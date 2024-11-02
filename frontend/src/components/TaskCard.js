import React, { useState, useRef, useEffect } from 'react';
import { shareTask } from '../api/taskApi';
import { BsThreeDots } from 'react-icons/bs';
import { IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5';
import '../styles/taskCard.css';
import ConfirmModal from './ConfirmModal';

function TaskCard({ task, onEdit, onDelete, onStatusChange, onChecklistItemToggle, users, isExpanded, onExpand, currentUser }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const dropdownRef = useRef(null);

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'moderate':
        return '#18B0FF'; 
      case 'high':
        return '#FF2473'; 
      case 'low':
        return '#63C05B'; 
      default:
        return '#787486'; 
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const { shareUrl } = await shareTask(task._id);
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setShowToast(true);
      setToastMessage('Link Copied!');
      setTimeout(() => {
        setShowToast(false);
        setIsCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Error sharing task:', error);
      setShowToast(true);
      setToastMessage('Failed to share task');
    } finally {
      setIsSharing(false);
      setShowDropdown(false);
    }
  };

  const allStatuses = ['backlog', 'todo', 'inProgress', 'done'];

  const formatStatus = (status) => {
    switch(status) {
      case 'inProgress':
        return 'Progress';
      default:
        return status;
    }
  };

  const getAssignedUserEmail = (assignedTo) => {
    if (!assignedTo) return 'UN';
    
    if (typeof assignedTo === 'object') {
      if (assignedTo.name) {
        return assignedTo.name.slice(0, 2).toUpperCase();
      }
      if (assignedTo.email) {
        return assignedTo.email.slice(0, 2).toUpperCase();
      }
    }
    
    const user = users.find(u => u._id === assignedTo);
    if (!user) return 'UN';
    
    if (user.name) {
      return user.name.slice(0, 2).toUpperCase();
    }
    
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    
    return 'UN';
  };

  const isDueDate = (date) => {
    if (!date) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate.getTime() < today.getTime()) {
      return 'overdue';
    } else if (dueDate.getTime() === today.getTime()) {
      return 'today';
    } else {
      return 'future';
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    
    const day = d.getDate();
    const suffix = getDaySuffix(day);
    
    return d.toLocaleDateString('en-US', { 
      month: 'short',
    }) + ' ' + day + suffix;
  };

  const getDaySuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setShowDropdown(false);
  };

  const handleConfirmDelete = () => {
    onDelete(task._id);
    setShowDeleteConfirm(false);
  };

  const shouldShowAssignedUser = () => {
    if (!task.assignedTo || !currentUser) return false;
    
    const assignedUserId = typeof task.assignedTo === 'object' 
      ? task.assignedTo._id 
      : task.assignedTo;
    
    return currentUser._id !== assignedUserId;
  };

  return (
    <>
      <div className={`task-card ${isExpanded ? 'expanded' : ''}`}>
        <div className="task-card-header">
          <div className="left-section">
            <div className="priority-user-group">
              <div className="task-priority">
                <div className={`priority-dot ${task.priority.toLowerCase()}`}></div>
                <span 
                  className="priority-text" 
                  style={{ color: getPriorityColor(task.priority) }}
                >
                  {task.priority}
                </span>
              </div>
              {shouldShowAssignedUser() && (
                <div className="assigned-to">
                  <span className="assigned-user">
                    {getAssignedUserEmail(task.assignedTo)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="dropdown-wrapper" ref={dropdownRef}>
            <button 
              className="menu-button"
              onClick={() => setShowDropdown(!showDropdown)}
              aria-label="More options"
            >
              <BsThreeDots size={16} />
            </button>
            
            {showDropdown && (
              <div className="menu-items">
                <button onClick={() => {
                  onEdit(task);
                  setShowDropdown(false);
                }}>Edit</button>
                <button onClick={handleShare}>
                  {isSharing ? 'Sharing...' : isCopied ? 'Link Copied!' : 'Share'}
                </button>
                <button 
                  className="delete-option"
                  onClick={handleDeleteClick}>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <h4 className="task-title">{task.title}</h4>

        <div className="checklist-wrapper">
          <span className="checklist-count">
            Checklist ({task.checklist.filter(item => item.isCompleted).length}/{task.checklist.length})
          </span>
          <button 
            className="expand-button"
            onClick={() => onExpand(!isExpanded)}
          >
            {isExpanded ? <IoChevronUpOutline size={16} /> : <IoChevronDownOutline size={16} />}
          </button>
        </div>

        {isExpanded && (
          <div className="checklist-items">
            {task.checklist.map((item, index) => (
              <div key={index} className="checklist-item">
                <input
                  type="checkbox"
                  checked={item.isCompleted}
                  onChange={() => onChecklistItemToggle(task._id, index)}
                />
                <span 
                  title={item.text} 
                  data-text={item.text}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="task-footer">
          {task.dueDate && (
            <span className={`due-date ${isDueDate(task.dueDate)} ${task.status === 'done' ? 'done' : ''}`}>
              {formatDate(task.dueDate)}
            </span>
          )}
          <div className="status-buttons">
            {allStatuses
              .filter(status => status !== task.status)
              .map(status => (
                <button 
                  key={status}
                  className="status-btn"
                  onClick={() => onStatusChange(task._id, status)}
                >
                  {formatStatus(status)}
                </button>
              ))}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleConfirmDelete}
          title="Are you sure you want to Delete?"
          type="delete"
        />
      )}

      {showToast && (
        <div className={`toast ${toastMessage === 'Link Copied!' ? 'success' : 'error'}`}>
          {toastMessage}
        </div>
      )}
    </>
  );
}

export default TaskCard;
