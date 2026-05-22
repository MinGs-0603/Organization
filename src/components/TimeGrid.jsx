import React, { useState, useEffect, useRef } from 'react';
import './TimeGrid.css';

const TimeGrid = ({ currentTime, events, onDragEnd, onEventClick, onEventMove, onEventResize, onEventDuplicate }) => {
  const scrollRef = useRef(null);

  const [dragAction, setDragAction] = useState(null); // 'CREATE', 'RESIZE', 'MOVE'
  const [activeEvent, setActiveEvent] = useState(null);
  
  // For CREATE:
  const [dragStartSlot, setDragStartSlot] = useState(null);
  const [dragCurrentSlot, setDragCurrentSlot] = useState(null);

  // For MOVE/RESIZE preview:
  const [previewEvent, setPreviewEvent] = useState(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const slotsPerHour = 6;

  // 카테고리별 이모지 매핑 (추가된 부분)
  const emojiMap = { cert: '📜', meeting: '🤝', break: '☕', workout: '🏃‍♂️', resume: '✍️', interview: '💬' };

  const handleSlotMouseDown = (globalIndex, e) => {
    if (e.button !== 0) return;
    setDragAction('CREATE');
    setDragStartSlot(globalIndex);
    setDragCurrentSlot(globalIndex);
  };

  const handleEventMouseDown = (ev, e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setDragAction('MOVE');
    setActiveEvent(ev);
    setPreviewEvent({ ...ev });
  };

  const handleResizeMouseDown = (ev, e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setDragAction('RESIZE');
    setActiveEvent(ev);
    setPreviewEvent({ ...ev });
  };

  const handleSlotMouseEnter = (globalIndex) => {
    if (dragAction === 'CREATE') {
      setDragCurrentSlot(globalIndex);
    } else if (dragAction === 'MOVE' && activeEvent) {
      const durationMin = activeEvent.end - activeEvent.start;
      const newStartMin = globalIndex * 10;
      setPreviewEvent({
        ...activeEvent,
        start: newStartMin,
        end: newStartMin + durationMin
      });
    } else if (dragAction === 'RESIZE' && activeEvent) {
      const newEndMin = (globalIndex + 1) * 10;
      if (newEndMin > activeEvent.start) {
        setPreviewEvent({
          ...activeEvent,
          end: newEndMin
        });
      }
    }
  };

  const handleMouseUp = (e) => {
    if (dragAction === 'CREATE') {
      if (dragStartSlot !== null && dragCurrentSlot !== null) {
        const start = Math.min(dragStartSlot, dragCurrentSlot);
        const end = Math.max(dragStartSlot, dragCurrentSlot) + 1;
        onDragEnd({ start: start * 10, end: end * 10 });
      }
    } else if (dragAction === 'MOVE' && previewEvent && activeEvent) {
      if (e.altKey) {
        onEventDuplicate(activeEvent.id, previewEvent.start, previewEvent.end);
      } else if (previewEvent.start !== activeEvent.start) {
        onEventMove(activeEvent.id, previewEvent.start, previewEvent.end);
      } else {
        // If they didn't move it, treat as click
        onEventClick(activeEvent);
      }
    } else if (dragAction === 'RESIZE' && previewEvent && activeEvent) {
      if (previewEvent.end !== activeEvent.end) {
        onEventResize(activeEvent.id, previewEvent.end);
      }
    }

    setDragAction(null);
    setActiveEvent(null);
    setPreviewEvent(null);
    setDragStartSlot(null);
    setDragCurrentSlot(null);
  };

  const handleMouseLeaveGrid = (e) => {
    if (dragAction) {
      handleMouseUp(e);
    }
  };

  // Current Time Line
  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentSeconds = currentTime.getSeconds();
  const timeColumnPercentage = ((currentMinutes + currentSeconds / 60) / 60) * 100;

  useEffect(() => {
    if (scrollRef.current) {
      const offset = currentHours * 60 - 100; 
      scrollRef.current.scrollTop = Math.max(0, offset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="time-grid-container" ref={scrollRef}>
      <div 
        className="time-grid" 
        onMouseLeave={handleMouseLeaveGrid}
        onMouseUp={handleMouseUp}
      >
        {hours.map((hour) => {
          const isCurrentHourRow = hour === currentHours;
          const hourStartSlot = hour * slotsPerHour;
          const hourEndSlot = hourStartSlot + slotsPerHour;

          // Drag Highlight
          let highlightStartCol = null;
          let highlightDuration = 0;
          
          if (dragAction === 'CREATE' && dragStartSlot !== null && dragCurrentSlot !== null) {
            const dragMin = Math.min(dragStartSlot, dragCurrentSlot);
            const dragMax = Math.max(dragStartSlot, dragCurrentSlot) + 1;
            
            if (dragMin < hourEndSlot && dragMax > hourStartSlot) {
              const overlapStart = Math.max(dragMin, hourStartSlot);
              const overlapEnd = Math.min(dragMax, hourEndSlot);
              highlightStartCol = overlapStart - hourStartSlot;
              highlightDuration = overlapEnd - overlapStart;
            }
          }

          const renderBlock = (ev, isPreview = false) => {
            const evStartSlot = ev.start / 10;
            const evEndSlot = ev.end / 10;
            
            if (evStartSlot >= hourEndSlot || evEndSlot <= hourStartSlot) return null;

            const overlapStart = Math.max(evStartSlot, hourStartSlot);
            const overlapEnd = Math.min(evEndSlot, hourEndSlot);
            
            const startCol = overlapStart - hourStartSlot;
            const durationCols = overlapEnd - overlapStart;
            const isEventStartInThisRow = evStartSlot >= hourStartSlot && evStartSlot < hourEndSlot;
            const isEventEndInThisRow = evEndSlot > hourStartSlot && evEndSlot <= hourEndSlot;

            const isBeingMovedOrResized = !isPreview && activeEvent && activeEvent.id === ev.id;

            return (
              <div 
                key={isPreview ? `preview-${ev.id}` : ev.id}
                className={`absolute-schedule-block ${isPreview ? 'preview' : ''} ${isBeingMovedOrResized ? 'dragging' : ''}`}
                onMouseDown={(e) => !isPreview && handleEventMouseDown(ev, e)}
                style={{
                  left: `${(startCol / slotsPerHour) * 100}%`,
                  width: `${(durationCols / slotsPerHour) * 100}%`,
                  backgroundColor: `${ev.color}CC`,
                  borderColor: ev.color,
                }}
                // 마우스 오버 시 상세 내용 툴팁 띄우기 (추가된 부분)
                title={ev.description ? `${ev.title}\n\n${ev.description}` : ev.title}
              >
                {isEventStartInThisRow && (
                  <div className="event-title-text">
                    {/* 카테고리 이모지 및 제목 렌더링 (추가된 부분) */}
                    {emojiMap[ev.categoryId] || ''} {ev.title}
                  </div>
                )}
                {!isPreview && isEventEndInThisRow && (
                  <div 
                    className="resize-handle"
                    onMouseDown={(e) => handleResizeMouseDown(ev, e)}
                  >
                    &#8942;
                  </div>
                )}
              </div>
            );
          };

          return (
            <div key={hour} className="hour-row">
              <div className="time-label">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              <div className="slots-container">
                {Array.from({ length: slotsPerHour }).map((_, slotIndex) => {
                  const globalSlotIndex = hour * slotsPerHour + slotIndex;
                  return (
                    <div 
                      key={globalSlotIndex} 
                      className="time-slot"
                      onMouseDown={(e) => handleSlotMouseDown(globalSlotIndex, e)}
                      onMouseEnter={() => handleSlotMouseEnter(globalSlotIndex)}
                    ></div>
                  );
                })}

                {highlightStartCol !== null && highlightDuration > 0 && (
                  <div 
                    className="absolute-highlight-block"
                    style={{
                      left: `${(highlightStartCol / slotsPerHour) * 100}%`,
                      width: `${(highlightDuration / slotsPerHour) * 100}%`
                    }}
                  ></div>
                )}

                {/* Render normal events */}
                {events.map(ev => renderBlock(ev))}

                {/* Render preview event on top if moving/resizing */}
                {dragAction !== 'CREATE' && previewEvent && renderBlock(previewEvent, true)}

                {isCurrentHourRow && (
                  <div 
                    className="current-time-vertical-line" 
                    style={{ left: `${timeColumnPercentage}%` }}
                  >
                    <div className="current-time-dot-top"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeGrid;
