import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { removeToken, isAuthenticated, getToken } from '../utils/token';
import { updateUser, getUserData } from '../api/userApi';
import '../styles/settings.css';
import { FiEye } from "react-icons/fi";
import { GoEyeClosed } from "react-icons/go";

function Settings() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    oldPassword: '',
    newPassword: ''
  });
  const [error, setError] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [userData, setUserData] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    } else {
      fetchUserData();
    }
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      const userData = await getUserData();
      setFormData(prevState => ({
        ...prevState,
        name: userData.name,
        email: userData.email
      }));
      setUserData(userData);
      setError('');
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to fetch user data. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {};
      let updateMessage = '';
      
      const hasNameChange = formData.name !== userData.name;
      const hasEmailChange = formData.email !== userData.email;
      const hasPasswordChange = formData.oldPassword && formData.newPassword;
      
      const changesCount = [hasNameChange, hasEmailChange, hasPasswordChange].filter(Boolean).length;
      
      if (changesCount === 0) {
        setToastMessage('No changes detected');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
      
      if (changesCount > 1) {
        setToastMessage('Please update only one field at a time');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      if (hasNameChange) {
        updatedData.name = formData.name;
        updateMessage = 'Name changed successfully';
      }
      else if (hasEmailChange) {
        updatedData.email = formData.email;
        updateMessage = 'Email changed successfully';
      }
      else if (hasPasswordChange) {
        updatedData.oldPassword = formData.oldPassword;
        updatedData.newPassword = formData.newPassword;
        updateMessage = 'Password changed successfully';
      }

      await updateUser(updatedData);
      showSuccessToast(updateMessage);

      if (updatedData.oldPassword) {
        setFormData(prevState => ({
          ...prevState,
          oldPassword: '',
          newPassword: ''
        }));
      } else {
        await fetchUserData();
      }
      
      setError('');
    } catch (error) {
      setToastMessage('Failed to update settings');
      setShowToast(true);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateUser({ name: formData.name });
      showSuccessToast('Name changed successfully');
    } catch (error) {
      setToastMessage('Failed to update name');
      setShowToast(true);
    }
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateUser({ email: formData.email });
      showSuccessToast('Email changed successfully');
    } catch (error) {
      setToastMessage('Failed to update email');
      setShowToast(true);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateUser({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      });
      showSuccessToast('Password changed successfully');
      setFormData(prevState => ({
        ...prevState,
        oldPassword: '',
        newPassword: ''
      }));
    } catch (error) {
      setToastMessage('Failed to update password');
      setShowToast(true);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar onLogout={handleLogout} />
      <div className="settings-content">
        <div className="settings-header">
          <h1>Settings</h1>
        </div>
        
        <div className="settings-container">
          <form className="settings-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                type="email"
                name="email"
                placeholder="Update Email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group password-field">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type={showOldPassword ? "text" : "password"}
                name="oldPassword"
                placeholder="Old Password"
                value={formData.oldPassword}
                onChange={handleChange}
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? <GoEyeClosed /> : <FiEye />}
              </button>
            </div>

            <div className="form-group password-field">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                placeholder="New Password"
                value={formData.newPassword}
                onChange={handleChange}
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <GoEyeClosed /> : <FiEye />}
              </button>
            </div>

            <button type="submit" className="update-button">
              Update
            </button>
          </form>
          
          {error && <p className="message error">{error}</p>}
          
          {showToast && (
            <div className={`toast ${
              toastMessage.includes('successfully') 
                ? 'success' 
                : toastMessage.includes('No changes') 
                  ? 'warning'
                  : 'error'
            }`}>
              {toastMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
