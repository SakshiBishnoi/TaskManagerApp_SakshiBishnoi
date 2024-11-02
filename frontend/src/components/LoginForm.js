import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import astronautImage from '../assets/astronaut.png';
import backImage from '../assets/Back.png';
import '../styles/auth.css';
import { FiEye } from "react-icons/fi";
import { GoEyeClosed } from "react-icons/go";

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const showErrorToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      showErrorToast('Email is required');
      return false;
    }
    if (!formData.password.trim()) {
      showErrorToast('Password is required');
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const response = await login(formData);
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        showErrorToast(error.response.data.message);
      } 
      else if (error.message === 'Network Error') {
        showErrorToast('Unable to connect to the server. Please try again later.');
      }
      else {
        showErrorToast('Invalid credentials');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="image-container">
          <img src={backImage} alt="Background Circle" className="background-circle" />
          <img src={astronautImage} alt="Astronaut" className="astronaut-image" />
        </div>
        <h1>Welcome aboard my friend</h1>
        <p>just a couple of clicks and we start</p>
      </div>
      <div className="auth-right">
        <div className="auth-form">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="Email"
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input 
                type={showPassword ? "text" : "password"}
                id="password" 
                name="password" 
                placeholder="Password"
                value={formData.password} 
                onChange={handleChange} 
                required 
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <GoEyeClosed /> : <FiEye />}
              </button>
            </div>
            <button type="submit" className="auth-button">Log in</button>
          </form>
          {showToast && (
            <div className="toast error">
              {toastMessage}
            </div>
          )}
          <div className="auth-link">
            <p>Have no account yet?</p>
            <button onClick={() => navigate('/register')}>Register</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
