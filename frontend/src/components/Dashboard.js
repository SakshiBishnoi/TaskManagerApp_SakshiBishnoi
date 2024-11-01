import React, { useEffect, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getToken, removeToken } from '../utils/token';
import TaskModal from './TaskModal';
import Board from './Board';
import Sidebar from './Sidebar';
import { createTask, getTasks, updateTask, deleteTask, getTaskStats, getAllUsers, bulkUpdateTasks } from '../api/taskApi';
import Notifications from './Notifications';
import { FiUsers } from 'react-icons/fi';  // We'll use react-icons for the user icon
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

function tasksReducer(state, action) {
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
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: Object.fromEntries(
          Object.entries(state.tasks).map(([status, tasks]) => [
            status,
            status === action.payload.status
              ? [action.payload, ...tasks.filter(task => task._id !== action.payload._id)]
              : tasks.filter(task => task._id !== action.payload._id)
          ])
        )
      };
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
}

// Add this helper function at the top of the file, before the Dashboard function
const getDisplayName = (fullName) => {
  if (!fullName) return '';
  const nameParts = fullName.trim().split(' ');
  return nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
};

function Dashboard() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(tasksReducer, initialState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [showAddPeoplePopup, setShowAddPeoplePopup] = useState(false);
  const [email, setEmail] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [modalType, setModalType] = useState(null); // 'logout' or 'delete'
  const [timeRange, setTimeRange] = useState(() => {
  const token = localStorage.getItem('token');
    if (token) {
      return localStorage.getItem('dashboardTimeRange') || 'Today';
    }
    return 'Today';
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    } else {
      console.log('Current token:', getToken());
      fetchTasks();
      fetchUsers();
      fetchCurrentUser(); // Add this here
    }
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchTasks();
    }
  }, [timeRange]);

  useEffect(() => {
    fetchUsers().catch(error => console.error('Error in fetchUsers:', error));
  }, []);

  useEffect(() => {
    console.log('Users in Dashboard:', users);
  }, [users]);

  useEffect(() => {
    localStorage.setItem('dashboardTimeRange', timeRange);
  }, [timeRange]);

  const fetchCurrentUser = async () => {
    try {
      const userData = await getCurrentUser();
      console.log('Current user data:', userData); // Debug log
      if (userData && userData.name) {
        setCurrentUser(userData);
      } else {
        console.warn('User data missing name property:', userData);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      setCurrentUser({});
    }
  };

  const fetchTasks = async () => {
    try {
      const tasks = await getTasks(timeRange);
      console.log('Raw tasks from API:', tasks);
      
      // Debug logging for assigned users
      tasks.forEach(task => {
        console.log('Task:', task.title);
        console.log('AssignedTo:', task.assignedTo);
        if (task.assignedTo) {
          console.log('Assigned user details:', {
            id: task.assignedTo._id,
            name: task.assignedTo.name,
            email: task.assignedTo.email
          });
        }
      });
      
      const organizedTasks = {
        backlog: tasks.filter(task => task.status === 'backlog'),
        todo: tasks.filter(task => task.status === 'todo'),
        inProgress: tasks.filter(task => task.status === 'inProgress'),
        done: tasks.filter(task => task.status === 'done')
      };
      dispatch({ type: 'SET_TASKS', payload: organizedTasks });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await getAllUsers();
      console.log('Fetched users with details:');
      fetchedUsers.forEach(user => {
        console.log(`User ID: ${user._id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name || 'No name provided'}`);
        console.log('------------------------');
      });
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('dashboardTimeRange');
    navigate('/login');
    setShowLogoutConfirm(false);
  };

  const handleCreateTask = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (task) => {
    try {
      const savedTask = await createTask({ 
        ...task, 
        status: 'todo'
      });
      dispatch({ type: 'ADD_TASK', payload: savedTask });
      setIsModalOpen(false);
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
      // Get the actual taskId if an object was passed
      const id = typeof taskId === 'object' ? taskId._id : taskId;
      
      // Create clean update object
      const updatedTask = typeof taskId === 'object' ? taskId : updates;
      
      // Ensure status is included in the update
      if (typeof updates === 'string') {
        // If updates is just a status string
        updatedTask.status = updates;
      }
      
      const savedTask = await updateTask(id, updatedTask);
      
      // Dispatch the updated task to update the state
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
      // You might want to dispatch an action here if you're using a global state management
      console.log('Updated analytics:', stats);
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
      const allTasks = Object.values(state.tasks).flat();
      const tasksToUpdate = allTasks.map(task => ({
        _id: task._id,
        assignedTo: selectedAssignee,
        title: task.title
      }));
      const result = await bulkUpdateTasks(tasksToUpdate);
      if (result.updatedTasks) {
        fetchTasks();
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
