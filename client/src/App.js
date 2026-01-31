import React, { useRef, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useCanvas } from './hooks/useCanvas';
import './styles.css';

const socket = io('http://localhost:3001');

function App() {
  const mainCanvasRef = useRef(null);
  const activeCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [userColor, setUserColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [cursors, setCursors] = useState({});

  const { drawPath, clearCanvas } = useCanvas();

  // Memoized render function to handle Undo/Redo and Initialization
  const renderHistory = useCallback((ctx, history) => {
    if (!mainCanvasRef.current) return;
    clearCanvas(mainCanvasRef.current);
    history.forEach(stroke => {
      ctx.globalCompositeOperation = stroke.isEraser ? 'destination-out' : 'source-over';
      drawPath(ctx, stroke.points, stroke.color, stroke.width);
    });
    ctx.globalCompositeOperation = 'source-over';
  }, [drawPath, clearCanvas]);

  useEffect(() => {
    socket.on('init-setup', (data) => {
      setUserColor(data.color);
      const ctx = mainCanvasRef.current.getContext('2d');
      renderHistory(ctx, data.history);
    });

    socket.on('remote-draw-step', (data) => {
      const ctx = activeCanvasRef.current.getContext('2d');
      ctx.globalCompositeOperation = data.isEraser ? 'destination-out' : 'source-over';
      drawPath(ctx, data.points, data.color, data.width);
      ctx.globalCompositeOperation = 'source-over';
    });

    socket.on('remote-cursor-move', (data) => {
      setCursors(prev => ({ ...prev, [data.userId]: data }));
    });

    socket.on('history-update', (newHistory) => {
      const ctx = mainCanvasRef.current.getContext('2d');
      clearCanvas(activeCanvasRef.current);
      renderHistory(ctx, newHistory);
    });

    socket.on('user-disconnected', (userId) => {
      setCursors(prev => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    });

    return () => {
      socket.off('init-setup');
      socket.off('remote-draw-step');
      socket.off('remote-cursor-move');
      socket.off('history-update');
      socket.off('user-disconnected');
    };
  }, [renderHistory, clearCanvas, drawPath]); // All dependencies included to clear ESLint warnings

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setIsDrawing(true);
    setCurrentPoints([{ x: offsetX, y: offsetY }]);
  };

  const draw = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    socket.emit('mouse-move', { x: offsetX, y: offsetY, color: userColor });

    if (!isDrawing) return;

    const newPoint = { x: offsetX, y: offsetY };
    const updatedPoints = [...currentPoints, newPoint];
    setCurrentPoints(updatedPoints);

    const ctx = activeCanvasRef.current.getContext('2d');
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    drawPath(ctx, updatedPoints, userColor, brushWidth);

    if (updatedPoints.length % 3 === 0) {
      socket.emit('draw-step', { 
        points: updatedPoints, 
        color: userColor, 
        width: brushWidth,
        isEraser: isEraser 
      });
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const mainCtx = mainCanvasRef.current.getContext('2d');
    mainCtx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    drawPath(mainCtx, currentPoints, userColor, brushWidth);
    mainCtx.globalCompositeOperation = 'source-over';

    socket.emit('stroke-end', { 
      points: currentPoints, 
      color: userColor, 
      width: brushWidth,
      isEraser: isEraser
    });

    clearCanvas(activeCanvasRef.current);
    setCurrentPoints([]);
  };

  return (
    <div className="app-container">
      <div className="toolbar">
        <div className="tool-group">
          <button className={`tool-btn1 ${!isEraser ? 'active' : ''}`} onClick={() => setIsEraser(false)}>🖌️ Brush</button>
          <button className={`tool-btn ${isEraser ? 'active' : ''}`} onClick={() => setIsEraser(true)}>🧽 Eraser</button>
        </div>
        <div className="tool-group">
          <input type="color" value={userColor} onChange={(e) => setUserColor(e.target.value)} disabled={isEraser} />
          <input type="range" min="1" max="50" value={brushWidth} onChange={(e) => setBrushWidth(e.target.value)} />
        </div>
        <button className="undo-btn" onClick={() => socket.emit('undo-request')}>Global Undo</button>
        <button className="redo-btn" onClick={() => socket.emit('redo-request')}>↪️ Redo</button>
      </div>

      <div className="canvas-wrapper">
        <canvas ref={mainCanvasRef} width={800} height={600} className="main-canvas" />
        <canvas 
          ref={activeCanvasRef} 
          width={800} height={600} 
          className="active-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        {Object.entries(cursors).map(([id, pos]) => (
          <div key={id} className="remote-cursor" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
            <div className="cursor-dot" style={{ backgroundColor: pos.color }} />
            <span className="cursor-label">User {id.substring(0, 4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;