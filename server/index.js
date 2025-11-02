// server/index.js

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// 配置 CORS，允许你的 React 客户端 (通常在 localhost:3000) 连接
const io = new Server(server, {
  cors: {
    origin: "*", // 在生产环境中建议指定为你的客户端地址，例如 "http://localhost:3000"
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const players = {};

io.on('connection', (socket) => {
  console.log(`✨ a user connected: ${socket.id}`);

  // 1. 为新玩家创建一个临时的信息对象
  players[socket.id] = {
    id: socket.id,
    position: { top: 300, left: 400 }, // 默认出生点
    direction: 'down',
    isWalking: false,
    frame: 0,
    nickname: `Guest_${Math.floor(Math.random() * 1000)}` // 临时昵称
  };
  
  // 2. 监听来自客户端的正式玩家数据（例如昵称）
  socket.on('playerData', ({ nickname }) => {
    // 更新服务器上的玩家昵称
    if (players[socket.id]) {
      players[socket.id].nickname = nickname;
    }

    // --- (核心修复逻辑) ---

    // A. 创建一个【不包含当前新玩家】的玩家列表
    const otherPlayers = { ...players };
    delete otherPlayers[socket.id];

    // B. 只将【其他】玩家的信息发送给【当前新玩家】
    // 这样它就不会收到自己的信息了
    socket.emit('currentPlayers', otherPlayers);

    // C. 将【新玩家】的信息广播给【所有其他】已经在线的玩家
    socket.broadcast.emit('newPlayer', players[socket.id]);
  });

  // 监听玩家移动事件
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id] = {
        ...players[socket.id],
        ...movementData,
      };
      // 将移动信息广播给其他所有客户端
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  // 监听玩家断开连接事件
  socket.on('disconnect', () => {
    console.log(`🔥 a user disconnected: ${socket.id}`);
    delete players[socket.id];
    // 广播玩家离开的消息
    io.emit('playerDisconnected', socket.id);
  });

  // --- 邀请功能事件监听 ---

  // 监听发送邀请事件
  socket.on('sendInvitation', (invitationData) => {
    // invitationData 应该包含 { fromId, toId, fromNickname, duration }
    const recipientSocket = io.sockets.sockets.get(invitationData.toId);
    if (recipientSocket) {
        console.log(`💌 Invitation sent from ${invitationData.fromNickname} to ${invitationData.toId}`);
        // 将邀请信息只发送给目标玩家
        recipientSocket.emit('receiveInvitation', invitationData);
    } else {
        console.log(`❌ Invitation failed: User ${invitationData.toId} not found.`);
        // （可选）可以通知邀请者，对方已离线
        socket.emit('invitationFailed', { message: 'The player is no longer online.' });
    }
  });

  // 监听接受邀请事件
  socket.on('acceptInvitation', (data) => {
    // data 应该包含 { fromId, toId, duration }
    const inviterSocket = io.sockets.sockets.get(data.fromId);
    // 启动双方的计时器
    if (inviterSocket) {
      inviterSocket.emit('startFocus', { duration: data.duration, partnerId: data.toId });
    }
    // 接受者自己也需要启动
    socket.emit('startFocus', { duration: data.duration, partnerId: data.fromId });
    console.log(`✅ Invitation accepted between ${data.fromId} and ${data.toId}`);
  });

  // 监听拒绝邀请事件
  socket.on('rejectInvitation', (data) => {
    // data 应该包含 { fromId, toNickname }
    const inviterSocket = io.sockets.sockets.get(data.fromId);
    if (inviterSocket) {
        inviterSocket.emit('invitationRejected', { by: data.toNickname });
    }
    console.log(`❌ Invitation rejected by ${data.toNickname}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});