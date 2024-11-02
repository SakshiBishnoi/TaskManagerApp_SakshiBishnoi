import React, { useEffect, useReducer, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getToken } from '../utils/token';
import TaskModal from './TaskModal';
import Board from './Board';
import Sidebar from './Sidebar';
import { createTask, getTasks, updateTask, deleteTask, getTaskStats, getAllUsers, bulkUpdateTasks } from '../api/taskApi';
import { updateDefaultAssignee, getBoardSettings } from '../api/boardApi';
import { createTaskAssignmentNotification } from '../api/authApi';
import Notifications from './Notifications';
import { FiUsers } from 'react-icons/fi';
import '../styles/dashboard.css';
import { getCurrentUser } from '../api/userApi';
import AddPeopleModal from './AddPeopleModal';
import ConfirmModal from './ConfirmModal';

const initialState = {
  tasks: {
    backlog: [],
    todo: [],
    inProgress: [],
    done: []
  }
};

function Dashboard() {
  const navigate = useNavigate();
  const tasksReducer = useCallback((state, action) => {
    switch (action.type) {
      case 'SET_TASKS':
        return { ...state, tasks: action.payload };
      case 'ADD_TASK':
        return {
          ...state,
          tasks: {
            ...state.tasks,
            [action.payload.status]: [action.payload, ...state.tasks[action.payload.status]]
          }
        };
      case 'UPDATE_TASK': {
        const { status: newStatus, _id } = action.payload;
        return {
          ...state,
          tasks: Object.fromEntries(
            Object.entries(state.tasks).map(([status, tasks]) => [
              status,
              status === newStatus
                ? [action.payload, ...tasks.filter(task => task._id !== _id)]
                : tasks.filter(task => task._id !== _id)
            ])
          )
        };
      }
      case 'DELETE_TASK':
        return {
          ...state,
          tasks: Object.fromEntries(
            Object.entries(state.tasks).map(([status, tasks]) => [
              status,
              tasks.filter(task => task._id !== action.payload)
            ])
          )
        };
      case 'UPDATE_TASK_CHECKLIST':
        return {
          ...state,
          tasks: Object.fromEntries(
            Object.entries(state.tasks).map(([status, tasks]) => [
              status,
              tasks.map(task => 
                task._id === action.payload._id ? { ...task, checklist: action.payload.checklist } : task
              )
            ])
          )
        };
      default:
        return state;
    }
  }, []);

  const [state, dispatch] = useReducer(tasksReducer, initialState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [showAddPeoplePopup, setShowAddPeoplePopup] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [timeRange, setTimeRange] = useState(() => {
  const token = localStorage.getItem('token');
    if (token) {
      return localStorage.getItem('dashboardTimeRange') || 'Today';
    }
    return 'Today';
  });
  const [boardSettings, setBoardSettings] = useState({ defaultAssignee: null });

  const getDisplayName = (name) => {
    if (!name) return '';
    const nameParts = name.split(' ');
    return nameParts[nameParts.length - 1];
  };

  const initializeDashboard = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      const [tasksData, usersData, userData] = await Promise.all([
        getTasks(timeRange),
        getAllUsers(),
        getCurrentUser()
      ]);

      const organizedTasks = {
        backlog: tasksData.filter(task => task.status === 'backlog'),
        todo: tasksData.filter(task => task.status === 'todo'),
        inProgress: tasksData.filter(task => task.status === 'inProgress'),
        done: tasksData.filter(task => task.status === 'done')
      };

      dispatch({ type: 'SET_TASKS', payload: organizedTasks });
      setUsers(usersData);
      setCurrentUser(userData);

      const boardData = await getBoardSettings();
      setBoardSettings(boardData);
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeDashboard();
  }, [timeRange, navigate]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('dashboardTimeRange');
    localStorage.removeItem('readNotifications');
    navigate('/login');
    setShowLogoutConfirm(false);
  };

  const handleCreateTask = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (task) => {
    try {
      if (boardSettings.defaultAssignee && !task.assignedTo) {
        task.assignedTo = boardSettings.defaultAssignee;
      }
      const savedTask = await createTask(task);
      
      if (savedTask.assignedTo) {
        try {
          await createTaskAssignmentNotification({
            taskId: savedTask._id,
            assignedTo: savedTask.assignedTo,
            taskTitle: savedTask.title
          });
        } catch (error) {
          console.error('Error creating assignment notification:', error);
        }
      }
      
      dispatch({ type: 'ADD_TASK', payload: savedTask });
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      dispatch({ type: 'DELETE_TASK', payload: taskId });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const id = typeof taskId === 'object' ? taskId._id : taskId;
      
      const updatedTask = typeof taskId === 'object' ? taskId : updates;
      
      if (typeof updates === 'string') {
        updatedTask.status = updates;
      }
      
      const savedTask = await updateTask(id, updatedTask);
      
      dispatch({ type: 'UPDATE_TASK', payload: savedTask });
    } catch (error) {
      console.error('Error updating task:', error.response?.data || error.message);
    }
  };

  const handleChecklistItemToggle = async (taskId, checklistItemIndex) => {
    try {
      const task = Object.values(state.tasks).flat().find(t => t._id === taskId);
      if (task) {
        const updatedChecklist = [...task.checklist];
        updatedChecklist[checklistItemIndex].isCompleted = !updatedChecklist[checklistItemIndex].isCompleted;
        const updatedTask = { ...task, checklist: updatedChecklist };
        const savedTask = await updateTask(taskId, updatedTask);
        dispatch({ type: 'UPDATE_TASK_CHECKLIST', payload: savedTask });
      }
    } catch (error) {
      console.error('Error updating checklist item:', error);
    }
  };

  const refreshAnalytics = async () => {
    try {
      const stats = await getTaskStats();
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedAssignee) {
      alert('Please select a user to assign tasks to.');
      return;
    }
    setIsBulkAssigning(true);
    try {
      await updateDefaultAssignee(selectedAssignee);
      setBoardSettings(prev => ({ ...prev, defaultAssignee: selectedAssignee }));

      const allTasks = Object.values(state.tasks).flat();
      const tasksToUpdate = allTasks.map(task => ({
        _id: task._id,
        assignedTo: selectedAssignee,
        title: task.title
      }));
      
      await updateDefaultAssignee(selectedAssignee);
      setBoardSettings(prev => ({ ...prev, defaultAssignee: selectedAssignee }));
      
      const result = await bulkUpdateTasks(tasksToUpdate);
      if (result.updatedTasks) {
        await initializeDashboard();
      }
    } catch (error) {
      console.error('Error assigning tasks:', error);
      alert('An error occurred while assigning tasks.');
    } finally {
      setIsBulkAssigning(false);
      setSelectedAssignee('');
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar onLogout={handleLogout} />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="left-section">
            <h2 className="welcome">
              Welcome{currentUser?.name ? `, ${getDisplayName(currentUser.name)}` : ''}!
            </h2>
            <div className="sub-header">
              <div className="board-section">
                <h3>Board</h3>
                <button className="add-people-button" onClick={() => setShowAddPeoplePopup(true)}>
                  <FiUsers /> Add People
                </button>
              </div>
            </div>
          </div>
          <div className="right-section">
            <div className="date-section">
              <p className="date">
                {new Date().toLocaleDateString('en-US', { 
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }).replace(/(\d+)/, (day) => {
                  const lastDigit = day % 10;
                  const lastTwoDigits = day % 100;
                  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
                    return `${day}th`;
                  }
                  switch (lastDigit) {
                    case 1: return `${day}st`;
                    case 2: return `${day}nd`;
                    case 3: return `${day}rd`;
                    default: return `${day}th`;
                  }
                })}
              </p>
            </div>
            <div className="filter-section">
              <div className="dropdown-container">
                <button 
                  className="dropdown-trigger"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {timeRange}
                  <div className={`select-arrow ${isDropdownOpen ? 'open' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="dropdown-menu filter-dropdown">
                    <button 
                      className={`dropdown-item ${timeRange === 'Today' ? 'active' : ''}`}
                      onClick={() => {
                        setTimeRange('Today');
                        setIsDropdownOpen(false);
                      }}
                    >
                      Today
                    </button>
                    <button 
                      className={`dropdown-item ${timeRange === 'This week' ? 'active' : ''}`}
                      onClick={() => {
                        setTimeRange('This week');
                        setIsDropdownOpen(false);
                      }}
                    >
                      This week
                    </button>
                    <button 
                      className={`dropdown-item ${timeRange === 'This month' ? 'active' : ''}`}
                      onClick={() => {
                        setTimeRange('This month');
                        setIsDropdownOpen(false);
                      }}
                    >
                      This month
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Notifications />
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setTaskToEdit(null);
          }}
          onSave={(task) => {
            if (task._id) {
              handleUpdateTask(task);
            } else {
              handleSaveTask(task);
            }
          }}
          taskToEdit={taskToEdit}
          onChecklistItemToggle={handleChecklistItemToggle}
          users={users}
          isLoading={isLoading}
          currentUser={currentUser}
        />
        <Board 
          tasks={state.tasks} 
          onEditTask={handleEditTask} 
          onDeleteTask={handleDeleteTask}
          onUpdateTask={handleUpdateTask}
          onChecklistItemToggle={handleChecklistItemToggle}
          users={users}
          onCreateTask={handleCreateTask}
          currentUser={currentUser}
        />
        <AddPeopleModal 
          isOpen={showAddPeoplePopup}
          onClose={() => setShowAddPeoplePopup(false)}
          users={users}
          selectedAssignee={selectedAssignee}
          onAssigneeChange={setSelectedAssignee}
          onSubmit={handleBulkAssign}
          isBulkAssigning={isBulkAssigning}
        />
        <ConfirmModal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={confirmLogout}
          title="Are you sure you want to Logout?"
          type="logout"
        />
      </div>
    </div>
  );
}

export default Dashboard;
