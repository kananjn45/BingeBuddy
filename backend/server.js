const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Room = require('./models/Room');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.DB_URL || 'mongodb://localhost:27017/bingebuddy', {
  // Options can be added if using older Mongoose, but modern Mongoose works without them
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // 1. Join Room
  socket.on('join_room', async ({ roomId, username }) => {
    socket.join(roomId);
    
    try {
      let room = await Room.findOne({ roomId });
      
      let role = 'Participant';
      if (!room) {
        // First user creates the room and becomes Host
        role = 'Host';
        room = new Room({
          roomId,
          videoId: '', // default empty
          users: []
        });
      } else if (room.users.length === 0) {
        role = 'Host';
      }

      const newUser = { socketId: socket.id, username, role };
      room.users.push(newUser);
      await room.save();

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
  socket.on('sync_action', async ({ roomId, action, payload }) => {
    try {
      const room = await Room.findOne({ roomId });
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
      await room.save();

      // Broadcast to everyone ELSE in the room
      socket.to(roomId).emit('sync_state', { action, payload, state: room });
    } catch (err) {
      console.error(err);
    }
  });

  // 3. Disconnect
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    try {
      // Find room containing this user
      const room = await Room.findOne({ 'users.socketId': socket.id });
      if (room) {
        // Remove user
        room.users = room.users.filter(u => u.socketId !== socket.id);
        
        // Handle Host leaving
        if (room.users.length > 0) {
           const hasHost = room.users.some(u => u.role === 'Host');
           if (!hasHost) {
              room.users[0].role = 'Host'; // Promote first remaining user to Host
           }
           await room.save();
           io.to(room.roomId).emit('user_left', room.users);
        } else {
           // Delete room if empty
           await Room.deleteOne({ roomId: room.roomId });
        }
      }
    } catch (err) {
      console.error(err);
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
