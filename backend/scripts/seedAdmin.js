const dotenv = require('dotenv');
dotenv.config();

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const LeavePolicy = require('../models/LeavePolicy');
const Leave = require('../models/Leave');
const Notification = require('../models/Notification');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    console.log('[Seed] Ensuring administrator account...');
    let admin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!admin) {
      admin = await User.create({
        name: adminName,
        employeeId: 'ADM001',
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        department: 'Management',
        designation: 'System Administrator',
        role: 'admin',
        isActive: true,
      });
      console.log(`[Seed] Administrator account created: ${admin.email}`);
    } else {
      console.log(`[Seed] Administrator already exists: ${admin.email}`);
    }

    // Default leave policies for current year
    const currentYear = new Date().getFullYear();
    const defaultPolicies = [
      { leaveType: 'Casual Leave', annualAllocation: 6, requiresAttachment: false, year: currentYear },
      { leaveType: 'Sick Leave', annualAllocation: 6, requiresAttachment: false, year: currentYear },
      { leaveType: 'Earned Leave', annualAllocation: 12, requiresAttachment: false, year: currentYear },
    ];

    console.log(`[Seed] Ensuring leave policies for year ${currentYear}...`);
    for (const policy of defaultPolicies) {
      const existing = await LeavePolicy.findOne({ leaveType: policy.leaveType, year: currentYear });
      if (!existing) {
        await LeavePolicy.create({ ...policy, updatedBy: admin._id });
        console.log(`[Seed] Created policy for ${policy.leaveType} (${policy.annualAllocation} days)`);
      } else {
        console.log(`[Seed] Policy exists: ${policy.leaveType} (${existing.annualAllocation} days)`);
      }
    }

    // Sample employees for development
    const sampleEmployees = [
      {
        name: 'Sarah Connor',
        employeeId: 'EMP001',
        email: 'sarah.connor@example.com',
        password: 'Employee@123',
        department: 'Engineering',
        designation: 'Senior Full Stack Engineer',
        role: 'employee',
        isActive: true,
      },
      {
        name: 'Michael Scott',
        employeeId: 'EMP002',
        email: 'michael.scott@example.com',
        password: 'Employee@123',
        department: 'Sales',
        designation: 'Regional Sales Manager',
        role: 'employee',
        isActive: true,
      },
      {
        name: 'Pam Beesly',
        employeeId: 'EMP003',
        email: 'pam.beesly@example.com',
        password: 'Employee@123',
        department: 'Human Resources',
        designation: 'HR Coordinator',
        role: 'employee',
        isActive: true,
      },
    ];

    console.log('[Seed] Ensuring sample employees...');
    const createdEmployees = [];
    for (const empData of sampleEmployees) {
      let emp = await User.findOne({ email: empData.email });
      if (!emp) {
        emp = await User.create(empData);
        console.log(`[Seed] Created employee: ${emp.name} (${emp.email})`);
      } else {
        console.log(`[Seed] Employee exists: ${emp.name}`);
      }
      createdEmployees.push(emp);
    }

    // Ensure sample leave records (populating the `leaves` collection)
    console.log('[Seed] Checking leaves collection...');
    const existingLeavesCount = await Leave.countDocuments();
    if (existingLeavesCount === 0 && createdEmployees.length > 0) {
      const sarah = createdEmployees[0];
      const nextWeekMonday = new Date();
      nextWeekMonday.setDate(nextWeekMonday.getDate() + ((1 + 7 - nextWeekMonday.getDay()) % 7 || 7));
      const nextWeekTuesday = new Date(nextWeekMonday);
      nextWeekTuesday.setDate(nextWeekMonday.getDate() + 1);

      const sampleLeave = await Leave.create({
        employee: sarah._id,
        leaveType: 'Casual Leave',
        startDate: nextWeekMonday,
        endDate: nextWeekTuesday,
        numberOfDays: 2,
        reason: 'Personal urgent family work',
        status: 'pending',
      });
      console.log(`[Seed] Created sample pending leave for ${sarah.name}`);

      // Ensure sample notification (populating `notifications` collection)
      await Notification.create({
        recipient: sarah._id,
        title: 'Welcome to LeaveFlow',
        message: 'Your employee profile and leave quota of 24 days have been successfully initialized.',
        type: 'system',
        relatedLeave: sampleLeave._id,
      });

      await Notification.create({
        recipient: admin._id,
        title: 'New Leave Request Received',
        message: `${sarah.name} (${sarah.employeeId}) submitted a 2-day Casual Leave application.`,
        type: 'leave_submitted',
        relatedLeave: sampleLeave._id,
      });
      console.log('[Seed] Created sample notifications.');
    }

    console.log('[Seed] Database initialization and collection provisioning complete!');
  } catch (error) {
    console.error(`[Seed] Critical error: ${error.message}`);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seedData();
