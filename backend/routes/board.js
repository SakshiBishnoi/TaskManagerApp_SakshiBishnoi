const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const auth = require('../middleware/authMiddleware');
router.get('/', auth, async (req, res) => {
  try {
    const board = await Board.findOne({ createdBy: req.user.id });
    res.json(board || { defaultAssignee: null });
  } catch (error) {
    console.error('Error getting board:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/default-assignee', auth, async (req, res) => {
  try {
    const { defaultAssignee } = req.body;
    
    if (!defaultAssignee) {
      return res.status(400).json({ message: 'Default assignee is required' });
    }

    let board = await Board.findOne({ createdBy: req.user.id });
    
    if (!board) {
      board = new Board({
        createdBy: req.user.id,
        defaultAssignee
      });
    } else {
      board.defaultAssignee = defaultAssignee;
    }
    
    await board.save();
    res.json(board);
  } catch (error) {
    console.error('Error updating default assignee:', error);
    res.status(500).json({ 
      message: 'Server error while updating default assignee',
      error: error.message 
    });
  }
});

module.exports = router; 