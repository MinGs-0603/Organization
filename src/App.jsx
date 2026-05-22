import React, { useState, useEffect } from 'react';
import TimeGrid from './TimeGrid';
import EventModal from './EventModal';
import './index.css';

export const CATEGORIES = [
  { name: '자격증', emoji: '📜', color: '#6E8EB9', textColor: '#ffffff' },
  { name: '회의', emoji: '🤝', color: '#8BB0C7', textColor: '#ffffff' },
  { name: '휴식', emoji: '☕', color: '#E5E5EA', textColor: '#1D1D1F' },
  { name: '운동', emoji: '🏃‍♂️', color: '#7FB5B5', textColor: '#ffffff' },
  { name: '자소서', emoji: '✍️', color: '#5C728A', textColor: '#ffffff' },
  { name: '면접', emoji: '💬', color: '#A1B1C8', textColor: '#ffffff' }
];

function App() {
  const [events, setEvents] = useState([]);
  const [modalEvent, setModalEvent] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('planner_events');
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('planner_events', JSON.stringify(events));
  }, [events]);

  const handleSaveEvent = (newEvent) => {
    setEvents(prev => {
      const idx = prev.findIndex(e => e.id === newEvent.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newEvent;
        return next;
      }
      return [...prev, newEvent];
    });
    setModalEvent(null);
  };

  const handleDeleteEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setModalEvent(null);
  };

  const today = new Date();
  const dateString = today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="clock-widget">
          <Clock />
          <p>{dateString}</p>
        </div>
        <div className="calendar-widget">
          <h2>Daily Planner</h2>
          <p style={{marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6'}}>
            <strong>Drag empty slot</strong> to create<br/>
            <strong>Drag block</strong> to move<br/>
            <strong>Drag right edge</strong> to resize<br/>
            <strong>Alt + Drag</strong> to duplicate
          </p>
        </div>
      </aside>
      
      <main className="main-content">
        <TimeGrid 
          events={events} 
          setEvents={setEvents} 
          onOpenModal={setModalEvent} 
        />
      </main>

      {modalEvent && (
        <EventModal
          event={modalEvent}
          onSave={handleSaveEvent}
          onClose={() => setModalEvent(null)}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <h1>
      {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
    </h1>
  );
}

export default App;
