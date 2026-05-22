import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TimeGrid from './components/TimeGrid';
import EventModal from './components/EventModal';

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Events state: lazy-load from localStorage
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('myDailyPlanner');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse events", e);
        return [];
      }
    }
    return [];
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('myDailyPlanner', JSON.stringify(events));
  }, [events]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTimeRange, setModalTimeRange] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleDragEnd = (range) => {
    setEditingEvent(null);
    setModalTimeRange(range);
    setIsModalOpen(true);
  };

  const handleEventClick = (ev) => {
    setEditingEvent(ev);
    setModalTimeRange({ start: ev.start, end: ev.end });
    setIsModalOpen(true);
  };

  const handleSaveEvent = (title, color, categoryId, description) => {
    if (modalTimeRange) {
      if (editingEvent) {
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, title, color } : e));
      } else {
        const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
        const newEvent = {
          id: Date.now().toString(),
          date: dateString,
          start: modalTimeRange.start,
          end: modalTimeRange.end,
          title,
          color,
        };
        setEvents(prev => [...prev, newEvent]);
      }
    }
    setIsModalOpen(false);
    setModalTimeRange(null);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setIsModalOpen(false);
    setModalTimeRange(null);
    setEditingEvent(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalTimeRange(null);
    setEditingEvent(null);
  };

  const handleEventMove = (eventId, newStart, newEnd) => {
    setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, start: newStart, end: newEnd } : ev));
  };

  const handleEventResize = (eventId, newEnd) => {
    setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, end: newEnd } : ev));
  };

  const handleEventDuplicate = (eventId, newStart, newEnd) => {
    const evToCopy = events.find(e => e.id === eventId);
    if (evToCopy) {
      const newEvent = {
        ...evToCopy,
        id: Date.now().toString(),
        start: newStart,
        end: newEnd
      };
      setEvents(prev => [...prev, newEvent]);
    }
  };

  // Filter events for the currently selected date
  const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
  const todaysEvents = events.filter(e => e.date === dateString);

  return (
    <div className="app-container">
      <Sidebar 
        currentTime={currentTime} 
        selectedDate={selectedDate} 
        onDateSelect={handleDateSelect}
        events={events}
      />
      
      <main className="main-area">
        <TimeGrid 
          currentTime={currentTime} 
          events={todaysEvents}
          onDragEnd={handleDragEnd}
          onEventClick={handleEventClick}
          onEventMove={handleEventMove}
          onEventResize={handleEventResize}
          onEventDuplicate={handleEventDuplicate}
        />
      </main>

      <EventModal 
        isOpen={isModalOpen}
        timeRange={modalTimeRange}
        editingEvent={editingEvent}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}

export default App;
