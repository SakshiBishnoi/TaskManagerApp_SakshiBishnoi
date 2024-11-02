import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { removeToken, isAuthenticated } from '../utils/token';
import { getTaskStats } from '../api/taskApi';
import '../styles/analytics.css';

function Analytics() {
  const navigate = useNavigate();
  const [taskStats, setTaskStats] = useState({
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
    dueDateTasks: 0
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    } else {
      fetchTaskStats();
    }
  }, [navigate]);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const fetchTaskStats = async () => {
    try {
      const stats = await getTaskStats();
      setTaskStats(stats);
    } catch (error) {
      console.error('Error fetching task statistics:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar onLogout={handleLogout} />
      <div className="analytics-content">
        <div className="analytics-header">
          <h2>Analytics</h2>
        </div>
        <div className="stats-container">
          <div className="stat-group">
            <div className="stat-item">
              <div className="stat-row">
                <span>Backlog Tasks</span>
                <span className="stat-value">{taskStats.status.backlog}</span>
              </div>
              <div className="stat-row">
                <span>To-do Tasks</span>
                <span className="stat-value">{taskStats.status.todo}</span>
              </div>
              <div className="stat-row">
                <span>In-Progress Tasks</span>
                <span className="stat-value">{taskStats.status.inProgress}</span>
              </div>
              <div className="stat-row">
                <span>Completed Tasks</span>
                <span className="stat-value">{taskStats.status.done}</span>
              </div>
            </div>
          </div>
          <div className="stat-group">
            <div className="stat-item">
              <div className="stat-row">
                <span>Low Priority</span>
                <span className="stat-value">{taskStats.priority.low}</span>
              </div>
              <div className="stat-row">
                <span>Moderate Priority</span>
                <span className="stat-value">{taskStats.priority.moderate}</span>
              </div>
              <div className="stat-row">
                <span>High Priority</span>
                <span className="stat-value">{taskStats.priority.high}</span>
              </div>
              <div className="stat-row">
                <span>Due Date Tasks</span>
                <span className="stat-value">{taskStats.dueDateTasks}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
