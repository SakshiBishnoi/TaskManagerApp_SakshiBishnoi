const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const auth = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

router.use(auth);

const createBulkNotification = async (userId, assigneeId, taskCount) => {
  try {
    const assigner = await User.findById(assigneeId).select('email name');
    const notification = new Notification({
      user: userId,        
      assignee: assigneeId, 
      message: `${taskCount} new tasks assigned by: ${assigner.email}`,
      read: false
    });
    await notification.save();
  } catch (error) {
    console.error('Error creating bulk notification:', error);
  }
};

router.post('/', async (req, res) => {
  try {
    console.log('Received task creation request:', req.body);
    
    const { title, priority, checklist, dueDate, assignedTo } = req.body;
    console.log('Creating task with data:', {
      title, priority, checklist, dueDate, assignedTo,
      createdBy: req.user.id
    });

    const task = new Task({
      title,
      priority,
      checklist,
      dueDate,
      status: 'todo',
      createdBy: req.user.id,
      assignedTo
    });

    console.log('Task model instance created:', task);
    
    const savedTask = await task.save();
    console.log('Task saved successfully:', savedTask);

    if (assignedTo && assignedTo !== req.user.id) {
      const assigner = await User.findById(req.user.id).select('email name');
      
      const notification = new Notification({
        user: assignedTo,
        assignee: req.user.id,
        message: `A new task "${title}" has been assigned to you by ${assigner.email}`,
        read: false
      });
      await notification.save();
      
      const io = req.app.get('io');
      if (io) {
        io.to(assignedTo.toString()).emit('newNotification', notification);
      }
    }

    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Task creation error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(400).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { timeRange } = req.query;
    let startDate = new Date(0);
    let endDate = new Date();
    
    if (timeRange) {
      startDate = new Date();
      endDate = new Date();
      
      switch (timeRange) {
        case 'Today':
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'This week':
          startDate.setDate(startDate.getDate() - startDate.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'This month':
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
      }
    }

    const tasks = await Task.find({
      $or: [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ],
      createdAt: { 
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate({
      path: 'assignedTo',
      select: '_id email name',
      model: 'User'
    })
    .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { isBulk } = req.query;
    if (isBulk === 'true') {
      const { tasks } = req.body;
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ message: 'Invalid input: tasks should be a non-empty array' });
      }

      const updatedTasks = await Task.bulkWrite(
        tasks.map((task) => ({
          updateOne: {
            filter: { _id: task._id, createdBy: req.user.id },
            update: { $set: { assignedTo: task.assignedTo } },
          },
        }))
      );

      if (updatedTasks.modifiedCount > 0) {
        await createBulkNotification(tasks[0].assignedTo, req.user.id, updatedTasks.modifiedCount);
      }

      return res.json({ 
        message: `${updatedTasks.modifiedCount} tasks updated successfully`, 
        updatedTasks: updatedTasks.upsertedIds 
      });
    } else {
      const originalTask = await Task.findOne({ 
        _id: req.params.id, 
        $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }]
      });
      if (!originalTask) return res.status(404).json({ message: 'Task not found' });

      const { title, priority, checklist, dueDate, status, assignedTo } = req.body;
      
      const originalAssignedTo = originalTask.assignedTo;
      
      if (title) originalTask.title = title;
      if (priority) originalTask.priority = priority;
      if (checklist) originalTask.checklist = checklist;
      if (dueDate !== undefined) {
        originalTask.dueDate = dueDate;
      }
      if (status) originalTask.status = status;
      if (assignedTo !== undefined) {
        originalTask.assignedTo = assignedTo;
      }

      const savedTask = await originalTask.save();

      if (assignedTo && assignedTo !== originalAssignedTo && assignedTo !== req.user.id) {
        try {
          const assigner = await User.findById(req.user.id).select('email name');
          
          const notification = new Notification({
            user: assignedTo,
            assignee: req.user.id,
            message: `Task "${savedTask.title}" has been assigned to you by ${assigner.email}`,
            read: false,
            taskId: savedTask._id
          });
          
          await notification.save();
          
          const io = req.app.get('io');
          if (io) {
            io.to(assignedTo.toString()).emit('newNotification', notification);
          }
        } catch (error) {
          console.error('Error creating notification for task update:', error);
        }
      }

      res.json(savedTask);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ 
      _id: req.params.id, 
      $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }]
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const tasks = await Task.find({ $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }] });
    const stats = {
      status: {
        backlog: 0,
        todo: 0,
        inProgress: 0,
        done: 0
      },
      priority: {
        low: 0,
        moderate: 0,
        high: 0
      },
      dueDateTasks: 0,
      assignedToMe: 0,
      assignedByMe: 0
    };

    const now = new Date();

    tasks.forEach(task => {
      stats.status[task.status]++;
      
      const priorityKey = task.priority.split(' ')[0].toLowerCase();
      stats.priority[priorityKey]++;

      const isOverdue = new Date(task.dueDate) < now;
      const isNotCompleted = task.checklist.some(item => !item.isCompleted);
      if (isOverdue && isNotCompleted) {
        stats.dueDateTasks++;
      }

      if (task.assignedTo && task.assignedTo.toString() === req.user.id) {
        stats.assignedToMe++;
      }
      if (task.createdBy.toString() === req.user.id && task.assignedTo && task.assignedTo.toString() !== req.user.id) {
        stats.assignedByMe++;
      }
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:taskId/share', async (req, res) => {
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

module.exports = router;
