import React from 'react';

interface CalendarProps {
  events: { 
    date: Date; 
    title: string; 
    type: 'meeting' | 'blocked';
    avatar?: string;
    userName?: string;
  }[];
  onDateClick?: (date: Date) => void;
  interactive?: boolean;
  compact?: boolean;
  selectedDate?: Date | null;
}

export const Calendar: React.FC<CalendarProps> = ({ events, onDateClick, interactive = false, compact = false, selectedDate = null }) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const days = [];
  // Filler for previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square bg-neutral-900/50 border border-neutral-800/50"></div>);
  }

  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    const dayEvents = events.filter(e => isSameDay(e.date, dateObj));
    const isToday = isSameDay(today, dateObj);
    const isSelected = selectedDate && isSameDay(selectedDate, dateObj);

    days.push(
      <div 
        key={`day-${d}`} 
        onClick={() => interactive && onDateClick && onDateClick(dateObj)}
        className={`
          aspect-square border border-neutral-800 p-1.5 relative transition-all group overflow-hidden flex flex-col items-center
          ${interactive ? 'cursor-pointer hover:bg-neutral-800' : ''}
          ${isSelected ? 'bg-white/5 ring-1 ring-inset ring-neutral-500 z-10' : (isToday ? 'bg-red-900/5' : 'bg-neutral-900')}
        `}
      >
        <span className={`
          ${compact ? 'text-[10px]' : 'text-sm font-semibold'} block mb-1 text-center
          ${isToday ? 'text-red-500 bg-red-900/20 w-4 h-4 rounded-full flex items-center justify-center' : (isSelected ? 'text-white' : 'text-neutral-500')}
        `}>
          {d}
        </span>
        
        {!compact && (
          <div className="w-full space-y-1">
            {dayEvents.map((evt, idx) => (
              <div 
                key={idx} 
                className={`
                  text-[10px] sm:text-xs truncate px-1.5 py-0.5 rounded
                  ${evt.type === 'meeting' ? 'bg-red-500/20 text-red-300' : 'bg-neutral-800 text-neutral-400'}
                `}
              >
                {evt.title}
              </div>
            ))}
          </div>
        )}
        
        {compact && dayEvents.length > 0 && (
          <div className="flex-1 flex items-center justify-center w-full">
            <div className="flex flex-wrap items-center justify-center gap-1 max-w-full">
              {dayEvents.slice(0, 3).map((evt, idx) => (
                evt.avatar ? (
                  <img 
                    key={idx} 
                    src={evt.avatar} 
                    className="w-3.5 h-3.5 rounded-full border border-neutral-800 object-cover shadow-sm flex-shrink-0" 
                    alt="" 
                  />
                ) : (
                  <div 
                    key={idx} 
                    className="w-3.5 h-3.5 rounded-full border border-neutral-800 bg-neutral-700 flex items-center justify-center text-[5px] font-bold text-white shadow-sm flex-shrink-0"
                  >
                    {getInitials(evt.userName || '')}
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 overflow-hidden">
      {!compact && (
        <div className="bg-neutral-900 p-4 border-b border-neutral-800 flex justify-between items-center">
          <h3 className="font-bold text-lg text-white">
            {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="text-xs text-neutral-500 font-medium tracking-wide uppercase">English (US)</div>
        </div>
      )}
      <div className="grid grid-cols-7 text-center border-b border-neutral-800 bg-neutral-900">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className={`${compact ? 'py-2 text-[9px]' : 'py-2 text-xs'} font-semibold text-neutral-500 uppercase tracking-wider`}>
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 bg-neutral-800 gap-[1px] border-b border-neutral-800">
        {days}
      </div>
    </div>
  );
};