import React from 'react';
import './Notification.css';


function Notification({ message, show, type = 'error' }) {
  const classes = `notification-container ${type} ${show ? 'show' : ''}`;

  return (
    <div className={classes}>
      {message}
    </div>
  );
}

export default Notification;