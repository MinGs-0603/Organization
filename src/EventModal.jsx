import React, { useState, useEffect } from 'react';
import { CATEGORIES } from './App';

export default function EventModal({ event, onSave, onClose, onDelete }) {
  const [title, setTitle] = useState(event.title || '');
  const [category, setCategory] = useState(event.category || CATEGORIES[0].name);
  const [description, setDescription] = useState(event.description || '');

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && !isInput) {
        e.preventDefault();
        handleSave();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        e.preventDefault();
        onDelete(event.id);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, category, description, event.id, onSave, onClose, onDelete]);

  const handleSave = () => {
    onSave({
      ...event,
      title: title.trim() || '새 일정',
      category,
      description
    });
  };

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const startTimeStr = formatTime(event.start);
  const endTimeStr = formatTime(event.start + event.duration);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-content" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>일정 편집</h2>
          <div className="time-range">
            {startTimeStr} ~ {endTimeStr}
          </div>
        </div>
        
        <div className="form-group">
          <label>제목</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="새 일정"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />
        </div>
        
        <div className="form-group">
          <label>카테고리</label>
          <div className="category-pills">
            {CATEGORIES.map(cat => (
              <div 
                key={cat.name}
                className="category-pill"
                style={{
                  borderColor: category === cat.name ? cat.color : 'var(--border-light)',
                  backgroundColor: category === cat.name ? cat.color : '#fff',
                  color: category === cat.name ? (cat.textColor || '#fff') : 'var(--text-main)',
                  boxShadow: category === cat.name ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                }}
                onClick={() => setCategory(cat.name)}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label>메모</label>
          <textarea 
            className="input-field" 
            placeholder="설명을 입력하세요..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div className="modal-actions">
          <button className="btn btn-delete" onClick={() => onDelete(event.id)}>삭제</button>
          <button className="btn btn-cancel" onClick={onClose}>취소</button>
          <button className="btn btn-save" onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  );
}
