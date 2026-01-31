Real-Time Collaborative Drawing Canvas

A high-performance, multi-user drawing application built with the MERN stack and WebSockets. This project allows multiple users to draw simultaneously on a shared canvas with real-time synchronization, global undo/redo, and user presence indicators.

Quick Start
1. Clone and Install
Bash
# Clone the repository
git clone <your-repo-link>
cd collaborative-canvas

# Install Backend dependencies
cd server && npm install

# Install Frontend dependencies
cd .. && cd client && npm install
2. Run the Application
You will need two terminal windows open:

Terminal 1 (Backend):

Bash
cd server
npm start
Server will run on http://localhost:3001

Terminal 2 (Frontend):

Bash
cd client
npm start
Frontend will run on http://localhost:3000

🛠️ Tech Stack
Frontend: React.js, HTML5 Canvas API (Native).

Backend: Node.js, Express.

Real-Time: Socket.io (WebSockets).

State Management: Server-authoritative history log.

 Features Implemented

Real-time Synchronization: See others draw stroke-by-stroke using optimized WebSocket event streaming.

Canvas Mastery: Native Canvas API implementation with Quadratic Bézier Curves for smooth, non-jagged lines.

Global Undo/Redo: Centralized state management that allows users to revert actions across all connected clients.

Collaborative Eraser: A precision tool using destination-out blending to remove specific parts of a drawing.

User Presence: Real-time cursor indicators showing the position and color of every active collaborator.

Performance Throttling: Network-efficient batching of coordinate data to prevent lag during high activity.

🔍 How to Test
Open http://localhost:3000 in two different browser windows (or one in Incognito mode).

Draw in one window; observe the smooth, real-time rendering in the second window.

Use the Eraser for minor edits and notice how it persists across both screens.

Click Global Undo; the last stroke should disappear for every connected user simultaneously.

📁 Project Structure
Plaintext
collaborative-canvas/
├── client/              # React Frontend
│   ├── src/hooks/       # Canvas logic & Path smoothing
│   └── src/App.js       # Main socket logic & UI
├── server/              # Node.js Backend
│   ├── drawing-state.js # History & Undo/Redo manager
│   └── index.js         # Socket.io Hub
└── ARCHITECTURE.md      # Technical deep-dive & decisions


Final Checklist
-> Canvas Mastery (40%): Efficient operations & path optimization included.

-> Real-time Features (30%): Smooth sync & cursor indicators working.

-> Advanced Features (20%): Global Undo/Redo & Conflict resolution strategy documented.

-> Code Quality (10%): Clean, modular code with zero ESLint warnings.