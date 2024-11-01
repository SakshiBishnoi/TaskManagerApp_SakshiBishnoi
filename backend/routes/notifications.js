const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');

router.use(auth);

// Get all notifications for the logged-in user
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      user: req.user.id,  // This is the receiver
      read: false
    })
      .populate('assignee', 'email name _id')  // This is the sender
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark a notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add task assignment notification
router.post('/task-assigned', auth, async (req, res) => {
  try {
    const { taskId, assignedTo, taskTitle } = req.body;
    
    // Get the assigner's (current user's) details
    const assigner = await User.findById(req.user.id).select('email name');
    
    const notification = new Notification({
      user: assignedTo, // The person receiving the task
      assignee: req.user.id, // The person assigning the task
      message: `Task "${taskTitle}" has been assigned to you by ${assigner.email}`,
      read: false,
      taskId: taskId
    });
    
    await notification.save();
    
    // Emit socket event if io exists
    const io = req.app.get('io');
    if (io) {
      io.to(assignedTo.toString()).emit('newNotification', notification);
    }
    
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating task assignment notification:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
