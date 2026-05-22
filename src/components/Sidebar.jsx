import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ currentTime, selectedDate, onDateSelect, events }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate));
    }
  }, [selectedDate]);

  // Date Formatting
  const formatDate = (date) => {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });

    return `${month}.${day} ${dayOfWeek}${isToday ? ', Today' : ''}`;
  };

  const formatLiveClock = (date) => {
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const paddedHours = String(hours).padStart(2, '0');
    return `${paddedHours}:${minutes}:${seconds} ${ampm}`;
  };

  // Calendar Logic
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const renderCells = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      
      const isSelected = 
        selectedDate && 
        date.getDate() === selectedDate.getDate() && 
        date.getMonth() === selectedDate.getMonth() && 
        date.getFullYear() === selectedDate.getFullYear();
      
      const isToday = 
        date.getDate() === new Date().getDate() && 
        date.getMonth() === new Date().getMonth() && 
        date.getFullYear() === new Date().getFullYear();

      const dateString = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const hasEvent = events && events.some(e => e.date === dateString);

      cells.push(
        <div 
          key={day} 
          className={`calendar-cell ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''}`}
          onClick={() => onDateSelect(date)}
        >
          <div className="day-number">{day}</div>
          {hasEvent && <div className="event-dot"></div>}
        </div>
      );
    }
    return cells;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-date">{formatDate(selectedDate)}</h1>
        <div className="sidebar-clock">{formatLiveClock(currentTime)}</div>
      </div>

      <div className="sidebar-calendar">
        <div className="calendar-header">
          <button className="nav-btn" onClick={handlePrevMonth}>
            <ChevronLeft size={20} />
          </button>
          <h2 className="month-title">
            {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
          </h2>
          <button className="nav-btn" onClick={handleNextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="calendar-body">
          <div className="days-of-week">
            {daysOfWeek.map(day => (
              <div key={day} className="day-name">{day}</div>
            ))}
          </div>
          <div className="calendar-grid">
            {renderCells()}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
