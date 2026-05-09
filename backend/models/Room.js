const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  socketId: { type: String, required: true },
  username: { type: String, required: true },
  role: { type: String, enum: ['Host', 'Moderator', 'Participant'], default: 'Participant' },
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  videoId: { type: String, default: '' },
  isPlaying: { type: Boolean, default: false },
  currentTime: { type: Number, default: 0 },
  users: [userSchema],
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
