import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './components/Icons';
import { Calendar } from './components/Calendar';
import { generateSmartBio } from './services/geminiService';
import { 
  User, Meeting, ViewState, PersonalityType, TimeOfDay, AuthStep, Gender 
} from './types';

// --- MOCK DATA ---
const INITIAL_USER_TEMPLATE: User = {
  id: 'me',
  name: '',
  age: 0,
  gender: Gender.OTHER,
  rating: 4.8,
  avatar: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&auto=format&fit=crop&q=60',
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
  { 
    id: '1', 
    name: 'Sarah Chen', 
    age: 26, 
    gender: Gender.FEMALE,
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=60', 
    location: { country: 'USA', city: 'New York', lat: 40.71, lng: -74.00 }, 
    occupation: 'Data Scientist', 
    bio: 'F1 fanatic and data nerd. Lets talk race strategies over coffee.', 
    interests: ['Formula 1', 'Data', 'Travel'], 
    personality: PersonalityType.INTROVERT, 
    preferredTime: TimeOfDay.EVENING 
  },
  { 
    id: '2', 
    name: 'Marcus Johnson', 
    age: 31, 
    gender: Gender.MALE,
    rating: 4.7,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60', 
    location: { country: 'UK', city: 'London', lat: 51.50, lng: -0.12 }, 
    occupation: 'Marketing Lead', 
    bio: 'Extrovert seeking interesting conversations about global markets and vintage cars.', 
    interests: ['Marketing', 'Formula 1', 'Stocks'], 
    personality: PersonalityType.EXTROVERT, 
    preferredTime: TimeOfDay.AFTERNOON 
  },
  { 
    id: '3', 
    name: 'Elena Popova', 
    age: 24, 
    gender: Gender.FEMALE,
    rating: 5.0,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=60', 
    location: { country: 'Ukraine', city: 'Kyiv', lat: 50.45, lng: 30.52 }, 
    occupation: 'Digital Artist', 
    bio: 'Art is life. Seeking muse and good vibes. I love exploring galleries.', 
    interests: ['Art', 'Museums', 'Wine'], 
    personality: PersonalityType.INTROVERT, 
    preferredTime: TimeOfDay.EVENING 
  },
  { 
    id: '4', 
    name: 'James Smith', 
    age: 29, 
    gender: Gender.MALE,
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=60', 
    location: { country: 'Australia', city: 'Melbourne', lat: -37.81, lng: 144.96 }, 
    occupation: 'Robotics Engineer', 
    bio: 'Building the future. Big fan of tech, sci-fi, and fast cars.', 
    interests: ['Engineering', 'Robotics', 'Formula 1'], 
    personality: PersonalityType.AMBIVERT, 
    preferredTime: TimeOfDay.MORNING 
  },
  { 
    id: '5', 
    name: 'Priya Patel', 
    age: 27, 
    gender: Gender.FEMALE,
    rating: 4.6,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=60', 
    location: { country: 'Canada', city: 'Toronto', lat: 43.65, lng: -79.38 }, 
    occupation: 'Architect', 
    bio: 'Designing spaces and finding connection. Lets sketch ideas.', 
    interests: ['Architecture', 'Design', 'Sustainability'], 
    personality: PersonalityType.EXTROVERT, 
    preferredTime: TimeOfDay.WEEKEND 
  },
  {
    id: '6',
    name: 'Liam O\'Connor',
    age: 34,
    gender: Gender.MALE,
    rating: 4.5,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=60',
    location: { country: 'Ireland', city: 'Dublin', lat: 53.34, lng: -6.26 },
    occupation: 'Musician',
    bio: 'Folk music enthusiast and coffee lover. Always looking for a jam session.',
    interests: ['Music', 'Guitar', 'Coffee', 'History'],
    personality: PersonalityType.AMBIVERT,
    preferredTime: TimeOfDay.EVENING
  },
  {
    id: '7',
    name: 'Sofia Rossi',
    age: 29,
    gender: Gender.FEMALE,
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=60',
    location: { country: 'Italy', city: 'Milan', lat: 45.46, lng: 9.19 },
    occupation: 'Fashion Designer',
    bio: 'Creating sustainable fashion. Love hunting through vintage markets.',
    interests: ['Fashion', 'Sustainability', 'Vintage', 'Art'],
    personality: PersonalityType.EXTROVERT,
    preferredTime: TimeOfDay.WEEKEND
  },
  {
    id: '8',
    name: 'Kenji Tanaka',
    age: 42,
    gender: Gender.MALE,
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1508341591423-4347099e1f19?w=800&auto=format&fit=crop&q=60',
    location: { country: 'Japan', city: 'Tokyo', lat: 35.67, lng: 139.65 },
    occupation: 'Chef',
    bio: 'Culinary adventures and street food. Lets eat and discuss flavors.',
    interests: ['Cooking', 'Food', 'Travel', 'Photography'],
    personality: PersonalityType.INTROVERT,
    preferredTime: TimeOfDay.AFTERNOON
  },
  {
    id: '9',
    name: 'Aisha Williams',
    age: 25,
    gender: Gender.FEMALE,
    rating: 4.7,
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&auto=format&fit=crop&q=60',
    location: { country: 'South Africa', city: 'Cape Town', lat: -33.92, lng: 18.42 },
    occupation: 'Marine Biologist',
    bio: 'Saving the oceans one reef at a time. Love deep diving.',
    interests: ['Ocean', 'Diving', 'Nature', 'Conservation'],
    personality: PersonalityType.AMBIVERT,
    preferredTime: TimeOfDay.MORNING
  },
  {
    id: '10',
    name: 'Carlos Mendez',
    age: 38,
    gender: Gender.MALE,
    rating: 4.6,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=60',
    location: { country: 'Mexico', city: 'Mexico City', lat: 19.43, lng: -99.13 },
    occupation: 'Architect',
    bio: 'Modernism meets tradition. Sketching the city and drinking mezcal.',
    interests: ['Architecture', 'Art', 'History', 'Design'],
    personality: PersonalityType.EXTROVERT,
    preferredTime: TimeOfDay.AFTERNOON
  },
  {
    id: '11',
    name: 'Emma Wilson',
    age: 55,
    gender: Gender.FEMALE,
    rating: 5.0,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=60',
    location: { country: 'Australia', city: 'Sydney', lat: -33.86, lng: 151.20 },
    occupation: 'Retired Teacher',
    bio: 'Gardening and book clubs. Always learning something new.',
    interests: ['Gardening', 'Books', 'Education', 'Writing'],
    personality: PersonalityType.INTROVERT,
    preferredTime: TimeOfDay.MORNING
  },
  {
    id: '12',
    name: 'Raj Patel',
    age: 22,
    gender: Gender.MALE,
    rating: 4.4,
    avatar: 'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=800&auto=format&fit=crop&q=60',
    location: { country: 'India', city: 'Mumbai', lat: 19.07, lng: 72.87 },
    occupation: 'Software Dev',
    bio: 'Coding the future. Cricket fan and tech enthusiast.',
    interests: ['Coding', 'Cricket', 'Tech', 'Startups'],
    personality: PersonalityType.AMBIVERT,
    preferredTime: TimeOfDay.EVENING
  },
  {
    id: '13',
    name: 'Olivia Dubois',
    age: 30,
    gender: Gender.FEMALE,
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=60',
    location: { country: 'France', city: 'Paris', lat: 48.85, lng: 2.35 },
    occupation: 'Sommelier',
    bio: 'Wine tasting and philosophy. Lets find the perfect pairing.',
    interests: ['Wine', 'Philosophy', 'Jazz', 'Gastronomy'],
    personality: PersonalityType.EXTROVERT,
    preferredTime: TimeOfDay.EVENING
  },
  {
    id: '14',
    name: 'Lars Jensen',
    age: 45,
    gender: Gender.MALE,
    rating: 4.7,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop&q=60',
    location: { country: 'Denmark', city: 'Copenhagen', lat: 55.67, lng: 12.56 },
    occupation: 'Urban Planner',
    bio: 'Biking cities and green spaces. Designing for people.',
    interests: ['Cycling', 'Urban Planning', 'Design', 'Environment'],
    personality: PersonalityType.INTROVERT,
    preferredTime: TimeOfDay.MORNING
  },
  {
    id: '15',
    name: 'Maya Gupta',
    age: 27,
    gender: Gender.FEMALE,
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=60',
    location: { country: 'USA', city: 'San Francisco', lat: 37.77, lng: -122.41 },
    occupation: 'UX Researcher',
    bio: 'Understanding people through design. Weekend hiker.',
    interests: ['UX', 'Psychology', 'Hiking', 'Tech'],
    personality: PersonalityType.AMBIVERT,
    preferredTime: TimeOfDay.WEEKEND
  },
  {
    id: '16',
    name: 'David Kim',
    age: 33,
    gender: Gender.MALE,
    rating: 4.6,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=60',
    location: { country: 'South Korea', city: 'Seoul', lat: 37.56, lng: 126.97 },
    occupation: 'Pro Gamer',
    bio: 'Esports and fast internet. Lets play.',
    interests: ['Gaming', 'Esports', 'Tech', 'Anime'],
    personality: PersonalityType.EXTROVERT,
    preferredTime: TimeOfDay.EVENING
  },
  {
    id: '17',
    name: 'Fatima Al-Fayed',
    age: 28,
    gender: Gender.FEMALE,
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=800&auto=format&fit=crop&q=60',
    location: { country: 'UAE', city: 'Dubai', lat: 25.20, lng: 55.27 },
    occupation: 'Entrepreneur',
    bio: 'Building startups and networking. Empowering women in business.',
    interests: ['Business', 'Startups', 'Networking', 'Luxury'],
    personality: PersonalityType.EXTROVERT,
    preferredTime: TimeOfDay.AFTERNOON
  },
  {
    id: '18',
    name: 'Lucas Silva',
    age: 31,
    gender: Gender.MALE,
    rating: 4.7,
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=800&auto=format&fit=crop&q=60',
    location: { country: 'Brazil', city: 'Rio', lat: -22.90, lng: -43.17 },
    occupation: 'Personal Trainer',
    bio: 'Health is wealth. Beach volleyball on weekends.',
    interests: ['Fitness', 'Sports', 'Beach', 'Nutrition'],
    personality: PersonalityType.EXTROVERT,
    preferredTime: TimeOfDay.MORNING
  },
  {
    id: '19',
    name: 'Nina Kova',
    age: 23,
    gender: Gender.NON_BINARY,
    rating: 4.5,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=60',
    location: { country: 'Germany', city: 'Berlin', lat: 52.52, lng: 13.40 },
    occupation: 'DJ',
    bio: 'Techno beats and underground scenes. Music is my language.',
    interests: ['Music', 'Techno', 'Nightlife', 'Vinyl'],
    personality: PersonalityType.INTROVERT,
    preferredTime: TimeOfDay.EVENING
  },
  {
    id: '20',
    name: 'Wei Zhang',
    age: 40,
    gender: Gender.MALE,
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop&q=60',
    location: { country: 'China', city: 'Shanghai', lat: 31.23, lng: 121.47 },
    occupation: 'Investor',
    bio: 'Global markets and tea ceremonies. Seeking balance.',
    interests: ['Finance', 'Tea', 'Travel', 'Economics'],
    personality: PersonalityType.AMBIVERT,
    preferredTime: TimeOfDay.MORNING
  }
];

// --- SUB-COMPONENTS ---

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
    <div className="absolute top-full right-0 mt-3 w-80 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
        <h3 className="font-bold text-white text-sm uppercase tracking-wide">Notifications</h3>
        <button onClick={onClose} className="text-neutral-500 hover:text-white"><Icons.X className="w-4 h-4" /></button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {MOCK_NOTIFICATIONS.map(n => (
          <div key={n.id} className={`p-4 border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors ${!n.read ? 'bg-red-500/5' : ''}`}>
            <div className="flex justify-between items-start mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${n.type === 'match' ? 'bg-red-500 text-white' : 'bg-neutral-700 text-neutral-300'}`}>
                {n.type}
              </span>
              <span className="text-neutral-500 text-xs">{n.time}</span>
            </div>
            <p className="text-sm text-neutral-200 mt-1">{n.text}</p>
          </div>
        ))}
      </div>
      <div className="p-2 text-center bg-black/50">
        <button className="text-xs font-bold text-neutral-500 hover:text-white uppercase tracking-widest">Mark all read</button>
      </div>
    </div>
  );
};

const MessagesDropdown = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute top-full right-0 mt-3 w-80 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
        <h3 className="font-bold text-white text-sm uppercase tracking-wide">Messages</h3>
        <button onClick={onClose} className="text-neutral-500 hover:text-white"><Icons.X className="w-4 h-4" /></button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {MOCK_CHATS.map(c => (
          <div key={c.id} className="p-4 border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors cursor-pointer group flex gap-3 items-center">
            <div className="relative">
              <img src={c.avatar} className="w-10 h-10 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" alt={c.name} />
              {c.unread > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-neutral-900"></div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h4 className="font-bold text-sm text-white truncate">{c.name}</h4>
                <span className="text-[10px] text-neutral-500">{c.time}</span>
              </div>
              <p className={`text-xs truncate ${c.unread > 0 ? 'text-white font-medium' : 'text-neutral-500'}`}>{c.lastMsg}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 text-center bg-black/50">
        <button className="text-xs font-bold text-neutral-500 hover:text-white uppercase tracking-widest">View All</button>
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
  <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-neutral-800 h-24 px-6 md:px-10 flex items-center justify-between transition-all">
    <div className="flex items-center gap-4 cursor-pointer group" onClick={() => handleNav(ViewState.DISCOVERY)}>
      <div className="w-10 h-10 bg-red-600 flex items-center justify-center text-white font-bold text-xl clip-diagonal group-hover:bg-white group-hover:text-black transition-colors">K</div>
      <span className="text-2xl font-bold tracking-tight text-white group-hover:text-red-500 transition-all font-display uppercase">KINDRED</span>
    </div>

    {/* Modern Top Bar Navigation */}
    <div className="hidden md:flex items-center gap-6 xl:gap-8">
       {[
         { id: ViewState.DISCOVERY, label: 'Discover' },
         { id: ViewState.MEETINGS, label: 'My Meetings' },
         { id: ViewState.PERKS, label: 'Perks' },
         { id: ViewState.GOLDEN, label: 'Become Golden', special: true },
       ].map(item => (
         <button
           key={item.id}
           onClick={() => handleNav(item.id)}
           className={`text-xs font-bold uppercase tracking-widest transition-all py-1 border-b-2 ${
             view === item.id 
               ? 'border-red-600 text-white' 
               : item.special 
                 ? 'border-transparent text-amber-500 hover:text-amber-400' 
                 : 'border-transparent text-neutral-500 hover:text-white'
           }`}
         >
           {item.label}
         </button>
       ))}
    </div>

    <div className="flex items-center gap-4 md:gap-8">
      {/* Messages */}
      <div className="relative">
        <button 
          onClick={() => { setChatsOpen(!chatsOpen); setNotifsOpen(false); }} 
          className={`transition-all ${chatsOpen ? 'text-white scale-110' : 'text-neutral-400 hover:text-white'}`}
        >
          <Icons.MessageCircle className="w-6 h-6" />
        </button>
        <MessagesDropdown isOpen={chatsOpen} onClose={() => setChatsOpen(false)} />
      </div>

      {/* Notifications */}
      <div className="relative">
        <button 
          onClick={() => { setNotifsOpen(!notifsOpen); setChatsOpen(false); }} 
          className={`transition-all ${notifsOpen ? 'text-white scale-110' : 'text-neutral-400 hover:text-white'}`}
        >
          <Icons.Bell className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-black"></span>
        </button>
        <NotificationDropdown isOpen={notifsOpen} onClose={() => setNotifsOpen(false)} />
      </div>

      <div className="h-10 w-px bg-neutral-800 mx-2"></div>

      {/* Profile Icon - Enhanced */}
      <button onClick={() => handleNav(ViewState.PROFILE)} className="relative group flex items-center gap-3 md:gap-4">
        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full p-0.5 bg-gradient-to-br from-red-600 to-neutral-900 shadow-[0_0_20px_rgba(220,38,38,0.4)] group-hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all duration-300">
           <img src={currentUser.avatar} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-black" />
           {/* Mobile Rating Badge */}
           <div className="md:hidden absolute -bottom-1 -right-1 bg-neutral-900 border border-neutral-700 text-amber-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg">
             <Icons.Star className="w-2 h-2 fill-current" /> {currentUser.rating}
           </div>
        </div>
        <div className="hidden md:flex flex-col items-start">
           <span className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-red-500 transition-colors">{currentUser.name.split(' ')[0] || 'User'}</span>
           <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
             <Icons.Star className="w-3 h-3 fill-current" /> {currentUser.rating} Rating
           </div>
        </div>
      </button>
    </div>
  </nav>
);

const LandingView = ({ setAuthStep }: { setAuthStep: (step: AuthStep) => void }) => (
  <div className="min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden">
    <Background />
    <div className="relative z-10 max-w-5xl w-full text-center">
      <div className="mb-10 inline-block">
        <div className="border border-red-600/30 bg-red-600/5 px-8 py-3 rounded-full backdrop-blur-md">
           <span className="text-red-500 font-bold tracking-[0.2em] text-xs uppercase">Social Syncing Protocol v2.0</span>
        </div>
      </div>
      
      <h1 className="text-8xl md:text-[10rem] font-bold text-white tracking-tighter mb-8 leading-[0.85] font-display">
        KIND<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-orange-500">RED</span>.
      </h1>
      
      <p className="text-xl md:text-3xl text-neutral-400 mb-16 max-w-2xl mx-auto font-light leading-relaxed">
        <span className="text-white font-medium">No swipes.</span> Meaningful connections.<br/>
        Minimal noise.
      </p>

      <button 
        onClick={() => setAuthStep(AuthStep.SIGNUP)}
        className="group relative px-16 py-8 bg-white text-black font-extrabold text-xl uppercase tracking-widest overflow-hidden hover:bg-red-600 hover:text-white transition-all duration-300 clip-diagonal"
      >
        Start Now
      </button>
      
      <div className="mt-20 flex justify-center gap-12 text-neutral-600 text-xs font-bold uppercase tracking-[0.2em]">
        <span>Since 2024</span>
        <span>//</span>
        <span>Global Network</span>
        <span>//</span>
        <span>Human First</span>
      </div>
    </div>
  </div>
);

const SignupView = ({ 
  currentUser, 
  handleUpdateProfile, 
  setAuthStep 
}: { 
  currentUser: User, 
  handleUpdateProfile: (u: Partial<User>) => void, 
  setAuthStep: (s: AuthStep) => void 
}) => (
  <div className="min-h-screen flex flex-col justify-center items-center p-4 text-white relative">
    <Background />
    <div className="max-w-md w-full relative z-10">
      <div className="mb-12 text-center">
        <h2 className="text-5xl font-bold tracking-tighter mb-4 font-display">Join Kindred</h2>
        <p className="text-neutral-500 font-medium">Create your digital identity.</p>
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-10 shadow-2xl rounded-2xl">
        <form 
          className="space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            setAuthStep(AuthStep.PROFILE_SETUP);
          }}
        >
          {['Full Name', 'Email Address', 'Password'].map((label, idx) => (
            <div key={label} className="group">
              <label className="block text-xs font-bold text-neutral-500 mb-3 uppercase tracking-widest group-focus-within:text-red-500 transition-colors">{label}</label>
              <input 
                required
                type={label === 'Password' ? 'password' : label === 'Email Address' ? 'email' : 'text'}
                className="w-full p-4 bg-black border border-neutral-800 focus:border-red-600 outline-none transition-all text-white placeholder-neutral-800 font-medium rounded-lg"
                placeholder={idx === 0 ? "e.g. Alex Rivera" : ""}
                value={label === 'Full Name' ? currentUser.name : undefined}
                onChange={label === 'Full Name' ? (e) => handleUpdateProfile({ name: e.target.value }) : undefined}
              />
            </div>
          ))}

          <button type="submit" className="w-full py-5 bg-white text-black font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all mt-4 rounded-lg">
            Continue
          </button>
        </form>
      </div>
      <button onClick={() => setAuthStep(AuthStep.LANDING)} className="w-full mt-8 text-neutral-500 text-xs hover:text-white transition-colors uppercase tracking-widest font-bold">Cancel & Return</button>
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

  const addInterest = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && interestInput.trim()) {
      e.preventDefault();
      if (!currentUser.interests.includes(interestInput.trim())) {
        handleUpdateProfile({ interests: [...currentUser.interests, interestInput.trim()] });
      }
      setInterestInput('');
    }
  };

  const removeInterest = (tag: string) => {
    handleUpdateProfile({ interests: currentUser.interests.filter(i => i !== tag) });
  };

  const handleAutoBioInternal = async () => {
    setIsGeneratingBio(true);
    await handleAiBio();
    setIsGeneratingBio(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.name || !currentUser.occupation || currentUser.age < 18) {
      alert("Please fill in your name, occupation, and ensure you are 18+.");
      return;
    }
    setAuthStep(AuthStep.COMPLETED);
  };

  return (
    <div className="min-h-screen py-16 px-4 flex justify-center items-start overflow-y-auto text-white relative">
       <Background />
       <div className="max-w-5xl w-full bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 p-8 md:p-16 relative z-10 shadow-2xl rounded-3xl">
         <div className="mb-14 flex justify-between items-end border-b border-neutral-800 pb-8">
           <div>
             <h2 className="text-5xl font-bold text-white uppercase tracking-tighter font-display">Setup</h2>
             <p className="text-neutral-500 mt-3 font-medium text-lg">Build your profile card.</p>
           </div>
           <div className="text-red-500 font-bold text-xs uppercase tracking-widest border border-red-500/30 px-4 py-2 bg-red-500/10 rounded-full">Step 2 of 2</div>
         </div>

         <form onSubmit={handleSubmit} className="space-y-10">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Age / Gender</label>
                  <div className="flex gap-4">
                    <input 
                      type="number" required min="18" max="100" placeholder="Age"
                      className="w-28 p-4 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white rounded-lg"
                      value={currentUser.age || ''}
                      onChange={(e) => handleUpdateProfile({age: parseInt(e.target.value) || 0})}
                    />
                    <select 
                       className="flex-1 p-4 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white appearance-none rounded-lg"
                       value={currentUser.gender}
                       onChange={(e) => handleUpdateProfile({gender: e.target.value as Gender})}
                    >
                      {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Occupation</label>
                  <input 
                    type="text" required
                    className="w-full p-4 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white placeholder-neutral-800 rounded-lg"
                    placeholder="e.g. Graphic Designer"
                    value={currentUser.occupation}
                    onChange={(e) => handleUpdateProfile({occupation: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Base Location</label>
                  <input 
                    type="text" required
                    className="w-full p-4 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white placeholder-neutral-800 rounded-lg"
                    placeholder="e.g. London"
                    value={currentUser.location.city}
                    onChange={(e) => handleUpdateProfile({location: {...currentUser.location, city: e.target.value, country: currentUser.location.country || 'Unknown'}})}
                  />
                </div>
              </div>
              
              <div className="space-y-8">
                 <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Social Battery</label>
                  <div className="flex flex-col gap-3">
                    {[PersonalityType.INTROVERT, PersonalityType.EXTROVERT, PersonalityType.AMBIVERT].map(t => (
                      <button 
                        key={t}
                        type="button"
                        onClick={() => handleUpdateProfile({personality: t})}
                        className={`w-full py-4 px-6 border text-xs font-bold uppercase tracking-wider transition-all rounded-lg ${currentUser.personality === t ? 'bg-white text-black border-white' : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-600'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                 <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Preferred Time</label>
                   <select 
                    className="w-full p-4 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white rounded-lg"
                    value={currentUser.preferredTime}
                    onChange={(e) => handleUpdateProfile({preferredTime: e.target.value as TimeOfDay})}
                   >
                     {Object.values(TimeOfDay).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                 </div>
              </div>
           </div>

           <div>
             <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Interests</label>
             <input 
                type="text"
                className="w-full p-4 bg-black border border-neutral-800 focus:border-red-600 outline-none mb-4 text-white placeholder-neutral-800 rounded-lg"
                placeholder="Type and press Enter..."
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={addInterest}
             />
             <div className="flex flex-wrap gap-2">
               {currentUser.interests.map(tag => (
                 <span key={tag} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white text-xs border border-neutral-700 font-bold uppercase tracking-wide rounded-full">
                   {tag}
                   <button type="button" onClick={() => removeInterest(tag)} className="hover:text-red-500"><Icons.X className="w-3 h-3"/></button>
                 </span>
               ))}
             </div>
           </div>

           <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest">Bio</label>
                <button 
                  type="button"
                  onClick={handleAutoBioInternal}
                  disabled={isGeneratingBio}
                  className="flex items-center gap-2 text-xs text-red-500 hover:text-white transition-colors disabled:opacity-50 font-bold uppercase tracking-wide"
                >
                  <Icons.Sparkles className="w-3 h-3" />
                  {isGeneratingBio ? 'Thinking...' : 'AI Assist'}
                </button>
              </div>
              <textarea 
                className="w-full h-36 p-5 bg-black border border-neutral-800 focus:border-red-600 outline-none resize-none text-white placeholder-neutral-800 text-sm leading-relaxed rounded-xl"
                placeholder="Brief introduction..."
                value={currentUser.bio}
                onChange={(e) => handleUpdateProfile({bio: e.target.value})}
              />
           </div>

           <div className="pt-10 border-t border-neutral-800 flex justify-end">
             <button type="submit" className="px-12 py-5 bg-white text-black font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all text-sm rounded-lg shadow-lg">
               Finish Setup
             </button>
           </div>
         </form>
       </div>
    </div>
  );
};

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
    <div className="p-4 md:p-10 max-w-screen-2xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-b border-neutral-800 pb-8">
        <div>
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-2 uppercase tracking-tighter font-display">Discover</h1>
          <p className="text-neutral-500 font-medium text-xl">Find your people.</p>
        </div>
      </div>

      {/* Tech Filter Bar */}
      <div className="bg-neutral-900 border border-neutral-800 p-2 mb-10 sticky top-28 z-30 flex flex-col md:flex-row items-center max-w-4xl shadow-2xl rounded-2xl">
         <div className="pl-6 pr-4 text-neutral-500"><Icons.Search className="w-5 h-5" /></div>
         <input 
            type="text" 
            placeholder="Search interests..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-white text-base font-medium placeholder-neutral-600 h-14 w-full md:w-auto px-4 md:px-0"
         />
         <div className="w-full md:w-px h-px md:h-8 bg-neutral-800 mx-4 my-2 md:my-0"></div>
         <button 
           onClick={() => setShowAdvanced(!showAdvanced)}
           className={`px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 w-full md:w-auto rounded-xl ${showAdvanced ? 'bg-white text-black' : 'bg-black text-white hover:bg-neutral-800'}`}
         >
           Filters
           <div className={`w-1.5 h-1.5 rounded-full ${showAdvanced ? 'bg-black' : 'bg-red-500'}`}></div>
         </button>
      </div>
      
      {/* Advanced Filters Drawer */}
       {showAdvanced && (
         <div className="mb-12 p-8 bg-neutral-900 border border-neutral-800 grid grid-cols-2 md:grid-cols-4 gap-8 animate-in slide-in-from-top-2 fade-in rounded-2xl">
            {[
               { label: 'Age Range', val: filterAge, set: setFilterAge, opts: ['18-24', '25-34', '35-44', '45-54', '55+'] },
               { label: 'Gender', val: filterGender, set: setFilterGender, opts: Object.values(Gender) },
               { label: 'Personality', val: filterType, set: setFilterType, opts: Object.values(PersonalityType) },
               { label: 'Timeframe', val: filterTime, set: setFilterTime, opts: Object.values(TimeOfDay) },
            ].map((f) => (
               <div key={f.label} className="space-y-3">
                 <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{f.label}</label>
                 <select value={f.val} onChange={(e) => f.set(e.target.value)} className="w-full p-4 bg-black border border-neutral-800 text-sm text-white outline-none focus:border-red-500 rounded-lg">
                    <option value="any">ANY</option>
                    {f.opts.map((o: string) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                 </select>
               </div>
            ))}
         </div>
       )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
        {filteredUsers.map((user: User) => (
            <div key={user.id} className="group relative bg-neutral-900 border border-neutral-800 hover:border-white transition-all duration-300 cursor-pointer flex flex-col h-[550px] rounded-2xl overflow-hidden" onClick={() => handleOpenProfile(user)}>
              <div className="relative h-2/3 overflow-hidden bg-neutral-800">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                
                <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 uppercase tracking-widest border border-white/10 rounded-lg">
                   {user.rating} ★
                </div>

                <div className="absolute bottom-0 left-0 w-full p-8">
                   <h3 className="font-bold text-4xl text-white uppercase leading-none mb-3 font-display">{user.name}</h3>
                   <div className="flex items-center gap-3">
                      <span className="text-red-500 text-xs font-bold uppercase tracking-widest">{user.occupation}</span>
                      <span className="w-1 h-1 bg-neutral-500 rounded-full"></span>
                      <span className="text-neutral-400 text-xs font-bold uppercase tracking-widest">{user.age} Y/O</span>
                   </div>
                </div>
              </div>
              
              <div className="p-8 flex-1 flex flex-col justify-between bg-neutral-900/50">
                 <p className="text-neutral-400 text-sm leading-relaxed line-clamp-2 font-medium">
                   "{user.bio}"
                 </p>
                 <div className="mt-4 pt-4 border-t border-neutral-800 flex justify-between items-center">
                    <div className="flex gap-2">
                      {user.interests.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="text-[10px] font-bold uppercase text-neutral-400 border border-neutral-700 px-3 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-white text-xs font-bold uppercase tracking-wider group-hover:text-red-500 transition-colors">View Profile &rarr;</div>
                 </div>
              </div>
            </div>
        ))}
      </div>
    </div>
  );
};

// --- NEW & UPDATED VIEWS ---

const MeetingsView = () => (
  <div className="p-4 md:p-10 max-w-6xl mx-auto animate-in fade-in">
    <div className="flex justify-between items-end mb-12 border-b border-neutral-800 pb-8">
       <div>
         <h1 className="text-6xl font-bold text-white uppercase tracking-tighter font-display">Meetings</h1>
         <p className="text-neutral-500 font-medium mt-2 text-xl">Your upcoming schedule.</p>
       </div>
       <button className="bg-white text-black text-xs font-bold uppercase px-8 py-4 hover:bg-neutral-200 transition-colors tracking-widest rounded-xl">Sync Calendar</button>
    </div>

    <div className="space-y-12">
       <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest">Upcoming</h3>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-0 flex flex-col md:flex-row group hover:border-neutral-600 transition-all rounded-2xl overflow-hidden">
             <div className="bg-black border-r border-neutral-800 p-10 text-center min-w-[160px] flex flex-col justify-center">
                <div className="text-red-500 font-bold text-4xl font-display">14</div>
                <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">OCT</div>
                <div className="text-white font-bold text-lg mt-4 bg-neutral-900 py-1 px-2 rounded-lg">14:00</div>
             </div>
             <div className="p-10 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-2">
                   <h4 className="text-2xl font-bold text-white uppercase">Strategy Talk: F1 & Data</h4>
                   <span className="bg-emerald-900/30 text-emerald-500 text-[10px] px-3 py-1 font-bold uppercase tracking-widest border border-emerald-900 rounded-full">Confirmed</span>
                </div>
                <p className="text-neutral-400 text-sm mb-6 font-medium">Meeting with <span className="text-white font-bold border-b-2 border-red-600 pb-0.5">Sarah Chen</span></p>
                <div className="flex gap-4">
                   <button className="bg-white text-black text-xs px-6 py-3 font-bold uppercase hover:bg-neutral-200 tracking-wider rounded-lg">Join Call</button>
                   <button className="border border-neutral-700 text-neutral-400 text-xs px-6 py-3 font-bold uppercase hover:text-white hover:border-white tracking-wider rounded-lg">Reschedule</button>
                </div>
             </div>
          </div>
       </section>

       <section className="opacity-70 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 bg-neutral-700 rounded-full"></div>
            <h3 className="text-neutral-500 font-bold text-sm uppercase tracking-widest">Past</h3>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-0 flex flex-col md:flex-row items-center grayscale hover:grayscale-0 transition-all rounded-2xl overflow-hidden">
             <div className="bg-black border-r border-neutral-800 p-8 text-center min-w-[160px]">
                <div className="text-neutral-300 font-bold text-3xl font-display">02</div>
                <div className="text-neutral-600 text-xs font-bold uppercase tracking-widest mt-1">OCT</div>
             </div>
             <div className="p-8 flex-1">
                <h4 className="text-xl font-bold text-neutral-300 uppercase">Design Systems Chat</h4>
                <p className="text-neutral-500 text-sm mt-1">With <span className="text-neutral-300">Elena Popova</span></p>
             </div>
             <button className="text-xs text-white underline decoration-red-500 underline-offset-4 mr-10 font-bold uppercase tracking-wider">View Notes</button>
          </div>
       </section>
    </div>
  </div>
);

const PerksView = ({ currentUser }: { currentUser: User }) => (
  <div className="p-4 md:p-10 max-w-6xl mx-auto animate-in fade-in">
    <div className="text-center mb-16 pt-8">
       <h1 className="text-6xl md:text-8xl font-bold text-white uppercase tracking-tighter mb-6 font-display">Loyalty Perks</h1>
       <div className="inline-block border border-neutral-800 bg-neutral-900 px-6 py-2 rounded-full">
         <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Level {Math.floor(currentUser.rating)} Member</p>
       </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-neutral-800 mb-16 rounded-3xl overflow-hidden">
       <div className="bg-black p-12 text-center group border-r border-neutral-800 hover:bg-neutral-900 transition-colors">
          <div className="text-6xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors font-display">850</div>
          <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Points Balance</div>
       </div>
       <div className="bg-black p-12 text-center group border-r border-neutral-800 hover:bg-neutral-900 transition-colors">
          <div className="text-6xl font-bold text-white mb-2 group-hover:text-amber-500 transition-colors font-display">Gold</div>
          <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Current Tier</div>
       </div>
       <div className="bg-black p-12 text-center group hover:bg-neutral-900 transition-colors">
          <div className="text-6xl font-bold text-white mb-2 group-hover:text-emerald-500 transition-colors font-display">3</div>
          <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Boosts Available</div>
       </div>
    </div>

    <div className="max-w-4xl mx-auto">
      <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-8 border-l-4 border-red-500 pl-4">Redeem Rewards</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {[
           { name: 'Profile Spotlight', cost: 500, desc: 'Boost visibility by 200% for 24h' },
           { name: 'Incognito Mode', cost: 300, desc: 'Browse profiles without detection' },
           { name: 'Advanced Analytics', cost: 800, desc: 'See who viewed your profile and stats' },
           { name: 'Direct Message', cost: 100, desc: 'Bypass the match requirement once' }
         ].map(perk => (
            <div key={perk.name} className="flex justify-between items-start bg-neutral-900 border border-neutral-800 p-8 hover:border-white transition-all group rounded-2xl">
               <div>
                  <h4 className="font-bold text-white text-lg uppercase mb-2">{perk.name}</h4>
                  <p className="text-neutral-500 text-xs font-medium leading-relaxed max-w-[200px]">{perk.desc}</p>
               </div>
               <button className="bg-black text-white border border-neutral-700 text-xs font-bold uppercase px-4 py-2 group-hover:bg-white group-hover:text-black transition-colors rounded-lg">
                  {perk.cost} PTS
               </button>
            </div>
         ))}
      </div>
    </div>
  </div>
);

const GoldenView = () => (
  <div className="p-4 md:p-10 max-w-7xl mx-auto animate-in fade-in">
    <div className="text-center mb-20 relative pt-10">
       <h1 className="text-7xl md:text-[10rem] font-bold text-white uppercase tracking-tighter relative z-10 leading-[0.8] font-display">
         Be <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-600">Golden</span>
       </h1>
       <p className="text-xl text-neutral-400 mt-10 max-w-2xl mx-auto font-light">Unlock maximum potential. Zero limitations.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 max-w-6xl mx-auto">
      {/* Free Tier */}
       <div className="bg-neutral-900 border border-neutral-800 p-10 flex flex-col rounded-3xl">
          <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">Standard</h3>
          <div className="text-6xl font-bold text-neutral-500 my-10 font-display">$0 <span className="text-sm font-bold text-neutral-600 tracking-widest font-sans">/ MO</span></div>
          <ul className="space-y-6 mb-12 flex-1">
             <li className="flex items-center gap-4 text-sm text-neutral-400 font-medium"><Icons.Zap className="w-5 h-5" /> 5 Connections / Day</li>
             <li className="flex items-center gap-4 text-sm text-neutral-400 font-medium"><Icons.Zap className="w-5 h-5" /> Basic Search Filters</li>
             <li className="flex items-center gap-4 text-sm text-neutral-400 font-medium"><Icons.Zap className="w-5 h-5" /> Standard Visibility</li>
          </ul>
          <div className="w-full py-5 text-center border border-neutral-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl">Current Plan</div>
       </div>

       {/* Golden Tier */}
       <div className="bg-black border-2 border-amber-500 p-10 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_60px_rgba(245,158,11,0.15)] rounded-3xl">
          <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-bold px-6 py-2 uppercase tracking-widest rounded-bl-2xl rounded-tr-xl">Best Value</div>
          <h3 className="text-3xl font-bold text-amber-500 uppercase tracking-tighter flex items-center gap-3 font-display">Golden</h3>
          <div className="text-6xl font-bold text-white my-10 font-display">$29 <span className="text-sm font-bold text-neutral-500 tracking-widest font-sans">/ MO</span></div>
          <ul className="space-y-6 mb-12 flex-1">
             <li className="flex items-center gap-4 text-sm text-white font-bold"><Icons.Star className="w-5 h-5 text-amber-500" /> Unlimited Connections</li>
             <li className="flex items-center gap-4 text-sm text-white font-bold"><Icons.Star className="w-5 h-5 text-amber-500" /> Advanced Filters (Time, Vibe)</li>
             <li className="flex items-center gap-4 text-sm text-white font-bold"><Icons.Star className="w-5 h-5 text-amber-500" /> Priority Listing & Badge</li>
             <li className="flex items-center gap-4 text-sm text-white font-bold"><Icons.Star className="w-5 h-5 text-amber-500" /> See Who Viewed You</li>
          </ul>
          <button className="w-full py-6 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm uppercase tracking-widest transition-all rounded-xl shadow-lg shadow-amber-500/20">Upgrade Now</button>
       </div>

        {/* Corporate Tier */}
       <div className="bg-neutral-900 border border-neutral-800 p-10 flex flex-col opacity-60 hover:opacity-100 transition-opacity rounded-3xl">
          <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">Enterprise</h3>
          <div className="text-6xl font-bold text-white my-10 font-display">$99 <span className="text-sm font-bold text-neutral-500 tracking-widest font-sans">/ MO</span></div>
          <ul className="space-y-6 mb-12 flex-1">
             <li className="flex items-center gap-4 text-sm text-neutral-300 font-medium"><Icons.Zap className="w-5 h-5" /> Everything in Golden</li>
             <li className="flex items-center gap-4 text-sm text-neutral-300 font-medium"><Icons.Zap className="w-5 h-5" /> Corporate Events Access</li>
             <li className="flex items-center gap-4 text-sm text-neutral-300 font-medium"><Icons.Zap className="w-5 h-5" /> Dedicated Account Manager</li>
          </ul>
          <button className="w-full py-6 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all rounded-xl">Contact Sales</button>
       </div>
    </div>
  </div>
);

const UserDetailsView = ({ selectedUser, setView }: { selectedUser: User | null, setView: (v: ViewState) => void }) => {
  if (!selectedUser) return null;
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20">
      <button onClick={() => setView(ViewState.DISCOVERY)} className="mb-10 flex items-center gap-2 text-neutral-400 hover:text-white font-bold transition-colors bg-transparent border-b border-neutral-800 hover:border-white pb-1 px-0 text-xs uppercase tracking-widest">
        &lt; Back to Feed
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Col: Photo & Main Info */}
        <div className="lg:col-span-5 space-y-8">
          <div className="p-2 bg-gradient-to-br from-neutral-800 to-black rounded-3xl border border-neutral-800 shadow-2xl">
             <div className="aspect-[3/4] overflow-hidden relative rounded-2xl">
               <img src={selectedUser.avatar} className="w-full h-full object-cover grayscale" />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
               <div className="absolute bottom-8 left-8 text-white">
                  <h1 className="text-6xl font-bold uppercase tracking-tighter leading-none font-display">{selectedUser.name}</h1>
                  <p className="text-lg font-medium text-red-500 flex items-center gap-2 mt-2 uppercase tracking-wide">
                     {selectedUser.occupation}
                  </p>
               </div>
               <div className="absolute top-4 right-4 bg-white text-black px-3 py-1 text-sm font-bold uppercase rounded-lg">
                 {selectedUser.rating} Rating
               </div>
             </div>
             
             <div className="p-6 flex gap-4">
                <button className="flex-1 py-5 bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-all text-sm rounded-xl shadow-lg shadow-red-600/20">
                   Connect
                </button>
                <button className="flex-1 py-5 bg-black border border-neutral-700 text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all text-sm rounded-xl">
                   Share
                </button>
             </div>
          </div>
          
          <div className="border border-neutral-800 p-8 bg-black rounded-3xl">
             <h4 className="text-white font-bold uppercase tracking-widest mb-6 border-b border-neutral-800 pb-4">Specs</h4>
             <div className="space-y-5 font-medium text-sm text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase text-xs font-bold">Gender</span>
                  <span className="text-white uppercase">{selectedUser.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase text-xs font-bold">Personality</span>
                  <span className="text-white uppercase">{selectedUser.personality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase text-xs font-bold">Location</span>
                  <span className="text-white uppercase">{selectedUser.location.city}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Col: Details & Booking */}
        <div className="lg:col-span-7 space-y-8">
           <div className="border border-neutral-800 p-10 bg-neutral-900 rounded-3xl">
              <h3 className="font-bold text-4xl text-white mb-6 uppercase tracking-tight font-display">
                 Bio
              </h3>
              <p className="text-xl text-neutral-300 leading-relaxed font-light">"{selectedUser.bio}"</p>
              
              <div className="mt-12">
                 <h4 className="font-bold text-neutral-500 text-xs uppercase tracking-widest mb-4">Interests</h4>
                 <div className="flex flex-wrap gap-3">
                    {selectedUser.interests.map(i => (
                      <span key={i} className="px-6 py-3 bg-black text-white text-xs font-bold uppercase border border-neutral-700 hover:border-red-500 transition-colors rounded-full">
                        {i}
                      </span>
                    ))}
                 </div>
              </div>
           </div>

           <div className="border border-neutral-800 p-10 bg-black relative rounded-3xl overflow-hidden">
               <div className="mb-8 flex justify-between items-end">
                 <div>
                    <h2 className="text-5xl font-bold text-white uppercase tracking-tight mb-2 font-display">Schedule</h2>
                    <p className="text-neutral-500 font-medium text-lg">Propose a meeting time.</p>
                 </div>
                 <div className="text-right hidden sm:block">
                    <div className="text-xs text-neutral-500 uppercase font-bold tracking-widest mb-1">Availability</div>
                    <div className="text-red-500 font-bold uppercase">{selectedUser.preferredTime}</div>
                 </div>
               </div>
               
               <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
                  <Calendar 
                      events={[{ date: new Date(), title: 'BUSY', type: 'blocked' }]}
                      interactive={true}
                      onDateClick={(d) => alert(`Meeting requested with ${selectedUser.name}`)}
                   />
               </div>
               
               <div className="mt-8 flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-neutral-500">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-red-900/40 border border-red-500 rounded-full"></div>
                     <span>Busy</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-neutral-800 border border-neutral-600 rounded-full"></div>
                     <span>Available</span>
                  </div>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const MyProfileView = ({ currentUser, handleUpdateProfile, handleAiBio }: any) => (
  <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
    <h1 className="text-6xl font-bold text-white mb-10 uppercase tracking-tighter font-display">Edit Profile</h1>
    
    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
      <div className="md:col-span-5 space-y-8">
        <div className="bg-neutral-900 border border-neutral-800 p-8 text-center rounded-3xl">
           <div className="w-64 h-64 mx-auto border-2 border-dashed border-neutral-700 mb-8 relative group cursor-pointer bg-black rounded-full overflow-hidden">
              <img src={currentUser.avatar} className="w-full h-full object-cover grayscale opacity-50 group-hover:opacity-30 transition-all" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold bg-white text-black px-4 py-2 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors rounded-full">Upload</span>
              </div>
           </div>
           
           <div className="space-y-6 text-left">
             <div>
               <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Display Name</label>
               <input className="w-full p-4 bg-black border border-neutral-800 focus:border-red-600 text-white outline-none font-medium text-sm rounded-lg" value={currentUser.name} onChange={(e) => handleUpdateProfile({name: e.target.value})} />
             </div>
             <div>
               <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Occupation</label>
               <input className="w-full p-4 bg-black border border-neutral-800 focus:border-red-600 text-white outline-none font-medium text-sm rounded-lg" value={currentUser.occupation} onChange={(e) => handleUpdateProfile({occupation: e.target.value})} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Gender</label>
                   <select 
                     className="w-full p-4 bg-black border border-neutral-800 focus:border-red-600 text-white outline-none font-medium text-xs rounded-lg appearance-none"
                     value={currentUser.gender}
                     onChange={(e) => handleUpdateProfile({gender: e.target.value as Gender})}
                   >
                     {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Age</label>
                   <input type="number" className="w-full p-4 bg-black border border-neutral-800 focus:border-red-600 text-white outline-none font-medium text-sm rounded-lg" value={currentUser.age} onChange={(e) => handleUpdateProfile({age: parseInt(e.target.value) || 0})} />
                </div>
             </div>
           </div>
        </div>
      </div>

      <div className="md:col-span-7 space-y-8">
         <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-xl text-white uppercase tracking-tight font-display">Bio</h3>
             <button onClick={handleAiBio} className="flex items-center gap-2 text-xs bg-black text-white px-4 py-2 uppercase hover:bg-neutral-800 transition-colors font-bold border border-neutral-700 rounded-lg">
               <Icons.Sparkles className="w-3 h-3" /> AI Generate
             </button>
           </div>
           <textarea 
             className="w-full h-48 p-6 bg-black border border-neutral-800 focus:border-red-600 text-neutral-300 font-medium text-sm leading-relaxed resize-none transition-all outline-none rounded-xl"
             value={currentUser.bio}
             onChange={(e) => handleUpdateProfile({bio: e.target.value})}
           />
         </div>

         <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl">
            <h3 className="font-bold text-xl text-white mb-8 uppercase tracking-tight font-display">Settings</h3>
            <div className="space-y-8">
               <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Personality Type</label>
                  <div className="flex gap-4">
                    {[PersonalityType.INTROVERT, PersonalityType.EXTROVERT, PersonalityType.AMBIVERT].map(t => (
                      <button 
                        key={t}
                        onClick={() => handleUpdateProfile({personality: t})}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border transition-all rounded-lg ${currentUser.personality === t ? 'bg-white text-black border-white' : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-600'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Availability Window</label>
                   <div className="grid grid-cols-2 gap-4">
                     {Object.values(TimeOfDay).map(t => (
                       <button
                        key={t}
                        onClick={() => handleUpdateProfile({preferredTime: t})}
                        className={`py-4 px-6 text-xs font-bold uppercase border transition-all text-left rounded-lg ${currentUser.preferredTime === t ? 'bg-neutral-800 border-red-600 text-white' : 'bg-transparent border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}
                       >
                         {t}
                       </button>
                     ))}
                   </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  </div>
);

// --- APP COMPONENT ---

export default function App() {
  // Global App State
  const [authStep, setAuthStep] = useState<AuthStep>(AuthStep.LANDING);
  
  // Dashboard State
  const [view, setView] = useState<ViewState>(ViewState.DISCOVERY);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USER_TEMPLATE);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [filterAge, setFilterAge] = useState<string>('any');
  const [filterType, setFilterType] = useState<string>('any'); 
  const [filterTime, setFilterTime] = useState<string>('any');
  const [filterGender, setFilterGender] = useState<string>('any');
  
  // Interactions
  const [chatsOpen, setChatsOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  
  // --- DERIVED DATA ---
  const filteredUsers = MOCK_USERS.filter(u => {
    const matchesSearch = searchQuery === '' || 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.interests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAge = filterAge === 'any' ? true : 
      filterAge === '18-24' ? (u.age >= 18 && u.age <= 24) :
      filterAge === '25-34' ? (u.age >= 25 && u.age <= 34) :
      filterAge === '35-44' ? (u.age >= 35 && u.age <= 44) :
      filterAge === '45-54' ? (u.age >= 45 && u.age <= 54) :
      (u.age >= 55);

    const matchesType = filterType === 'any' ? true : u.personality === filterType;
    const matchesTime = filterTime === 'any' ? true : u.preferredTime === filterTime;
    const matchesGender = filterGender === 'any' ? true : u.gender === filterGender;

    return matchesSearch && matchesAge && matchesType && matchesTime && matchesGender;
  });

  // --- HANDLERS ---
  const handleNav = (v: ViewState) => {
    setView(v);
    window.scrollTo(0,0);
  };

  const handleOpenProfile = (user: User) => {
    setSelectedUser(user);
    setView(ViewState.USER_DETAILS);
  };

  const handleUpdateProfile = (updated: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...updated }));
  };

  const handleAiBio = async () => {
    const newBio = await generateSmartBio(currentUser.interests, currentUser.occupation, currentUser.personality);
    handleUpdateProfile({ bio: newBio });
  };

  // --- MAIN RENDER ---
  if (authStep === AuthStep.LANDING) return <LandingView setAuthStep={setAuthStep} />;
  
  if (authStep === AuthStep.SIGNUP) return (
    <SignupView 
      currentUser={currentUser} 
      handleUpdateProfile={handleUpdateProfile} 
      setAuthStep={setAuthStep} 
    />
  );
  
  if (authStep === AuthStep.PROFILE_SETUP) return (
    <ProfileSetupView 
      currentUser={currentUser} 
      handleUpdateProfile={handleUpdateProfile} 
      setAuthStep={setAuthStep}
      handleAiBio={handleAiBio}
    />
  );

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-red-600 selection:text-white overflow-x-hidden relative">
      <Background />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar 
          currentUser={currentUser} 
          view={view}
          handleNav={handleNav} 
          chatsOpen={chatsOpen} setChatsOpen={setChatsOpen}
          notifsOpen={notifsOpen} setNotifsOpen={setNotifsOpen}
        />
        
        <main className="flex-1 max-w-[1920px] mx-auto w-full pt-10 px-4 md:px-8">
          {view === ViewState.DISCOVERY && (
            <DiscoveryView 
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              filterAge={filterAge} setFilterAge={setFilterAge}
              filterType={filterType} setFilterType={setFilterType}
              filterTime={filterTime} setFilterTime={setFilterTime}
              filterGender={filterGender} setFilterGender={setFilterGender}
              filteredUsers={filteredUsers}
              handleOpenProfile={handleOpenProfile}
            />
          )}
          {view === ViewState.USER_DETAILS && (
            <UserDetailsView selectedUser={selectedUser} setView={setView} />
          )}
          {view === ViewState.PROFILE && (
            <MyProfileView 
              currentUser={currentUser} 
              handleUpdateProfile={handleUpdateProfile} 
              handleAiBio={handleAiBio} 
            />
          )}
          
          {view === ViewState.MEETINGS && <MeetingsView />}
          {view === ViewState.PERKS && <PerksView currentUser={currentUser} />}
          {view === ViewState.GOLDEN && <GoldenView />}
          {/* LIKES & SUBSCRIPTION placeholders can redirect to relevant views or stay simple */}
          {view === ViewState.LIKES && (
             <div className="p-10 text-center"><h1 className="text-4xl font-bold uppercase tracking-tighter font-display">Likes</h1><p className="text-neutral-500 font-medium mt-4">Coming soon.</p></div>
          )}
        </main>
      </div>

      {/* Mobile Nav Bottom - simplified for bold tech look */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 flex justify-around p-4 z-40">
           <button onClick={() => handleNav(ViewState.DISCOVERY)} className={view === ViewState.DISCOVERY ? 'text-red-500' : 'text-neutral-500'}><Icons.Search /></button>
           <button onClick={() => handleNav(ViewState.MEETINGS)} className={view === ViewState.MEETINGS ? 'text-red-500' : 'text-neutral-500'}><Icons.Calendar /></button>
           <button onClick={() => handleNav(ViewState.PERKS)} className={view === ViewState.PERKS ? 'text-red-500' : 'text-neutral-500'}><Icons.Star /></button>
           <button onClick={() => handleNav(ViewState.GOLDEN)} className={view === ViewState.GOLDEN ? 'text-amber-500' : 'text-neutral-500'}><Icons.Crown /></button>
      </div>
    </div>
  );
}
