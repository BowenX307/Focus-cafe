import React from 'react';
import './Dashboard.css';

function Dashboard({ todayFocusTime, user }) {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatDate = (date) => {
    // (核心修改) 指定 'en-US' 语言环境来确保日期是英文格式
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatFocusTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    let result = '';
    if (hours > 0) result += `${hours}h `;
    result += `${mins}m`;
    return result;
  };

  return (
    <div className="dashboard">
      <div className="welcome-message">
        Welcome, <strong>{user ? user.nickname : 'Guest'}</strong>!
      </div>

      <div className="date-time">
        <div className="time">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <div className="date">{formatDate(time)}</div>
      </div>

      <div className="focus-stats">
        <div className="stats-title">Today's Focus</div>
        <div className="stats-time">{formatFocusTime(todayFocusTime)}</div>
      </div>
    </div>
  );
}

export default Dashboard;

