import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './components/Icons';
import { Calendar } from './components/Calendar';
import { generateSmartBio } from './services/geminiService';
import { 
  User, Meeting, ViewState, PersonalityType, TimeOfDay, AuthStep, Gender 
} from './types';

// --- SUGGESTION DATA ---
const OCCUPATION_SUGGESTIONS = [
  "Software Engineer", "Digital Artist", "Data Scientist", "Architect", "Chef", 
  "UX Designer", "Product Manager", "Marketing Lead", "Musician", "Marine Biologist",
  "Photographer", "Entrepreneur", "Writer", "Psychologist", "Teacher"
];

const INTEREST_SUGGESTIONS = [
  "Formula 1", "Coding", "Digital Art", "Travel", "Coffee", "Jazz", "Gaming", 
  "Hiking", "Sustainability", "Wine Tasting", "Cooking", "Photography", 
  "Economics", "History", "Architecture", "Design Systems", "Yoga", "Books"
];

const CITY_SUGGESTIONS = [
  "New York", "London", "Paris", "Berlin", "San Francisco", "Tokyo", "Sydney", 
  "Kyiv", "Toronto", "Dubai", "Mumbai", "Singapore", "Barcelona", "Mexico City"
];

// --- MOCK DATA ---
const INITIAL_USER_TEMPLATE: User = {
  id: 'me',
  name: '',
  age: 0,
  gender: Gender.OTHER,
  rating: 4.8,
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=60',
  location: { country: '', city: '', lat: 0, lng: 0 },
  occupation: '',
  bio: '',
  interests: [],
  personality: PersonalityType.AMBIVERT,
  preferredTime: TimeOfDay.MORNING,
  isGolden: false
};

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'match', text: 'Sarah Chen accepted your meeting request.', time: '2m ago', read: false },
  { id: 2, type: 'system', text: 'You earned 50 Kindred Points!', time: '1h ago', read: false },
  { id: 3, type: 'match', text: 'New suggestion: David Kim shares your interest in Gaming.', time: '3h ago', read: true },
];

const MOCK_CHATS = [
  { id: 1, name: 'Sarah Chen', lastMsg: 'Sounds good! See you then.', time: '10m', unread: 1, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60' },
  { id: 2, name: 'Marcus Johnson', lastMsg: 'Have you seen the latest race results?', time: '2h', unread: 0, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60' },
  { id: 3, name: 'Kindred Support', lastMsg: 'Welcome to Golden tier!', time: '1d', unread: 0, avatar: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&auto=format&fit=crop&q=60' },
];

const MOCK_USERS: User[] = [
  { id: '1', name: 'Sarah Chen', age: 26, gender: Gender.FEMALE, rating: 4.9, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=60', location: { country: 'USA', city: 'New York', lat: 40.71, lng: -74.00 }, occupation: 'Data Scientist', bio: 'F1 fanatic and data nerd. Lets talk race strategies over coffee.', interests: ['Formula 1', 'Data', 'Travel'], personality: PersonalityType.INTROVERT, preferredTime: TimeOfDay.EVENING },
  { id: '2', name: 'Marcus Johnson', age: 31, gender: Gender.MALE, rating: 4.7, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60', location: { country: 'UK', city: 'London', lat: 51.50, lng: -0.12 }, occupation: 'Marketing Lead', bio: 'Extrovert seeking interesting conversations about global markets and vintage cars.', interests: ['Marketing', 'Formula 1', 'Stocks'], personality: PersonalityType.EXTROVERT, preferredTime: TimeOfDay.AFTERNOON },
  { id: '3', name: 'Elena Popova', age: 24, gender: Gender.FEMALE, rating: 5.0, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=60', location: { country: 'Ukraine', city: 'Kyiv', lat: 50.45, lng: 30.52 }, occupation: 'Digital Artist', bio: 'Art is life. Seeking muse and good vibes. I love exploring galleries.', interests: ['Art', 'Museums', 'Wine'], personality: PersonalityType.INTROVERT, preferredTime: TimeOfDay.EVENING },
  { id: '4', name: 'James Smith', age: 29, gender: Gender.MALE, rating: 4.8, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=60', location: { country: 'Australia', city: 'Melbourne', lat: -37.81, lng: 144.96 }, occupation: 'Robotics Engineer', bio: 'Building the future. Big fan of tech, sci-fi, and fast cars.', interests: ['Engineering', 'Robotics', 'Formula 1'], personality: PersonalityType.AMBIVERT, preferredTime: TimeOfDay.MORNING },
  { id: '5', name: 'Priya Patel', age: 27, gender: Gender.FEMALE, rating: 4.6, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=60', location: { country: 'Canada', city: 'Toronto', lat: 43.65, lng: -79.38 }, occupation: 'Architect', bio: 'Designing spaces and finding connection. Lets sketch ideas.', interests: ['Architecture', 'Design', 'Sustainability'], personality: PersonalityType.EXTROVERT, preferredTime: TimeOfDay.WEEKEND },
  { id: '16', name: 'David Kim', age: 33, gender: Gender.MALE, rating: 4.6, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=60', location: { country: 'South Korea', city: 'Seoul', lat: 37.56, lng: 126.97 }, occupation: 'Pro Gamer', bio: 'Esports and fast internet. Lets play.', interests: ['Gaming', 'Esports', 'Tech', 'Anime'], personality: PersonalityType.EXTROVERT, preferredTime: TimeOfDay.EVENING },
  { id: '17', name: 'Fatima Al-Fayed', age: 28, gender: Gender.FEMALE, rating: 4.9, avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=800&auto=format&fit=crop&q=60', location: { country: 'UAE', city: 'Dubai', lat: 25.20, lng: 55.27 }, occupation: 'Entrepreneur', bio: 'Building startups and networking. Empowering women in business.', interests: ['Business', 'Startups', 'Networking', 'Luxury'], personality: PersonalityType.EXTROVERT, preferredTime: TimeOfDay.AFTERNOON }
];

// --- SUB-COMPONENTS ---

const AutocompleteInput = ({ 
  value, 
  onChange, 
  suggestions, 
  placeholder, 
  label,
  onSelect
}: { 
  value: string; 
  onChange: (val: string) => void; 
  suggestions: string[]; 
  placeholder: string; 
  label: string;
  onSelect?: (val: string) => void;
}) => {
  const [filtered, setFiltered] = useState<string[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (value.length > 0) {
      const matches = suggestions.filter(s => s.toLowerCase().startsWith(value.toLowerCase())).slice(0, 5);
      setFiltered(matches);
      setShow(matches.length > 0);
    } else {
      setShow(false);
    }
  }, [value, suggestions]);

  return (
    <div className="relative group">
      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 group-focus-within:text-red-500 transition-colors">{label}</label>
      <input 
        type="text"
        className="w-full p-4 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white placeholder-neutral-800 rounded-xl transition-all font-medium"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
      />
      {show && (
        <div className="absolute z-50 w-full mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
          {filtered.map(s => (
            <button 
              key={s}
              type="button"
              onClick={() => {
                if (onSelect) onSelect(s);
                else onChange(s);
                setShow(false);
              }}
              className="w-full text-left p-4 hover:bg-neutral-800 text-sm font-medium text-white transition-colors flex items-center gap-3 border-b border-neutral-800 last:border-none"
            >
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Background = () => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-neutral-950">
    <div className="absolute inset-0 opacity-10" style={{ 
      backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`, 
      backgroundSize: '80px 80px' 
    }}></div>
  </div>
);

const NotificationDropdown = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute top-full right-0 mt-3 w-80 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-black/40">
        <h3 className="font-bold text-white text-xs uppercase tracking-widest">Notifications</h3>
        <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors"><Icons.X className="w-4 h-4" /></button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {MOCK_NOTIFICATIONS.map(n => (
          <div key={n.id} className={`p-4 border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors ${!n.read ? 'bg-red-500/5' : ''}`}>
            <div className="flex justify-between items-start mb-1">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${n.type === 'match' ? 'bg-red-500 text-white' : 'bg-neutral-700 text-neutral-300'}`}>
                {n.type}
              </span>
              <span className="text-neutral-600 text-[10px] font-bold">{n.time}</span>
            </div>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{n.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const MessagesDropdown = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute top-full right-0 mt-3 w-80 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-black/40">
        <h3 className="font-bold text-white text-xs uppercase tracking-widest">Messages</h3>
        <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors"><Icons.X className="w-4 h-4" /></button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {MOCK_CHATS.map(c => (
          <div key={c.id} className="p-4 border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors cursor-pointer group flex gap-4 items-center">
            <div className="relative">
              <img src={c.avatar} className="w-10 h-10 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all border border-neutral-700" alt={c.name} />
              {c.unread > 0 && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-neutral-900 flex items-center justify-center text-[8px] font-bold text-white">{c.unread}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h4 className="font-bold text-sm text-white truncate">{c.name}</h4>
                <span className="text-[10px] text-neutral-600 font-bold">{c.time}</span>
              </div>
              <p className={`text-[11px] truncate ${c.unread > 0 ? 'text-white font-semibold' : 'text-neutral-500'}`}>{c.lastMsg}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Navbar = ({ 
  currentUser, 
  view,
  handleNav, 
  chatsOpen, 
  setChatsOpen, 
  notifsOpen, 
  setNotifsOpen 
}: any) => (
  <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-neutral-800 h-28 px-6 md:px-12 flex items-center justify-between transition-all">
    <div className="flex items-center gap-5 cursor-pointer group" onClick={() => handleNav(ViewState.DISCOVERY)}>
      <div className="w-12 h-12 bg-red-600 flex items-center justify-center text-white font-bold text-2xl clip-diagonal group-hover:bg-white group-hover:text-black transition-all transform group-hover:scale-105">K</div>
      <span className="text-2xl md:text-3xl font-bold tracking-tighter text-white group-hover:text-red-500 transition-all font-display uppercase">KINDRED</span>
    </div>

    {/* Robust Navigation for Medium and Large Screens */}
    <div className="hidden md:flex items-center gap-6 xl:gap-10">
       {[
         { id: ViewState.DISCOVERY, label: 'Discover' },
         { id: ViewState.MEETINGS, label: 'My Meetings' },
         { id: ViewState.PERKS, label: 'Perks' },
         { id: ViewState.GOLDEN, label: 'Become Golden', special: true },
       ].map(item => (
         <button
           key={item.id}
           onClick={() => handleNav(item.id)}
           className={`text-xs xl:text-sm font-bold uppercase tracking-[0.15em] transition-all py-1 border-b-2 ${
             view === item.id 
               ? 'border-red-600 text-white' 
               : item.special 
                 ? 'border-transparent text-amber-500 hover:text-amber-400 hover:scale-105' 
                 : 'border-transparent text-neutral-500 hover:text-white hover:border-neutral-500'
           }`}
         >
           {item.label}
         </button>
       ))}
    </div>

    <div className="flex items-center gap-5 md:gap-10">
      <div className="flex items-center gap-3 md:gap-6">
        <div className="relative">
          <button 
            onClick={() => { setChatsOpen(!chatsOpen); setNotifsOpen(false); }} 
            className={`p-3 rounded-full transition-all ${chatsOpen ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white hover:bg-neutral-900'}`}
          >
            <Icons.MessageCircle className="w-6 h-6" />
          </button>
          <MessagesDropdown isOpen={chatsOpen} onClose={() => setChatsOpen(false)} />
        </div>

        <div className="relative">
          <button 
            onClick={() => { setNotifsOpen(!notifsOpen); setChatsOpen(false); }} 
            className={`p-3 rounded-full transition-all ${notifsOpen ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white hover:bg-neutral-900'}`}
          >
            <Icons.Bell className="w-6 h-6" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-black"></span>
          </button>
          <NotificationDropdown isOpen={notifsOpen} onClose={() => setNotifsOpen(false)} />
        </div>
      </div>

      <div className="h-10 w-px bg-neutral-800 hidden sm:block"></div>

      {/* Stand-out Profile Icon with Rating */}
      <button onClick={() => handleNav(ViewState.PROFILE)} className="relative group flex items-center gap-5">
        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full p-1 bg-gradient-to-tr from-red-600 via-neutral-900 to-amber-500 shadow-[0_0_30px_rgba(220,38,38,0.3)] group-hover:shadow-[0_0_40px_rgba(220,38,38,0.5)] transition-all duration-500 transform group-hover:scale-110">
           <img src={currentUser.avatar} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-black" />
           <div className="absolute -bottom-1 -right-1 bg-neutral-900 border border-neutral-700 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xl border-amber-500/30">
             <Icons.Star className="w-2.5 h-2.5 fill-current" /> {currentUser.rating}
           </div>
        </div>
        <div className="hidden xl:flex flex-col items-start">
           <span className="text-sm font-bold text-white uppercase tracking-widest group-hover:text-red-500 transition-colors">{currentUser.name.split(' ')[0] || 'Member'}</span>
           <span className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.2em] border border-neutral-800 px-2 py-0.5 mt-1 rounded bg-black/40">Verified Member</span>
        </div>
      </button>
    </div>
  </nav>
);

const DiscoveryView = ({ 
  searchQuery, setSearchQuery, 
  filterAge, setFilterAge, 
  filterType, setFilterType, 
  filterTime, setFilterTime,
  filterGender, setFilterGender,
  filteredUsers, handleOpenProfile 
}: any) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="p-4 md:p-12 max-w-screen-2xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 border-b-2 border-neutral-900 pb-10">
        <div>
          <h1 className="text-7xl md:text-9xl font-bold text-white mb-3 uppercase tracking-tighter font-display leading-[0.85]">Discover</h1>
          <p className="text-neutral-500 font-semibold text-xl tracking-tight">Find people you connect with.</p>
        </div>
      </div>

      <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 p-3 mb-14 sticky top-32 z-30 flex flex-col md:flex-row items-center max-w-5xl mx-auto shadow-2xl rounded-2xl">
         <div className="pl-6 pr-4 text-neutral-500"><Icons.Search className="w-6 h-6" /></div>
         <input 
            type="text" 
            placeholder="Interests, names, or occupations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-white text-lg font-medium placeholder-neutral-700 h-14 w-full md:w-auto px-4 md:px-0"
         />
         <div className="w-full md:w-px h-px md:h-10 bg-neutral-800 mx-6 my-3 md:my-0"></div>
         <button 
           onClick={() => setShowAdvanced(!showAdvanced)}
           className={`px-10 py-4 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 w-full md:w-auto rounded-xl ${showAdvanced ? 'bg-white text-black' : 'bg-black border border-neutral-800 text-white hover:bg-neutral-800'}`}
         >
           Filters
           <div className={`w-2 h-2 rounded-full ${showAdvanced ? 'bg-black animate-pulse' : 'bg-red-600'}`}></div>
         </button>
      </div>
      
       {showAdvanced && (
         <div className="mb-14 p-10 bg-neutral-900 border border-neutral-800 grid grid-cols-2 md:grid-cols-4 gap-10 animate-in slide-in-from-top-4 fade-in rounded-3xl">
            {[
               { label: 'Age Range', val: filterAge, set: setFilterAge, opts: ['18-24', '25-34', '35-44', '45-54', '55+'] },
               { label: 'Gender', val: filterGender, set: setFilterGender, opts: Object.values(Gender) },
               { label: 'Social Battery', val: filterType, set: setFilterType, opts: Object.values(PersonalityType) },
               { label: 'Availability', val: filterTime, set: setFilterTime, opts: Object.values(TimeOfDay) },
            ].map((f) => (
               <div key={f.label} className="space-y-4">
                 <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{f.label}</label>
                 <select value={f.val} onChange={(e) => f.set(e.target.value)} className="w-full p-4 bg-black border border-neutral-800 text-xs font-bold text-white outline-none focus:border-red-600 rounded-xl transition-all cursor-pointer">
                    <option value="any">Any</option>
                    {f.opts.map((o: string) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                 </select>
               </div>
            ))}
         </div>
       )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 pb-32">
        {filteredUsers.map((user: User) => (
            <div key={user.id} className="group relative bg-neutral-900 border border-neutral-800 hover:border-white transition-all duration-500 cursor-pointer flex flex-col h-[580px] rounded-3xl overflow-hidden shadow-xl" onClick={() => handleOpenProfile(user)}>
              <div className="relative h-[65%] overflow-hidden bg-neutral-900">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-100"></div>
                
                <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-xl text-white text-[10px] font-black px-4 py-2 uppercase tracking-widest border border-white/10 rounded-full flex items-center gap-1.5">
                   <Icons.Star className="w-3 h-3 text-amber-500 fill-current" /> {user.rating}
                </div>

                <div className="absolute bottom-0 left-0 w-full p-10">
                   <h3 className="font-bold text-4xl text-white uppercase leading-none mb-3 font-display tracking-tight group-hover:text-red-500 transition-colors">{user.name}</h3>
                   <div className="flex items-center gap-3">
                      <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">{user.occupation}</span>
                      <span className="w-1.5 h-1.5 bg-neutral-700 rounded-full"></span>
                      <span className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">{user.age} Y/O</span>
                   </div>
                </div>
              </div>
              
              <div className="p-10 flex-1 flex flex-col justify-between bg-neutral-900/30">
                 <p className="text-neutral-400 text-sm leading-relaxed line-clamp-2 font-medium italic">
                   "{user.bio}"
                 </p>
                 <div className="mt-6 pt-6 border-t border-neutral-800 flex justify-between items-center">
                    <div className="flex gap-2.5">
                      {user.interests.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="text-[9px] font-black uppercase text-neutral-500 border border-neutral-800 px-4 py-1.5 rounded-full bg-black/20 group-hover:border-neutral-600 transition-colors">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-white text-[10px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-all">View Profile &rarr;</div>
                 </div>
              </div>
            </div>
        ))}
      </div>
    </div>
  );
};

const MeetingsView = () => (
  <div className="p-6 md:p-12 max-w-6xl mx-auto animate-in fade-in duration-500">
    <div className="flex flex-col sm:flex-row justify-between items-end mb-16 border-b-2 border-neutral-900 pb-12 gap-6">
       <div>
         <h1 className="text-7xl font-bold text-white uppercase tracking-tighter font-display leading-none">Meetings</h1>
         <p className="text-neutral-500 font-semibold mt-3 text-xl tracking-tight">Your scheduled catch-ups.</p>
       </div>
       <button className="bg-white text-black text-xs font-black uppercase px-10 py-5 hover:bg-red-600 hover:text-white transition-all tracking-[0.2em] rounded-2xl shadow-xl">Sync Calendar</button>
    </div>

    <div className="space-y-16">
       <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
            <h3 className="text-white font-black text-xs uppercase tracking-[0.3em]">Upcoming</h3>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-0 flex flex-col md:flex-row group hover:border-red-600/50 transition-all rounded-3xl overflow-hidden shadow-2xl">
             <div className="bg-black border-r border-neutral-800 p-12 text-center min-w-[180px] flex flex-col justify-center">
                <div className="text-red-500 font-bold text-5xl font-display leading-none">14</div>
                <div className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">OCTOBER</div>
                <div className="text-white font-black text-xl mt-6 bg-neutral-900/50 py-2 px-3 rounded-xl border border-neutral-800">14:00</div>
             </div>
             <div className="p-12 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-4">
                   <h4 className="text-3xl font-bold text-white uppercase tracking-tight">Strategy Coffee: F1 & Data</h4>
                   <span className="bg-emerald-900/20 text-emerald-500 text-[9px] px-4 py-1.5 font-black uppercase tracking-widest border border-emerald-900/50 rounded-full">Confirmed</span>
                </div>
                <p className="text-neutral-500 text-sm mb-10 font-medium">Meeting with <span className="text-white font-black border-b-2 border-red-600 pb-1">Sarah Chen</span></p>
                <div className="flex flex-wrap gap-5">
                   <button className="bg-white text-black text-[10px] px-8 py-4 font-black uppercase hover:bg-red-600 hover:text-white transition-all tracking-[0.1em] rounded-xl shadow-lg">Join Call</button>
                   <button className="border border-neutral-800 text-neutral-500 text-[10px] px-8 py-4 font-black uppercase hover:text-white hover:border-white transition-all tracking-[0.1em] rounded-xl">Reschedule</button>
                </div>
             </div>
          </div>
       </section>

       <section className="opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-3 h-3 bg-neutral-700 rounded-full"></div>
            <h3 className="text-neutral-500 font-black text-xs uppercase tracking-[0.3em]">History</h3>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 p-0 flex flex-col md:flex-row items-center grayscale hover:grayscale-0 transition-all rounded-3xl overflow-hidden">
             <div className="bg-black/30 border-r border-neutral-800 p-10 text-center min-w-[180px]">
                <div className="text-neutral-400 font-bold text-4xl font-display">02</div>
                <div className="text-neutral-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">OCTOBER</div>
             </div>
             <div className="p-10 flex-1">
                <h4 className="text-2xl font-bold text-neutral-300 uppercase tracking-tight">Architecture Chat</h4>
                <p className="text-neutral-500 text-sm mt-2 font-medium">Session with <span className="text-neutral-300 font-bold">Elena Popova</span></p>
             </div>
             <button className="text-[10px] text-white underline decoration-red-600 underline-offset-8 mr-12 font-black uppercase tracking-widest hover:text-red-500 transition-colors">View Notes</button>
          </div>
       </section>
    </div>
  </div>
);

const ProfileSetupView = ({
  currentUser,
  handleUpdateProfile,
  setAuthStep,
  handleAiBio
}: {
  currentUser: User,
  handleUpdateProfile: (u: Partial<User>) => void,
  setAuthStep: (s: AuthStep) => void,
  handleAiBio: () => Promise<void>
}) => {
  const [interestInput, setInterestInput] = useState('');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  const handleInterestSelect = (val: string) => {
    if (!currentUser.interests.includes(val)) {
      handleUpdateProfile({ interests: [...currentUser.interests, val] });
    }
    setInterestInput('');
  };

  const handleAutoBioInternal = async () => {
    setIsGeneratingBio(true);
    await handleAiBio();
    setIsGeneratingBio(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.name || !currentUser.occupation || currentUser.age < 18) {
      alert("Please fill in your details correctly.");
      return;
    }
    setAuthStep(AuthStep.COMPLETED);
  };

  return (
    <div className="min-h-screen py-24 px-4 flex justify-center items-start overflow-y-auto text-white relative">
       <Background />
       <div className="max-w-6xl w-full bg-neutral-900/60 backdrop-blur-3xl border border-neutral-800 p-10 md:p-20 relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-[3rem]">
         <div className="mb-16 flex justify-between items-end border-b-2 border-neutral-900 pb-12">
           <div>
             <h2 className="text-6xl md:text-8xl font-bold text-white uppercase tracking-tighter font-display leading-[0.85]">Profile<br/>Setup</h2>
             <p className="text-neutral-500 mt-5 font-semibold text-2xl tracking-tight">Complete your member card.</p>
           </div>
           <div className="text-red-500 font-black text-xs uppercase tracking-[0.3em] border-2 border-red-600/30 px-6 py-3 bg-red-600/5 rounded-full">Step 2 of 2</div>
         </div>

         <form onSubmit={handleSubmit} className="space-y-16">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-10">
                <div className="flex gap-6">
                  <div className="w-32">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Age</label>
                    <input 
                      type="number" required min="18" max="100" placeholder="--"
                      className="w-full p-5 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white text-center font-bold text-lg rounded-2xl transition-all"
                      value={currentUser.age || ''}
                      onChange={(e) => handleUpdateProfile({age: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Gender</label>
                    <select 
                       className="w-full p-5 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white appearance-none rounded-2xl font-bold transition-all cursor-pointer"
                       value={currentUser.gender}
                       onChange={(e) => handleUpdateProfile({gender: e.target.value as Gender})}
                    >
                      {Object.values(Gender).map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <AutocompleteInput 
                  label="Occupation"
                  placeholder="e.g. Architect, Software Engineer..."
                  value={currentUser.occupation}
                  onChange={(val) => handleUpdateProfile({occupation: val})}
                  suggestions={OCCUPATION_SUGGESTIONS}
                />

                <AutocompleteInput 
                  label="City"
                  placeholder="e.g. London, Tokyo..."
                  value={currentUser.location.city}
                  onChange={(val) => handleUpdateProfile({location: {...currentUser.location, city: val, country: 'USA'}})}
                  suggestions={CITY_SUGGESTIONS}
                />
              </div>
              
              <div className="space-y-10">
                 <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Social Battery</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[PersonalityType.INTROVERT, PersonalityType.EXTROVERT, PersonalityType.AMBIVERT].map(t => (
                      <button 
                        key={t}
                        type="button"
                        onClick={() => handleUpdateProfile({personality: t})}
                        className={`py-5 px-4 border-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl ${currentUser.personality === t ? 'bg-white text-black border-white shadow-xl scale-105' : 'bg-black/40 text-neutral-600 border-neutral-800 hover:border-neutral-500 hover:text-white'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                 <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Preferred Time</label>
                   <div className="grid grid-cols-2 gap-3">
                     {Object.values(TimeOfDay).map(t => (
                       <button
                        key={t}
                        type="button"
                        onClick={() => handleUpdateProfile({preferredTime: t})}
                        className={`py-4 px-5 text-[10px] font-black uppercase border-2 transition-all text-left rounded-2xl ${currentUser.preferredTime === t ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-black/40 border-neutral-800 text-neutral-500 hover:border-neutral-500'}`}
                       >
                         {t}
                       </button>
                     ))}
                   </div>
                 </div>
              </div>
           </div>

           <div>
             <AutocompleteInput 
                label="Interests (Autocomplete)"
                placeholder="Start typing your interests..."
                value={interestInput}
                onChange={setInterestInput}
                suggestions={INTEREST_SUGGESTIONS}
                onSelect={handleInterestSelect}
             />
             <div className="flex flex-wrap gap-3 mt-6">
               {currentUser.interests.map(tag => (
                 <span key={tag} className="flex items-center gap-3 px-6 py-3 bg-neutral-800 text-white text-[10px] border border-neutral-700 font-black uppercase tracking-widest rounded-full shadow-lg">
                   {tag}
                   <button type="button" onClick={() => handleUpdateProfile({ interests: currentUser.interests.filter(i => i !== tag) })} className="hover:text-red-500 transition-colors"><Icons.X className="w-3 h-3"/></button>
                 </span>
               ))}
               {currentUser.interests.length === 0 && <p className="text-neutral-600 text-xs font-medium italic">No interests added yet.</p>}
             </div>
           </div>

           <div>
              <div className="flex justify-between items-center mb-5">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest">Bio</label>
                <button 
                  type="button"
                  onClick={handleAutoBioInternal}
                  disabled={isGeneratingBio}
                  className="flex items-center gap-2 text-[10px] text-red-500 hover:text-white transition-all disabled:opacity-50 font-black uppercase tracking-widest bg-red-600/10 px-4 py-2 rounded-full border border-red-600/30"
                >
                  <Icons.Sparkles className="w-3.5 h-3.5" />
                  {isGeneratingBio ? 'Generating...' : 'AI Assist'}
                </button>
              </div>
              <textarea 
                className="w-full h-44 p-8 bg-black border-2 border-neutral-800 focus:border-red-600 outline-none resize-none text-white placeholder-neutral-800 text-lg leading-relaxed rounded-[2rem] transition-all"
                placeholder="Tell us about yourself..."
                value={currentUser.bio}
                onChange={(e) => handleUpdateProfile({bio: e.target.value})}
              />
           </div>

           <div className="pt-16 border-t border-neutral-900 flex justify-end">
             <button type="submit" className="px-16 py-6 bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all text-sm rounded-[1.5rem] shadow-2xl hover:scale-105 active:scale-95">
               Complete Setup
             </button>
           </div>
         </form>
       </div>
    </div>
  );
};

const PerksView = ({ currentUser }: { currentUser: User }) => (
  <div className="p-4 md:p-12 max-w-6xl mx-auto animate-in fade-in duration-700">
    <div className="text-center mb-20 pt-10">
       <h1 className="text-7xl md:text-9xl font-bold text-white uppercase tracking-tighter mb-8 font-display leading-[0.85]">Perks</h1>
       <div className="inline-block border-2 border-neutral-900 bg-neutral-900/50 backdrop-blur-xl px-10 py-3 rounded-full shadow-2xl">
         <p className="text-neutral-400 text-xs font-black uppercase tracking-[0.3em]">Level {Math.floor(currentUser.rating)} Member</p>
       </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-neutral-900 mb-20 rounded-[3rem] overflow-hidden shadow-2xl bg-black">
       <div className="p-16 text-center group border-r-2 border-neutral-900 hover:bg-neutral-900 transition-all">
          <div className="text-7xl font-bold text-white mb-3 group-hover:text-red-500 transition-colors font-display">850</div>
          <div className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em]">Points Balance</div>
       </div>
       <div className="p-16 text-center group border-r-2 border-neutral-900 hover:bg-neutral-900 transition-all">
          <div className="text-7xl font-bold text-white mb-3 group-hover:text-amber-500 transition-colors font-display">Gold</div>
          <div className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em]">Tier Status</div>
       </div>
       <div className="p-16 text-center group hover:bg-neutral-900 transition-all">
          <div className="text-7xl font-bold text-white mb-3 group-hover:text-emerald-500 transition-colors font-display">3</div>
          <div className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em]">Boosts Left</div>
       </div>
    </div>

    <div className="max-w-4xl mx-auto">
      <h3 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-10 border-l-4 border-red-500 pl-6">Redeem Your Benefits</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {[
           { name: 'Profile Spotlight', cost: 500, desc: 'Increase visibility for 24 hours' },
           { name: 'Private Mode', cost: 300, desc: 'Browse profiles without being seen' },
           { name: 'Meeting Analytics', cost: 800, desc: 'See deep insights on your connections' },
           { name: 'Priority Connect', cost: 100, desc: 'Your meeting requests go to the top' }
         ].map(perk => (
            <div key={perk.name} className="flex justify-between items-start bg-neutral-900/50 border border-neutral-800 p-10 hover:border-white transition-all group rounded-3xl">
               <div>
                  <h4 className="font-bold text-white text-xl uppercase mb-3 font-display">{perk.name}</h4>
                  <p className="text-neutral-500 text-xs font-medium leading-relaxed max-w-[200px]">{perk.desc}</p>
               </div>
               <button className="bg-black text-white border border-neutral-700 text-[10px] font-black uppercase px-6 py-3 group-hover:bg-white group-hover:text-black transition-all rounded-xl">
                  {perk.cost} PTS
               </button>
            </div>
         ))}
      </div>
    </div>
  </div>
);

const GoldenView = () => (
  <div className="p-6 md:p-12 max-w-7xl mx-auto animate-in fade-in duration-700">
    <div className="text-center mb-24 relative pt-10">
       <h1 className="text-7xl md:text-[11rem] font-bold text-white uppercase tracking-tighter relative z-10 leading-[0.8] font-display">
         Become <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 drop-shadow-[0_0_30px_rgba(251,191,36,0.3)]">GOLDEN</span>
       </h1>
       <p className="text-2xl text-neutral-400 mt-12 max-w-3xl mx-auto font-medium tracking-tight">Unlock premium features and meaningful connections.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10 max-w-6xl mx-auto">
       <div className="bg-neutral-900 border border-neutral-800 p-12 flex flex-col rounded-[3rem] shadow-2xl opacity-80 hover:opacity-100 transition-opacity">
          <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">Standard</h3>
          <div className="text-6xl font-bold text-neutral-600 my-12 font-display">$0 <span className="text-sm font-black text-neutral-700 tracking-[0.2em] font-sans">/ MO</span></div>
          <ul className="space-y-6 mb-16 flex-1">
             <li className="flex items-center gap-5 text-sm text-neutral-500 font-bold uppercase tracking-widest"><Icons.Zap className="w-5 h-5" /> 5 Connections / Day</li>
             <li className="flex items-center gap-5 text-sm text-neutral-500 font-bold uppercase tracking-widest"><Icons.Zap className="w-5 h-5" /> Basic Search</li>
          </ul>
          <div className="w-full py-6 text-center border-2 border-neutral-800 text-neutral-500 font-black text-xs uppercase tracking-[0.2em] rounded-2xl">Current Plan</div>
       </div>

       <div className="bg-black border-2 border-amber-500 p-12 flex flex-col relative transform md:-translate-y-8 shadow-[0_0_80px_rgba(245,158,11,0.2)] rounded-[3rem] z-20">
          <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-8 py-3 uppercase tracking-[0.3em] rounded-bl-3xl rounded-tr-[2.5rem]">Recommended</div>
          <h3 className="text-4xl font-bold text-amber-500 uppercase tracking-tighter flex items-center gap-4 font-display">Golden</h3>
          <div className="text-7xl font-bold text-white my-12 font-display">$29 <span className="text-sm font-black text-neutral-500 tracking-[0.2em] font-sans">/ MO</span></div>
          <ul className="space-y-7 mb-16 flex-1">
             <li className="flex items-center gap-5 text-sm text-white font-black uppercase tracking-widest"><Icons.Star className="w-5 h-5 text-amber-500 fill-current" /> Unlimited Connections</li>
             <li className="flex items-center gap-5 text-sm text-white font-black uppercase tracking-widest"><Icons.Star className="w-5 h-5 text-amber-500 fill-current" /> Priority Listing</li>
             <li className="flex items-center gap-5 text-sm text-white font-black uppercase tracking-widest"><Icons.Star className="w-5 h-5 text-amber-500 fill-current" /> See Who Visited</li>
          </ul>
          <button className="w-full py-8 bg-amber-500 hover:bg-white text-black font-black text-sm uppercase tracking-[0.3em] transition-all rounded-3xl shadow-[0_15px_30px_-5px_rgba(245,158,11,0.4)]">Go Golden</button>
       </div>

       <div className="bg-neutral-900 border border-neutral-800 p-12 flex flex-col rounded-[3rem] opacity-60 hover:opacity-100 transition-opacity">
          <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">Enterprise</h3>
          <div className="text-6xl font-bold text-white my-12 font-display">$99 <span className="text-sm font-black text-neutral-500 tracking-[0.2em] font-sans">/ MO</span></div>
          <ul className="space-y-6 mb-16 flex-1">
             <li className="flex items-center gap-5 text-sm text-neutral-400 font-bold uppercase tracking-widest"><Icons.Zap className="w-5 h-5" /> Professional Groups</li>
             <li className="flex items-center gap-5 text-sm text-neutral-400 font-bold uppercase tracking-widest"><Icons.Zap className="w-5 h-5" /> Corporate Events</li>
          </ul>
          <button className="w-full py-6 bg-white text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all rounded-2xl">Contact Us</button>
       </div>
    </div>
  </div>
);

// --- APP ROOT ---

export default function App() {
  const [authStep, setAuthStep] = useState<AuthStep>(AuthStep.LANDING);
  const [view, setView] = useState<ViewState>(ViewState.DISCOVERY);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USER_TEMPLATE);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filterAge, setFilterAge] = useState<string>('any');
  const [filterType, setFilterType] = useState<string>('any'); 
  const [filterTime, setFilterTime] = useState<string>('any');
  const [filterGender, setFilterGender] = useState<string>('any');
  
  const [chatsOpen, setChatsOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  
  const filteredUsers = MOCK_USERS.filter(u => {
    const matchesSearch = searchQuery === '' || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.interests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAge = filterAge === 'any' ? true : filterAge === '18-24' ? (u.age >= 18 && u.age <= 24) : filterAge === '25-34' ? (u.age >= 25 && u.age <= 34) : filterAge === '35-44' ? (u.age >= 35 && u.age <= 44) : filterAge === '45-54' ? (u.age >= 45 && u.age <= 54) : (u.age >= 55);
    const matchesType = filterType === 'any' ? true : u.personality === filterType;
    const matchesTime = filterTime === 'any' ? true : u.preferredTime === filterTime;
    const matchesGender = filterGender === 'any' ? true : u.gender === filterGender;
    return matchesSearch && matchesAge && matchesType && matchesTime && matchesGender;
  });

  const handleNav = (v: ViewState) => { setView(v); window.scrollTo(0,0); };
  const handleOpenProfile = (user: User) => { setSelectedUser(user); setView(ViewState.USER_DETAILS); };
  const handleUpdateProfile = (updated: Partial<User>) => { setCurrentUser(prev => ({ ...prev, ...updated })); };
  const handleAiBio = async () => {
    const newBio = await generateSmartBio(currentUser.interests, currentUser.occupation, currentUser.personality);
    handleUpdateProfile({ bio: newBio });
  };

  if (authStep === AuthStep.LANDING) return <LandingView setAuthStep={setAuthStep} />;
  if (authStep === AuthStep.SIGNUP) return (
    <SignupView currentUser={currentUser} handleUpdateProfile={handleUpdateProfile} setAuthStep={setAuthStep} />
  );
  if (authStep === AuthStep.PROFILE_SETUP) return (
    <ProfileSetupView currentUser={currentUser} handleUpdateProfile={handleUpdateProfile} setAuthStep={setAuthStep} handleAiBio={handleAiBio} />
  );

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-red-600 selection:text-white overflow-x-hidden relative">
      <Background />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar 
          currentUser={currentUser} view={view} handleNav={handleNav} 
          chatsOpen={chatsOpen} setChatsOpen={setChatsOpen} notifsOpen={notifsOpen} setNotifsOpen={setNotifsOpen}
        />
        <main className="flex-1 max-w-[1920px] mx-auto w-full pt-10 px-6 md:px-12">
          {view === ViewState.DISCOVERY && <DiscoveryView searchQuery={searchQuery} setSearchQuery={setSearchQuery} filterAge={filterAge} setFilterAge={setFilterAge} filterType={filterType} setFilterType={setFilterType} filterTime={filterTime} setFilterTime={setFilterTime} filterGender={filterGender} setFilterGender={setFilterGender} filteredUsers={filteredUsers} handleOpenProfile={handleOpenProfile} />}
          {view === ViewState.MEETINGS && <MeetingsView />}
          {view === ViewState.PERKS && <PerksView currentUser={currentUser} />}
          {view === ViewState.GOLDEN && <GoldenView />}
          {view === ViewState.PROFILE && <ProfileSetupView currentUser={currentUser} handleUpdateProfile={handleUpdateProfile} setAuthStep={(s) => {}} handleAiBio={handleAiBio} />}
        </main>
      </div>
    </div>
  );
}

const LandingView = ({ setAuthStep }: { setAuthStep: (step: AuthStep) => void }) => (
  <div className="min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden">
    <Background />
    <div className="relative z-10 max-w-6xl w-full text-center">
      <div className="mb-14 inline-block">
        <div className="border border-red-600/30 bg-red-600/5 px-10 py-4 rounded-full backdrop-blur-xl">
           <span className="text-red-500 font-black tracking-[0.4em] text-[10px] uppercase">Meaningful Connections // v2.4.0</span>
        </div>
      </div>
      <h1 className="text-8xl md:text-[14rem] font-bold text-white tracking-tighter mb-10 leading-[0.85] font-display">
        KIND<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-orange-500 drop-shadow-[0_0_50px_rgba(220,38,38,0.3)]">RED</span>.
      </h1>
      <p className="text-2xl md:text-4xl text-neutral-400 mb-20 max-w-3xl mx-auto font-light leading-snug tracking-tight">
        <span className="text-white font-bold">Beyond Swiping.</span> Find real connections based on shared interests and shared time.
      </p>
      <button 
        onClick={() => setAuthStep(AuthStep.SIGNUP)}
        className="group relative px-20 py-10 bg-white text-black font-black text-2xl uppercase tracking-[0.2em] overflow-hidden hover:bg-red-600 hover:text-white transition-all duration-500 clip-diagonal shadow-[0_30px_60px_-15px_rgba(255,255,255,0.2)]"
      >
        Start Now
      </button>
    </div>
  </div>
);

const SignupView = ({ currentUser, handleUpdateProfile, setAuthStep }: any) => (
  <div className="min-h-screen flex flex-col justify-center items-center p-4 text-white relative">
    <Background />
    <div className="max-w-xl w-full relative z-10">
      <div className="mb-16 text-center">
        <h2 className="text-7xl font-bold tracking-tighter mb-5 font-display uppercase">Sign Up</h2>
        <p className="text-neutral-500 font-bold uppercase tracking-[0.2em] text-sm">Create your Kindred profile.</p>
      </div>
      <div className="bg-neutral-900/40 backdrop-blur-3xl border border-neutral-800 p-16 shadow-2xl rounded-[3rem]">
        <form className="space-y-10" onSubmit={(e) => { e.preventDefault(); setAuthStep(AuthStep.PROFILE_SETUP); }}>
          {['Full Name', 'Email', 'Password'].map((label, idx) => (
            <div key={label} className="group">
              <label className="block text-[10px] font-black text-neutral-600 mb-3 uppercase tracking-[0.2em] group-focus-within:text-red-500 transition-colors">{label}</label>
              <input required type={idx === 2 ? 'password' : 'text'} className="w-full p-6 bg-black border-2 border-neutral-800 focus:border-red-600 outline-none transition-all text-white placeholder-neutral-900 font-bold rounded-2xl" placeholder={idx === 0 ? "e.g. Alex Rivera" : ""} value={idx === 0 ? currentUser.name : undefined} onChange={idx === 0 ? (e) => handleUpdateProfile({ name: e.target.value }) : undefined} />
            </div>
          ))}
          <button type="submit" className="w-full py-7 bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all mt-6 rounded-[1.5rem] shadow-xl">Continue</button>
        </form>
      </div>
    </div>
  </div>
);
