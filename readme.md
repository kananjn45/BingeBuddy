📺 YouTube Watch Party
A real-time synchronized video sharing platform where users can watch YouTube videos together. Built with a full-stack architecture utilizing WebSockets for instant synchronization.

🚀 Live Demo
Live URL: [Insert your Render/Railway link here]

🛠 Tech Stack
Frontend: React.js, TypeScript, Tailwind CSS, Vite
Backend: Node.js, Express.js
Real-time: Socket.IO (WebSockets)
Database: [Insert your DB, e.g., MongoDB or SQLite]
API: YouTube IFrame Player API
Deployment: [Insert e.g., Render / Vercel]
✨ Features
✅ Real-time Synchronization: Play, pause, and seek actions are synced across all clients.
✅ Room-Based System: Create unique rooms or join existing ones via codes.
✅ Role-Based Access Control (RBAC):
Host: Full control over playback and user management.
Moderator: Can control playback.
Participant/Viewer: Watch-only access.
✅ Dynamic Participant List: See who is in the room and their role in real-time.
✅ Backend Validation: The server verifies permissions before executing playback commands.
⚙️ Local Setup
Prerequisites
Node.js (v16 or higher)
npm or yarn
Installation
Clone the repository

git clone https://github.com/your-username/youtube-watch-party.git
cd youtube-watch-party
Backend Setup

cd backend
npm install
# Create a .env file and add your PORT and DB_URL
npm start
Frontend Setup

cd frontend
npm install
npm run dev
Open the app Navigate to http://localhost:5173 (or the port provided by Vite).

📡 Architecture Overview
The application uses a Client-Server-Client communication model via WebSockets:

Client $\rightarrow$ Server: User triggers an action (e.g., pause).
Server Logic: The server receives the event, identifies the user's role in the room, and checks if they have playback_control permissions.
Server $\rightarrow$ Clients: If authorized, the server broadcasts the sync_state event to all users joined to that specific Room ID.
Client Execution: The YouTube IFrame API receives the command and pauses the video locally for every user.
📝 License
MIT License - feel free to use this for your own learning!

