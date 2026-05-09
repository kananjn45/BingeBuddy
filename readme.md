# 📺 BingeBuddy (YouTube Watch Party)

A real-time synchronized video sharing platform where users can watch YouTube videos together. Built with a full-stack architecture utilizing WebSockets for instant synchronization.

## 🚀 Live Demo
Live URL: *(Coming Soon)*

## 🛠 Tech Stack
- **Frontend**: React.js, TypeScript, Tailwind CSS v4, Vite
- **Backend**: Node.js, Express.js
- **Real-time**: Socket.IO (WebSockets)
- **Database**: MongoDB (Mongoose)
- **API**: YouTube IFrame Player API

## ✨ Features
- ✅ **Real-time Synchronization**: Play, pause, and seek actions are synced across all clients.
- ✅ **Room-Based System**: Create unique rooms or join existing ones via codes.
- ✅ **Role-Based Access Control (RBAC)**:
  - **Host**: Full control over playback and user management.
  - **Moderator**: Can control playback.
  - **Participant/Viewer**: Watch-only access.
- ✅ **Dynamic Participant List**: See who is in the room and their role in real-time.
- ✅ **Backend Validation**: The server verifies permissions before executing playback commands.

## ⚙️ Local Setup

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
Clone the repository:
```bash
git clone https://github.com/your-username/bingebuddy.git
cd bingebuddy
```

### Install Dependencies & Run
We use `concurrently` to run both frontend and backend easily:
```bash
# Install all dependencies for both frontend and backend
npm run install:all

# Start both development servers
npm run dev
```

Open the app by navigating to [http://localhost:5173](http://localhost:5173).

## 📡 Architecture Overview
The application uses a Client-Server-Client communication model via WebSockets:

1. **Client -> Server**: User triggers an action (e.g., pause).
2. **Server Logic**: The server receives the event, identifies the user's role in the room, and checks if they have playback control permissions.
3. **Server -> Clients**: If authorized, the server broadcasts the sync state event to all users joined to that specific Room ID.
4. **Client Execution**: The YouTube IFrame API receives the command and pauses the video locally for every user.

## 📝 License
MIT License - feel free to use this for your own learning!
