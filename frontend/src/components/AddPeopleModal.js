import React, { useState, useRef } from 'react';
import '../styles/addPeopleModal.css';

function AddPeopleModal({ isOpen, onClose, users, selectedAssignee, onAssigneeChange, onSubmit, isBulkAssigning, currentUser }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const dropdownRef = useRef(null);

  const filteredUsers = users.filter(user => {
    if (!user?._id) return false;
    if (!currentUser?._id) return true;
    return user._id.toString() !== currentUser._id.toString();
  });

  const getUserInitials = (user) => {
    if (!user || !user.name) return 'UN';
    return user.name.slice(0, 2).toUpperCase();
  };

  const getSelectedUserEmail = () => {
    const user = filteredUsers.find(u => u._id === selectedAssignee);
    return user ? user.email : 'Select user to assign all tasks';
  };

  const handleSubmit = async () => {
    await onSubmit();
    setShowSuccess(true);
  };

  const handleClose = () => {
    setShowSuccess(false);
    setShowDropdown(false);
    setSelectedEmail('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="add-people-overlay">
      <div className="add-people-content">
        {!showSuccess ? (
          <>
            <div className="add-people-header">
              <h3>Add People to the Board</h3>
            </div>
            <div className="add-people-body">
              <div className="add-people-select" ref={dropdownRef}>
                <button 
                  className="add-people-dropdown-button"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {getSelectedUserEmail()}
                </button>
                {showDropdown && (
                  <div className="add-people-dropdown-menu">
                    {filteredUsers.map(user => (
                      <div key={user._id} className="add-people-dropdown-item">
                        <div className="user-info">
                          <div className="user-avatar">
                            {getUserInitials(user)}
                          </div>
                          <span className="user-email">{user.email}</span>
                        </div>
                        <button 
                          className={`assign-button ${selectedAssignee === user._id ? 'unassign-button' : ''}`}
                          onClick={() => {
                            if (selectedAssignee === user._id) {
                              onAssigneeChange('');
                              setSelectedEmail('');
                            } else {
                              onAssigneeChange(user._id);
                              setSelectedEmail(user.email);
                            }
                            setShowDropdown(false);
                          }}
                        >
                          {selectedAssignee === user._id ? 'Unassign' : 'Assign'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="add-people-footer">
              <button className="add-people-cancel" onClick={handleClose}>
                Cancel
              </button>
              <button 
                className="add-people-submit"
                onClick={handleSubmit}
                disabled={!selectedAssignee || isBulkAssigning}
              >
                {isBulkAssigning ? 'Adding...' : 'Add Email'}
              </button>
            </div>
          </>
        ) : (
          <div className="success-message">
            <h3>{selectedEmail} added to board</h3>
            <button 
              className="okay-button"
              onClick={handleClose}
            >
              Okay, got it!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddPeopleModal;
