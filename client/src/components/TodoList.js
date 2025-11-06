import React, { useState, useEffect } from 'react';
import './TodoList.css';

const TODO_STORAGE_KEY = 'focus_cafe_todos';

function TodoList() {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(TODO_STORAGE_KEY);
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    } catch (error) {
      console.error("无法从 localStorage 加载任务:", error);
    }
  }, []);

  
  useEffect(() => {
    try {
      localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error("无法将任务保存到 localStorage:", error);
    }
  }, [tasks]);

  // 处理添加新任务
  const handleAddTask = (e) => {
    e.preventDefault(); // 防止表单提交导致页面刷新
    if (inputValue.trim() === '') return; // 不允许添加空任务
    
    const newTask = {
      id: Date.now(), // 使用时间戳作为唯一ID
      text: inputValue,
      completed: false,
    };
    setTasks([...tasks, newTask]);
    setInputValue(''); // 清空输入框
  };

  // 处理切换任务完成状态 (打勾)
  const handleToggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  // 处理删除任务
  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="todo-list-widget">
      <div className="todo-header">TO-DO LIST</div>
      <form className="todo-form" onSubmit={handleAddTask}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="New Task..."
        />
        <button type="submit">+</button>
      </form>
      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className={task.completed ? 'completed' : ''}>
            <div className="checkbox" onClick={() => handleToggleTask(task.id)}>
              {task.completed ? '✔' : ''}
            </div>
            <span className="task-text">{task.text}</span>
            <button className="delete-btn" onClick={() => handleDeleteTask(task.id)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList;
