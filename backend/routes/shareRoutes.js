const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { v4: uuidv4 } = require('uuid');

router.post('/tasks/:taskId/share', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.shareId) {
      task.shareId = uuidv4();
      task.isShared = true;
      task.sharedAt = new Date();
      await task.save();
    }

    res.json({
      shareId: task.shareId,
      shareUrl: `${process.env.FRONTEND_URL}/share/${task.shareId}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/tasks/share/:shareId', async (req, res) => {
  try {
    const task = await Task.findOne({ shareId: req.params.shareId })
      .populate('assignedTo', 'email')
      .populate('createdBy', 'email');

    if (!task) {
      return res.status(404).json({ message: 'Shared task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

