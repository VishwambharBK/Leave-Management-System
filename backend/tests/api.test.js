const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Leave = require('../models/Leave');
const LeavePolicy = require('../models/LeavePolicy');

jest.setTimeout(90000);

let mongoServer;
let adminToken;
let employeeToken;
let adminUser;
let employeeUser;
let inactiveEmployee;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Setup Leave Policies for current year
  const currentYear = new Date().getFullYear();
  await LeavePolicy.create([
    { leaveType: 'Casual Leave', annualAllocation: 6, year: currentYear },
    { leaveType: 'Sick Leave', annualAllocation: 6, year: currentYear },
    { leaveType: 'Earned Leave', annualAllocation: 12, year: currentYear },
  ]);

  // Create Admin
  adminUser = await User.create({
    name: 'Admin Test',
    employeeId: 'ADM999',
    email: 'admin.test@example.com',
    password: 'Password@123',
    role: 'admin',
    department: 'Management',
  });

  // Create Employee
  employeeUser = await User.create({
    name: 'John Test',
    employeeId: 'EMP999',
    email: 'john.test@example.com',
    password: 'Password@123',
    role: 'employee',
    department: 'Engineering',
  });

  // Create Inactive Employee
  inactiveEmployee = await User.create({
    name: 'Inactive Test',
    employeeId: 'EMP888',
    email: 'inactive.test@example.com',
    password: 'Password@123',
    role: 'employee',
    department: 'Support',
    isActive: false,
  });

  // Get Tokens
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin.test@example.com', password: 'Password@123' });
  adminToken = adminRes.body.data.token;

  const empRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'john.test@example.com', password: 'Password@123' });
  employeeToken = empRes.body.data.token;
}, 90000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 90000);

describe('1. Authentication Module', () => {
  it('should log in successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john.test@example.com', password: 'Password@123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('john.test@example.com');
  });

  it('should reject login with missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john.test@example.com', password: 'WrongPassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject login for inactive employee accounts', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inactive.test@example.com', password: 'Password@123' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  it('should reject protected route with invalid or corrupted token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid_token_xyz');

    expect(res.statusCode).toBe(401);
  });
});

describe('2. Authorization & RBAC', () => {
  it('should prevent employees from accessing admin APIs', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Forbidden/i);
  });

  it('should allow admin to access admin APIs', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toHaveProperty('totalEmployees');
  });

  it('should reject unauthenticated requests to protected routes', async () => {
    const res = await request(app).get('/api/employees/profile');
    expect(res.statusCode).toBe(401);
  });
});

describe('3. Leave Application & Validation Rules', () => {
  const getNextWeekdayRange = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() + ((1 + 7 - day) % 7 || 7);
    const monday = new Date(d.setDate(diff));
    const tuesday = new Date(monday);
    tuesday.setDate(monday.getDate() + 1);

    return {
      start: monday.toISOString().split('T')[0],
      end: tuesday.toISOString().split('T')[0],
    };
  };

  it('should reject past start dates', async () => {
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'Casual Leave',
        startDate: '2020-01-01',
        endDate: '2020-01-05',
        reason: 'Past leave attempt',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/past/i);
  });

  it('should reject end date earlier than start date', async () => {
    const { start } = getNextWeekdayRange();
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'Casual Leave',
        startDate: start,
        endDate: '2020-01-01',
        reason: 'End date before start',
      });

    expect(res.statusCode).toBe(400);
  });

  it('should reject weekend-only leave requests (zero working days)', async () => {
    const d = new Date();
    const day = d.getDay();
    const satDiff = d.getDate() + ((6 - day + 7) % 7 || 7);
    const sat = new Date(d.setDate(satDiff));
    const sun = new Date(sat);
    sun.setDate(sat.getDate() + 1);

    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'Casual Leave',
        startDate: sat.toISOString().split('T')[0],
        endDate: sun.toISOString().split('T')[0],
        reason: 'Weekend only leave attempt',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/working days/i);
  });

  it('should successfully submit a valid leave request and exclude weekends from count', async () => {
    const { start, end } = getNextWeekdayRange();

    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'Casual Leave',
        startDate: start,
        endDate: end,
        reason: 'Personal urgent work reason',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.numberOfDays).toBe(2);
    expect(res.body.data.status).toBe('pending');
  });

  it('should prevent overlapping leave applications for the same employee', async () => {
    const { start, end } = getNextWeekdayRange();

    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'Casual Leave',
        startDate: start,
        endDate: end,
        reason: 'Overlapping leave attempt',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/overlapping/i);
  });

  it('should reject requests exceeding available leave balance', async () => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    const start = d.toISOString().split('T')[0];
    const endD = new Date(d);
    endD.setDate(d.getDate() + 35);
    const end = endD.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'Casual Leave',
        startDate: start,
        endDate: end,
        reason: 'Too many days requested',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Insufficient leave balance/i);
  });
});

describe('4. Admin Approval & Rejection Workflow', () => {
  let pendingLeaveId;

  beforeAll(async () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const start = d.toISOString().split('T')[0];
    const endD = new Date(d);
    endD.setDate(d.getDate() + 2);
    const end = endD.toISOString().split('T')[0];

    const leave = await Leave.create({
      employee: employeeUser._id,
      leaveType: 'Sick Leave',
      startDate: new Date(start),
      endDate: new Date(end),
      numberOfDays: 2,
      reason: 'Medical checkup and rest',
      status: 'pending',
    });
    pendingLeaveId = leave._id;
  });

  it('should prevent employees from approving leave requests', async () => {
    const res = await request(app)
      .patch(`/api/admin/leaves/${pendingLeaveId}/approve`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ adminRemarks: 'Self approval attempt' });

    expect(res.statusCode).toBe(403);
  });

  it('should allow admin to approve a pending leave request', async () => {
    const res = await request(app)
      .patch(`/api/admin/leaves/${pendingLeaveId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ adminRemarks: 'Approved by admin' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('approved');
    expect(res.body.data.adminRemarks).toBe('Approved by admin');
  });

  it('should not allow approving an already approved leave request', async () => {
    const res = await request(app)
      .patch(`/api/admin/leaves/${pendingLeaveId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ adminRemarks: 'Duplicate approve' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Only pending requests can be approved/i);
  });

  it('should require remarks when admin rejects a request', async () => {
    const leave = await Leave.create({
      employee: employeeUser._id,
      leaveType: 'Earned Leave',
      startDate: new Date(Date.now() + 86400000 * 40),
      endDate: new Date(Date.now() + 86400000 * 42),
      numberOfDays: 2,
      reason: 'Vacation request',
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/admin/leaves/${leave._id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ adminRemarks: '' });

    expect(res.statusCode).toBe(400);
  });

  it('should allow admin to reject a pending leave request with remarks', async () => {
    const leave = await Leave.create({
      employee: employeeUser._id,
      leaveType: 'Earned Leave',
      startDate: new Date(Date.now() + 86400000 * 45),
      endDate: new Date(Date.now() + 86400000 * 47),
      numberOfDays: 2,
      reason: 'Vacation request 2',
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/admin/leaves/${leave._id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ adminRemarks: 'Critical project release scheduled on these dates.' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('rejected');
  });
});

describe('5. Leave Balance Integrity', () => {
  it('should accurately calculate leave balances with approved, pending, and rejected leaves', async () => {
    const res = await request(app)
      .get('/api/employees/leave-balance')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const { balances, totalAllocated, totalUsed } = res.body.data;

    // Casual Leave was applied (2 days pending)
    expect(balances['Casual Leave'].allocated).toBe(6);
    expect(balances['Casual Leave'].pending).toBe(2);

    // Sick Leave was approved (2 days used)
    expect(balances['Sick Leave'].allocated).toBe(6);
    expect(balances['Sick Leave'].used).toBe(2);
    expect(balances['Sick Leave'].remaining).toBe(4);

    // Earned Leave was rejected (used = 0)
    expect(balances['Earned Leave'].allocated).toBe(12);
    expect(balances['Earned Leave'].used).toBe(0);

    expect(totalAllocated).toBe(24);
    expect(totalUsed).toBe(2);
  });
});
