import React from 'react';

interface CalendarProps {
  events: { date: Date; title: string; type: 'meeting' | 'blocked' }[];
  onDateClick?: (date: Date) => void;
  interactive?: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({ events, onDateClick, interactive = false }) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday

  const days = [];
  // Filler for previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-20 sm:h-24 bg-neutral-900/50 border border-neutral-800/50"></div>);
  }

  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    const dayEvents = events.filter(e => 
      e.date.getDate() === d && 
      e.date.getMonth() === currentMonth && 
      e.date.getFullYear() === currentYear
    );

    const isToday = d === today.getDate();

    days.push(
      <div 
        key={`day-${d}`} 
        onClick={() => interactive && onDateClick && onDateClick(dateObj)}
        className={`
          h-20 sm:h-24 border border-neutral-800 p-2 relative transition-all group overflow-hidden
          ${interactive ? 'cursor-pointer hover:bg-neutral-800' : ''}
          ${isToday ? 'bg-red-900/10' : 'bg-neutral-900'}
        `}
      >
        <span className={`
          text-sm font-semibold block mb-1 
          ${isToday ? 'text-red-500 bg-red-900/20 w-6 h-6 rounded-full flex items-center justify-center' : 'text-neutral-500'}
        `}>
          {d}
        </span>
        
        <div className="space-y-1">
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
      </div>
    );
  }

  return (
    <div className="w-full bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 overflow-hidden">
      <div className="bg-neutral-900 p-4 border-b border-neutral-800 flex justify-between items-center">
        <h3 className="font-bold text-lg text-white">
          {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="text-xs text-neutral-500 font-medium tracking-wide uppercase">English (US)</div>
      </div>
      <div className="grid grid-cols-7 text-center border-b border-neutral-800 bg-neutral-900">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
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
