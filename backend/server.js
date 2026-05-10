const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// In-memory data store for rooms
const rooms = new Map();

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // 1. Join Room
  socket.on('join_room', ({ roomId, username }) => {
    socket.join(roomId);
    
    try {
      let room = rooms.get(roomId);
      let role = 'Participant';
      
      if (!room) {
        // First user creates the room and becomes Host
        role = 'Host';
        room = {
          roomId,
          videoId: '', 
          isPlaying: false,
          currentTime: 0,
          users: [{ socketId: socket.id, username, role }]
        };
        rooms.set(roomId, room);
      } else {
        if (room.users.length === 0) {
          role = 'Host';
        }
        
        // Check if user is already in the room (e.g., React Strict Mode double mount)
        const existingUserIndex = room.users.findIndex(u => u.socketId === socket.id);
        if (existingUserIndex !== -1) {
          room.users[existingUserIndex].username = username;
          role = room.users[existingUserIndex].role; // Retain their original role
        } else {
          room.users.push({ socketId: socket.id, username, role });
        }
      }

      // Send current state to the user who just joined
      socket.emit('room_state', {
        videoId: room.videoId,
        isPlaying: room.isPlaying,
        currentTime: room.currentTime,
        users: room.users,
        myRole: role
      });

      // Broadcast to others that a user joined
      io.to(roomId).emit('user_joined', room.users);
      
      console.log(`User ${username} joined room ${roomId} as ${role}`);
    } catch (err) {
      console.error(err);
      socket.emit('error', 'Could not join room');
    }
  });

  // 2. Playback Sync
  socket.on('sync_action', ({ roomId, action, payload }) => {
    try {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.find(u => u.socketId === socket.id);
      if (!user) return;

      // Role Based Access Control
      if (user.role === 'Participant') {
         return socket.emit('error', 'You do not have permission to control playback.');
      }

      // Update room state in DB
      if (action === 'play') room.isPlaying = true;
      if (action === 'pause') room.isPlaying = false;
      if (action === 'seek') room.currentTime = payload.currentTime;
      if (action === 'change_video') {
         room.videoId = payload.videoId;
         room.isPlaying = false;
         room.currentTime = 0;
      }

      // Broadcast to everyone ELSE in the room
      socket.to(roomId).emit('sync_state', { action, payload, state: room });
    } catch (err) {
      console.error(err);
    }
  });

  // Handle explicit leave
  socket.on('leave_room', ({ roomId }) => {
    try {
      const room = rooms.get(roomId);
      if (room) {
        room.users = room.users.filter(u => u.socketId !== socket.id);
        
        if (room.users.length > 0) {
           const hasHost = room.users.some(u => u.role === 'Host');
           if (!hasHost) {
              room.users[0].role = 'Host'; 
           }
           io.to(room.roomId).emit('user_left', room.users);
        } else {
           rooms.delete(roomId);
        }
      }
      socket.leave(roomId);
    } catch (err) {
      console.error(err);
    }
  });

  // 3. Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    try {
      // Find room containing this user
      for (const [roomId, room] of rooms.entries()) {
        const userExists = room.users.some(u => u.socketId === socket.id);
        if (userExists) {
          room.users = room.users.filter(u => u.socketId !== socket.id);
          
          if (room.users.length > 0) {
             const hasHost = room.users.some(u => u.role === 'Host');
             if (!hasHost) {
                room.users[0].role = 'Host';
             }
             io.to(roomId).emit('user_left', room.users);
          } else {
             rooms.delete(roomId);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} (Using In-Memory Storage)`);
});
