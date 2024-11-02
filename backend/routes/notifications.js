const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      user: req.user.id,  
      read: false
    })
      .populate('assignee', 'email name _id')  
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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

router.post('/task-assigned', auth, async (req, res) => {
  try {
    const { taskId, assignedTo, taskTitle } = req.body;
    
    if (!taskId || !assignedTo || !taskTitle) {
      return res.status(400).json({ 
        message: 'Missing required fields: taskId, assignedTo, or taskTitle' 
      });
    }

    const assigner = await User.findById(req.user.id).select('email name');
    if (!assigner) {
      return res.status(404).json({ message: 'Assigner not found' });
    }
    
    const notification = new Notification({
      user: assignedTo,
      assignee: req.user.id,
      message: `Task "${taskTitle}" has been assigned to you by ${assigner.email}`,
      read: false,
      taskId: taskId
    });
    
    await notification.save();
    
    const io = req.app.get('io');
    if (io) {
      io.to(assignedTo.toString()).emit('newNotification', notification);
    }
    
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating task assignment notification:', error);
    res.status(500).json({ 
      message: 'Server error while creating notification',
      error: error.message 
    });
  }
});

module.exports = router;
