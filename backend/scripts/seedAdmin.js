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

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@exelon.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    console.log('[Seed] Ensuring administrator account...');
    let admin = await User.findOne({
      $or: [{ email: adminEmail.toLowerCase() }, { role: 'admin' }, { employeeId: 'ADM001' }],
    });
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
      admin.email = adminEmail.toLowerCase();
      admin.name = adminName;
      admin.password = adminPassword;
      admin.isActive = true;
      await admin.save();
      console.log(`[Seed] Administrator account ready: ${admin.email}`);
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
        name: 'Vishwambhara',
        employeeId: 'EMP001',
        email: 'vishwambhara@exelon.com',
        password: 'Employee@123',
        department: 'Engineering',
        designation: 'Senior Software Engineer',
        role: 'employee',
        isActive: true,
      },
      {
        name: 'Aneesh',
        employeeId: 'EMP002',
        email: 'aneesh@exelon.com',
        password: 'Employee@123',
        department: 'Operations',
        designation: 'Product Specialist',
        role: 'employee',
        isActive: true,
      },
    ];

    console.log('[Seed] Ensuring sample employees...');
    const createdEmployees = [];
    for (const empData of sampleEmployees) {
      let emp = await User.findOne({
        $or: [{ email: empData.email.toLowerCase() }, { employeeId: empData.employeeId }],
      });
      if (!emp) {
        emp = await User.create(empData);
        console.log(`[Seed] Created employee: ${emp.name} (${emp.email})`);
      } else {
        emp.name = empData.name;
        emp.email = empData.email.toLowerCase();
        emp.department = empData.department;
        emp.designation = empData.designation;
        emp.password = empData.password;
        emp.isActive = true;
        await emp.save();
        console.log(`[Seed] Updated employee: ${emp.name} (${emp.email})`);
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
