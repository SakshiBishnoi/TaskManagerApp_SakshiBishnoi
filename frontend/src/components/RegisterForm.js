import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/authApi';
import axios from 'axios';
import astronautImage from '../assets/astronaut.png';
import backImage from '../assets/Back.png';
import '../styles/auth.css';
import { FiEye } from "react-icons/fi";
import { GoEyeClosed } from "react-icons/go";
import debounce from 'lodash/debounce';

function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState({
    hasLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecial: false
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const debouncedValidatePassword = useMemo(
    () => debounce((password) => {
      const strength = {
        hasLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      };
      setPasswordStrength(strength);
      return Object.values(strength).every(Boolean);
    }, 150),
    []
  );

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password') {
      debouncedValidatePassword(value);
    }
  }, [debouncedValidatePassword]);

  const showErrorToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(formData.email)) {
      showErrorToast('Please enter a valid email address');
      return;
    }

    if (!validatePassword(formData.password)) {
      showErrorToast('Password does not meet all requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showErrorToast('Passwords do not match');
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      navigate('/login');
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const validatePassword = (password) => {
    const strength = {
      hasLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordStrength(strength);
    return Object.values(strength).every(Boolean);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const PasswordRequirements = () => {
    const remainingRequirements = Object.entries(passwordStrength)
      .filter(([_, isValid]) => !isValid)
      .map(([requirement]) => {
        const requirementText = {
          hasLength: 'At least 8 characters',
          hasUpperCase: 'One uppercase letter',
          hasLowerCase: 'One lowercase letter',
          hasNumber: 'One number',
          hasSpecial: 'One special character'
        }[requirement];
        return <li key={requirement}>{requirementText}</li>;
      });

    if (remainingRequirements.length === 0) {
      return null;
    }

    return (
      <div className="password-requirements">
        <h4>Remaining requirements:</h4>
        <ul>{remainingRequirements}</ul>
      </div>
    );
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
          <h2>Register</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input 
                type="text" 
                id="name" 
                name="name" 
                placeholder="Name"
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </div>
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
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={() => setShowPasswordRequirements(false)}
                required 
              />
              {showPasswordRequirements && formData.password && <PasswordRequirements />}
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <GoEyeClosed /> : <FiEye />}
              </button>
            </div>
            <div className="form-group">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input 
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword" 
                name="confirmPassword" 
                placeholder="Confirm Password"
                value={formData.confirmPassword} 
                onChange={handleChange} 
                required 
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <GoEyeClosed /> : <FiEye />}
              </button>
            </div>
            <button type="submit" className="auth-button">Register</button>
          </form>
          {message && <p className={`message ${message.includes('successful') ? 'success-message' : 'error-message'}`}>{message}</p>}
          <div className="auth-link">
            <p>Already have an account?</p>
            <button onClick={() => navigate('/login')}>Log in</button>
          </div>
        </div>
      </div>
      {showToast && (
        <div className={`toast error`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default RegisterForm;
