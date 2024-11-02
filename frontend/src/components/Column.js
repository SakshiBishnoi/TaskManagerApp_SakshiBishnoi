import React, { useState, useEffect } from 'react';
import TaskCard from './TaskCard';
import { VscCollapseAll } from 'react-icons/vsc';
import { IoAddOutline } from 'react-icons/io5';

function Column({ title, status, tasks, onEditTask, onDeleteTask, onStatusChange, onChecklistItemToggle, users, onCreateTask, currentUser }) {
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  const handleExpandTask = (taskId, isExpanded) => {
    const newExpandedTasks = new Set(expandedTasks);
    if (isExpanded) {
      newExpandedTasks.add(taskId);
    } else {
      newExpandedTasks.delete(taskId);
    }
    setExpandedTasks(newExpandedTasks);
  };

  const toggleAllTasks = () => {
    if (expandedTasks.size > 0) {
      setExpandedTasks(new Set());
      setIsAllExpanded(false);
    } else {
      setExpandedTasks(new Set(tasks.map(task => task._id)));
      setIsAllExpanded(true);
    }
  };

  useEffect(() => {
    setIsAllExpanded(expandedTasks.size > 0);
  }, [expandedTasks]);

  return (
    <div className="column">
      <div className="column-header">
        <h3>{title}</h3>
        <div className="column-actions">
          {status === 'todo' && (
            <button 
              className="add-task-btn"
              onClick={onCreateTask}
              aria-label="Create new task"
            >
              <IoAddOutline />
            </button>
          )}
          <button 
            className="collapse-btn" 
            onClick={toggleAllTasks}
          >
            <VscCollapseAll size={24} />
          </button>
        </div>
      </div>
      <div className="column-content">
        {tasks.map(task => (
          <TaskCard 
            key={task._id} 
            task={task} 
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onStatusChange={onStatusChange}
            onChecklistItemToggle={onChecklistItemToggle}
            users={users}
            isExpanded={expandedTasks.has(task._id)}
            onExpand={(isExpanded) => handleExpandTask(task._id, isExpanded)}
            currentUser={currentUser}
          />
        ))}
      </div>
    </div>
  );
}

export default Column;
