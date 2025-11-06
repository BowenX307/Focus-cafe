import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { io } from "socket.io-client"; 

import backgroundImage from './assets/Japanese_house.png';
import idleSheet from './assets/Molly_idle_48x48.png';
import runSheet from './assets/Molly_run_48x48.png';
import { collisionMap, TILE_SIZE, GRID_WIDTH, GRID_HEIGHT } from './maps/cafeLayout';
import InvitationModal from './components/InvitationModal';

import FocusTimer from './components/FocusTimer';
import Notification from './components/Notification';
import { getOrCreateUser } from './utils/user';
import Dashboard from './components/Dashboard';
import TodoList from './components/TodoList';

const FRAME_WIDTH = 48;
const FRAME_HEIGHT = 96;
const RUN_FRAMES = 6;
const IDLE_FRAMES = 1;
const MOVE_STEP = 4;
const ANIMATION_SPEED = 100;

const DIRECTION_ORDER = {
  right: 0,
  down: 3,
  left: 2,
  up: 1,
};

const SAFE_SPAWN_POINT = { top: 5 * TILE_SIZE, left: 5 * TILE_SIZE };

const INTERACTION_DISTANCE = TILE_SIZE * 1.5;

function App() {
  const [position, setPosition] = useState(SAFE_SPAWN_POINT);
  const [direction, setDirection] = useState('right');
  const [frame, setFrame] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [otherPlayers, setOtherPlayers] = useState({});

  const [nearbyPlayer, setNearbyPlayer] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [focusCommand, setFocusCommand] = useState(null);

  // --- 通讯相关的 Refs ---
  const socketRef = useRef(null);

  // --- 其他状态和 Refs (保持不变) ---
  const [isFocusing, setIsFocusing] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'error' });
  const [user, setUser] = useState(null);
  const [todayFocusTime, setTodayFocusTime] = useState(0);
  const keysPressed = useRef({});
  const gameLoopRef = useRef();
  const lastFrameTimeRef = useRef(0);
  const isFocusingRef = useRef(isFocusing);
  useEffect(() => {
    isFocusingRef.current = isFocusing;
  }, [isFocusing]);
  //联网
  useEffect(() => {
    const localUser = getOrCreateUser();
    setUser(localUser);

    // 连接到我们的后端服务器 (确保你的后端在 3001 端口运行)
    socketRef.current = io('http://localhost:3001');
    const socket = socketRef.current;

    // 当成功连接时...
    socket.on('connect', () => {
      console.log('✅ 连接成功，我的ID是:', socket.id);
      // 告诉服务器我的昵称是什么
      socket.emit('playerData', { nickname: localUser.nickname });
    });

    socket.on('currentPlayers', (players) => {
      setOtherPlayers(players);
    });

    // 监听 'currentPlayers' 事件，获取所有已在线的玩家
    socket.on('currentPlayers', (players) => {
      // 我们需要移除自己，因为我们不想把自己渲染成“其他玩家”
      const otherPlayersData = { ...players };
      delete otherPlayersData[socket.id];
      setOtherPlayers(otherPlayersData);
    });

    // 监听 'newPlayer' 事件，有新玩家加入
    socket.on('newPlayer', (playerInfo) => {
      setOtherPlayers(prev => ({ ...prev, [playerInfo.id]: playerInfo }));
    });

    // 监听 'playerDisconnected' 事件，有玩家离开
    socket.on('playerDisconnected', (id) => {
      setOtherPlayers(prev => {
        const newPlayers = { ...prev };
        delete newPlayers[id];
        return newPlayers;
      });
    });

    // 监听 'playerMoved' 事件，更新其他玩家的位置和状态
    socket.on('playerMoved', (playerInfo) => {
      setOtherPlayers(prev => ({ ...prev, [playerInfo.id]: playerInfo }));
    });

    // 组件卸载时，确保断开连接
    return () => {
      socket.disconnect();
    };
  }, []);


  const handleTimerStateChange = useCallback((timerIsRunning) => {
    setIsFocusing(timerIsRunning);
  }, []);

  const handleFocusComplete = useCallback((minutesFocused) => {
    const newTotalTime = todayFocusTime + minutesFocused;
    setTodayFocusTime(newTotalTime);
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`focusTime_${today}`, newTotalTime);
    setNotification({
      show: true,
      message: `Congrats! You've focused for ${minutesFocused} minutes.`,
      type: 'success',
    });
  }, [todayFocusTime]);

  useEffect(() => {
    const localUser = getOrCreateUser();
    setUser(localUser);
    socketRef.current = io('http://localhost:3001');
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Connected with id:', socket.id);
      socket.emit('playerData', { nickname: localUser.nickname });
    });

    socket.on('currentPlayers', (players) => {
      const others = { ...players };
      if(socket.id) delete others[socket.id];
      setOtherPlayers(others);
    });

    socket.on('newPlayer', (playerInfo) => {
      if (socket.id !== playerInfo.id) {
        setOtherPlayers(prev => ({ ...prev, [playerInfo.id]: playerInfo }));
      }
    });

    socket.on('playerDisconnected', (id) => {
      setOtherPlayers(prev => {
        const newPlayers = { ...prev };
        delete newPlayers[id];
        return newPlayers;
      });
    });

    socket.on('playerMoved', (playerInfo) => {
      if (socket.id !== playerInfo.id) {
        setOtherPlayers(prev => ({ ...prev, [playerInfo.id]: playerInfo }));
      }
    });

    // 3. (核心新增) 监听邀请相关的事件
    socket.on('receiveFocusInvitation', (invite) => { setInvitation(invite); });
    socket.on('invitationAccepted', ({ duration }) => {
      setNotification({ show: true, message: 'Invitation accepted! Starting focus...', type: 'success' });
      setFocusCommand({ duration, trigger: Date.now() });
      setInvitation(null);
    });
    socket.on('invitationRejected', ({ fromId }) => {
      const rejectedPlayer = otherPlayers[fromId];
      setNotification({ show: true, message: `${rejectedPlayer?.nickname || 'A player'} rejected your invitation.`, type: 'error' });
    });

    return () => { socket.disconnect(); };
  }, []);
  
  // (核心修复) 键盘事件监听器现在只在组件加载时设置一次
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const moveKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

      if (moveKeys.includes(key)) {
        e.preventDefault(); 
      }

      // (核心修复) 使用 ref 来读取最新的 isFocusing 状态
      if (isFocusingRef.current) {
        if (moveKeys.includes(key)) {
          setNotification({ show: true, message: 'You cannot move while focusing!', type: 'error' });
        }
        return;
      }
      keysPressed.current[key] = true;
    };
    const handleKeyUp = (e) => {
      delete keysPressed.current[e.key.toLowerCase()];
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, []); // (核心修复) 空依赖数组，确保监听器只设置一次！

  const isColliding = (nextLeft, nextTop) => {
    const characterFeetY = nextTop + FRAME_HEIGHT - 5;
    const characterCenterX = nextLeft + FRAME_WIDTH / 2;
    if (nextLeft < 0 || nextTop < 0 || nextLeft + FRAME_WIDTH > GRID_WIDTH * TILE_SIZE || nextTop + FRAME_HEIGHT > GRID_HEIGHT * TILE_SIZE) return true;
    const gridX = Math.floor(characterCenterX / TILE_SIZE);
    const gridY = Math.floor(characterFeetY / TILE_SIZE);
    if (!collisionMap[gridY] || collisionMap[gridY][gridX] === undefined) return true;
    return collisionMap[gridY][gridX] === 1;
  };

  useEffect(() => {
    let lastSentState = {};

    const gameLoop = (currentTime) => {
      const walking = Object.keys(keysPressed.current).length > 0;
      setIsWalking(walking);
      setPosition(prevPosition => {
        let { top, left } = prevPosition;
        let currentDirection = direction;
        if (keysPressed.current['w'] || keysPressed.current['arrowup']) { top -= MOVE_STEP; currentDirection = 'up'; }
        else if (keysPressed.current['s'] || keysPressed.current['arrowdown']) { top += MOVE_STEP; currentDirection = 'down'; }
        else if (keysPressed.current['a'] || keysPressed.current['arrowleft']) { left -= MOVE_STEP; currentDirection = 'left'; }
        else if (keysPressed.current['d'] || keysPressed.current['arrowright']) { left += MOVE_STEP; currentDirection = 'right'; }
        setDirection(currentDirection);
        if (walking && !isColliding(left, top)) {
          return { top, left };
        }
        return prevPosition;
      });
      if (walking) {
        if (currentTime - lastFrameTimeRef.current > ANIMATION_SPEED) {
          setFrame(prevFrame => (prevFrame + 1) % RUN_FRAMES);
          lastFrameTimeRef.current = currentTime;
        }
      } else {
        setFrame(0);
      }
      let foundNearby = null;
      for (const player of Object.values(otherPlayers)) {
        const dx = player.position.left - position.left;
        const dy = player.position.top - position.top;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < INTERACTION_DISTANCE) {
          foundNearby = player;
          break;
        }
      }
      // 只有当自己不在专注时，才显示附近玩家的邀请按钮
      setNearbyPlayer(isFocusing ? null : foundNearby);
      const currentState = { position, direction, isWalking, frame };
      if (socketRef.current?.connected && JSON.stringify(currentState) !== JSON.stringify(lastSentState)) {
        socketRef.current.emit('playerMovement', currentState);
        lastSentState = currentState;
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [position, direction, isWalking, frame, otherPlayers, isFocusing]); // 这里的依赖是正确的

  const sendInvitation = () => {
    if (nearbyPlayer && socketRef.current) {
      const duration = 25; // 默认邀请25分钟
      socketRef.current.emit('sendFocusInvitation', {
        fromId: socketRef.current.id,
        toId: nearbyPlayer.id,
        duration: duration,
      });
      setNotification({ show: true, message: `Invitation sent to ${nearbyPlayer.nickname}!`, type: 'success' });
      setNearbyPlayer(null);
    }
  };

  const acceptInvitation = () => {
    if (invitation && socketRef.current) {
      socketRef.current.emit('acceptFocusInvitation', {
        fromId: invitation.fromId,
        toId: socketRef.current.id,
        duration: invitation.duration,
      });
    }
  };

  const rejectInvitation = () => {
    if (invitation && socketRef.current) {
      socketRef.current.emit('rejectFocusInvitation', {
        fromId: invitation.fromId,
        toId: socketRef.current.id,
      });
    }
    setInvitation(null);
  };
  

  const calculateBackgroundPosition = (isPlayerWalking, playerFrame, playerDirection) => {
    const directionIndex = DIRECTION_ORDER[playerDirection];
    if (isPlayerWalking) {
      const xOffset = (directionIndex * RUN_FRAMES + playerFrame) * FRAME_WIDTH;
      return `-${xOffset}px 0px`;
    } else {
      const xOffset = (directionIndex * IDLE_FRAMES) * FRAME_WIDTH;
      return `-${xOffset}px 0px`;
    }
  };

  const characterStyle = {
    backgroundImage: `url(${isWalking ? runSheet : idleSheet})`,
    backgroundPosition: calculateBackgroundPosition(isWalking, frame, direction),
    top: `${position.top}px`,
    left: `${position.left}px`,
  };

  return (
    <div className="page-container theme-pixel">
      {/* --- 顶部和侧边UI元素 --- */}
      <Dashboard 
        todayFocusTime={todayFocusTime} 
        user={user} 
      />
      <Notification 
        show={notification.show} 
        message={notification.message}
        type={notification.type}
      />
      <TodoList />

      {/* 1. (核心新增) 当有附近玩家且自己不在专注时，显示邀请按钮 */}
      {nearbyPlayer && !isFocusing && (
        <button className="invite-button" onClick={sendInvitation}>
          Invite {nearbyPlayer.nickname} to Focus!
        </button>
      )}

      {/* 2. (核心新增) 当收到邀请时，显示邀请模态框 */}
      <InvitationModal 
        invitation={invitation}
        onAccept={acceptInvitation}
        onReject={rejectInvitation}
      />

      {/* --- 游戏主场景 --- */}
      <div className="app-container" style={{ backgroundImage: `url(${backgroundImage})`, width: `${GRID_WIDTH * TILE_SIZE}px`, height: `${GRID_HEIGHT * TILE_SIZE}px` }}>
        {/* 渲染自己 */}
        <div className="character" style={characterStyle} />

        {/* 渲染所有其他玩家 */}
        {Object.values(otherPlayers).map(player => (
          <div key={player.id} className="character" style={{
            backgroundImage: `url(${player.isWalking ? runSheet : idleSheet})`,
            backgroundPosition: calculateBackgroundPosition(player.isWalking, player.frame, player.direction),
            top: `${player.position.top}px`,
            left: `${player.position.left}px`,
          }}>
            <div className="player-nickname">{player.nickname}</div>
          </div>
        ))}
      </div>
      
      {/* 3. (核心新增) 将远程启动命令传递给计时器 */}
      <FocusTimer 
        onStateChange={handleTimerStateChange} 
        onFocusComplete={handleFocusComplete}
        focusCommand={focusCommand}
      />
    </div>
  );
}

export default App;

