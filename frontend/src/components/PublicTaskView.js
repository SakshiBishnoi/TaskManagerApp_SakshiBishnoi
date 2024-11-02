import React from 'react';
import { useParams } from 'react-router-dom';
import { getSharedTask } from '../api/taskApi';
import '../styles/publicTaskView.css';
import logo from '../assets/logo.png';  

function PublicTaskView() {
  const { shareId } = useParams();
  const [task, setTask] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high priority':
        return '#FF2473';
      case 'moderate priority':
        return '#18B0FF';
      case 'low priority':
        return '#63C05B';
      default:
        return '#787486';
    }
  };

  const isDueDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate.getTime() < today.getTime()) {
      return 'overdue';
    } else if (dueDate.getTime() === today.getTime()) {
      return 'today';
    }
    return '';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  React.useEffect(() => {
    const fetchTask = async () => {
      try {
        const taskData = await getSharedTask(shareId);
        setTask(taskData);
      } catch (err) {
        setError(err.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [shareId]);

  if (loading) return <div className="public-task-loading">Loading...</div>;
  if (error) return <div className="public-task-error">Error: {error}</div>;
  if (!task) return <div className="public-task-error">Task not found</div>;

  return (
    <div className="public-view-wrapper">
      <div className="public-header">
        <div className="logo-container">
          <img src={logo} alt="Pro Manage" className="logo-image" />
          <span className="logo-text">Pro Manage</span>
        </div>
      </div>
      
      <div className="public-task-container">
        <div className="public-task-card">
          <div className="task-header">
            <div className="priority-badge" style={{ color: getPriorityColor(task.priority) }}>
              <span className="priority-dot" style={{ backgroundColor: getPriorityColor(task.priority) }}></span>
              {task.priority}
            </div>
            <h2 className="task-title">{task.title}</h2>
          </div>

          <div className="checklist-section">
            <div className="checklist-header">
              Checklist ({task.checklist.filter(item => item.isCompleted).length}/{task.checklist.length})
            </div>
            <div className="public-task-checklist-container">
              <div className="checklist-items">
                {task.checklist.map((item, index) => (
                  <div 
                    key={index} 
                    className={`checklist-item ${item.isCompleted ? 'completed' : ''}`}
                    title={item.text}
                  >
                    <input 
                      type="checkbox" 
                      checked={item.isCompleted} 
                      readOnly 
                    />
                    <span className="checklist-text text-ellipsis">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="task-footer">
            {task.dueDate && (
              <div className="due-date-container">
                <span className="due-date-label">Due Date:</span>
                <span className={`due-date ${isDueDate(task.dueDate)} ${task.status === 'done' ? 'done' : ''}`}>
                  {formatDate(task.dueDate)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicTaskView;
