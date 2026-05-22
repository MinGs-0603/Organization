import React, { useState, useEffect, useRef } from 'react';
import './TimeGrid.css';

const TimeGrid = ({ currentTime, events, onDragEnd }) => {
  const scrollRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState(null);
  const [dragCurrentSlot, setDragCurrentSlot] = useState(null);

  // 24 hours, 6 slots per hour
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const slotsPerHour = 6;

  const handleMouseDown = (globalIndex, e) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStartSlot(globalIndex);
    setDragCurrentSlot(globalIndex);
  };

  const handleMouseEnter = (globalIndex) => {
    if (isDragging) {
      setDragCurrentSlot(globalIndex);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (dragStartSlot !== null && dragCurrentSlot !== null) {
        const start = Math.min(dragStartSlot, dragCurrentSlot);
        const end = Math.max(dragStartSlot, dragCurrentSlot) + 1; // inclusive
        onDragEnd({ start: start * 10, end: end * 10 });
      }
      setDragStartSlot(null);
      setDragCurrentSlot(null);
    }
  };

  const handleMouseLeaveGrid = () => {
    if (isDragging) {
      handleMouseUp();
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

          // Calculate Drag Highlight for this specific hour row
          let highlightStartCol = null;
          let highlightDuration = 0;
          
          if (isDragging && dragStartSlot !== null && dragCurrentSlot !== null) {
            const dragMin = Math.min(dragStartSlot, dragCurrentSlot);
            const dragMax = Math.max(dragStartSlot, dragCurrentSlot) + 1;
            
            // Check if drag overlaps this hour
            if (dragMin < hourEndSlot && dragMax > hourStartSlot) {
              const overlapStart = Math.max(dragMin, hourStartSlot);
              const overlapEnd = Math.min(dragMax, hourEndSlot);
              
              highlightStartCol = overlapStart - hourStartSlot;
              highlightDuration = overlapEnd - overlapStart;
            }
          }

          // Filter events that overlap this hour row
          const overlappingEvents = events.filter(ev => {
            const evStartSlot = ev.start / 10;
            const evEndSlot = ev.end / 10;
            return evStartSlot < hourEndSlot && evEndSlot > hourStartSlot;
          });

          return (
            <div key={hour} className="hour-row">
              <div className="time-label">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              <div className="slots-container">
                {/* 6 underlying horizontal slot dividers (no background colors applied here) */}
                {Array.from({ length: slotsPerHour }).map((_, slotIndex) => {
                  const globalSlotIndex = hour * slotsPerHour + slotIndex;
                  return (
                    <div 
                      key={globalSlotIndex} 
                      className="time-slot"
                      onMouseDown={(e) => handleMouseDown(globalSlotIndex, e)}
                      onMouseEnter={() => handleMouseEnter(globalSlotIndex)}
                    ></div>
                  );
                })}

                {/* Absolute overlay for dragging highlight */}
                {highlightStartCol !== null && highlightDuration > 0 && (
                  <div 
                    className="absolute-highlight-block"
                    style={{
                      left: `${(highlightStartCol / slotsPerHour) * 100}%`,
                      width: `${(highlightDuration / slotsPerHour) * 100}%`
                    }}
                  ></div>
                )}

                {/* Absolute overlay for saved events */}
                {overlappingEvents.map(ev => {
                  const evStartSlot = ev.start / 10;
                  const evEndSlot = ev.end / 10;
                  
                  const overlapStart = Math.max(evStartSlot, hourStartSlot);
                  const overlapEnd = Math.min(evEndSlot, hourEndSlot);
                  
                  const startCol = overlapStart - hourStartSlot;
                  const durationCols = overlapEnd - overlapStart;
                  
                  // Check if this row contains the very first slot of the event to render the title
                  const isEventStartInThisRow = evStartSlot >= hourStartSlot && evStartSlot < hourEndSlot;

                  return (
                    <div 
                      key={ev.id}
                      className="absolute-schedule-block"
                      style={{
                        left: `${(startCol / slotsPerHour) * 100}%`,
                        width: `${(durationCols / slotsPerHour) * 100}%`,
                        backgroundColor: `${ev.color}CC`, // 80% opacity hex
                        borderColor: ev.color,
                      }}
                    >
                      {isEventStartInThisRow && (
                        <div className="event-title-text">{ev.title}</div>
                      )}
                    </div>
                  );
                })}

                {/* Draw current time line over this hour's row if applicable */}
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
