const express = require('express');
const router = express.Router();
const SharedTask = require('../models/SharedTask');
const auth = require('../middleware/authMiddleware');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const sharedTasks = await SharedTask.find({
      $or: [
        { assignedUserId: req.user.id },
        { assignerUserId: req.user.id }
      ]
    }).populate('taskId');
    res.json(sharedTasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const sharedTask = await SharedTask.findOneAndDelete({
      _id: req.params.id,
      $or: [
        { assignedUserId: req.user.id },
        { assignerUserId: req.user.id }
      ]
    });
    if (!sharedTask) return res.status(404).json({ message: 'Shared task not found' });
    res.json({ message: 'Shared task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

