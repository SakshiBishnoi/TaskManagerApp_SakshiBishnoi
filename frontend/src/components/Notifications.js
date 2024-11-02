import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationAsRead } from '../../api/notificationApi';
import '../styles/notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const fetchedNotifications = await getNotifications();
      if (fetchedNotifications.length > 0) {
        setNotifications(fetchedNotifications);
        // Show the first unread notification as popup
        const unreadNotification = fetchedNotifications.find(n => !n.read);
        if (unreadNotification) {
          setCurrentNotification(unreadNotification);
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
      setNotifications(notifications.filter(n => n._id !== notificationId));
      setShowPopup(false);
      setCurrentNotification(null);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const NotificationMessage = ({ message }) => {
    return (
      <div className="notification-message">
        <p>{message}</p>
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
