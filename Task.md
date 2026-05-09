# Task: YouTube Watch Party

## Objective
Build a real-time collaborative platform that allows multiple users to watch YouTube videos simultaneously with synchronized viewing.

## Core Requirements
1. **Room Management**
   - Create Room: User automatically becomes the Host.
   - Join Room: Users can join via a unique Room ID or URL.
   - Participant List: Real-time display of users and their roles.
   - User Management: Host can kick participants from the room.

2. **Roles & Permissions (RBAC)**
   - **Host**: Can play/pause/seek, change video, and manage users.
   - **Moderator**: Can play/pause/seek, and change video.
   - **Participant/Viewer**: Watch-only access.

3. **Synchronization**
   - Sync playback actions (play, pause, seek) and video URL changes across all clients in a room.
   - Server-side validation of user roles before broadcasting sync events.

4. **Tech Stack**
   - **Frontend**: React.js, TypeScript, Tailwind CSS, Vite.
   - **Backend**: Node.js, Express.js.
   - **Real-time**: Socket.IO (WebSockets).
   - **API**: YouTube IFrame Player API.
   - **Database**: MongoDB/PostgreSQL/SQLite (for room metadata).

## Deliverables
- Fully functional frontend and backend applications.
- Integrated WebSocket communication for low-latency synchronization.
- Completed User Flow: Landing Page -> Room Entry -> Synchronized Interaction.
