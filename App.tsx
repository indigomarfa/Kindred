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
const placeholderBaseline = "#7A7A7A";

const inputIdleBase = "bg-neutral-900/40 border border-neutral-800/50 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.02),0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-500";
const inputHoverBase = "hover:border-neutral-700 hover:shadow-[0_20px_50px_-20px_rgba(255,42,42,0.08),0_10px_15px_-3px_rgba(0,0,0,0.2)] hover:bg-neutral-900/60";
// Restoring the Kindred Red focus state
const inputFocusBase = "focus:border-neutral-500 focus:shadow-[inset_3px_0_0_0_#FF2A2A,0_25px_60px_-25px_rgba(255,42,42,0.15),0_15px_25px_-5px_rgba(0,0,0,0.3)] focus:bg-neutral-900/80";

// Restoring the strong red selection highlight
const selectActiveBase = "bg-neutral-900/80 border-neutral-500 shadow-[inset_4px_0_0_0_#FF2A2A,0_25px_60px_-25px_rgba(255,42,42,0.15)]";

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
  milestones: []
};

const MOCK_USERS: User[] = [
  { id: '1', name: 'Sarah Chen', age: 26, gender: Gender.FEMALE, rating: 4.9, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=60', location: { country: 'USA', city: 'New York', lat: 40.71, lng: -74.00 }, occupation: 'Data Scientist', bio: 'F1 fanatic and data nerd. Lets talk race strategies over coffee.', interests: ['Formula 1', 'Data', 'Travel'], personality: PersonalityType.INTROVERT, preferredTime: TimeOfDay.EVENING, depth: ConversationDepth.DEEP, intent: MeetingIntent.OCCASIONAL, milestones: [] },
  { id: '2', name: 'Marcus Johnson', age: 31, gender: Gender.MALE, rating: 4.7, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60', location: { country: 'UK', city: 'London', lat: 51.50, lng: -0.12 }, occupation: 'Marketing Lead', bio: 'Extrovert seeking interesting conversations about global markets and vintage cars.', interests: ['Marketing', 'Formula 1', 'Stocks'], personality: PersonalityType.EXTROVERT, preferredTime: TimeOfDay.AFTERNOON, depth: ConversationDepth.LIGHT, intent: MeetingIntent.ONE_OFF, milestones: [] },
  { id: '3', name: 'Elena Popova', age: 24, gender: Gender.FEMALE, rating: 5.0, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=60', location: { country: 'Ukraine', city: 'Kyiv', lat: 50.45, lng: 30.52 }, occupation: 'Digital Artist', bio: 'Art is life. Seeking muse and good vibes. I love exploring galleries.', interests: ['Art', 'Museums', 'Wine'], personality: PersonalityType.INTROVERT, preferredTime: TimeOfDay.EVENING, depth: ConversationDepth.THOUGHTFUL, intent: MeetingIntent.FOLLOW_UP, milestones: [] },
  { id: '4', name: 'James Smith', age: 29, gender: Gender.MALE, rating: 4.8, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=60', location: { country: 'Australia', city: 'Melbourne', lat: -37.81, lng: 144.96 }, occupation: 'Robotics Engineer', bio: 'Building the future. Big fan of tech, sci-fi, and fast cars.', interests: ['Engineering', 'Robotics', 'Formula 1'], personality: PersonalityType.AMBIVERT, preferredTime: TimeOfDay.MORNING, depth: ConversationDepth.INTENSE, intent: MeetingIntent.ONE_OFF, milestones: [] }
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
          boxShadow: isHovered
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
          boxShadow: isHovered
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
            : isHovered 
              ? "0 14px 0 rgba(0,0,0,.35), inset 0 3px 0 rgba(255,255,255,1.0), inset 0 -3px 0 rgba(0,0,0,.12), 0 0 20px rgba(255,255,255,0.4)"
              : "0 11px 0 rgba(0,0,0,.30), inset 0 2px 0 rgba(255,255,255,.90), inset 0 -3px 0 rgba(0,0,0,.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transform: isPressed ? "translateY(7px)" : isHovered ? "translateY(-2px)" : "translateY(0px)",
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
            opacity: isHovered ? 1.0 : 0.92,
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
            opacity: isHovered ? 1.0 : 0.65,
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
            textShadow: isHovered ? "0 0 8px rgba(255,255,255,0.5)" : "none",
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative group" ref={containerRef}>
      {label && <label className="block text-[10px] font-bold text-[#949494] uppercase tracking-widest mb-3 group-focus-within:text-white transition-colors">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-6 py-0 transition-all flex items-center justify-between outline-none font-bold ${height} text-left ${isOpen ? `${selectActiveBase} rounded-t-xl rounded-b-none` : `${inputIdleBase} ${inputHoverBase} rounded-xl focus:shadow-[inset_2px_0_0_0_#FF2A2A,inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-2px_5px_rgba(0,0,0,0.8),0_10px_20_5px_rgba(0,0,0,0.6)] focus:bg-neutral-900/60`} ${!value ? 'text-[#7A7A7A]' : 'text-white'}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <Icons.Menu className={`w-3.5 h-3.5 transition-all duration-300 ${isOpen ? 'rotate-90 text-white' : 'text-[#949494]'} group-hover:text-white`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-[60] w-full bg-[#121212]/98 backdrop-blur-3xl border-x border-b border-white/10 rounded-b-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`w-full text-left p-4 text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 relative group/opt ${value === opt ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-[#7A7A7A] hover:text-white hover:bg-white/5'}`}
            >
              {value === opt && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FF2A2A]"></div>
              )}
              <span className="relative z-10">{opt}</span>
            </button>
          ))}
        </div>
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
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % totalItems);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === 'Enter') {
        e.preventDefault();
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
    <div className="relative group">
      {label && <label className="block text-[10px] font-bold text-[#949494] uppercase tracking-widest mb-3 group-focus-within:text-white transition-colors">{label}</label>}
      <div className="relative">
        <input 
          ref={inputRef}
          type="text"
          className={`w-full px-4 py-0 transition-all outline-none font-medium h-[56px] text-sm text-white placeholder-[#7A7A7A] ${inputIdleBase} ${inputHoverBase} ${inputFocusBase} ${show && hasItemsToShow ? 'rounded-t-xl rounded-b-none' : 'rounded-xl'}`}
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
        <div className="absolute top-full left-0 z-50 w-full bg-[#121212]/98 backdrop-blur-3xl border-x border-b border-white/10 rounded-b-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
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
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FF2A2A]"></div>
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
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FF2A2A]"></div>
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
         { id: ViewState.PERKS, label: 'Presence' },
         { id: ViewState.GOLDEN, label: 'Golden', special: true },
       ].map(item => (
         <button
           key={item.id}
           onClick={() => handleNav(item.id)}
           className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all py-1 border-b-2 ${
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
        <button onClick={() => setChatsOpen(prev => !prev)} className="p-2 text-neutral-500 hover:text-white hover:scale-110 transition-all"><Icons.MessageCircle className="w-5 h-5" /></button>
        <button onClick={() => setNotifsOpen(prev => !prev)} className="p-2 text-neutral-500 hover:text-white hover:scale-110 transition-all"><Icons.Bell className="w-5 h-5" /></button>
      </div>
      <button onClick={() => handleNav(ViewState.PROFILE)} className="w-12 h-12 rounded-full p-0.5 bg-neutral-800 hover:bg-neutral-600 transition-all group overflow-hidden hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]">
         <img src={currentUser.avatar} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-black" />
      </button>
    </div>
  </nav>
);

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
    setAuthStep(AuthStep.COMPLETED);
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
        <button type="button" onClick={onPrev} className="text-[#7A7A7A] hover:text-white text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 transform">Back</button>
      ) : <div />}
      <div className="flex gap-8 items-center">
        {skip && !isEditMode && <button type="button" onClick={onNext} className="text-[#7A7A7A] hover:text-white text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 transform">Skip</button>}
        <button 
          type="button" 
          onClick={onNext} 
          className="px-14 py-5 bg-white text-black font-black uppercase tracking-[0.15em] hover:bg-white hover:shadow-[0_20px_50px_-10px_rgba(255,42,42,0.5),0_10px_20px_-5px_rgba(0,0,0,0.3)] transition-all text-[11px] rounded-xl shadow-[0_25px_45px_-10px_rgba(0,0,0,0.45),0_10px_20px_-5px_rgba(0,0,0,0.2)] active:scale-95 cta-lean"
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

  return (
    <div className="min-h-screen py-8 px-4 flex justify-center items-start overflow-y-auto text-white relative">
      <Background isAuth />
       <div 
        className={`max-w-3xl w-full bg-neutral-800/40 backdrop-blur-3xl border border-white/10 p-6 md:p-10 relative z-10 rounded-[3rem] transition-all duration-700 animate-in fade-in zoom-in ${isBackgrounded ? 'shadow-lg translate-y-2' : 'shadow-2xl'}`} 
        style={{ 
          boxShadow: isBackgrounded ? '0 15px 30px rgba(0,0,0,0.5)' : '0 40px 100px rgba(0,0,0,0.4)', 
          outline: '1px solid rgba(255,255,255,0.06)' 
        }}
       >
         
         <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-900 pb-8 gap-4 relative">
           <div className="flex flex-col items-start">
             <h2 className="text-4xl font-bold text-white uppercase tracking-tighter font-display">
                {isComplete ? "Your member card" : "You’ve arrived"}
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
             <div className="space-y-2 narrative-beat">
               <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">Final Shape</h3>
               <p className="text-[#949494] text-sm font-medium leading-snug max-w-md italic opacity-70">
                 {isInternalEditing ? "Choose a block to refine." : "You’ve arrived. Take a quiet look."}
               </p>
             </div>
             
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
                    <label className="text-[9px] font-black text-[#949494] uppercase tracking-[0.2em] block">Passions</label>
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

                <button 
                  onClick={() => isInternalEditing && setStep(6)}
                  className={`bg-black/30 border border-neutral-800/80 p-6 rounded-[2.5rem] relative text-left transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 group col-span-1 md:col-span-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] delay-200 ${isInternalEditing ? 'hover:border-white/40 hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'}`}
                >
                   <div className="flex justify-between items-start mb-4">
                    <label className="text-[9px] font-black text-[#949494] uppercase tracking-[0.2em] block">Your Voice</label>
                    {isInternalEditing && <Icons.Zap className="w-3 h-3 text-[#FF2A2A] opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                  <p className="text-neutral-400 font-medium italic leading-relaxed text-base line-clamp-3">
                    "{currentUser.bio || "No bio yet. Let people know what you're about."}"
                  </p>
                </button>
             </div>

             <div className="pt-8 border-t border-neutral-900 flex justify-between items-center">
                <button 
                  type="button" 
                  onClick={() => {
                    if (isInternalEditing) setIsInternalEditing(false);
                    else prevStep();
                  }} 
                  className="text-[#7A7A7A] hover:text-white text-xs font-black uppercase tracking-widest transition-all"
                >
                  {isInternalEditing ? 'Cancel' : 'Back'}
                </button>
                
                {isInternalEditing ? (
                   <button 
                    type="button" 
                    onClick={finishOnboarding} 
                    className="px-14 py-5 bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-white hover:shadow-[0_20px_50px_rgba(255,255,255,0.2)] transition-all text-[11px] rounded-2xl"
                  >
                    Save changes
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={finishOnboarding} 
                    className="px-16 py-6 bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-white hover:shadow-[0_20px_50px_rgba(255,255,255,0.2)] transition-all text-[11px] rounded-2xl"
                  >
                    {isComplete ? "Finish setup" : "Finish setup"}
                  </button>
                )}
             </div>
           </div>
         )}
         </div>

         {/* Discard Confirmation Dialog */}
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
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [filterPersonality, setFilterPersonality] = useState<PersonalityType | 'ANY'>('ANY');
  const [filterTime, setFilterTime] = useState<TimeOfDay | 'ANY'>('ANY');
  const [filterDepth, setFilterDepth] = useState<ConversationDepth | 'ANY'>('ANY');
  const [filterIntent, setFilterIntent] = useState<MeetingIntent | 'ANY'>('ANY');

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
  };

  const isFiltersActive = useMemo(() => 
    filterPersonality !== 'ANY' || 
    filterTime !== 'ANY' || 
    filterDepth !== 'ANY' || 
    filterIntent !== 'ANY'
  , [filterPersonality, filterTime, filterDepth, filterIntent]);

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

  const isPopUpOpen = useMemo(() => chatsOpen || notifsOpen, [chatsOpen, notifsOpen]);

  if (authStep === AuthStep.LANDING) return <LandingView setAuthStep={setAuthStep} />;
  if (authStep === AuthStep.SIGNUP) return <SignupView currentUser={currentUser} handleUpdateProfile={handleUpdateProfile} setAuthStep={setAuthStep} />;
  if (authStep !== AuthStep.COMPLETED && !currentUser.hasCompletedOnboarding) return <ProfileSetupView currentUser={currentUser} handleUpdateProfile={handleUpdateProfile} setAuthStep={setAuthStep} handleAiBio={handleAiBio} />;

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

            {/* HERO SEARCH BAR - BOLDER & PROVOCATIVE COMMAND BAR */}
            <div className="max-w-6xl mx-auto w-full group relative py-12">
              <div className="relative transition-all duration-100 hover:-translate-y-0.5">
                {/* Kindred Red Accent Line - Solid, sharp, reactive */}
                <div className={`absolute left-0 top-0 bottom-0 w-[4px] bg-[#FF2A2A] rounded-l-[8px] z-20 transition-all duration-100 group-focus-within:w-[6px]`}></div>
                
                <input
                  type="text"
                  placeholder="Who do you dare to talk to?"
                  className="
                    w-full h-[56px] rounded-[8px] pl-12 pr-44 text-lg font-bold text-white 
                    placeholder:text-neutral-500 placeholder:font-black outline-none transition-all duration-100
                    bg-[#121212] border border-white/35
                    hover:border-white/50
                    focus:bg-[#141414] focus:border-white/70 focus:text-white
                    caret-[#FF2A2A]
                  "
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={() => !showFilters && setShowFilters(true)}
                />
                
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`
                    absolute right-4 top-1/2 -translate-y-1/2 h-[34px] px-6 rounded-[2px] 
                    text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-100 
                    bg-neutral-900 border border-neutral-800 text-neutral-400
                    hover:border-[#FF2A2A] hover:text-white hover:bg-transparent
                    ${showFilters ? 'border-[#FF2A2A] text-white bg-neutral-800' : ''}
                  `}
                >
                  FILTERS
                </button>
              </div>

              {/* FILTERS PANEL */}
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showFilters ? 'max-h-[1400px] opacity-100 mt-6' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <div className="p-12 bg-[#1a1a1a] border border-neutral-800/80 rounded-[3rem] space-y-16 relative shadow-2xl">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-8">
                    <div>
                      <h3 className="text-[14px] font-black text-white uppercase tracking-[0.3em]">Refine Discovery</h3>
                      <p className="text-[11px] text-neutral-500 mt-2 font-bold tracking-wide uppercase">Fine-tune your personal frequency</p>
                    </div>
                    {isFiltersActive && (
                      <button onClick={clearFilters} className="text-[11px] font-black text-neutral-500 hover:text-white uppercase tracking-widest transition-all cursor-pointer underline underline-offset-8 decoration-neutral-800 hover:decoration-white">Reset all</button>
                    )}
                  </div>
                  
                  {/* Primary Filters */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-12">
                    <div className="space-y-6">
                      <label className="text-[16px] font-bold text-white tracking-tight block">How do you usually show up?</label>
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
                      <p className="text-[12px] text-neutral-600 font-medium leading-relaxed italic">The energy you seek in your next interaction.</p>
                    </div>

                    <div className="space-y-6">
                      <label className="text-[16px] font-bold text-white tracking-tight block">What's the depth?</label>
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

                  {/* Secondary Filters */}
                  <div className="pt-12 border-t border-neutral-800/50 grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-12">
                    <div className="space-y-6">
                      <label className="text-[14px] font-bold text-neutral-400 tracking-tight block">When are you most present?</label>
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
                      <label className="text-[14px] font-bold text-neutral-400 tracking-tight block">What's the commitment style?</label>
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

                  {/* Advanced Filters Toggle */}
                  <div className="pt-6">
                    <button 
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-[11px] font-black text-neutral-600 hover:text-white uppercase tracking-widest flex items-center gap-3 transition-all"
                    >
                      <Icons.Menu className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90 text-white' : ''}`} />
                      {showAdvanced ? 'Collapse context' : 'Advanced context'}
                    </button>
                    
                    {showAdvanced && (
                      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="space-y-4">
                          <label className="text-[11px] font-black text-neutral-500 uppercase tracking-widest block">Industry & Expertise</label>
                          <div className="p-8 bg-[#212121] rounded-3xl border border-neutral-800 text-[12px] text-neutral-600 italic">
                            Domain-specific filters are in preparation.
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[11px] font-black text-neutral-500 uppercase tracking-widest block">Region & Locale</label>
                          <div className="p-8 bg-[#212121] rounded-3xl border border-neutral-800 text-[12px] text-neutral-600 italic">
                            Global English / High Latency Optimized
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RESULTS GRID */}
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
                    <button className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.25em] text-[11px] rounded-2xl hover:shadow-2xl hover:scale-[1.02] transform transition-all active:scale-95">Click</button>
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
          <div className="space-y-10">
            <h2 className="text-4xl font-bold uppercase tracking-tighter">Your Schedule</h2>
            <Calendar events={[]} interactive />
          </div>
        )}

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
        <div className="fixed inset-y-0 right-0 w-80 bg-[#0d0d0d] border-l border-neutral-800 z-[100] shadow-2xl animate-in slide-in-from-right duration-300">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(0,0,0,0.7)_0%,_transparent_80%)] pointer-events-none"></div>
           <div className="relative z-10 h-full p-6">
             <div className="flex justify-between items-center mb-8 border-b border-neutral-900 pb-4">
                <h3 className="font-bold uppercase tracking-widest text-sm text-white">Messages</h3>
                <button onClick={() => setChatsOpen(false)} className="text-neutral-500 hover:text-white transition-all"><Icons.X className="w-5 h-5" /></button>
             </div>
             <p className="text-neutral-600 text-[10px] font-black uppercase tracking-[0.3em] text-center mt-20">No active chats</p>
           </div>
        </div>
      )}

      {notifsOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-[#0d0d0d] border-l border-neutral-800 z-[100] shadow-2xl animate-in slide-in-from-right duration-300">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(0,0,0,0.7)_0%,_transparent_80%)] pointer-events-none"></div>
           <div className="relative z-10 h-full p-6">
             <div className="flex justify-between items-center mb-8 border-b border-neutral-900 pb-4">
                <h3 className="font-bold uppercase tracking-widest text-sm text-white">Notifications</h3>
                <button onClick={() => setNotifsOpen(false)} className="text-neutral-500 hover:text-white transition-all"><Icons.X className="w-5 h-5" /></button>
             </div>
             <p className="text-neutral-600 text-[10px] font-black uppercase tracking-[0.3em] text-center mt-20">All caught up</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;