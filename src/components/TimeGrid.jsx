import React, { useState, useRef, useEffect } from 'react';
import { CATEGORIES, HOURS_IN_DAY, SLOTS_PER_HOUR, SLOT_MINUTES } from '../utils/constants';

const TimeGrid = ({ date, blocks, setBlocks, onEditBlock, currentTime }) => {
  const containerRef = useRef(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'create', 'move', 'resize'
  const [dragState, setDragState] = useState(null); // stores intermediate drag info

  // Generate grid hours and slots
  const hours = Array.from({ length: HOURS_IN_DAY }, (_, i) => i);
  const slots = Array.from({ length: SLOTS_PER_HOUR }, (_, i) => i * SLOT_MINUTES);

  // Helper to calculate minutes from mouse position relative to container
  const getMinutesFromEvent = (e) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const x = e.clientX - rect.left - 60; // 60px is the hour label width
    
    if (x < 0) return 0;
    
    const rowHeight = 60; // var(--grid-row-height)
    const hour = Math.floor(y / rowHeight);
    
    const gridWidth = rect.width - 60;
    const slotWidth = gridWidth / SLOTS_PER_HOUR;
    const slotIndex = Math.floor(x / slotWidth);
    
    let mins = hour * 60 + slotIndex * SLOT_MINUTES;
    return Math.max(0, Math.min(mins, 24 * 60 - SLOT_MINUTES));
  };

  const handleMouseDown = (e, actionType, block = null) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();

    const mins = getMinutesFromEvent(e);

    if (actionType === 'create') {
      setIsDragging(true);
      setDragType('create');
      setDragState({ startMins: mins, currentMins: mins + SLOT_MINUTES });
    } else if (actionType === 'move' || actionType === 'resize') {
      setIsDragging(true);
      setDragType(actionType);
      
      let newBlock = { ...block };
      // Duplicate logic
      if (actionType === 'move' && e.altKey) {
        newBlock = { ...newBlock, id: Date.now().toString() };
        // We temporarily add it to blocks so we can drag the copy
        setBlocks(prev => [...prev, newBlock]);
      }

      setDragState({ 
        block: newBlock, 
        offsetMins: mins - newBlock.startMins,
        startMins: mins
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const mins = getMinutesFromEvent(e);

      if (dragType === 'create') {
        setDragState(prev => ({ ...prev, currentMins: Math.max(prev.startMins + SLOT_MINUTES, mins + SLOT_MINUTES) }));
      } else if (dragType === 'move') {
        const duration = dragState.block.endMins - dragState.block.startMins;
        let newStart = mins - dragState.offsetMins;
        // Snap to slot
        newStart = Math.round(newStart / SLOT_MINUTES) * SLOT_MINUTES;
        newStart = Math.max(0, Math.min(newStart, 24 * 60 - duration));
        
        setBlocks(prev => prev.map(b => b.id === dragState.block.id ? { ...b, startMins: newStart, endMins: newStart + duration } : b));
      } else if (dragType === 'resize') {
        let newEnd = mins + SLOT_MINUTES;
        newEnd = Math.round(newEnd / SLOT_MINUTES) * SLOT_MINUTES;
        newEnd = Math.max(dragState.block.startMins + SLOT_MINUTES, newEnd);
        
        setBlocks(prev => prev.map(b => b.id === dragState.block.id ? { ...b, endMins: newEnd } : b));
      }
    };

    const handleMouseUp = () => {
      if (dragType === 'create') {
        // Only open modal if we dragged at least one slot
        if (dragState.currentMins > dragState.startMins) {
          onEditBlock({
            startMins: dragState.startMins,
            endMins: dragState.currentMins,
            categoryId: CATEGORIES[0].id,
            date
          });
        }
      }
      setIsDragging(false);
      setDragType(null);
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragType, dragState, setBlocks, onEditBlock, date]);

  return (
    <div 
      style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '24px', 
        backgroundColor: 'transparent',
        position: 'relative'
      }}
    >
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative', 
          border: '1px solid var(--grid-line)', 
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--sidebar-bg)',
          boxShadow: 'var(--shadow-apple)',
          userSelect: 'none',
          overflow: 'hidden'
        }}
        onMouseDown={(e) => handleMouseDown(e, 'create')}
      >
        {/* Grid Background */}
        {hours.map(hour => (
          <div key={hour} style={{ display: 'flex', height: 'var(--grid-row-height)', borderBottom: '1px solid var(--grid-line)' }}>
            <div style={{ width: '60px', borderRight: '1px solid var(--grid-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
              {`${hour.toString().padStart(2, '0')}:00`}
            </div>
            <div style={{ flex: 1, display: 'flex' }}>
              {slots.map((slot, idx) => (
                <div key={idx} style={{ flex: 1, borderRight: idx < slots.length - 1 ? '1px dashed var(--grid-line)' : 'none' }}></div>
              ))}
            </div>
          </div>
        ))}

        {/* Temporary Creation Block */}
        {dragType === 'create' && dragState && (
          <div style={{
            position: 'absolute',
            top: `${Math.floor(dragState.startMins / 60) * 60}px`,
            left: `calc(60px + ((100% - 60px) / 60) * ${dragState.startMins % 60})`,
            width: `calc(((100% - 60px) / 60) * ${dragState.currentMins - dragState.startMins})`,
            height: '60px', // simplified for now, assuming horizontal only
            backgroundColor: `${CATEGORIES[0].color}D9`,
            border: `1.5px solid ${CATEGORIES[0].color}`,
            borderRadius: 'var(--radius-md)',
            pointerEvents: 'none',
            zIndex: 10
          }}></div>
        )}

        {/* Render Blocks */}
        {blocks.filter(b => b.date === date).map(block => {
          const category = CATEGORIES.find(c => c.id === block.categoryId) || CATEGORIES[0];
          
          const startHour = Math.floor(block.startMins / 60);
          const startMin = block.startMins % 60;
          const durationMins = block.endMins - block.startMins;

          return (
            <div
              key={block.id}
              className="block-container"
              style={{
                position: 'absolute',
                top: `${startHour * 60}px`,
                left: `calc(60px + ((100% - 60px) / 60) * ${startMin})`,
                width: `calc(((100% - 60px) / 60) * ${durationMins})`,
                height: '60px',
                backgroundColor: `${category.color}D9`,
                border: `1.5px solid ${category.color}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: 'none',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px',
                cursor: 'grab',
                zIndex: dragType === 'move' && dragState?.block.id === block.id ? 20 : 5,
                opacity: dragType === 'move' && dragState?.block.id === block.id ? 0.8 : 1,
                transition: isDragging ? 'none' : 'var(--transition-smooth)'
              }}
              onMouseDown={(e) => handleMouseDown(e, 'move', block)}
              onClick={(e) => {
                e.stopPropagation();
                if (!isDragging) onEditBlock(block);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', width: '100%' }}>
                <span style={{ fontSize: '16px' }}>{category.emoji}</span>
                <span style={{ color: 'var(--text-main)', fontWeight: '500', fontSize: '13px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {block.title}
                </span>
              </div>
              
              {/* Resize Handle */}
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '8px',
                  cursor: 'col-resize',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderTopRightRadius: '6px',
                  borderBottomRightRadius: '6px'
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, 'resize', block);
                }}
              />

              {block.description && (
                <div className="tooltip">
                  {block.description}
                </div>
              )}
            </div>
          );
        })}

        {/* Current Time Indicator */}
        {currentTime && date === new Date().toISOString().split('T')[0] && (
          <div style={{ pointerEvents: 'none', zIndex: 30 }}>
            {/* The Dot */}
            <div style={{
              position: 'absolute',
              top: `${currentTime.getHours() * 60 + currentTime.getMinutes() - 4}px`,
              left: '56px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--toss-blue)',
            }}></div>
            {/* The Line */}
            <div style={{
              position: 'absolute',
              top: `${currentTime.getHours() * 60 + currentTime.getMinutes()}px`,
              left: '60px',
              width: 'calc(100% - 60px)',
              height: '2px',
              backgroundColor: 'var(--toss-blue)',
              opacity: 0.8
            }}></div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TimeGrid;
