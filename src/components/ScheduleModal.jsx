import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../utils/constants';

const ScheduleModal = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  useEffect(() => {
    if (isOpen && initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCategory(CATEGORIES.find(c => c.id === initialData.categoryId) || CATEGORIES[0]);
      
      const formatTime = (minutes) => {
        const h = Math.floor(minutes / 60).toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
      };
      
      setStartTime(formatTime(initialData.startMins));
      setEndTime(formatTime(initialData.endMins));
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Delete' && initialData?.id && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        onDelete(initialData.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, description, category, startTime, endTime, initialData]);

  if (!isOpen) return null;

  const handleSave = () => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins >= endMins) {
      alert("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    onSave({
      id: initialData?.id || Date.now().toString(),
      title: title || category.name,
      description,
      categoryId: category.id,
      startMins,
      endMins,
      date: initialData?.date || new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        display: 'flex', flexDirection: 'column', gap: '16px',
        backgroundColor: 'var(--sidebar-bg)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-apple)',
        border: '1px solid var(--grid-line)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>
          {initialData?.id ? '일정 수정' : '새 일정'}
        </h2>

        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            style={{ padding: '8px', border: '1px solid var(--grid-line)', borderRadius: 'var(--radius-md)', flex: 1, color: 'var(--text-main)', outline: 'none' }}
          />
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-main)' }}>~</span>
          <input
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            style={{ padding: '8px', border: '1px solid var(--grid-line)', borderRadius: 'var(--radius-md)', flex: 1, color: 'var(--text-main)', outline: 'none' }}
          />
        </div>

        <input
          type="text"
          placeholder="일정 제목"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
          style={{ padding: '10px', border: '1px solid var(--grid-line)', borderRadius: 'var(--radius-md)', fontSize: '16px', color: 'var(--text-main)', outline: 'none' }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: `1.5px solid ${category.id === cat.id ? 'var(--text-main)' : 'transparent'}`,
                backgroundColor: category.id === cat.id ? 'var(--bg-cream)' : 'transparent',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '14px',
                fontWeight: category.id === cat.id ? '600' : '400',
                transition: 'var(--transition-smooth)'
              }}
            >
              <span>{cat.emoji}</span> {cat.name}
            </button>
          ))}
        </div>

        <textarea
          placeholder="상세 내용"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          style={{ padding: '10px', border: '1px solid var(--grid-line)', borderRadius: 'var(--radius-md)', fontSize: '14px', resize: 'vertical', color: 'var(--text-main)', outline: 'none' }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
          {initialData?.id && (
            <button
              onClick={() => onDelete(initialData.id)}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: '#FFE3E3', color: '#E03131', cursor: 'pointer', fontWeight: '500', marginRight: 'auto', transition: 'var(--transition-smooth)' }}
            >
              삭제
            </button>
          )}
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--grid-line)', backgroundColor: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '500', transition: 'var(--transition-smooth)' }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: 'var(--text-main)', color: 'white', cursor: 'pointer', fontWeight: '600', transition: 'var(--transition-smooth)' }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
