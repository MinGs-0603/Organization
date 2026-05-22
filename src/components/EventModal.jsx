import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import './EventModal.css';

const COLORS = [
  { name: 'Soft Teal', hex: '#A3D9D2' },
  { name: 'Sky Blue', hex: '#9ED9F7' },
  { name: 'Sapphire', hex: '#A2B5E2' },
  { name: 'Slate Blue', hex: '#9FAEC3' },
  { name: 'Lavender Blue', hex: '#B8C5EA' },
];

const EventModal = ({ isOpen, onClose, onSave, onDelete, timeRange, editingEvent }) => {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].hex);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        setTitle(editingEvent.title);
        setSelectedColor(editingEvent.color);
      } else {
        setTitle('');
        setSelectedColor(COLORS[0].hex);
      }
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen, editingEvent]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only delete if we are in Edit Mode and NOT typing inside the input field
        if (editingEvent && document.activeElement !== inputRef.current) {
          onDelete(editingEvent.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editingEvent, onClose, onDelete]);

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
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="modal-time-range">
            {formatTimeFromMinutes(timeRange.start)} - {formatTimeFromMinutes(timeRange.end)}
          </div>
          {editingEvent && (
            <button type="button" className="btn-delete-icon" onClick={() => onDelete(editingEvent.id)} title="Delete Schedule">
              <Trash2 size={16} />
            </button>
          )}
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
            <button type="submit" className="btn-save">{editingEvent ? 'Update' : 'Save'}</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EventModal;
