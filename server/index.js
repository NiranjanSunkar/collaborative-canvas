require('dotenv').config(); // Load environment variables first

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const drawingState = require('./drawing-state');

const app = express();
app.use(cors());

// 1. Create the HTTP server using the express app
const server = http.createServer(app); 

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// 2. Initialize Socket.io with the 'server' variable defined above
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`User Joined: ${socket.id}`);

  // 1. Initialize user with current history and a random color
  const userColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
  socket.emit('init-setup', { 
    userId: socket.id, 
    history: drawingState.getSnapshot(),
    color: userColor
  });

  // 2. Real-time broadcast: Send drawing steps to others as they happen
  socket.on('draw-step', (data) => {
    socket.broadcast.emit('remote-draw-step', {
      ...data,
      userId: socket.id
    });
  });

  // 3. Commit completed strokes to history
  socket.on('stroke-end', (strokeData) => {
    drawingState.addStroke({ ...strokeData, userId: socket.id });
  });

  // 4. Global Undo Logic
  socket.on('undo-request', () => {
    const success = drawingState.undo(socket.id);
    if (success) {
      io.emit('history-update', drawingState.getSnapshot());
    }
  });

  // 5. Global Redo Logic
  socket.on('redo-request', () => {
    const success = drawingState.redo(socket.id);
    if (success) {
      io.emit('history-update', drawingState.getSnapshot());
    }
  });

  // 6. Cursor Positions for Real-time Presence
  socket.on('mouse-move', (pos) => {
    socket.broadcast.emit('remote-cursor-move', {
      userId: socket.id,
      ...pos
    });
  });

  socket.on('disconnect', () => {
    console.log(`User Left: ${socket.id}`);
    socket.broadcast.emit('user-disconnected', socket.id);
  });
});

// 3. Start the server
server.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});