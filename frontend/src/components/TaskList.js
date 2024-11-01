import React from 'react';

function TaskList({ tasks, onEditTask, onDeleteTask }) {
  return (
    <div>
      <h3>Tasks</h3>
      {tasks.map((task) => (
        <div key={task._id}>
          <h4>{task.title}</h4>
          <p>Priority: {task.priority}</p>
          <p>Due Date: {task.dueDate}</p>
          <h5>Checklist:</h5>
          <ul>
            {task.checklist.map((item, index) => (
              <li key={`${task._id}-${index}`}>{item}</li>
            ))}
          </ul>
          <button onClick={() => onEditTask(task)}>Edit</button>
          <button onClick={() => onDeleteTask(task._id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default TaskList;
