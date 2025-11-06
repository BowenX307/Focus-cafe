import React, { useState, useEffect, useRef } from 'react';
import './FocusTimer.css';

const TIME_OPTIONS = [15, 25, 50];

function FocusTimer({ onStateChange, onFocusComplete, focusCommand}) {
  const [mode, setMode] = useState('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [duration, setDuration] = useState(TIME_OPTIONS[1] * 60);
  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);

  useEffect(() => {
    if (focusCommand) {
      const { duration: commandDuration } = focusCommand;
      const durationInSeconds = commandDuration * 60;
      setDuration(durationInSeconds);
      // 使用 setTimeout 确保状态更新后再启动计时器
      setTimeout(() => startTimer(durationInSeconds), 0);
    }
  }, [focusCommand]);

  useEffect(() => {
    if (onStateChange) {
      onStateChange(mode === 'running' || mode === 'paused');
    }
  }, [mode, onStateChange]);

  const startTimer = (startDuration) => {
    const finalDuration = startDuration || duration;
    if (finalDuration <= 0) return;

    endTimeRef.current = Date.now() + finalDuration * 1000;
    setTimeLeft(finalDuration);
    setMode('running');
    
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        if (onFocusComplete) onFocusComplete(finalDuration / 60);
        if (onStateChange) onStateChange(false);
        setMode('idle');
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
  };
  
  const handleStartFocus = () => {
    if (duration <= 0) return;
    startTimer(); // 不带参数调用，使用内部的 duration state
  };

  const pauseTimer = () => {
    clearInterval(intervalRef.current);
    setMode('paused');
  };

  const stopTimer = () => {
    clearInterval(intervalRef.current);
    if (onStateChange) onStateChange(false);
    setMode('idle');
    setTimeLeft(0);
  }

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  
  const handleTimeInputChange = (e) => {
    const minutes = parseInt(e.target.value, 10);
    if (!isNaN(minutes) && minutes > 0) {
      setDuration(minutes * 60);
    } else if (e.target.value === '') {
      setDuration(0);
    }
  };
  
  const renderIdle = () => (
    <button className="start-focus-btn" onClick={() => setMode('setting')}>
      Start Focus
    </button>
  );

  const renderSettings = () => (
    <>
      <div>
        {TIME_OPTIONS.map(minutes => (
          <button
            key={minutes}
            className={duration === minutes * 60 ? 'selected' : ''}
            onClick={() => setDuration(minutes * 60)}
          >
            {minutes}min
          </button>
        ))}
      </div>
      <input
        type="number"
        placeholder="Custom"
        value={duration > 0 ? duration / 60 : ''}
        onChange={handleTimeInputChange}
        min="1"
      />
      <button onClick={handleStartFocus}>Start</button>
    </>
  );

  const renderTimer = () => (
    <>
      <div className="countdown-display">{formatTime(timeLeft)}</div>
      <div>
        <button onClick={mode === 'running' ? pauseTimer : startTimer}>
          {mode === 'running' ? 'Pause' : 'Resume'}
        </button>
        <button onClick={stopTimer}>Stop</button>
      </div>
    </>
  );

  return (
    <div className="timer-widget">
      {mode === 'idle' && renderIdle()}
      {mode === 'setting' && renderSettings()}
      {(mode === 'running' || mode === 'paused') && renderTimer()}
    </div>
  );
}

export default FocusTimer;

