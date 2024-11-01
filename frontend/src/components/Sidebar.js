import React from 'react';
import { NavLink } from 'react-router-dom';
import { MdOutlineSpaceDashboard } from 'react-icons/md';
import { GoDatabase } from 'react-icons/go';
import { FiSettings } from 'react-icons/fi';
import { TbLogout } from "react-icons/tb";
import logo from '../assets/logo.png';

function Sidebar({ onLogout }) {
  return (
    <div className="sidebar">
      <div className="menu-container">
        <div className="logo-container">
          <img src={logo} alt="Pro Manage" className="logo-image" />
          <span className="logo-text">Pro Manage</span>
        </div>
        
        <div className="menu">
          <NavLink to="/dashboard" className="nav-item" activeClassName="active">
            <MdOutlineSpaceDashboard size={20} /> Board
          </NavLink>
          <NavLink to="/analytics" className="nav-item" activeClassName="active">
            <GoDatabase size={20} /> Analytics
          </NavLink>
          <NavLink to="/settings" className="nav-item" activeClassName="active">
            <FiSettings size={20} /> Settings
          </NavLink>
        </div>
      </div>
      
      <button className="nav-item logout-nav-item" onClick={onLogout}>
        <TbLogout size={20} />
        <span>Logout</span>
      </button>
    </div>
  );
}

export default Sidebar;
