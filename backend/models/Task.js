const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  priority: { type: String, required: true },
  checklist: [{ text: String, isCompleted: Boolean }],
  dueDate: { type: Date },
  status: { type: String, default: 'todo' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  shareId: { type: String, unique: true, sparse: true },
  isShared: { type: Boolean, default: false },
  sharedAt: { type: Date }
}, { timestamps: true });

TaskSchema.index({ shareId: 1 });

module.exports = mongoose.model('Task', TaskSchema);
