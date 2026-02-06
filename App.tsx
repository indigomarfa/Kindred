import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Icons } from './components/Icons';
import { Calendar } from './components/Calendar';
import { 
  generateSmartBio, 
  getInterestSuggestions, 
  getRelatedInterests 
} from './services/geminiService';
import { 
  User, Meeting, ViewState, PersonalityType, TimeOfDay, AuthStep, Gender, SelfDefinition, Milestone, ConversationDepth, MeetingIntent 
} from './types';

// --- CONSTANTS ---

const accentRed = "#FF2A2A";
const accentGold = "#C5A059";
const accentSilver = "#949494";

const textPrimary = "#E6E6E6";
const textSecondary = "#B8B8B8";
const textMuted = "#9A9A9A";

const inputIdleBase = "bg-neutral-900/40 border border-neutral-800/50 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.02),0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-500";
const inputHoverBase = "hover:border-neutral-700 hover:shadow-[0_20px_50px_-20px_rgba(255,42,42,0.08),0_10px_15px_-3px_rgba(0,0,0,0.2)] hover:bg-neutral-900/60";
const inputFocusBase = "focus:border-neutral-500 focus:shadow-[inset_3px_0_0_0_#FF2A2A,0_25px_60px_-25px_rgba(255,42,42,0.15),0_15px_25px_-5px_rgba(0,0,0,0.3)] focus:bg-neutral-900/80";

const OCCUPATION_SUGGESTIONS = [
  "Software Engineer", "Digital Artist", "Data Scientist", "Architect", "Chef", 
  "UX Designer", "Product Manager", "Marketing Lead", "Musician", "Marine Biologist",
  "Photographer", "Entrepreneur", "Writer", "Psychologist", "Teacher"
];

const CITY_SUGGESTIONS = [
  "New York", "London", "Paris", "Berlin", "San Francisco", "Tokyo", "Sydney", 
  "Kyiv", "Toronto", "Dubai", "Mumbai", "Singapore", "Barcelona", "Mexico City"
];

const POPULAR_INTERESTS = [
  "Artificial Intelligence", "Stoicism", "Formula 1", "Cybersecurity", 
  "Minimalism", "Digital Art", "Cooking", "Photography", "Travel", "Gaming"
];

const SELF_DEFINITIONS: SelfDefinition[] = [
  'Pro', 'Fierce enthusiast', 'Fan', 'Learner', 'First-stepper'
];

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
  depth: ConversationDepth.THOUGHTFUL,
  intent: MeetingIntent.ONE_OFF,
  isGolden: false,
  hasCompletedOnboarding: false,
  milestones: [],
  availability: [],
  automation: { enabled: false, frequency: null }
};

const MOCK_USERS: User[] = [
  { id: '1', name: 'Sarah Chen', age: 26, gender: Gender.FEMALE, rating: 4.9, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=60', location: { country: 'USA', city: 'New York', lat: 40.71, lng: -74.00 }, occupation: 'Data Scientist', bio: 'F1 fanatic and data nerd. Lets talk race strategies over coffee.', interests: ['Formula 1', 'Data', 'Travel'], personality: PersonalityType.INTROVERT, preferredTime: TimeOfDay.EVENING, depth: ConversationDepth.DEEP, intent: MeetingIntent.OCCASIONAL, milestones: [] },
  { id: '2', name: 'Marcus Johnson', age: 31, gender: Gender.MALE, rating: 4.7, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60', location: { country: 'UK', city: 'London', lat: 51.50, lng: -0.12 }, occupation: 'Marketing Lead', bio: 'Extrovert seeking interesting conversations about global markets and vintage cars.', interests: ['Marketing', 'Formula 1', 'Stocks'], personality: PersonalityType.EXTROVERT, preferredTime: TimeOfDay.AFTERNOON, depth: ConversationDepth.LIGHT, intent: MeetingIntent.ONE_OFF, milestones: [] },
  { id: '3', name: 'Elena Popova', age: 24, gender: Gender.FEMALE, rating: 5.0, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=60', location: { country: 'Ukraine', city: 'Kyiv', lat: 50.45, lng: 30.52 }, occupation: 'Digital Artist', bio: 'Art is life. Seeking muse and good vibes. I love exploring galleries.', interests: ['Art', 'Museums', 'Wine'], personality: PersonalityType.INTROVERT, preferredTime: TimeOfDay.EVENING, depth: ConversationDepth.THOUGHTFUL, intent: MeetingIntent.FOLLOW_UP, milestones: [] },
  { id: '4', name: 'James Smith', age: 29, gender: Gender.MALE, rating: 4.8, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=60', location: { country: 'Australia', city: 'Melbourne', lat: -37.81, lng: 144.96 }, occupation: 'Robotics Engineer', bio: 'Building the future. Big fan of tech, sci-fi, and fast cars.', interests: ['Engineering', 'Robotics', 'Formula 1'], personality: PersonalityType.AMBIVERT, preferredTime: TimeOfDay.MORNING, depth: ConversationDepth.INTENSE, intent: MeetingIntent.ONE_OFF, milestones: [] }
];

const MOCK_REMINDERS = [
  { id: 'r1', user: MOCK_USERS[0], topic: 'How does data actually change the gut feeling of a race strategist?', time: 'Tomorrow' },
  { id: 'r2', user: MOCK_USERS[2], topic: 'Is human creativity just a complex algorithm we haven\'t mapped yet?', time: 'In 3 days' },
  { id: 'r3', user: MOCK_USERS[1], topic: 'Why do we still crave the tactile friction of vintage machinery?', time: 'This Saturday' }
];

const Background = ({ isAuth = false }: { isAuth?: boolean }) => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-[#0d0d0d] overflow-hidden">
    <div className="absolute inset-0">
      {!isAuth && (
        <div className="absolute inset-0 opacity-[0.03]" style={{ 
          backgroundImage: `linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)`, 
          backgroundSize: '80px 80px' 
        }}></div>
      )}
      <div className="absolute left-[5%] top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
      <div className="absolute right-[5%] top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
    </div>
  </div>
);

function StartJourney3DButton({ onClick }: { onClick?: () => void }) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const effectiveHovered = isHovered || isMobile;

  return (
    <button
      type="button"
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      onClick={onClick}
      style={{
        position: "relative",
        width: 320,
        height: 78,
        border: "none",
        padding: 0,
        background: "transparent",
        cursor: "pointer",
        outline: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 999,
          background:
            "linear-gradient(180deg, #5a5a5a 0%, #1a1a1a 45%, #080808 100%)",
          boxShadow: effectiveHovered
            ? `0 50px 110px -10px rgba(255,42,42,1.0), 
               0 25px 55px -5px rgba(255,42,42,0.7),
               0 0 70px 0px rgba(255,42,42,0.5), 
               0 25px 40px rgba(0,0,0,0.9), 
               inset 0 3px 0 rgba(255,255,255,0.25), 
               inset 0 -18px 24px rgba(0,0,0,0.9)`
            : `0 15px 30px rgba(0,0,0,0.6), 
               0 25px 40px rgba(0,0,0,0.8), 
               inset 0 2px 0 rgba(255,255,255,0.1), 
               inset 0 -18px 24px rgba(0,0,0,0.9)`,
          transition: "box-shadow 350ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      <span
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 10,
          height: 18,
          borderRadius: 999,
          background:
            "linear-gradient(180deg, #ff4b4b 0%, #e10000 55%, #a30000 100%)",
          boxShadow: effectiveHovered
            ? `0 0 45px rgba(255,42,42,0.7),
               0 10px 14px rgba(0,0,0,.45), 
               inset 0 2px 0 rgba(255,255,255,.35), 
               inset 0 -7px 10px rgba(0,0,0,.48)`
            : `0 10px 14px rgba(0,0,0,.45), 
               inset 0 2px 0 rgba(255,255,255,.22), 
               inset 0 -7px 10px rgba(0,0,0,.48)`,
          transition: "all 350ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      <span
        style={{
          position: "absolute",
          left: 10,
          right: 10,
          top: 10,
          height: 54,
          borderRadius: 999,
          background:
            "linear-gradient(180deg, #ffffff 0%, #f4f4f4 55%, #e6e6e6 100%)",
          boxShadow: isPressed 
            ? "0 4px 0 rgba(0,0,0,.30), inset 0 2px 0 rgba(255,255,255,.90), inset 0 -3px 0 rgba(0,0,0,.12)"
            : effectiveHovered 
              ? "0 14px 0 rgba(0,0,0,.35), inset 0 3px 0 rgba(255,255,255,1.0), inset 0 -3px 0 rgba(0,0,0,.12), 0 0 20px rgba(255,255,255,0.4)"
              : "0 11px 0 rgba(0,0,0,.30), inset 0 2px 0 rgba(255,255,255,.90), inset 0 -3px 0 rgba(0,0,0,.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transform: isPressed 
            ? (isMobile ? "translateY(4px)" : "translateY(7px)") 
            : (effectiveHovered ? "translateY(-2px)" : "translateY(0px)"),
          transition: "transform 150ms ease-out, box-shadow 150ms ease-out",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: "8%",
            right: "8%",
            top: "8%",
            height: "60%",
            borderRadius: 999,
            background:
              "linear-gradient(180deg, rgba(255,255,255,.95) 0%, rgba(255,255,255,.50) 55%, rgba(255,255,255,0) 100%)",
            transform: "skewX(-16deg)",
            opacity: effectiveHovered ? 1.0 : 0.92,
            transition: "opacity 300ms ease",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: "10%",
            right: "10%",
            top: 3,
            height: 2,
            borderRadius: 999,
            background: "rgba(255,255,255,.80)",
            opacity: effectiveHovered ? 1.0 : 0.65,
            transition: "opacity 300ms ease",
          }}
        />
        <span
          style={{
            position: "relative",
            fontWeight: 900,
            fontSize: 13,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#000",
            fontFamily: "'Outfit', sans-serif",
            textShadow: effectiveHovered ? "0 0 8px rgba(255,255,255,0.5)" : "none",
            transition: "text-shadow 300ms ease",
          }}
        >
          START JOURNEY
        </span>
      </span>
    </button>
  );
}

const CustomSelect = ({ 
  value, 
  options, 
  onChange, 
  placeholder, 
  label,
  height = "h-[64px]"
}: { 
  value: string; 
  options: string[]; 
  onChange: (val: any) => void; 
  placeholder: string; 
  label: string;
  height?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
  };

  return (
    <div className={`relative group ${isOpen ? 'z-[100]' : ''}`}>
      {label && <label className="block text-[10px] font-bold text-[#949494] uppercase tracking-widest mb-3 group-focus-within:text-white transition-colors">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-6 py-0 transition-all flex items-center justify-between outline-none font-bold ${height} text-left rounded-xl ${isOpen ? 'border-[#FF2A2A] shadow-[inset_2px_0_0_0_#FF2A2A,0_0_15px_rgba(255,42,42,0.1)] relative z-[101]' : `${inputIdleBase} ${inputHoverBase} focus:border-[#FF2A2A] focus:shadow-[inset_2px_0_0_0_#FF2A2A]`} ${!value ? 'text-[#7A7A7A]' : 'text-white'}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <Icons.Menu className={`w-3.5 h-3.5 transition-all duration-300 ${isOpen ? 'rotate-90 text-white' : 'text-[#949494]'} group-hover:text-white`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-[6px] animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="absolute top-[calc(100%+8px)] left-0 w-full z-[102] bg-[#141414] border border-white/10 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.65)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-[150ms] ease-out"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`w-full text-left p-4 text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 relative group/opt border-b border-white/[0.03] last:border-none ${value === opt ? 'bg-white/[0.04] text-white shadow-[inset_1px_0_0_rgba(255,255,255,0.05)]' : 'text-[#7A7A7A] hover:text-white hover:bg-white/[0.02]'}`}
              >
                {value === opt && (
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FF2A2A] shadow-[0_0_8px_rgba(255,42,42,0.4)]"></div>
                )}
                <span className="relative z-10">{opt}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const AutocompleteInput = ({ 
  value, 
  onChange, 
  suggestions, 
  placeholder, 
  label,
  onSelect,
  showCustomFallback = false,
  isLoading = false,
  localSuggestions = []
}: { 
  value: string; 
  onChange: (val: string) => void; 
  suggestions: string[]; 
  placeholder: string; 
  label: string;
  onSelect?: (val: string) => void;
  showCustomFallback?: boolean;
  isLoading?: boolean;
  localSuggestions?: string[];
}) => {
  const [show, setShow] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const combinedSuggestions = useMemo(() => {
    const unique = new Set([...localSuggestions, ...suggestions]);
    return Array.from(unique).slice(0, 10);
  }, [suggestions, localSuggestions]);

  const handleSelectInternal = useCallback((val: string) => {
    if (onSelect) {
      onSelect(val);
    } else {
      onChange(val);
    }
    setShow(false);
    if (onSelect) {
      inputRef.current?.focus();
    }
  }, [onSelect, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (show) {
      const totalItems = combinedSuggestions.length + (showCustomFallback && value.length > 0 ? 1 : 0);
      if (e.key === 'ArrowDown') {
        setHighlightedIndex(prev => (prev + 1) % totalItems);
      } else if (e.key === 'ArrowUp') {
        setHighlightedIndex(prev => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === 'Enter') {
        if (highlightedIndex < combinedSuggestions.length) {
          handleSelectInternal(combinedSuggestions[highlightedIndex]);
        } else if (showCustomFallback && value.length > 0) {
          handleSelectInternal(value);
        }
      } else if (e.key === 'Escape') {
        setShow(false);
      }
    }
  };

  const hasItemsToShow = (value.length > 0 || combinedSuggestions.length > 0);

  return (
    <div className={`relative group ${show && hasItemsToShow ? 'z-[100]' : ''}`}>
      {label && <label className="block text-[10px] font-bold text-[#949494] uppercase tracking-widest mb-3 group-focus-within:text-white transition-colors">{label}</label>}
      <div className="relative">
        <input 
          ref={inputRef}
          type="text"
          className={`w-full px-4 py-0 transition-all outline-none font-medium h-[56px] text-sm text-white placeholder-[#7A7A7A] ${inputIdleBase} ${inputHoverBase} ${inputFocusBase} rounded-xl`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShow(true)}
          onBlur={() => setTimeout(() => setShow(false), 200)}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {show && hasItemsToShow && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full z-[110] bg-[#141414] border border-white/10 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.65)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-[150ms] ease-out">
          {combinedSuggestions.map((s, idx) => (
            <button 
              key={s}
              type="button"
              onMouseEnter={() => setHighlightedIndex(idx)}
              onMouseDown={(e) => {
                e.preventDefault(); 
                handleSelectInternal(s);
              }}
              className={`w-full text-left p-4 text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 relative border-b border-white/5 last:border-none ${highlightedIndex === idx ? 'bg-white/10 text-white shadow-[inset_1px_0_0_0_rgba(255,255,255,0.05)]' : 'text-[#949494] hover:bg-white/5 hover:text-white'}`}
            >
              {highlightedIndex === idx && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FF2A2A] shadow-[0_0_8px_rgba(255,42,42,0.4)]"></div>
              )}
              <span className="relative z-10">{s}</span>
            </button>
          ))}
          {showCustomFallback && value.length > 0 && !combinedSuggestions.some(f => f.toLowerCase() === value.toLowerCase()) && (
            <button 
              type="button"
              onMouseEnter={() => setHighlightedIndex(combinedSuggestions.length)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectInternal(value);
              }}
              className={`w-full text-left p-4 text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 relative border-b border-white/5 last:border-none ${highlightedIndex === combinedSuggestions.length ? 'bg-white/10 text-white' : 'text-[#949494] hover:bg-white/5 hover:text-white'}`}
            >
              {highlightedIndex === combinedSuggestions.length && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FF2A2A] shadow-[0_0_8px_rgba(255,42,42,0.4)]"></div>
              )}
              <Icons.Sparkles className="w-4 h-4 text-amber-500/80" />
              Add custom: "{value}"
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const Navbar = ({ currentUser, view, handleNav, setChatsOpen, setNotifsOpen }: any) => (
  <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-neutral-800 h-24 px-6 md:px-12 flex items-center justify-between transition-all">
    <div className="flex items-center gap-5 cursor-pointer group" onClick={() => handleNav(ViewState.DISCOVERY)}>
      <div className="w-10 h-10 bg-neutral-100 flex items-center justify-center text-black font-bold text-xl clip-diagonal group-hover:bg-white transition-all transform group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]">K</div>
      <span className="text-xl md:text-2xl font-bold tracking-tight text-white group-hover:text-white transition-all font-display uppercase">KIND<span style={{ color: accentRed }}>RED.</span></span>
    </div>

    <div className="hidden md:flex items-center gap-8">
       {[
         { id: ViewState.DISCOVERY, label: 'Unlock' },
         { id: ViewState.MEETINGS, label: 'Meetings' },
         { id: ViewState.GOLDEN, label: 'Golden', special: true },
       ].map(item => (
         <button
           key={item.id}
           onClick={() => handleNav(item.id)}
           className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all py-1 border-b-2 hover:border-white ${
             view === item.id 
               ? 'border-white text-white' 
               : item.special 
                 ? 'border-transparent text-amber-500 hover:text-amber-300 hover:scale-105 transform' 
                 : 'border-transparent text-neutral-500 hover:text-white'
           }`}
         >
           {item.label}
         </button>
       ))}
    </div>

    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <button onClick={() => setChatsOpen(prev => !prev)} className="hidden md:block p-2 text-neutral-500 hover:text-white hover:scale-110 transition-all">
          <Icons.MessageCircle className="w-5 h-5" />
        </button>
        <button onClick={() => setNotifsOpen(prev => !prev)} className="p-2 text-neutral-500 hover:text-white hover:scale-110 transition-all">
          <Icons.Bell className="w-5 h-5" />
        </button>
      </div>
      <button onClick={() => handleNav(ViewState.PROFILE)} className="w-12 h-12 rounded-full p-0.5 bg-neutral-800 hover:bg-neutral-600 transition-all group overflow-hidden hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]">
         <img src={currentUser.avatar} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-black" />
      </button>
    </div>
  </nav>
);

const GoldenView = () => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-24 animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-10">
        <h1 className="text-6xl md:text-8xl font-bold uppercase tracking-tighter font-display leading-[0.9]">
          BE <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#EEDD8C] via-[#C5A059] to-[#8C6F3D]">GOLDEN.</span>
        </h1>
        <p className="text-[#E6E6E6] text-lg md:text-xl font-medium tracking-wide">
          Be visible where intention matters.
        </p>
      </section>

      {/* Access Tiers Stack */}
      <div className="space-y-12">
        {/* Silver Access Card */}
        <div className="group relative bg-[#0D0D0D] border border-[#BFC3C7]/20 rounded-[2.5rem] p-10 md:p-14 overflow-hidden shadow-2xl hover:bg-neutral-900/40 transition-all duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-bold uppercase tracking-tight text-[#E6E6E6]">BE SILVER</h2>
                <div className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#BFC3C7]/40 bg-gradient-to-br from-[#BFC3C7] to-[#8F9499] text-black shadow-inner">
                  Silver Badge
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-[#E6E6E6] tracking-tighter">$12</span>
                <span className="text-sm font-medium text-[#B8B8B8] tracking-wide">/ month</span>
                <span className="text-[10px] font-black text-[#9A9A9A] uppercase tracking-[0.2em] ml-4">$144 / year</span>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            {[
              "Unlimited meeting bookings",
              "Smart matching (AI recommendations)",
              "Advanced search filters (expertise level, depth)",
              "Reduced or no ads"
            ].map(f => (
              <div key={f} className="flex items-center gap-4 text-[#B8B8B8] font-medium text-base">
                <div className="w-1.5 h-1.5 rounded-full bg-[#BFC3C7]"></div>
                {f}
              </div>
            ))}
          </div>

          <button className="w-full py-6 bg-transparent border-2 border-[#BFC3C7]/30 text-[#E6E6E6] font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl hover:bg-[#BFC3C7] hover:text-black hover:border-transparent transition-all duration-300 active:scale-[0.98]">
            Go Silver
          </button>
        </div>

        {/* Golden Access Card */}
        <div className="group relative bg-neutral-950 border border-[#C9A24D]/30 rounded-[3rem] p-10 md:p-14 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] hover:shadow-[#C9A24D]/10 transition-all duration-700">
          {/* Subtle light sweep animation */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#C9A24D]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[2000ms] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-bold uppercase tracking-tight text-[#EEDD8C]">BE GOLDEN</h2>
                <div className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#F2D27A]/50 bg-gradient-to-br from-[#6E5318] via-[#F2D27A] to-[#A57C2B] text-black shadow-lg">
                  ✦ Golden Badge
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-[#E6E6E6] tracking-tighter">$24</span>
                <span className="text-sm font-medium text-[#B8B8B8] tracking-wide">/ month</span>
                <span className="text-[10px] font-black text-[#C9A24D]/60 uppercase tracking-[0.2em] ml-4">$288 / year</span>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-[11px] font-black text-[#C9A24D] uppercase tracking-[0.3em] mb-8">Everything in Silver, plus:</p>
            <div className="space-y-6 mb-12">
              {[
                "Priority visibility in discovery",
                "Calendar sync (Google & Apple)",
                "Personalized insights: interests & profile stats",
                "Golden profile badge for instant trust"
              ].map(f => (
                <div key={f} className="flex items-center gap-4 text-[#E6E6E6] font-medium text-base">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#EEDD8C] to-[#C9A24D] shadow-[0_0_10px_rgba(201,162,77,0.5)]"></div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <button className="relative z-10 w-full py-6 bg-gradient-to-br from-[#6E5318] via-[#C9A24D] to-[#A57C2B] text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl shadow-xl hover:brightness-110 hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98]">
            Go Golden
          </button>
        </div>
      </div>

      {/* Transactional Section */}
      <section className="text-center py-16 space-y-6 border-t border-neutral-900/50">
        <h2 className="text-2xl font-bold text-[#E6E6E6] uppercase tracking-tight">Not ready for a subscription?</h2>
        <div className="max-w-lg mx-auto space-y-6">
          <p className="text-[#B8B8B8] text-base font-medium leading-relaxed">
            You can book 2–3 meetings per month for free.<br />
            After that, pay per individual meeting.
          </p>
          <div className="pt-4">
            <span className="text-2xl font-bold text-[#E6E6E6] tracking-tighter">$1.99 – $4.99</span>
            <span className="block text-[10px] font-black text-[#9A9A9A] uppercase tracking-[0.4em] mt-2">Per connection</span>
          </div>
        </div>
      </section>

      {/* Soft Reassurance Footer */}
      <footer className="text-center pb-20 pt-10">
        <p className="text-[10px] font-black text-neutral-800 uppercase tracking-[0.6em]">Kindred Membership Access</p>
      </footer>
    </div>
  );
};

const AvailabilitySetupView = ({ onComplete }: { onComplete: () => void }) => {
  // Pre-select 1-2 slots to silently teach the interaction as requested.
  const initialSelection = useMemo(() => {
    const today = new Date();
    const tue = new Date(today);
    tue.setDate(tue.getDate() + (2 - tue.getDay() + 7) % 7);
    const thu = new Date(today);
    thu.setDate(thu.getDate() + (4 - thu.getDay() + 7) % 7);
    
    return new Set<string>([
      `${tue.toDateString()}-14:00`,
      `${thu.toDateString()}-18:00`
    ]);
  }, []);

  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(initialSelection);
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [automationFreq, setAutomationFreq] = useState<'WEEKLY' | 'MONTHLY' | null>(null);

  const next14Days = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const timeSlots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

  const toggleSlot = (date: Date, slot: string) => {
    const key = `${date.toDateString()}-${slot}`;
    const next = new Set(selectedSlots);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedSlots(next);
  };

  return (
    <div className="min-h-screen bg-black py-16 px-6 relative overflow-hidden flex flex-col items-center">
      <Background isAuth />
      <div className="max-w-3xl w-full z-10 space-y-12 animate-in fade-in duration-1000">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-tight leading-tight font-display">
            LET OTHERS KNOW WHEN YOU ARE READY TO MEET UP
          </h1>
          <p className="text-[#B8B8B8] text-base font-medium">
            Your availability helps us suggest better matches.
          </p>
        </header>

        {/* Contained Card for Grid */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[520px]">
          {/* Header Row (Time Labels) */}
          <div className="grid grid-cols-[100px_1fr] border-b border-white/5 bg-neutral-900/40">
             <div className="p-5 border-r border-white/5 flex items-center justify-center">
               <Icons.Calendar className="w-4 h-4 text-neutral-500" />
             </div>
             <div className="grid grid-cols-7">
                {timeSlots.map(t => (
                  <div key={t} className="py-5 text-[9px] font-black text-neutral-500 text-center uppercase tracking-widest">{t.split(':')[0]}</div>
                ))}
             </div>
          </div>

          {/* Scrollable Matrix */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {next14Days.map((date) => {
              const isToday = new Date().toDateString() === date.toDateString();
              return (
                <div key={date.toISOString()} className="grid grid-cols-[100px_1fr] border-b border-white/5 last:border-none group">
                  <div className={`p-5 border-r border-white/5 flex flex-col justify-center items-center transition-colors ${isToday ? 'bg-white/[0.03]' : 'bg-transparent'}`}>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#9A9A9A] mb-1">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className={`text-lg font-bold ${isToday ? 'text-white' : 'text-[#B8B8B8]'}`}>
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-px bg-white/5">
                    {timeSlots.map(slot => {
                      const isSelected = selectedSlots.has(`${date.toDateString()}-${slot}`);
                      return (
                        <button
                          key={slot}
                          onClick={() => toggleSlot(date, slot)}
                          className={`aspect-square transition-all duration-300 border-none outline-none relative group/cell cursor-pointer ${
                            isSelected 
                              ? 'bg-neutral-200/90 border-l-2 border-l-[#FF2A2A]' 
                              : 'bg-black hover:bg-neutral-800'
                          }`}
                        >
                          {isSelected && (
                             <div className="absolute inset-0 shadow-[inset_0_0_12px_rgba(255,255,255,0.2)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Automation Section */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between p-8 bg-[#0D0D0D] border border-white/10 rounded-[2rem] shadow-xl">
            <p className="text-[13px] font-bold text-[#E6E6E6] uppercase tracking-widest">
              UPDATE THESE AVAILABILITY SLOTS AUTOMATICALLY
            </p>
            <button 
              onClick={() => setAutomationEnabled(!automationEnabled)}
              className={`w-14 h-7 rounded-full relative transition-all duration-300 ${automationEnabled ? 'bg-neutral-600' : 'bg-neutral-900'}`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 ${automationEnabled ? 'left-8 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'left-1'}`} />
            </button>
          </div>

          {automationEnabled && (
            <div className="flex bg-[#0D0D0D] border border-white/10 p-1.5 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-400">
              <button 
                onClick={() => setAutomationFreq('WEEKLY')}
                className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 ${automationFreq === 'WEEKLY' ? 'bg-white/10 text-white shadow-inner' : 'text-[#9A9A9A] hover:text-white'}`}
              >
                WEEKLY
              </button>
              <button 
                onClick={() => setAutomationFreq('MONTHLY')}
                className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 ${automationFreq === 'MONTHLY' ? 'bg-white/10 text-white shadow-inner' : 'text-[#9A9A9A] hover:text-white'}`}
              >
                MONTHLY
              </button>
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col gap-8 pt-8 items-center w-full">
          <button 
            onClick={onComplete}
            className="w-full max-w-sm py-6 bg-[#E6E6E6] text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl shadow-2xl hover:bg-white hover:shadow-white/5 active:scale-[0.98] transition-all duration-300"
          >
            SAVE AVAILABILITY
          </button>
          <button 
            onClick={onComplete}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-[#9A9A9A] hover:text-white transition-colors duration-300"
          >
            SKIP THIS STEP FOR NOW
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileSetupView = ({
  currentUser,
  handleUpdateProfile,
  setAuthStep,
  handleAiBio,
  isEditMode = false,
  isBackgrounded = false,
  onClose
}: {
  currentUser: User,
  handleUpdateProfile: (u: Partial<User>) => void,
  setAuthStep: (s: AuthStep) => void,
  handleAiBio: () => Promise<void>,
  isEditMode?: boolean,
  isBackgrounded?: boolean,
  onClose?: () => void
}) => {
  const [step, setStep] = useState(isEditMode ? 7 : 1);
  const [isInternalEditing, setIsInternalEditing] = useState(false);
  const [interestInput, setInterestInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [triedToSubmit, setTriedToSubmit] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Availability inline state
  const [isAvailabilityExpanded, setIsAvailabilityExpanded] = useState(false);
  const [tempAvailability, setTempAvailability] = useState<Set<string>>(new Set(currentUser.availability || []));
  const [tempAutomation, setTempAutomation] = useState(currentUser.automation || { enabled: false, frequency: null });

  const totalSteps = 7;
  const isComplete = currentUser.hasCompletedOnboarding;

  useEffect(() => {
    if (interestInput.length < 2) {
      setAiSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      const results = await getInterestSuggestions(interestInput);
      setAiSuggestions(results);
      setIsSuggesting(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [interestInput]);

  const handleInterestSelect = useCallback((val: string) => {
    const trimmed = val.trim();
    if (trimmed && !currentUser.interests.includes(trimmed)) {
      handleUpdateProfile({ interests: [...currentUser.interests, trimmed] });
    }
    setInterestInput('');
    setAiSuggestions([]);
  }, [currentUser.interests, handleUpdateProfile]);

  const toggleInterest = useCallback((item: string) => {
    if (currentUser.interests.includes(item)) {
      handleUpdateProfile({ interests: currentUser.interests.filter(i => i !== item) });
    } else {
      handleUpdateProfile({ interests: [...currentUser.interests, item] });
    }
  }, [currentUser.interests, handleUpdateProfile]);

  const handleAutoBioInternal = async () => {
    setIsGeneratingBio(true);
    await handleAiBio();
    setIsGeneratingBio(false);
  };

  const nextStep = () => {
    setTriedToSubmit(true);
    if (step === 4 && currentUser.interests.length < 2) return;
    if (step < totalSteps) setStep(s => s + 1);
    else if (step === totalSteps) finishOnboarding();
    setTriedToSubmit(false);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    if (isEditMode && step !== 7) {
        setStep(7);
    } else if (step > 1) {
        setStep(s => s - 1);
    }
    window.scrollTo(0, 0);
  };

  const handleClose = useCallback(() => {
    if (isInternalEditing) {
      setShowDiscardConfirm(true);
    } else {
      onClose?.();
    }
  }, [isInternalEditing, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditMode && step === 7) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, step, handleClose]);

  const finishOnboarding = () => {
    let label = 'Explorer';
    if (currentUser.personality === PersonalityType.INTROVERT) label = 'Thinker';
    if (currentUser.personality === PersonalityType.EXTROVERT) label = 'Connector';
    if (currentUser.interests.length > 5) label = 'Seeker';

    const hasArrival = currentUser.milestones.some(m => m.id === 'arrival');
    const newMilestones: Milestone[] = hasArrival ? currentUser.milestones : [
      ...currentUser.milestones,
      {
        id: 'arrival',
        label: 'The Arrival',
        description: 'You joined Kindred and crafted your first member card.',
        date: new Date()
      }
    ];

    handleUpdateProfile({ 
      hasCompletedOnboarding: true,
      milestones: newMilestones,
      identityLabel: label
    });
    // Immediately trigger availability screen post-onboarding
    setAuthStep(AuthStep.AVAILABILITY);
    setIsInternalEditing(false);
  };

  const renderProgress = () => {
    const labels = ["WARMING UP", "YOUR CONTEXT", "Energy", "Passions", "Depth", "Your voice", "Final Shape"];
    return (
      <div className="mb-10 relative px-2">
        <div className="flex items-center gap-1.5 h-1 w-full bg-neutral-900 rounded-full overflow-hidden">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`h-full flex-1 journey-line-segment ${i + 1 <= step ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'bg-transparent'}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-4">
          <span className="text-[10px] font-black text-[#949494] uppercase tracking-widest noted-feedback">{labels[step-1]}</span>
          <span className="text-[9px] font-bold text-[#949494] uppercase tracking-widest">{step === totalSteps ? "Taking shape" : "Moving forward"}</span>
        </div>
      </div>
    );
  };

  const StepActionButtons = ({ onNext, onPrev, nextLabel = "Keep going", skip = false }: { onNext: () => void, onPrev?: () => void, nextLabel?: string, skip?: boolean }) => (
    <div className="pt-10 flex justify-between items-center">
      {onPrev ? (
        <button type="button" onClick={onPrev} className="text-[#7A7A7A] hover:text-white text-xs font-bold uppercase tracking-widest transition-all hover:scale-10 transform">Back</button>
      ) : <div />}
      <div className="flex gap-8 items-center">
        {skip && !isEditMode && <button type="button" onClick={onNext} className="text-[#7A7A7A] hover:text-white text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 transform">Skip</button>}
        <button 
          type="button" 
          onClick={onNext} 
          className="px-14 py-5 bg-white text-black font-black uppercase tracking-[0.15em] hover:bg-white hover:shadow-[0_20px_50px_rgba(255,42,42,0.25)] transition-all text-[11px] rounded-xl shadow-[0_25px_45px_-10px_rgba(0,0,0,0.45),0_10px_20px_-5px_rgba(0,0,0,0.2)] active:scale-95 cta-lean"
        >
          {isEditMode && step !== 7 ? "Refine" : nextLabel}
        </button>
      </div>
    </div>
  );

  const localFilteredInterests = useMemo(() => {
    if (interestInput.length < 2) return [];
    return POPULAR_INTERESTS.filter(i => 
      i.toLowerCase().includes(interestInput.toLowerCase()) && 
      !currentUser.interests.includes(i)
    );
  }, [interestInput, currentUser.interests]);

  const toggleAvailabilitySlot = (date: Date, slot: string) => {
    const key = `${date.toDateString()}-${slot}`;
    const next = new Set(tempAvailability);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setTempAvailability(next);
  };

  const hasAvailabilityChanges = useMemo(() => {
    const currentSet = new Set(currentUser.availability || []);
    if (currentSet.size !== tempAvailability.size) return true;
    for (const item of Array.from(tempAvailability)) {
      if (!currentSet.has(item)) return true;
    }
    if (currentUser.automation?.enabled !== tempAutomation.enabled) return true;
    if (currentUser.automation?.frequency !== tempAutomation.frequency) return true;
    return false;
  }, [currentUser.availability, currentUser.automation, tempAvailability, tempAutomation]);

  const availabilitySummary = useMemo(() => {
    if (!currentUser.availability || currentUser.availability.length === 0) return "Not set yet";
    const total = currentUser.availability.length;
    // Basic logic for slots per week estimate
    const perWeek = Math.max(1, Math.floor(total / 2)); 
    return `${perWeek}–${perWeek + 2} slots per week · ${currentUser.preferredTime}`;
  }, [currentUser.availability, currentUser.preferredTime]);

  const next14Days = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const timeSlots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

  return (
    <div className="min-h-screen py-8 px-4 flex justify-center items-start overflow-y-auto text-white relative">
      <Background isAuth />
       <div 
        className={`max-w-3xl w-full bg-neutral-800/40 backdrop-blur-3xl border border-white/10 p-6 md:p-10 relative z-10 rounded-[3rem] transition-all duration-700 animate-in fade-in zoom-in ${isBackgrounded ? 'shadow-lg translate-y-2 opacity-85 blur-[1.5px]' : 'shadow-2xl'}`} 
        style={{ 
          boxShadow: isBackgrounded ? '0 15px 30px rgba(0,0,0,0.5)' : '0 40px 100px rgba(0,0,0,0.4)', 
          outline: '1px solid rgba(255,255,255,0.06)' 
        }}
       >
         
         <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-900 pb-8 gap-4 relative">
           <div className="flex flex-col items-start">
             <h2 className="text-4xl font-bold text-white uppercase tracking-tighter font-display">
                {isComplete ? "Your member card" : "It gets personal"}
             </h2>
             <p className="text-[10px] font-black uppercase tracking-widest text-[#949494] mt-1.5 opacity-100">
                {isComplete ? "This is you." : "Building your member card"}
             </p>
             {isEditMode && step === 7 && (
                <button 
                  onClick={() => setIsInternalEditing(!isInternalEditing)}
                  className={`mt-5 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${isInternalEditing ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'}`}
                >
                  {isInternalEditing ? <Icons.X className="w-3.5 h-3.5" /> : <Icons.Zap className="w-3.5 h-3.5" />}
                  {isInternalEditing ? 'Done' : 'Edit'}
                </button>
             )}
           </div>
           {isEditMode && step === 7 && (
             <button 
              onClick={handleClose}
              className="p-2 -mr-2 text-neutral-200 hover:text-white transition-all hover:scale-110 active:scale-95 flex items-center gap-2 group absolute right-0 top-0 md:relative"
             >
               <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline opacity-0 group-hover:opacity-100 transition-opacity">Exit</span>
               <Icons.X className="w-5 h-5" />
             </button>
           )}
         </div>

         {!isEditMode && step < totalSteps && renderProgress()}

         {step === 1 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="space-y-2 narrative-beat">
               <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">Who you are</h3>
               <p className="text-[#949494] text-sm font-medium leading-snug max-w-md">We’ll take this step by step.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3 group">
                 <label className="block text-[10px] font-bold text-[#949494] uppercase tracking-widest">Age</label>
                 <input 
                    type="number" 
                    min="18" 
                    className={`w-full px-6 py-0 transition-all outline-none rounded-xl h-[64px] text-lg font-bold text-white text-left placeholder-[#7A7A7A] ${inputIdleBase} ${inputHoverBase} ${inputFocusBase}`}
                    placeholder="e.g. 28"
                    value={currentUser.age || ''} 
                    onChange={(e) => handleUpdateProfile({age: parseInt(e.target.value) || 0})} 
                  />
               </div>
               <div className="space-y-3">
                 <CustomSelect 
                    label="Gender"
                    placeholder="Select gender"
                    value={currentUser.gender || ""}
                    options={Object.values(Gender)}
                    onChange={(val) => handleUpdateProfile({gender: val as Gender})}
                 />
               </div>
             </div>
             <StepActionButtons onNext={isEditMode ? () => setStep(7) : nextStep} nextLabel="Go deeper" skip={!isEditMode} />
           </div>
         )}

         {step === 2 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="space-y-2 narrative-beat">
               <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">In the world</h3>
               <p className="text-[#949494] text-sm font-medium leading-snug max-w-md">How you spend your time and energy gives us context.</p>
             </div>
             <div className="space-y-6">
               <AutocompleteInput 
                  label="Occupation" 
                  placeholder="e.g. Product Manager" 
                  value={currentUser.occupation} 
                  onChange={(val) => handleUpdateProfile({occupation: val})} 
                  suggestions={OCCUPATION_SUGGESTIONS} 
               />
               <AutocompleteInput 
                  label="Current City" 
                  placeholder="e.g. London" 
                  value={currentUser.location.city} 
                  onChange={(val) => handleUpdateProfile({location: {...currentUser.location, city: val, country: 'Global'}})} 
                  suggestions={CITY_SUGGESTIONS} 
               />
             </div>
             <StepActionButtons onNext={isEditMode ? () => setStep(7) : nextStep} onPrev={prevStep} nextLabel="Go deeper" />
           </div>
         )}

         {step === 3 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="space-y-2 narrative-beat">
               <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">Social Energy</h3>
               <p className="text-[#949494] text-sm font-medium leading-snug max-w-md">Choose what actually fits your life rhythm.</p>
             </div>
             <div className="space-y-8">
               <div className="space-y-4">
                  <label className="block text-[10px] font-black text-[#949494] uppercase tracking-widest">Social Battery</label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.values(PersonalityType).map(t => (
                      <button key={t} type="button" onClick={() => handleUpdateProfile({personality: t})} className={`py-5 px-2 border-none text-[10px] font-black uppercase tracking-widest transition-all rounded-xl h-[64px] ${currentUser.personality === t ? 'bg-white text-black shadow-[0_15px_35px_-8px_rgba(255,42,42,0.35)]' : 'bg-neutral-800/50 text-neutral-600 hover:bg-neutral-700/50 hover:text-white hover:scale-[1.02] transform'}`}>{t}</button>
                    ))}
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="block text-[10px] font-black text-[#949494] uppercase tracking-widest">General Availability</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.values(TimeOfDay).map(t => (
                      <button key={t} type="button" onClick={() => handleUpdateProfile({preferredTime: t})} className={`py-3 px-6 text-[10px] font-black uppercase border-none transition-all text-left rounded-xl h-[64px] flex items-center ${currentUser.preferredTime === t ? 'bg-white text-black shadow-[0_15px_35px_-8px_rgba(255,42,42,0.35)]' : 'bg-neutral-800/50 text-neutral-500 hover:bg-neutral-700/50 hover:text-white hover:scale-[1.02] transform'}`}>{t}</button>
                    ))}
                  </div>
               </div>
             </div>
             <StepActionButtons onNext={isEditMode ? () => setStep(7) : nextStep} onPrev={prevStep} nextLabel="Go deeper" />
           </div>
         )}

         {step === 4 && (
           <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="space-y-2 narrative-beat">
               <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">Passions</h3>
               <p className="text-[#949494] text-sm font-medium leading-snug max-w-md italic">Pick what reflects you best. Choose at least 2.</p>
             </div>
             <div className="space-y-7">
                <AutocompleteInput 
                  label=""
                  placeholder="Type an interest or discover one below..."
                  value={interestInput}
                  onChange={setInterestInput}
                  suggestions={aiSuggestions}
                  onSelect={handleInterestSelect}
                  showCustomFallback={true}
                  isLoading={isSuggesting}
                  localSuggestions={localFilteredInterests}
                />
                
                <div className="bg-[#212121] rounded-[2.5rem] p-9 border border-white/5 transition-all duration-500 shadow-[inset_0_2px_12px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-wrap gap-2.5">
                     {POPULAR_INTERESTS.slice(0, 10).map((item, idx) => {
                       const isSelected = currentUser.interests.includes(item);
                       return (
                        <button 
                          key={item}
                          type="button"
                          onClick={() => toggleInterest(item)}
                          className={`
                            px-6 py-3.5 transition-all duration-200 text-[10px] font-bold tracking-widest uppercase rounded-2xl 
                            active:scale-95 flex items-center gap-2.5 border
                            ${isSelected 
                              ? 'bg-[#333] border-neutral-500 text-white shadow-[0_8px_20px_rgba(0,0,0,0.4)] translate-y-[-1px]' 
                              : 'bg-black/40 border-neutral-800/60 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800 hover:text-white'}
                          `}
                        >
                          {isSelected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF2A2A] shadow-[0_0_6px_rgba(255,42,42,0.8)]"></div>
                          )}
                          {item}
                        </button>
                       );
                     })}
                  </div>
               </div>

               {currentUser.interests.length > 0 && (
                  <div className="pt-4 space-y-4">
                    <label className="block text-[9px] font-black text-neutral-700 uppercase tracking-[0.3em] ml-1">Your Selection</label>
                    <div className="flex flex-wrap gap-2.5">
                      {currentUser.interests.map(tag => (
                        <span key={tag} className="flex items-center gap-2.5 px-5 py-2.5 bg-neutral-900 border border-neutral-800 text-white text-[10px] font-black uppercase tracking-widest rounded-full animate-in zoom-in duration-300 shadow-md">
                          <div className="w-1 h-1 rounded-full bg-[#FF2A2A]"></div>
                          {tag}
                          <button type="button" onClick={() => toggleInterest(tag)} className="text-neutral-600 hover:text-white transition-colors ml-0.5"><Icons.X className="w-3 h-3"/></button>
                        </span>
                      ))}
                    </div>
                  </div>
               )}
             </div>
             <StepActionButtons onNext={isEditMode ? () => setStep(7) : nextStep} onPrev={prevStep} nextLabel="Keep going" />
           </div>
         )}

         {step === 5 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="space-y-2 narrative-beat">
               <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">Depth</h3>
               <p className="text-[#949494] text-sm font-medium leading-snug max-w-md">Everyone starts somewhere.</p>
             </div>
             <div className="space-y-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-[#949494] uppercase tracking-widest">How long have you been into this?</label>
                  <div className="grid grid-cols-2 gap-4 max-w-sm">
                    <input 
                      type="number" 
                      min="1" 
                      className={`w-full px-6 py-0 transition-all outline-none rounded-xl h-[64px] text-lg font-bold text-white placeholder-[#7A7A7A] ${inputIdleBase} ${inputHoverBase} ${inputFocusBase}`}
                      placeholder="e.g. 2"
                      value={currentUser.interestDuration?.value || ''}
                      onChange={(e) => handleUpdateProfile({ 
                        interestDuration: { 
                          value: parseInt(e.target.value) || 0, 
                          unit: currentUser.interestDuration?.unit || 'Years' 
                        } 
                      })}
                    />
                    <CustomSelect 
                       label=""
                       placeholder="Unit"
                       value={currentUser.interestDuration?.unit?.toUpperCase() || ""}
                       options={["WEEKS", "MONTHS", "YEARS"]}
                       onChange={(val) => handleUpdateProfile({ 
                         interestDuration: { 
                           value: currentUser.interestDuration?.value || 0, 
                           unit: val.charAt(0) + val.slice(1).toLowerCase() as any
                         } 
                       })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-[#949494] uppercase tracking-widest">How do you see yourself?</label>
                  <div className="flex flex-wrap gap-2">
                    {SELF_DEFINITIONS.map(def => (
                      <button
                        key={def}
                        type="button"
                        onClick={() => handleUpdateProfile({ selfDefinition: def })}
                        className={`px-5 py-4 border-none text-[9px] font-black uppercase tracking-widest transition-all rounded-xl h-[64px] ${currentUser.selfDefinition === def ? 'bg-white text-black shadow-[0_15px_35px_-8px_rgba(255,42,42,0.35)]' : 'bg-neutral-800/50 text-neutral-600 hover:bg-neutral-700/50 hover:text-white hover:scale-[1.02] transform'}`}
                      >
                        {def}
                      </button>
                    ))}
                  </div>
                </div>
             </div>
             <StepActionButtons onNext={isEditMode ? () => setStep(7) : nextStep} onPrev={prevStep} nextLabel="Keep going" />
           </div>
         )}

         {step === 6 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="space-y-2 narrative-beat">
               <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">Your voice</h3>
               <p className="text-[#949494] text-sm font-medium leading-snug max-w-md">Let others drive the same wave</p>
             </div>
             <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] text-neutral-400 font-bold tracking-wide italic leading-snug">
                    A few sentences are enough — you can always change this later.
                  </p>
                  <textarea 
                    className={`w-full h-48 p-10 transition-all outline-none resize-none text-white text-lg font-normal leading-[1.8] rounded-3xl placeholder-[#8A8A8A] bg-[#1e1e1e]/80 border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.6)] focus:bg-[#212121] focus:border-neutral-500 focus:shadow-[inset_4px_0_0_0_#FF2A2A,0_0_20px_rgba(255,42,42,0.1)]`}
                    placeholder="What makes a conversation meaningful to you?" 
                    value={currentUser.bio} 
                    onChange={(e) => handleUpdateProfile({bio: e.target.value})} 
                  />
                </div>
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={handleAutoBioInternal} 
                    disabled={isGeneratingBio} 
                    className="flex items-center gap-2 text-[9px] text-neutral-400 transition-all font-black uppercase tracking-[0.2em] py-[7px] px-[11px] rounded-md opacity-80 hover:opacity-100 cursor-pointer"
                  >
                    <Icons.Sparkles className="w-3.5 h-3.5" />
                    {isGeneratingBio ? 'Refining...' : 'Refine with AI'}
                  </button>
                </div>
             </div>
             <StepActionButtons onNext={isEditMode ? () => setStep(7) : nextStep} onPrev={prevStep} nextLabel="Final Shape" skip={!isEditMode} />
           </div>
         )}

         {step === 7 && (
           <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
             {isInternalEditing && (
                <div className="space-y-2 narrative-beat">
                  <p className="text-[#949494] text-sm font-medium leading-snug max-w-md italic opacity-70">
                    Choose a block to refine.
                  </p>
                </div>
             )}
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
                <button 
                  onClick={() => isInternalEditing && setStep(1)}
                  className={`bg-black/30 border border-neutral-800/80 p-5 rounded-3xl relative text-left transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 group shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${isInternalEditing ? 'hover:border-white/40 hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <label className="text-[9px] font-black text-[#949494] uppercase tracking-[0.2em] block">Basics</label>
                    {isInternalEditing && <Icons.Zap className="w-3 h-3 text-[#FF2A2A] opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                  <p className="font-bold text-white text-base tracking-tight">{currentUser.age || '?'} yrs · {currentUser.gender || 'Other'}</p>
                </button>

                <button 
                  onClick={() => isInternalEditing && setStep(2)}
                  className={`bg-black/30 border border-neutral-800/80 p-5 rounded-3xl relative text-left transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 group shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] delay-75 ${isInternalEditing ? 'hover:border-white/40 hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <label className="text-[9px] font-black text-[#949494] uppercase tracking-[0.2em] block">Location & Work</label>
                    {isInternalEditing && <Icons.Zap className="w-3 h-3 text-[#FF2A2A] opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                  <p className="font-bold text-white text-base tracking-tight truncate">
                    {currentUser.occupation || 'Wanderer'} <span className="text-neutral-500 font-medium lowercase">in</span> {currentUser.location.city || 'Secret'}
                  </p>
                </button>

                <button 
                  onClick={() => isInternalEditing && setStep(4)}
                  className={`bg-black/30 border border-neutral-800/80 p-6 rounded-[2.5rem] relative text-left transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 group col-span-1 md:col-span-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] delay-150 ${isInternalEditing ? 'hover:border-white/40 hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] block">Passions</label>
                    {isInternalEditing && <span className="text-[9px] font-black text-[#FF2A2A] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Add/Remove</span>}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {currentUser.interests.length > 0 ? currentUser.interests.map(i => (
                      <span key={i} className="text-[10px] px-4 py-1.5 bg-neutral-900 border border-white/10 rounded-full font-black uppercase tracking-widest text-white flex items-center gap-2 group/chip transition-all hover:bg-neutral-800 hover:border-white/20">
                        {i}
                        {isInternalEditing && <Icons.X className="w-3 h-3 text-neutral-500 hover:text-white" />}
                      </span>
                    )) : <p className="text-neutral-600 italic text-sm">No passions listed yet.</p>}
                  </div>
                </button>

                {/* AVAILABILITY COLLAPSIBLE SECTION */}
                <div className="col-span-1 md:col-span-2 space-y-4">
                  <button 
                    onClick={() => setIsAvailabilityExpanded(!isAvailabilityExpanded)}
                    className="w-full bg-black/30 border border-neutral-800/80 p-6 rounded-[2.5rem] relative text-left transition-all duration-300 group shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:border-white/20"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <label className="text-[9px] font-black text-[#949494] uppercase tracking-[0.2em] block">Availability</label>
                      <Icons.Menu className={`w-3.5 h-3.5 transition-all duration-500 text-neutral-500 ${isAvailabilityExpanded ? 'rotate-180 text-white' : ''}`} />
                    </div>
                    {!isAvailabilityExpanded && (
                      <p className="font-bold text-white text-base tracking-tight">{availabilitySummary}</p>
                    )}
                  </button>

                  {isAvailabilityExpanded && (
                    <div className="bg-[#0D0D0D] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500">
                      <div className="p-8 space-y-10">
                        {/* Inline Availability Grid */}
                        <div className="bg-black border border-white/5 rounded-[2rem] overflow-hidden flex flex-col h-[400px]">
                           <div className="grid grid-cols-[80px_1fr] border-b border-white/5 bg-neutral-900/40">
                              <div className="p-4 border-r border-white/5 flex items-center justify-center">
                                <Icons.Calendar className="w-4 h-4 text-neutral-500" />
                              </div>
                              <div className="grid grid-cols-7">
                                 {timeSlots.map(t => (
                                   <div key={t} className="py-4 text-[8px] font-black text-neutral-500 text-center uppercase tracking-widest">{t.split(':')[0]}</div>
                                 ))}
                              </div>
                           </div>
                           <div className="flex-1 overflow-y-auto scrollbar-hide">
                             {next14Days.map((date) => {
                               const isToday = new Date().toDateString() === date.toDateString();
                               return (
                                 <div key={date.toISOString()} className="grid grid-cols-[80px_1fr] border-b border-white/5 last:border-none">
                                   <div className={`p-4 border-r border-white/5 flex flex-col justify-center items-center ${isToday ? 'bg-white/[0.02]' : ''}`}>
                                     <span className="text-[8px] font-black uppercase tracking-widest text-[#9A9A9A] mb-1">
                                       {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                     </span>
                                     <span className={`text-md font-bold ${isToday ? 'text-white' : 'text-[#B8B8B8]'}`}>
                                       {date.getDate()}
                                     </span>
                                   </div>
                                   <div className="grid grid-cols-7 gap-px bg-white/5">
                                     {timeSlots.map(slot => {
                                       const isSelected = tempAvailability.has(`${date.toDateString()}-${slot}`);
                                       return (
                                         <button
                                           key={slot}
                                           onClick={() => toggleAvailabilitySlot(date, slot)}
                                           className={`aspect-square transition-all duration-300 border-none outline-none relative group/cell cursor-pointer ${
                                             isSelected ? 'bg-neutral-200/90 border-l-2 border-l-[#FF2A2A]' : 'bg-black hover:bg-neutral-800'
                                           }`}
                                         >
                                           {isSelected && <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]" />}
                                         </button>
                                       );
                                     })}
                                   </div>
                                 </div>
                               );
                             })}
                           </div>
                        </div>

                        {/* Inline Automation Toggle */}
                        <div className="space-y-6">
                           <div className="flex items-center justify-between p-6 bg-black border border-white/5 rounded-2xl">
                             <p className="text-[11px] font-bold text-[#E6E6E6] uppercase tracking-widest">Update these availability slots automatically</p>
                             <button 
                               onClick={() => setTempAutomation({...tempAutomation, enabled: !tempAutomation.enabled})}
                               className={`w-12 h-6 rounded-full relative transition-all duration-300 ${tempAutomation.enabled ? 'bg-neutral-600' : 'bg-neutral-900'}`}
                             >
                               <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${tempAutomation.enabled ? 'left-7' : 'left-1'}`} />
                             </button>
                           </div>
                           {tempAutomation.enabled && (
                             <div className="flex bg-black border border-white/5 p-1 rounded-xl animate-in fade-in duration-300">
                               <button onClick={() => setTempAutomation({...tempAutomation, frequency: 'WEEKLY'})} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${tempAutomation.frequency === 'WEEKLY' ? 'bg-white/10 text-white shadow-inner' : 'text-[#9A9A9A]'}`}>WEEKLY</button>
                               <button onClick={() => setTempAutomation({...tempAutomation, frequency: 'MONTHLY'})} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${tempAutomation.frequency === 'MONTHLY' ? 'bg-white/10 text-white shadow-inner' : 'text-[#9A9A9A]'}`}>MONTHLY</button>
                             </div>
                           )}
                        </div>

                        {/* Actions for rollout */}
                        <div className="flex gap-4 items-center">
                          <button 
                            disabled={!hasAvailabilityChanges}
                            onClick={() => {
                              handleUpdateProfile({ 
                                availability: Array.from(tempAvailability),
                                automation: tempAutomation
                              });
                              setIsAvailabilityExpanded(false);
                            }}
                            className={`flex-1 py-4 font-black uppercase tracking-[0.2em] text-[10px] rounded-xl transition-all ${hasAvailabilityChanges ? 'bg-[#E6E6E6] text-black shadow-xl hover:bg-white active:scale-95' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'}`}
                          >
                            Update Availability
                          </button>
                          <button 
                            onClick={() => {
                              setTempAvailability(new Set(currentUser.availability || []));
                              setTempAutomation(currentUser.automation || { enabled: false, frequency: null });
                              setIsAvailabilityExpanded(false);
                            }}
                            className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => isInternalEditing && setStep(6)}
                  className={`bg-black/30 border border-neutral-800/80 p-6 rounded-[2.5rem] relative text-left transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 group col-span-1 md:col-span-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] delay-200 ${isInternalEditing ? 'hover:border-white/40 hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'}`}
                >
                   <div className="flex justify-between items-start mb-4">
                    <label className="text-[9px] font-black text-[#949494] uppercase tracking-widest block">Your Voice</label>
                    {isInternalEditing && <Icons.Zap className="w-3 h-3 text-[#FF2A2A] opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                  <p className="text-neutral-400 font-medium italic leading-relaxed text-base line-clamp-3">
                    "{currentUser.bio || "No bio yet. Let people know what you're about."}"
                  </p>
                </button>
             </div>

             <div className="pt-8 border-t border-neutral-900 flex justify-between items-center">
                <div className="flex items-center">
                  {isInternalEditing && (
                    <button 
                      type="button" 
                      onClick={() => setIsInternalEditing(false)} 
                      className="text-[#7A7A7A] hover:text-white text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                
                {isInternalEditing ? (
                   <button 
                    type="button" 
                    onClick={finishOnboarding} 
                    className="px-14 py-5 bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-white hover:shadow-[0_20px_50px_rgba(255,42,42,0.25)] transition-all text-[11px] rounded-2xl"
                  >
                    Save changes
                  </button>
                ) : (
                  !isEditMode && (
                    <button 
                      type="button" 
                      onClick={finishOnboarding} 
                      className="px-16 py-6 bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-white hover:shadow-[0_20px_50px_rgba(255,42,42,0.25)] transition-all text-[11px] rounded-2xl"
                    >
                      Jump
                    </button>
                  )
                )}
             </div>
           </div>
         )}
         </div>

         {showDiscardConfirm && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDiscardConfirm(false)}></div>
             <div className="bg-neutral-900 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative z-10 max-w-sm w-full animate-in zoom-in-95 duration-200">
               <h4 className="text-xl font-bold uppercase tracking-tight text-white mb-4">Discard changes?</h4>
               <p className="text-neutral-400 text-sm font-medium mb-8 leading-relaxed">Your edits will be lost. Return to discovery?</p>
               <div className="flex flex-col gap-3">
                 <button 
                   onClick={() => {
                     setShowDiscardConfirm(false);
                     setIsInternalEditing(false);
                     onClose?.();
                   }}
                   className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-neutral-200 transition-all"
                 >
                   Discard
                 </button>
                 <button 
                   onClick={() => setShowDiscardConfirm(false)}
                   className="w-full py-4 bg-neutral-800 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-neutral-700 transition-all"
                 >
                   Keep editing
                 </button>
               </div>
             </div>
           </div>
         )}
    </div>
  );
};

const LandingView = ({ setAuthStep }: { setAuthStep: (step: AuthStep) => void }) => (
  <div className="min-h-screen flex flex-col justify-center items-center p-6 text-center">
    <Background isAuth />
    <div className="relative z-10">
      <h1 className="text-7xl md:text-9xl font-bold text-white tracking-tighter mb-16 font-display drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] uppercase">KIND<span style={{ color: accentRed }}>RED.</span></h1>
      <p className="text-xl text-[#7A7A7A] font-light mb-16 tracking-wide animate-in fade-in duration-1000">Where shared interests meet shared time.</p>
      
      <div className="relative inline-block animate-in zoom-in duration-700 delay-300">
        <StartJourney3DButton onClick={() => setAuthStep(AuthStep.SIGNUP)} />
      </div>
    </div>
  </div>
);

const SignupView = ({ currentUser, handleUpdateProfile, setAuthStep }: any) => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState(currentUser.name || '');

  const isEnabled = useMemo(() => {
    if (isLogin) return email.length > 3;
    return email.length > 3 && name.length > 1;
  }, [isLogin, email, name]);

  return (
    <div className="min-h-screen flex flex-col items-center pt-[12vh] p-4 relative overflow-hidden">
      <Background isAuth />
      <div className="max-w-lg w-full relative z-10">
        <div className="w-full bg-neutral-900/80 backdrop-blur-xl border border-white/15 p-14 pb-12 rounded-[3rem] shadow-2xl relative z-[1]">
          <div className="relative flex bg-black/60 p-1.5 rounded-2xl mb-10">
             <button onClick={() => setIsLogin(false)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest relative z-10 transition-all ${!isLogin ? 'text-black bg-white rounded-xl' : 'text-[#7A7A7A]'}`}>NEW HERE</button>
             <button onClick={() => setIsLogin(true)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest relative z-10 transition-all ${isLogin ? 'text-black bg-white rounded-xl' : 'text-[#7A7A7A]'}`}>WELCOME BACK</button>
          </div>

          <form className="space-y-8" onSubmit={(e) => { 
            e.preventDefault(); 
            if (!isEnabled) return;
            handleUpdateProfile({ name });
            setAuthStep(isLogin ? AuthStep.COMPLETED : AuthStep.PROFILE_SETUP); 
          }}>
            {!isLogin && (
              <div className="space-y-2 group">
                <label className="block text-[9px] font-black text-[#7A7A7A] uppercase tracking-widest ml-1">NAME</label>
                <input required type="text" className={`w-full p-5 transition-all outline-none rounded-xl font-bold text-white placeholder-[#7A7A7A] ${inputIdleBase} ${inputHoverBase} ${inputFocusBase}`} placeholder="e.g. Alex Rivera" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className="space-y-2 group">
              <label className="block text-[9px] font-black text-[#7A7A7A] uppercase tracking-widest ml-1">EMAIL</label>
              <input required type="email" className={`w-full p-5 transition-all outline-none rounded-xl font-bold text-white placeholder-[#7A7A7A] ${inputIdleBase} ${inputHoverBase} ${inputFocusBase}`} placeholder="alex@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <button type="submit" disabled={!isEnabled} className={`w-full py-6 font-black uppercase tracking-[0.2em] transition-all duration-[300ms] rounded-xl text-[11px] ${isEnabled ? 'bg-[#F5F5F5] text-black shadow-lg' : 'bg-neutral-800/80 text-[#7A7A7A]'}`}>
              {isLogin ? 'GO ON' : 'GET STARTED'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const FilterChip: React.FC<{ 
  label: string; 
  active: boolean; 
  onClick: () => void;
}> = ({ 
  label, 
  active, 
  onClick 
}) => (
  <button
    onClick={onClick}
    className={`
      px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border relative cursor-pointer
      ${active 
        ? 'bg-[#f5f5f5] text-black border-transparent shadow-md' 
        : 'bg-[#2a2a2a] border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white hover:-translate-y-0.5'
      }
    `}
  >
    <div className="flex items-center gap-2">
      {label}
      {active && <div className="w-1 h-1 rounded-full bg-[#FF2A2A]"></div>}
    </div>
  </button>
);

const App = () => {
  const [view, setView] = useState<ViewState>(ViewState.DISCOVERY);
  const [authStep, setAuthStep] = useState<AuthStep>(AuthStep.LANDING);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USER_TEMPLATE);
  const [chatsOpen, setChatsOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filterPersonality, setFilterPersonality] = useState<PersonalityType | 'ANY'>('ANY');
  const [filterTime, setFilterTime] = useState<TimeOfDay | 'ANY'>('ANY');
  const [filterDepth, setFilterDepth] = useState<ConversationDepth | 'ANY'>('ANY');
  const [filterIntent, setFilterIntent] = useState<MeetingIntent | 'ANY'>('ANY');
  const [filterAge, setFilterAge] = useState('Any');
  const [filterLocation, setFilterLocation] = useState('');

  const [meetingFilterDate, setMeetingFilterDate] = useState<Date | null>(null);

  const handleUpdateProfile = (updates: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  const handleAiBio = async () => {
    const bio = await generateSmartBio(
      currentUser.interests,
      currentUser.occupation,
      currentUser.personality
    );
    handleUpdateProfile({ bio });
  };

  const handleNav = (newView: ViewState) => {
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilterPersonality('ANY');
    setFilterTime('ANY');
    setFilterDepth('ANY');
    setFilterIntent('ANY');
    setFilterAge('Any');
    setFilterLocation('');
  };

  const isFiltersActive = useMemo(() => 
    filterPersonality !== 'ANY' || 
    filterTime !== 'ANY' || 
    filterDepth !== 'ANY' || 
    filterIntent !== 'ANY' ||
    filterAge !== 'Any' ||
    filterLocation !== ''
  , [filterPersonality, filterTime, filterDepth, filterIntent, filterAge, filterLocation]);

  const filteredUsers = useMemo(() => {
    return MOCK_USERS.filter(user => {
      const matchesSearch = !searchQuery || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.occupation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.interests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesPersonality = filterPersonality === 'ANY' || user.personality === filterPersonality;
      const matchesTime = filterTime === 'ANY' || user.preferredTime === filterTime;
      const matchesDepth = filterDepth === 'ANY' || user.depth === filterDepth;
      const matchesIntent = filterIntent === 'ANY' || user.intent === filterIntent;

      return matchesSearch && matchesPersonality && matchesTime && matchesDepth && matchesIntent;
    });
  }, [searchQuery, filterPersonality, filterTime, filterDepth, filterIntent]);

  const reminderEvents = useMemo(() => {
    const today = new Date();
    
    const getTomorrow = () => {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      return d;
    };
    const getIn3Days = () => {
      const d = new Date(today);
      d.setDate(d.getDate() + 3);
      return d;
    };
    const getThisSaturday = () => {
      const d = new Date(today);
      const day = d.getDay();
      const diff = (6 - day + 7) % 7;
      d.setDate(d.getDate() + (diff === 0 ? 7 : diff)); 
      return d;
    };

    return [
      { id: 'r1', date: getTomorrow(), reminder: MOCK_REMINDERS[0] },
      { id: 'r2', date: getIn3Days(), reminder: MOCK_REMINDERS[1] },
      { id: 'r3', date: getThisSaturday(), reminder: MOCK_REMINDERS[2] },
    ];
  }, []);

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  const filteredReminders = useMemo(() => {
    if (!meetingFilterDate) return reminderEvents;
    return reminderEvents.filter(re => isSameDay(re.date, meetingFilterDate));
  }, [reminderEvents, meetingFilterDate]);

  const calendarItems = useMemo(() => reminderEvents.map(re => ({
    date: re.date,
    title: re.reminder.topic,
    type: 'meeting' as const,
    avatar: re.reminder.user.avatar,
    userName: re.reminder.user.name
  })), [reminderEvents]);

  const isPopUpOpen = useMemo(() => chatsOpen || notifsOpen, [chatsOpen, notifsOpen]);

  if (authStep === AuthStep.LANDING) return <LandingView setAuthStep={setAuthStep} />;
  if (authStep === AuthStep.SIGNUP) return <SignupView currentUser={currentUser} handleUpdateProfile={handleUpdateProfile} setAuthStep={setAuthStep} />;
  if (authStep === AuthStep.PROFILE_SETUP) return <ProfileSetupView currentUser={currentUser} handleUpdateProfile={handleUpdateProfile} setAuthStep={setAuthStep} handleAiBio={handleAiBio} />;
  if (authStep === AuthStep.AVAILABILITY) return <AvailabilitySetupView onComplete={() => setAuthStep(AuthStep.COMPLETED)} />;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neutral-800/30">
      <Background />
      <Navbar currentUser={currentUser} view={view} handleNav={handleNav} setChatsOpen={setChatsOpen} setNotifsOpen={setNotifsOpen} />
      
      <main className={`relative z-10 px-6 md:px-12 py-10 max-w-7xl mx-auto transition-all duration-700 ${isPopUpOpen ? 'pointer-events-none select-none pop-up-active' : ''}`}>
        {view === ViewState.DISCOVERY && (
          <div className="space-y-16 animate-in fade-in duration-700">
            <div>
              <h1 className="text-6xl md:text-8xl font-bold text-white uppercase tracking-tighter font-display">Unlock. You.</h1>
            </div>

            <div className="max-w-6xl mx-auto w-full group relative py-12">
              <div className="flex items-center gap-3 w-full">
                <div className="relative flex-1 min-w-0 group/search transition-all duration-100 hover:-translate-y-0.5">
                  <div className={`absolute left-0 top-0 bottom-0 w-[4px] bg-[#FF2A2A] rounded-l-[8px] z-20 transition-all duration-100 group-focus-within/search:w-[6px]`}></div>
                  <input
                    type="text"
                    placeholder="Who do you want to talk to?"
                    className="
                      w-full h-[56px] rounded-[8px] pl-6 md:pl-10 pr-4 text-base md:text-lg font-bold text-white 
                      placeholder:text-neutral-500 placeholder:font-black outline-none transition-all duration-100
                      bg-[#121212] border border-white/35
                      hover:border-white/50
                      focus:bg-[#141414] focus:border-white/70 focus:text-white
                      caret-[#FF2A2A]
                      truncate
                    "
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={() => !showFilters && setShowFilters(true)}
                  />
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`
                    flex-shrink-0 h-[56px] px-5 md:px-8 rounded-[8px] 
                    text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-100 
                    bg-[#1a1a1a] border border-white/10 text-neutral-400
                    hover:border-[#FF2A2A] hover:text-white hover:bg-[#222]
                    active:scale-95
                    ${showFilters ? 'border-[#FF2A2A] text-white bg-neutral-800' : ''}
                  `}
                >
                  FILTERS
                </button>
              </div>

              <div className={`transition-all duration-500 ease-in-out ${showFilters ? 'max-h-[2000px] opacity-100 mt-6 overflow-visible' : 'max-h-0 opacity-0 pointer-events-none overflow-hidden'}`}>
                <div className="p-12 bg-[#141414] border border-white/10 rounded-[3rem] space-y-8 relative shadow-[0_16px_50px_rgba(0,0,0,0.65)]">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-8">
                    <div></div>
                    {isFiltersActive && (
                      <button onClick={clearFilters} className="text-[11px] font-black text-neutral-500 hover:text-white uppercase tracking-widest transition-all cursor-pointer underline underline-offset-8 decoration-neutral-800 hover:decoration-white">Reset all</button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-12">
                    <div className="space-y-6">
                      <label className="text-[16px] font-bold text-white tracking-tight block">What energy do you seek?</label>
                      <div className="flex flex-wrap gap-3">
                        {(['ANY', ...Object.values(PersonalityType)] as const).map((t) => (
                          <FilterChip 
                            key={t} 
                            label={t} 
                            active={filterPersonality === t} 
                            onClick={() => setFilterPersonality(t)} 
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <label className="text-[16px] font-bold text-white tracking-tight block">How do you want it to feel?</label>
                      <div className="flex flex-wrap gap-3">
                        {(['ANY', ...Object.values(ConversationDepth)] as const).map((t) => (
                          <FilterChip 
                            key={t} 
                            label={t} 
                            active={filterDepth === t} 
                            onClick={() => setFilterDepth(t)} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-12 border-t border-neutral-800/50 grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-12">
                    <div className="space-y-6">
                      <label className="text-[16px] font-bold text-white tracking-tight block">When are you most present?</label>
                      <div className="flex flex-wrap gap-3">
                        {(['ANY', ...Object.values(TimeOfDay)] as const).map((t) => (
                          <FilterChip 
                            key={t} 
                            label={t} 
                            active={filterTime === t} 
                            onClick={() => setFilterTime(t)} 
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <label className="text-[16px] font-bold text-white tracking-tight block">How do you want it to continue?</label>
                      <div className="flex flex-wrap gap-3">
                        {(['ANY', ...Object.values(MeetingIntent)] as const).map((t) => (
                          <FilterChip 
                            key={t} 
                            label={t} 
                            active={filterIntent === t} 
                            onClick={() => setFilterIntent(t)} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-800/50 grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-12">
                    <div className="space-y-6">
                      <label className="text-[16px] font-bold text-white tracking-tight block">Age</label>
                      <div className="flex flex-wrap gap-3">
                        {['Any', '18–24', '25–34', '35–44', '45+'].map((range) => (
                          <FilterChip 
                            key={range} 
                            label={range} 
                            active={filterAge === range} 
                            onClick={() => setFilterAge(range)} 
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-6">
                      <label className="text-[16px] font-bold text-white tracking-tight block">Location</label>
                      <AutocompleteInput 
                        label=""
                        placeholder="e.g. San Francisco, London"
                        value={filterLocation}
                        onChange={setFilterLocation}
                        suggestions={CITY_SUGGESTIONS}
                        onSelect={setFilterLocation}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32 transition-opacity duration-1000 ${!searchQuery && !showFilters ? 'opacity-70 grayscale-[0.4]' : 'opacity-100 grayscale-0'}`}>
              {filteredUsers.length > 0 ? filteredUsers.map(user => (
                <div key={user.id} className="bg-neutral-900/40 border border-neutral-800/80 rounded-[2.5rem] overflow-hidden transition-all duration-700 group cursor-pointer shadow-2xl hover:bg-neutral-800/60 hover:-translate-y-[2px] transform">
                  <div className="h-72 relative overflow-hidden">
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-full h-full object-cover transition-[transform,filter] duration-[2000ms] group-hover:scale-110 group-hover:brightness-[1.12] group-hover:saturate-[1.18] group-hover:contrast-[1.05]" 
                      style={{ transition: 'transform 2000ms ease-in-out, filter 200ms ease-out' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 transition-opacity duration-200 group-hover:opacity-65"></div>
                    <div className="absolute bottom-6 left-6">
                      <h3 className="text-3xl font-bold uppercase tracking-tight">{user.name}, {user.age}</h3>
                      <p className="text-[11px] text-neutral-400 font-black uppercase tracking-[0.25em] mt-1">{user.occupation}</p>
                    </div>
                  </div>
                  <div className="p-8 space-y-6">
                    <p className="text-[15px] text-neutral-400 line-clamp-2 italic font-medium leading-relaxed">"{user.bio}"</p>
                    <div className="flex flex-wrap gap-2.5">
                      {user.interests.map(i => (
                        <span key={i} className="text-[10px] px-4 py-1.5 bg-neutral-950 border border-neutral-800 rounded-full font-bold uppercase tracking-widest text-neutral-500 transition-colors group-hover:text-neutral-300 group-hover:border-neutral-700">{i}</span>
                      ))}
                    </div>
                    <button className="hidden md:block w-full py-5 bg-white text-black font-black uppercase tracking-[0.25em] text-[11px] rounded-2xl hover:shadow-2xl hover:scale-[1.02] transform transition-all active:scale-95">Click</button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-32 text-center animate-in fade-in duration-500">
                   <p className="text-neutral-700 font-black uppercase tracking-[0.4em] text-sm">No signal matching your current frequency.</p>
                   <button onClick={clearFilters} className="mt-8 text-[11px] text-white underline underline-offset-4 font-bold uppercase tracking-widest">Clear Tuning</button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === ViewState.MEETINGS && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="space-y-2 flex-1">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter font-display">Your Kind Reminder</h2>
                    <p className="text-[#949494] text-sm font-medium tracking-wide">Conversations you’ve said yes to.</p>
                  </div>
                  {meetingFilterDate && (
                    <button 
                      onClick={() => setMeetingFilterDate(null)}
                      className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors pb-1 border-b border-neutral-800 hover:border-neutral-500"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
                
                <div className="max-w-3xl space-y-4 pt-8">
                  {filteredReminders.map(({ id, reminder }) => (
                    <div 
                      key={id}
                      className="group relative bg-[#121212] border border-neutral-800/80 rounded-[2rem] p-6 flex items-center gap-6 transition-all duration-150 hover:bg-[#1a1a1a] hover:border-neutral-700 hover:-translate-y-0.5 cursor-pointer shadow-xl active:scale-[0.995]"
                    >
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-12 bg-[#FF2A2A]/40 rounded-r-full group-hover:h-16 group-hover:bg-[#FF2A2A] transition-all duration-150"></div>
                      <div className="w-16 h-16 rounded-full overflow-hidden border border-white/5 flex-shrink-0 group-hover:scale-105 transition-transform duration-150">
                        <img src={reminder.user.avatar} alt={reminder.user.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold text-neutral-400 group-hover:text-white transition-colors uppercase tracking-tight truncate">{reminder.user.name}</h3>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF2A2A]/80 px-3 py-1 bg-[#FF2A2A]/5 rounded-full border border-[#FF2A2A]/10 transition-all duration-150 group-hover:shadow-[0_0_10px_rgba(255,42,42,0.25)] group-hover:text-white group-hover:border-[#FF2A2A]/30">
                            {reminder.time}
                          </span>
                        </div>
                        <p className="text-neutral-500 group-hover:text-neutral-200 transition-colors mt-1 font-medium leading-relaxed italic line-clamp-2">"{reminder.topic}"</p>
                      </div>
                      <div className="hidden md:flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 px-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500">View</span>
                        <Icons.Zap className="w-4 h-4 text-[#FF2A2A]/80" />
                      </div>
                    </div>
                  ))}

                  {filteredReminders.length === 0 && (
                    <div className="py-24 text-center border-2 border-dashed border-neutral-900 rounded-[3rem]">
                      <p className="text-neutral-700 font-black uppercase tracking-[0.4em] text-sm">No meetings scheduled for this day.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full md:w-[420px] flex-shrink-0 animate-in fade-in zoom-in duration-500">
                <div className="bg-[#121212] border border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl">
                  <div className="p-4 border-b border-neutral-800 bg-[#161616]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                      <Icons.Calendar className="w-3 h-3 text-[#FF2A2A]" />
                      Schedule
                    </p>
                  </div>
                  <div className="p-3">
                    <Calendar 
                      events={calendarItems} 
                      interactive={true} 
                      compact={true} 
                      onDateClick={setMeetingFilterDate}
                      selectedDate={meetingFilterDate}
                    />
                  </div>
                </div>
              </div>
            </div>
            {reminderEvents.length === 0 && (
              <div className="py-24 text-center border-2 border-dashed border-neutral-900 rounded-[3rem]">
                <p className="text-neutral-700 font-black uppercase tracking-[0.4em] text-sm">Waiting for a new wave.</p>
              </div>
            )}
          </div>
        )}

        {view === ViewState.GOLDEN && <GoldenView />}

        {view === ViewState.PROFILE && (
          <ProfileSetupView 
            currentUser={currentUser} 
            handleUpdateProfile={handleUpdateProfile} 
            setAuthStep={setAuthStep} 
            handleAiBio={handleAiBio} 
            isEditMode={true} 
            isBackgrounded={isPopUpOpen} 
            onClose={() => setView(ViewState.DISCOVERY)}
          />
        )}
      </main>

      {chatsOpen && (
        <>
          <div className="fixed inset-0 z-[110] bg-black/55 backdrop-blur-[6px] animate-in fade-in duration-200" onClick={() => setChatsOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-80 bg-[#141414] border-l border-white/10 z-[120] shadow-[0_16px_50px_rgba(0,0,0,0.65)] animate-in slide-in-from-right duration-300">
             <div className="relative z-10 h-full p-8">
               <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                  <h3 className="font-bold uppercase tracking-[0.2em] text-[11px] text-white">Messages</h3>
                  <button onClick={() => setChatsOpen(false)} className="text-neutral-500 hover:text-white transition-all"><Icons.X className="w-5 h-5" /></button>
               </div>
               <div className="flex flex-col items-center justify-center h-full -mt-20">
                 <div className="w-1.5 h-1.5 rounded-full bg-neutral-800 mb-6"></div>
                 <p className="text-neutral-600 text-[10px] font-black uppercase tracking-[0.3em] text-center">No active chats</p>
               </div>
             </div>
          </div>
        </>
      )}

      {notifsOpen && (
        <>
          <div className="fixed inset-0 z-[110] bg-black/55 backdrop-blur-[6px] animate-in fade-in duration-200" onClick={() => setNotifsOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-80 bg-[#141414] border-l border-white/10 z-[120] shadow-[0_16px_50px_rgba(0,0,0,0.65)] animate-in slide-in-from-right duration-300">
             <div className="relative z-10 h-full p-8">
               <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                  <h3 className="font-bold uppercase tracking-[0.2em] text-[11px] text-white">Notifications</h3>
                  <button onClick={() => setNotifsOpen(false)} className="text-neutral-500 hover:text-white transition-all"><Icons.X className="w-5 h-5" /></button>
               </div>
               <div className="flex flex-col items-center justify-center h-full -mt-20">
                 <div className="w-1.5 h-1.5 rounded-full bg-neutral-800 mb-6"></div>
                 <p className="text-neutral-600 text-[10px] font-black uppercase tracking-[0.3em] text-center">All caught up</p>
               </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;