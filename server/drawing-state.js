// server/drawing-state.js

class DrawingState {
  constructor() {
    this.history = []; 
    this.redoStack = []; // Added: Temporarily stores undone strokes
  }

  addStroke(stroke) {
    this.history.push(stroke);
    // Clear redo stack for this user when they draw something new
    this.redoStack = this.redoStack.filter(s => s.userId !== stroke.userId);
  }

  undo(userId) {
    const lastIndex = this.history.map(s => s.userId).lastIndexOf(userId);
    if (lastIndex !== -1) {
      const [removed] = this.history.splice(lastIndex, 1);
      this.redoStack.push(removed); // Move to redo stack
      return true;
    }
    return false;
  }

  redo(userId) {
    const lastIndex = this.redoStack.map(s => s.userId).lastIndexOf(userId);
    if (lastIndex !== -1) {
      const [restored] = this.redoStack.splice(lastIndex, 1);
      this.history.push(restored); // Move back to history
      return true;
    }
    return false;
  }

  getSnapshot() {
    return this.history;
  }
}

module.exports = new DrawingState();