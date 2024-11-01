import React from 'react';
import '../styles/confirmModal.css';

function ConfirmModal({ isOpen, onClose, onConfirm, title, type }) {
  if (!isOpen) return null;

  const getButtonText = () => {
    switch (type) {
      case 'logout':
        return 'Yes, Logout';
      case 'delete':
        return 'Yes, Delete';
      default:
        return 'Yes';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="confirm-modal">
        <h3>{title}</h3>
        <div className="confirm-buttons">
          <button 
            className={`confirm-${type}`}
            onClick={onConfirm}
          >
            {getButtonText()}
          </button>
          <button 
            className="confirm-cancel" 
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
