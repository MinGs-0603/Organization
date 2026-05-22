import React, { useRef, useState, useEffect } from 'react';
import { CATEGORIES } from './App';

export default function TimeGrid({ events, setEvents, onOpenModal }) {
  const gridRef = useRef(null);
  
  const [dragAction, setDragAction] = useState(null); // 'create', 'move', 'resize', 'duplicate'
  const [dragEventId, setDragEventId] = useState(null);
  const [tempEvent, setTempEvent] = useState(null);
  const [dragStartPos, setDragStartPos] = useState(null);

  const ROWS = 24;
  const COLS = 6;
  const CELL_MINUTES = 10;
  
  const getMinutesFromPos = (clientX, clientY) => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width - 1));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height - 1));
    
    const cellWidth = rect.width / COLS;
    const rowHeight = rect.height / ROWS;
    
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / rowHeight);
    
    return row * 60 + col * CELL_MINUTES;
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // Only left click
    
    const target = e.target;
    const minutes = getMinutesFromPos(e.clientX, e.clientY);
    
    if (target.closest('.resize-handle')) {
      e.stopPropagation();
      const segmentEl = target.closest('.event-segment');
      const eventId = segmentEl.dataset.eventId;
      const ev = events.find(ev => ev.id === eventId);
      if (!ev) return;
      
      setDragAction('resize');
      setDragEventId(eventId);
      setTempEvent({ ...ev });
      setDragStartPos({ x: e.clientX, y: e.clientY, startMinutes: ev.start, duration: ev.duration });
      e.target.setPointerCapture(e.pointerId);
      return;
    }
    
    if (target.closest('.event-segment')) {
      e.stopPropagation();
      const segmentEl = target.closest('.event-segment');
      const eventId = segmentEl.dataset.eventId;
      const ev = events.find(ev => ev.id === eventId);
      if (!ev) return;
      
      let isDuplicate = e.altKey;
      let targetEventId = eventId;
      
      if (isDuplicate) {
        targetEventId = Date.now().toString();
        const duplicatedEvent = { ...ev, id: targetEventId };
        setTempEvent(duplicatedEvent);
      } else {
        setTempEvent({ ...ev });
      }
      
      setDragAction(isDuplicate ? 'duplicate' : 'move');
      setDragEventId(targetEventId);
      setDragStartPos({ minutes, originalStart: ev.start });
      e.target.setPointerCapture(e.pointerId);
      return;
    }
    
    // Create new
    const startRounded = Math.floor(minutes / CELL_MINUTES) * CELL_MINUTES;
    const newEvent = {
      id: Date.now().toString(),
      title: '새 일정',
      category: CATEGORIES[0].name,
      description: '',
      start: startRounded,
      duration: CELL_MINUTES
    };
    
    setDragAction('create');
    setTempEvent(newEvent);
    setDragEventId(newEvent.id);
    setDragStartPos({ minutes: startRounded });
    gridRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragAction || !tempEvent) return;
    
    const currentMinutes = getMinutesFromPos(e.clientX, e.clientY);
    
    if (dragAction === 'create') {
      const start = dragStartPos.minutes;
      const endColMinute = Math.floor(currentMinutes / CELL_MINUTES) * CELL_MINUTES + CELL_MINUTES;
      let duration = endColMinute - start;
      
      if (duration < CELL_MINUTES) {
        // Allow backwards drag to create
        duration = CELL_MINUTES; 
      }
      
      setTempEvent({ ...tempEvent, duration });
    } 
    else if (dragAction === 'move' || dragAction === 'duplicate') {
      const deltaMinutes = Math.floor((currentMinutes - dragStartPos.minutes) / CELL_MINUTES) * CELL_MINUTES;
      let newStart = dragStartPos.originalStart + deltaMinutes;
      if (newStart < 0) newStart = 0;
      if (newStart + tempEvent.duration > 24 * 60) newStart = 24 * 60 - tempEvent.duration;
      
      setTempEvent({ ...tempEvent, start: newStart });
    }
    else if (dragAction === 'resize') {
      const deltaMinutes = Math.floor((currentMinutes - getMinutesFromPos(dragStartPos.x, dragStartPos.y)) / CELL_MINUTES) * CELL_MINUTES;
      let newDuration = dragStartPos.duration + deltaMinutes;
      if (newDuration < CELL_MINUTES) newDuration = CELL_MINUTES;
      if (tempEvent.start + newDuration > 24 * 60) newDuration = 24 * 60 - tempEvent.start;
      
      setTempEvent({ ...tempEvent, duration: newDuration });
    }
  };

  const handlePointerUp = (e) => {
    if (!dragAction || !tempEvent) return;
    
    if (dragAction === 'create') {
      setEvents(prev => [...prev, tempEvent]);
      onOpenModal(tempEvent); 
    } else if (dragAction === 'move' || dragAction === 'resize') {
      setEvents(prev => prev.map(ev => ev.id === tempEvent.id ? tempEvent : ev));
    } else if (dragAction === 'duplicate') {
      setEvents(prev => [...prev, tempEvent]);
    }
    
    if (e.target.hasPointerCapture && e.target.hasPointerCapture(e.pointerId)) {
      e.target.releasePointerCapture(e.pointerId);
    }
    
    setDragAction(null);
    setTempEvent(null);
    setDragEventId(null);
  };
  
  const renderEvents = () => {
    const allEvents = [...events];
    if (tempEvent) {
      if (dragAction === 'create' || dragAction === 'duplicate') {
        allEvents.push(tempEvent);
      } else {
        const idx = allEvents.findIndex(e => e.id === tempEvent.id);
        if (idx >= 0) allEvents[idx] = tempEvent;
      }
    }
    
    const segments = [];
    allEvents.forEach(event => {
      let remaining = event.duration;
      let currentStart = event.start;
      const isDragging = tempEvent && tempEvent.id === event.id;
      
      let segmentIndex = 0;
      while (remaining > 0) {
        const row = Math.floor(currentStart / 60);
        const col = (currentStart % 60) / 10;
        const maxColsInRow = 6 - col;
        const colsToTake = Math.min(remaining / 10, maxColsInRow);
        
        const cat = CATEGORIES.find(c => c.name === event.category) || CATEGORIES[0];
        
        segments.push({
          ...event,
          segmentId: `${event.id}-${segmentIndex}`,
          row,
          col,
          span: colsToTake,
          isLast: remaining <= colsToTake * 10,
          isDragging,
          cat
        });
        
        remaining -= colsToTake * 10;
        currentStart += colsToTake * 10;
        segmentIndex++;
      }
    });
    
    return segments.map(seg => (
      <div 
        key={seg.segmentId}
        className={`event-segment ${!seg.isDragging ? 'has-transition' : ''}`}
        data-event-id={seg.id}
        style={{
          top: `${seg.row * 60}px`,
          left: `calc(${(seg.col / 6) * 100}%)`,
          width: `calc(${(seg.span / 6) * 100}%)`,
          backgroundColor: `${seg.cat.color}CC`,
          borderColor: seg.cat.color,
          color: seg.cat.textColor || '#fff',
          pointerEvents: (dragAction && !seg.isDragging) ? 'none' : 'auto',
          zIndex: seg.isDragging ? 100 : 10
        }}
        title={`${seg.title}${seg.description ? '\n' + seg.description : ''}`}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (!dragAction) onOpenModal(events.find(ev => ev.id === seg.id));
        }}
      >
        <div className="event-content">
          <span className="event-emoji">{seg.cat.emoji}</span>
          <span className="event-title">{seg.title}</span>
        </div>
        {seg.isLast && (
          <div className="resize-handle">⋮</div>
        )}
      </div>
    ));
  };
  
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentRow = Math.floor(currentMinutes / 60);
  const currentCol = currentMinutes % 60;
  const timeLineLeft = `calc(${(currentCol / 60) * 100}%)`;
  const timeLineTopPx = currentRow * 60;
  
  return (
    <div className="time-grid-container">
      <div className="grid-wrapper">
        <div className="row-headers">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="row-header">
              {i.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>
        
        <div 
          className="grid-body"
          ref={gridRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {Array.from({ length: 24 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid-row">
              {Array.from({ length: 6 }).map((_, colIndex) => (
                <div key={colIndex} className="grid-cell" />
              ))}
            </div>
          ))}
          
          {/* Current Time Indicator */}
          <div 
            className="current-time-indicator"
            style={{
              left: timeLineLeft,
              top: `${timeLineTopPx}px`,
              height: '60px'
            }}
          />
          
          {renderEvents()}
        </div>
      </div>
    </div>
  );
}
