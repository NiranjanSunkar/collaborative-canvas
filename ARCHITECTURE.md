# System Architecture: Real-Time Collaborative Canvas

## 1. High-Level Data Flow
The application follows an **Event-Driven Architecture** utilizing WebSockets for low-latency synchronization.

* **User Action:** A user interacts with the `active-canvas` layer.
* **Local Rendering:** The stroke is rendered immediately on the client-side for **Optimistic UI** feedback.
* **Throttled Emission:** Coordinate data is batched and emitted via `socket.emit('draw-step')` every 3rd mouse-move event to prevent network congestion.
* **Server Broadcast:** The Node.js server receives the coordinates and utilizes `socket.broadcast.emit` to send the data to all other connected clients in the room.
* **Remote Rendering:** Recipient clients receive and render the incoming path on their respective canvases using native Canvas API operations.



## 2. Dual-Canvas Strategy
To maximize performance and satisfy the **Canvas Mastery** requirement, I implemented a layered rendering system:
* **Main Canvas:** Stores the permanent "Source of Truth" (the drawing history). This layer only redraws during initial setup or global state changes (Undo/Redo).
* **Active Canvas:** A transparent overlay that handles high-frequency updates, such as the current user's active stroke and remote users' live drawing. This prevents expensive full-frame re-renders of the entire history during active drawing.

## 3. State Synchronization & Conflict Resolution
The application employs a **Server-Authoritative Operation Log** to manage the global state across multiple users:

* **Global History:** The server maintains a `masterHistory` array. When a stroke is completed, the full coordinate set is committed to this array.
* **Conflict-Free Undo/Redo:**
    * **Undo:** The server performs a reverse-search in the history to find and remove the last non-eraser stroke specific to the requesting `userId`.
    * **Redo:** Undone actions are temporarily stored in a server-side `redoStack`. If the user draws a new stroke, their personal redo stack is cleared to maintain logical timeline consistency.
* **Global Re-sync:** After any Undo or Redo, the server broadcasts a `history-update` event. All clients clear their canvases and re-render the history sequentially to ensure **100% state consistency**.



## 4. Technical Optimizations
* **Path Smoothing:** Implemented **Quadratic Bézier Curves** (`quadraticCurveTo`) instead of straight lines. This ensures smooth, natural-looking strokes even when mouse sampling rates are limited by hardware or network throttling.
* **Selective Erasing:** Utilized the Canvas `globalCompositeOperation: 'destination-out'`. This treats the brush as a transparency tool, allowing users to perform minor edits on the existing drawing history.
* **GPU-Accelerated Cursors:** Remote user indicators are rendered as DOM elements with CSS `transform: translate()`. This offloads cursor movement to the browser's compositor thread, keeping the main thread free for canvas operations.