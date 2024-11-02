import React from 'react';
import Column from './Column';

const Board = React.memo(function Board({ tasks, onEditTask, onDeleteTask, onUpdateTask, onChecklistItemToggle, users, onCreateTask, currentUser }) {
  const columns = [
    { title: 'Backlog', status: 'backlog', tasks: tasks.backlog },
    { title: 'To do', status: 'todo', tasks: tasks.todo },
    { title: 'In progress', status: 'inProgress', tasks: tasks.inProgress },
    { title: 'Done', status: 'done', tasks: tasks.done }
  ];

  const handleStatusChange = (taskId, newStatus) => {
    const task = Object.values(tasks).flat().find(t => t._id === taskId);
    if (task) {
      const updatedTask = { ...task, status: newStatus };
      onUpdateTask(updatedTask);
    }
  };

  return (
    <div className="board">
      {columns.map(column => (
        <Column 
          key={column.status}
          title={column.title}
          status={column.status}
          tasks={column.tasks}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onStatusChange={handleStatusChange}
          onChecklistItemToggle={onChecklistItemToggle}
          users={users}
          onCreateTask={onCreateTask}
          currentUser={currentUser}
        />
      ))}
    </div>
  );
});

export default Board;
