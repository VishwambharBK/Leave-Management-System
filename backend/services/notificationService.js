const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification for a specific user.
 */
const createNotification = async ({ recipient, title, message, type = 'system', relatedLeave = null }) => {
  try {
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      relatedLeave,
    });
    return notification;
  } catch (error) {
    console.error(`Failed to create notification: ${error.message}`);
    return null;
  }
};

/**
 * Notify all active admins (e.g., when an employee submits or cancels a leave request).
 */
const notifyAdmins = async ({ title, message, type = 'system', relatedLeave = null }) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    const notifications = admins.map((admin) => ({
      recipient: admin._id,
      title,
      message,
      type,
      relatedLeave,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error(`Failed to notify admins: ${error.message}`);
  }
};

module.exports = {
  createNotification,
  notifyAdmins,
};

