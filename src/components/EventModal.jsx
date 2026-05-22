import React, { useState, useEffect, useRef } from 'react';
import './EventModal.css';

const COLORS = [
  { name: 'Soft Coral', hex: '#F27F70' },
  { name: 'Muted Sage', hex: '#A2C2A6' },
  { name: 'Soft Butter', hex: '#F0D689' },
  { name: 'Dusty Blue', hex: '#88A0C0' },
  { name: 'Muted Lavender', hex: '#D0B8CB' },
];

const EventModal = ({ isOpen, onClose, onSave, timeRange }) => {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].hex);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSelectedColor(COLORS[0].hex);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSave = (e) => {
    e.preventDefault();
    const finalTitle = title.trim() ? title.trim() : 'Untitled Event';
    onSave(finalTitle, selectedColor);
  };

  const formatTimeFromMinutes = (totalMinutes) => {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  if (!isOpen || !timeRange) return null;

  return (
    <>
      <div className={`modal-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`event-modal ${isOpen ? 'open' : ''}`}>
        <div className="modal-header">
          <div className="modal-time-range">
            {formatTimeFromMinutes(timeRange.start)} - {formatTimeFromMinutes(timeRange.end)}
          </div>
        </div>
        
        <form onSubmit={handleSave} className="modal-body">
          <input 
            ref={inputRef}
            type="text" 
            className="event-input" 
            placeholder="Event Title..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          
          <div className="color-picker-container">
            <label className="color-picker-label">Color</label>
            <div className="color-palette">
              {COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  className={`color-btn ${selectedColor === color.hex ? 'selected' : ''}`}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => setSelectedColor(color.hex)}
                  title={color.name}
                  aria-label={`Select ${color.name}`}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save">Save</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EventModal;
