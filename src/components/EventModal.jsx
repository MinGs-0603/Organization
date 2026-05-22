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
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        setTitle(editingEvent.title || '');
        setDescription(editingEvent.description || '');
        // 기존 색상이나 카테고리 ID로 매칭
        const cat = CATEGORIES.find(c => c.id === editingEvent.categoryId) 
                 || CATEGORIES.find(c => c.hex === editingEvent.color) 
                 || CATEGORIES[0];
        setSelectedCategory(cat);
      } else {
        setTitle('');
        setDescription('');
        setSelectedCategory(CATEGORIES[0]);
      }
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen, editingEvent]);

  // 키보드 단축키 (Esc 닫기, Delete 삭제)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeTag = document.activeElement.tagName.toLowerCase();
        // 입력창에 타이핑 중이 아닐 때만 삭제 작동
        if (editingEvent && activeTag !== 'input' && activeTag !== 'textarea') {
          onDelete(editingEvent.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editingEvent, onClose, onDelete]);

  const handleSave = (e) => {
    e.preventDefault();
    const finalTitle = title.trim() ? title.trim() : '새로운 일정';
    // App.jsx로 4가지 데이터를 올려보냄
    onSave(finalTitle, selectedCategory.hex, selectedCategory.id, description);
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
            <button type="button" className="btn-delete-icon" onClick={() => onDelete(editingEvent.id)} title="일정 삭제">
              <Trash2 size={16} />
            </button>
          )}
        </div>
        
        <form onSubmit={handleSave} className="modal-body">
          {/* 카테고리 선택 알약 버튼들 */}
          <div className="category-picker">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-pill ${selectedCategory.id === cat.id ? 'selected' : ''}`}
                style={{ 
                  backgroundColor: selectedCategory.id === cat.id ? cat.hex : '#F0F4F8',
                  color: selectedCategory.id === cat.id ? '#FFFFFF' : '#333D4B',
                  borderColor: selectedCategory.id === cat.id ? cat.hex : '#E5E8EB'
                }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>

          <input 
            ref={inputRef}
            type="text" 
            className="event-input" 
            placeholder="일정 제목을 입력하세요..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* 상세 내용 텍스트 에어리어 */}
          <textarea
            className="event-textarea"
            placeholder="상세 내용을 메모하세요 (선택)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>취소</button>
            <button type="submit" className="btn-save">{editingEvent ? '수정하기' : '저장하기'}</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EventModal;
