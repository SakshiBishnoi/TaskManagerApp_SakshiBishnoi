import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationAsRead } from '../api/notificationApi';
import '../styles/notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const isNotificationRead = (notificationId) => {
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    return readNotifications.includes(notificationId);
  };

  const fetchNotifications = async () => {
    try {
      const fetchedNotifications = await getNotifications();
      if (fetchedNotifications.length > 0) {
        const unreadNotifications = fetchedNotifications.filter(
          notification => !isNotificationRead(notification._id)
        );
        setNotifications(unreadNotifications);
        
        const firstUnread = unreadNotifications[0];
        if (firstUnread) {
          setCurrentNotification(firstUnread);
          setShowPopup(true);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      
      const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      if (!readNotifications.includes(notificationId)) {
        readNotifications.push(notificationId);
        localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
      }
      
      setNotifications(notifications.filter(n => n._id !== notificationId));
      setShowPopup(false);
      setCurrentNotification(null);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const NotificationMessage = ({ message }) => {
    const truncateTaskTitle = (message) => {
      const titleMatch = message.match(/"([^"]*)/);
      if (!titleMatch) return message;
      
      const title = titleMatch[1];
      const truncatedTitle = title.length > 30 ? title.substring(0, 30) + '...' : title;
      return message.replace(title, truncatedTitle);
    };

    return (
      <div className="notification-message">
        <p>{truncateTaskTitle(message)}</p>
        <button 
          className="got-it-button"
          onClick={() => handleMarkAsRead(currentNotification._id)}
        >
          Got it
        </button>
      </div>
    );
  };

  return (
    <>
      {showPopup && currentNotification && (
        <div className="notification-overlay">
          <div className="notification-modal">
            <div className="notification-content">
              <NotificationMessage message={currentNotification.message} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Notifications;
