import React, { useState, useEffect, useRef} from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/taskModal.css';
import {BsFillTrashFill } from 'react-icons/bs';
import { createTaskAssignmentNotification } from '../api/authApi';

function TaskModal({ isOpen, onClose, onSave, taskToEdit, onChecklistItemToggle, users, isLoading, currentUser }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('MODERATE PRIORITY');
  const [checklist, setChecklist] = useState([]);
  const [dueDate, setDueDate] = useState(null);
  const [status, setStatus] = useState('todo');
  const [assignedTo, setAssignedTo] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const assignDropdownRef = useRef(null);

  useEffect(() => {
    if (taskToEdit) {
      setAssignedTo(taskToEdit.assignedTo);
    }
  }, [taskToEdit]);

  const getUserInitials = (user) => {
    if (!user || !user.name) return 'UN';
    return user.name.slice(0, 2).toUpperCase();
  };

  const getAssignedUserEmail = (assignedId) => {
    if (!assignedId) return null;
    
    if (typeof assignedId === 'object' && assignedId.email) {
      return assignedId.email;
    }
    
    const user = users.find(u => u._id === assignedId);
    return user ? user.email : null;
  };

  const resetForm = () => {
    setTitle('');
    setPriority('MODERATE PRIORITY');
    setChecklist([]);
    setDueDate(null);
    setStatus('todo');
    setAssignedTo('');
    setShowDatePicker(false);
    setShowAssignDropdown(false);
  };

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setPriority(taskToEdit.priority);
      setChecklist(taskToEdit.checklist);
      setDueDate(taskToEdit.dueDate ? new Date(taskToEdit.dueDate) : null);
      setStatus(taskToEdit.status);
      setAssignedTo(taskToEdit.assignedTo?._id || taskToEdit.assignedTo || '');
    } else {
      resetForm();
    }
  }, [taskToEdit]);

  const handleAddChecklistItem = () => {
    setChecklist([...checklist, { text: '', isCompleted: false }]);
  };

  const handleChecklistItemChange = (index, value) => {
    const newChecklist = [...checklist];
    newChecklist[index].text = value;
    setChecklist(newChecklist);
  };

  const handleChecklistItemToggle = (index) => {
    if (taskToEdit) {
      onChecklistItemToggle(taskToEdit._id, index);
    } else {
      const newChecklist = [...checklist];
      newChecklist[index].isCompleted = !newChecklist[index].isCompleted;
      setChecklist(newChecklist);
    }
  };

  const handleSave = () => {
    const taskData = {
      _id: taskToEdit ? taskToEdit._id : undefined,
      title,
      priority,
      checklist,
      status,
      assignedTo: assignedTo || null,
      dueDate: dueDate || null
    };

    onSave(taskData);
    resetForm();
    onClose();
  };

  const handleDeleteChecklistItem = (index) => {
    const newChecklist = checklist.filter((_, i) => i !== index);
    setChecklist(newChecklist);
  };

  const formatDate = (date) => {
    if (!date) return 'Select Due Date';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Select Due Date';
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (assignDropdownRef.current && !assignDropdownRef.current.contains(event.target)) {
        setShowAssignDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const isFormValid = () => {
    const isTitleValid = title.trim().length > 0;
    
    const isChecklistValid = checklist.length === 0 || 
      checklist.every(item => item.text.trim() !== '');
    
    return isTitleValid && isChecklistValid;
  };

  const handleAssign = async (userId) => {
    try {
      setAssignedTo(userId);
      setShowAssignDropdown(false);
      
      console.log('Assigning to user:', userId);
      const assignedUser = users.find(u => u._id === userId);
      console.log('Assigned user details:', assignedUser);

      if (taskToEdit && taskToEdit._id && userId !== taskToEdit.assignedTo) {
        try {
          await createTaskAssignmentNotification({
            taskId: taskToEdit._id,
            assignedTo: userId,
            taskTitle: taskToEdit.title
          });
        } catch (error) {
          console.error('Error creating assignment notification:', error);
        }
      }
    } catch (error) {
      console.error('Error assigning user:', error);
      setAssignedTo('');
    }
  };

  const isAssignedUser = () => {
    if (!taskToEdit || !currentUser || !assignedTo) return false;
    
    const assignedUserId = typeof assignedTo === 'object' 
      ? assignedTo._id 
      : assignedTo;
    
    return currentUser._id === assignedUserId;
  };

  const handleAssignDropdownClick = () => {
    if (isAssignedUser()) return; 
    setShowAssignDropdown(!showAssignDropdown);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="title-section">
          <h3>Title <span className="required">*</span></h3>
          <div className="title-input-wrapper">
            <input
              type="text"
              placeholder="Enter Task Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="title-input"
            />
          </div>
        </div>

        <div className="priority-section">
          <h3>Select Priority <span className="required">*</span></h3>
          <div className="priority-buttons">
            {[
              { label: 'HIGH PRIORITY', color: '#D8727D' },
              { label: 'MODERATE PRIORITY', color: '#18B0FF' },
              { label: 'LOW PRIORITY', color: '#68B266' }
            ].map(({ label, color }) => (
              <button
                key={label}
                className={`priority-button ${priority === label ? 'active' : ''}`}
                onClick={() => setPriority(label)}
                style={{ color: priority === label ? color : '#787486' }}
              >
                <span className="priority-dot" style={{ backgroundColor: color }}></span>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="assign-section">
          <h3>Assign to</h3>
          <div className="assign-dropdown" ref={assignDropdownRef}>
            <button 
              className={`assign-dropdown-button ${isAssignedUser() ? 'disabled' : ''}`}
              onClick={handleAssignDropdownClick}
              disabled={isAssignedUser()}
            >
              {getAssignedUserEmail(assignedTo) || 'Add assignee'}
            </button>
            {showAssignDropdown && (
              <div className="assign-dropdown-menu task-modal-dropdown-menu">
                {users
                  .filter(user => user._id !== currentUser._id)
                  .map(user => (
                    <div key={user._id} className="assign-dropdown-item">
                      <div className="user-info">
                        <div className="user-avatar">
                          {getUserInitials(user)}
                        </div>
                        <span className="user-email">{user.email}</span>
                      </div>
                      <button 
                        className={`assign-button ${assignedTo === user._id ? 'unassign-button' : ''}`}
                        onClick={() => {
                          if (assignedTo === user._id) {
                            setAssignedTo('');
                          } else {
                            setAssignedTo(user._id);
                          }
                          setShowAssignDropdown(false);
                        }}
                      >
                        {assignedTo === user._id ? 'Unassign' : 'Assign'}
                      </button>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        <div className="checklist-section">
          <h3>Checklist ({checklist.filter(item => item.isCompleted).length}/{checklist.length}) <span className="required">*</span></h3>
          <div className="checklist-container">
            <div className="checklist-items">
              {checklist.map((item, index) => (
                <div key={index} className="checklist-item">
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => handleChecklistItemToggle(index)}
                  />
                  <input
                    type="text"
                    value={item.text}
                    placeholder="Task to be done"
                    onChange={(e) => handleChecklistItemChange(index, e.target.value)}
                  />
                  <button onClick={() => handleDeleteChecklistItem(index)} className="delete-button">
                    <BsFillTrashFill size={20} />
                  </button>
                </div>
              ))}
            </div>
            <button className="add-new-button" onClick={handleAddChecklistItem}>
              + Add New
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <div className="date-button-wrapper">
            <button 
              className="date-button"
              onClick={() => setShowDatePicker(true)}
            >
              {formatDate(dueDate)}
            </button>
            {showDatePicker && (
              <DatePicker
                selected={dueDate}
                onChange={(date) => {
                  setDueDate(date);
                  setShowDatePicker(false);
                }}
                dateFormat="MM/dd/yyyy"
                onClickOutside={() => setShowDatePicker(false)}
                open={true}
                customInput={<></>}
                calendarClassName="custom-calendar"
              >
                <div className="datepicker-footer">
                  <button 
                    type="button" 
                    className="datepicker-button"
                    onClick={(e) => {
                      e.preventDefault();
                      setDueDate(null);
                      setShowDatePicker(false);
                    }}
                  >
                    Clear date
                  </button>
                  <button 
                    type="button" 
                    className="datepicker-button"
                    onClick={(e) => {
                      e.preventDefault();
                      setDueDate(new Date());
                      setShowDatePicker(false);
                    }}
                  >
                    Today
                  </button>
                </div>
              </DatePicker>
            )}
          </div>
          <div className="footer-actions">
            <button className="modal-cancel-button" onClick={onClose}>Cancel</button>
            <button 
              className="save-button" 
              onClick={handleSave}
              disabled={!isFormValid()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;
