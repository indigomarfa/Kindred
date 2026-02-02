import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Icons } from './components/Icons';
import { Calendar } from './components/Calendar';
import { 
  generateSmartBio, 
  getInterestSuggestions, 
  getRelatedInterests 
} from './services/geminiService';
import { 
  User, Meeting, ViewState, PersonalityType, TimeOfDay, AuthStep, Gender, SelfDefinition, Milestone 
} from './types';

// --- CONSTANTS ---

const accentRed = "#FF2A2A";

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
  isGolden: false,
  hasCompletedOnboarding: false,
  milestones: []
};

const MOCK_USERS: User[] = [
  { id: '1', name: 'Sarah Chen', age: 26, gender: Gender.FEMALE, rating: 4.9, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=60', location: { country: 'USA', city: 'New York', lat: 40.71, lng: -74.00 }, occupation: 'Data Scientist', bio: 'F1 fanatic and data nerd. Lets talk race strategies over coffee.', interests: ['Formula 1', 'Data', 'Travel'], personality: PersonalityType.INTROVERT, preferredTime: TimeOfDay.EVENING, milestones: [] },
  { id: '2', name: 'Marcus Johnson', age: 31, gender: Gender.MALE, rating: 4.7, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60', location: { country: 'UK', city: 'London', lat: 51.50, lng: -0.12 }, occupation: 'Marketing Lead', bio: 'Extrovert seeking interesting conversations about global markets and vintage cars.', interests: ['Marketing', 'Formula 1', 'Stocks'], personality: PersonalityType.EXTROVERT, preferredTime: TimeOfDay.AFTERNOON, milestones: [] },
  { id: '3', name: 'Elena Popova', age: 24, gender: Gender.FEMALE, rating: 5.0, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=60', location: { country: 'Ukraine', city: 'Kyiv', lat: 50.45, lng: 30.52 }, occupation: 'Digital Artist', bio: 'Art is life. Seeking muse and good vibes. I love exploring galleries.', interests: ['Art', 'Museums', 'Wine'], personality: PersonalityType.INTROVERT, preferredTime: TimeOfDay.EVENING, milestones: [] },
  { id: '4', name: 'James Smith', age: 29, gender: Gender.MALE, rating: 4.8, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=60', location: { country: 'Australia', city: 'Melbourne', lat: -37.81, lng: 144.96 }, occupation: 'Robotics Engineer', bio: 'Building the future. Big fan of tech, sci-fi, and fast cars.', interests: ['Engineering', 'Robotics', 'Formula 1'], personality: PersonalityType.AMBIVERT, preferredTime: TimeOfDay.MORNING, milestones: [] }
];

// --- 3D BUTTON COMPONENT ---

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
      {/* Black outer base with conditional red ambient glow */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 999,
          background:
            "linear-gradient(180deg, #5a5a5a 0%, #1a1a1a 45%, #080808 100%)",
          boxShadow: isHovered
            ? `0 45px 100px -15px rgba(255,42,42,0.85), 
               0 20px 45px -5px rgba(255,42,42,0.55),
               0 0 60px 0px rgba(255,42,42,0.4), 
               0 25px 40px rgba(0,0,0,0.9), 
               inset 0 2px 0 rgba(255,255,255,0.15), 
               inset 0 -18px 24px rgba(0,0,0,0.9)`
            : `0 15px 30px rgba(0,0,0,0.6), 
               0 25px 40px rgba(0,0,0,0.8), 
               inset 0 2px 0 rgba(255,255,255,0.1), 
               inset 0 -18px 24px rgba(0,0,0,0.9)`,
          transition: "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* Red bottom thickness (base lip) */}
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
            ? `0 0 35px rgba(255,42,42,0.5),
               0 10px 14px rgba(0,0,0,.45), 
               inset 0 2px 0 rgba(255,255,255,.22), 
               inset 0 -7px 10px rgba(0,0,0,.48)`
            : `0 10px 14px rgba(0,0,0,.45), 
               inset 0 2px 0 rgba(255,255,255,.22), 
               inset 0 -7px 10px rgba(0,0,0,.48)`,
          transition: "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* White top face (pressable) */}
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
            : "0 11px 0 rgba(0,0,0,.30), inset 0 2px 0 rgba(255,255,255,.90), inset 0 -3px 0 rgba(0,0,0,.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transform: isPressed ? "translateY(7px)" : "translateY(0px)",
          transition: "transform 120ms ease-out, box-shadow 120ms ease-out",
        }}
      >
        {/* Gloss highlight */}
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
            opacity: 0.92,
          }}
        />

        {/* Top rim line */}
        <span
          style={{
            position: "absolute",
            left: "10%",
            right: "10%",
            top: 3,
            height: 2,
            borderRadius: 999,
            background: "rgba(255,255,255,.80)",
            opacity: 0.65,
          }}
        />

        {/* Label */}
        <span
          style={{
            position: "relative",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#111",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          START JOURNEY
        </span>
      </span>
    </button>
  );
}

// --- SUB-COMPONENTS ---

const Background = ({ isAuth = false }: { isAuth?: boolean }) => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-[#0d0d0d] overflow-hidden">
    {!isAuth && (
      <div className="absolute inset-0 opacity-[0.03]" style={{ 
        backgroundImage: `linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)`, 
        backgroundSize: '80px 80px' 
      }}></div>
    )}
    <div className="absolute left-[5%] top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
    <div className="absolute right-[5%] top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
  </div>
);

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

  return (
    <div className="relative group">
      {label && <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 group-focus-within:text-white transition-colors">{label}</label>}
      <div className="relative">
        <input 
          ref={inputRef}
          type="text"
          className="w-full px-4 py-0 bg-neutral-900/60 border-none shadow-[0_20px_40px_-12px_rgba(255,42,42,0.25)] focus:shadow-[0_25px_50px_-12px_rgba(255,42,42,0.5),0_10px_20px_-5px_rgba(255,42,42,0.2)] outline-none text-white placeholder-neutral-500 placeholder-opacity-50 rounded-xl transition-all font-medium h-[56px] text-sm"
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
      
      {show && (value.length > 0 || combinedSuggestions.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {combinedSuggestions.map((s, idx) => (
            <button 
              key={s}
              type="button"
              onMouseEnter={() => setHighlightedIndex(idx)}
              onMouseDown={(e) => {
                e.preventDefault(); 
                handleSelectInternal(s);
              }}
              className={`w-full text-left p-4 text-sm font-medium transition-colors flex items-center gap-3 border-b border-neutral-800 last:border-none ${highlightedIndex === idx ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${highlightedIndex === idx ? 'bg-white' : 'bg-neutral-700'}`}></div>
              {s}
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
              className={`w-full text-left p-4 text-sm font-medium transition-colors flex items-center gap-3 border-b border-neutral-800 last:border-none ${highlightedIndex === combinedSuggestions.length ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
            >
              <Icons.Sparkles className="w-4 h-4 text-white/40" />
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
      <div className="w-10 h-10 bg-neutral-100 flex items-center justify-center text-black font-bold text-xl clip-diagonal group-hover:bg-neutral-200 transition-all transform group-hover:scale-105">K</div>
      <span className="text-xl md:text-2xl font-bold tracking-tight text-white group-hover:text-neutral-400 transition-all font-display uppercase">KIND<span style={{ color: accentRed }}>RED.</span></span>
    </div>

    <div className="hidden md:flex items-center gap-8">
       {[
         { id: ViewState.DISCOVERY, label: 'Discover' },
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
                 ? 'border-transparent text-amber-500 hover:text-amber-400' 
                 : 'border-transparent text-neutral-500 hover:text-white'
           }`}
         >
           {item.label}
         </button>
       ))}
    </div>

    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <button onClick={() => setChatsOpen(prev => !prev)} className="p-2 text-neutral-500 hover:text-white transition-all"><Icons.MessageCircle className="w-5 h-5" /></button>
        <button onClick={() => setNotifsOpen(prev => !prev)} className="p-2 text-neutral-500 hover:text-white transition-all"><Icons.Bell className="w-5 h-5" /></button>
      </div>
      <button onClick={() => handleNav(ViewState.PROFILE)} className="w-12 h-12 rounded-full p-0.5 bg-neutral-800 hover:bg-neutral-700 transition-all group overflow-hidden">
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
  isEditMode = false
}: {
  currentUser: User,
  handleUpdateProfile: (u: Partial<User>) => void,
  setAuthStep: (s: AuthStep) => void,
  handleAiBio: () => Promise<void>,
  isEditMode?: boolean
}) => {
  const [step, setStep] = useState(isEditMode ? 7 : 1);
  const [interestInput, setInterestInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [relatedInterests, setRelatedInterests] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [triedToSubmit, setTriedToSubmit] = useState(false);

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

  useEffect(() => {
    if (currentUser.interests.length === 0) {
      setRelatedInterests([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await getRelatedInterests(currentUser.interests);
      setRelatedInterests(results.filter(r => !currentUser.interests.includes(r)));
    }, 800);

    return () => clearTimeout(timer);
  }, [currentUser.interests]);

  const localFilteredInterests = useMemo(() => {
    if (interestInput.length < 2) return [];
    return POPULAR_INTERESTS.filter(i => 
      i.toLowerCase().includes(interestInput.toLowerCase()) && 
      !currentUser.interests.includes(i)
    );
  }, [interestInput, currentUser.interests]);

  const handleInterestSelect = useCallback((val: string) => {
    const trimmed = val.trim();
    if (trimmed && !currentUser.interests.includes(trimmed)) {
      handleUpdateProfile({ interests: [...currentUser.interests, trimmed] });
    }
    setInterestInput('');
    setAiSuggestions([]);
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
  };

  const renderProgress = () => {
    const labels = ["WARMING UP", "YOUR CONTEXT", "Energy", "Passions", "Depth", "Expression", "Final Shape"];
    return (
      <div className="mb-10 relative px-2">
        <div className="flex items-center gap-1.5 h-1 w-full bg-neutral-900 rounded-full overflow-hidden">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`h-full flex-1 journey-line-segment ${i + 1 <= step ? 'bg-white' : 'bg-transparent'}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-4">
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest noted-feedback">{labels[step-1]}</span>
          <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">{step === totalSteps ? "Taking shape" : "Moving forward"}</span>
        </div>
      </div>
    );
  };

  const StepActionButtons = ({ onNext, onPrev, nextLabel = "Keep going", skip = false }: { onNext: () => void, onPrev?: () => void, nextLabel?: string, skip?: boolean }) => (
    <div className="pt-10 flex justify-between items-center">
      {onPrev ? (
        <button type="button" onClick={onPrev} className="text-neutral-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-all">Back</button>
      ) : <div />}
      <div className="flex gap-8 items-center">
        {skip && !isEditMode && <button type="button" onClick={onNext} className="text-neutral-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-all">Skip</button>}
        <button 
          type="button" 
          onClick={onNext} 
          className="px-14 py-5 bg-white text-black font-black uppercase tracking-[0.15em] hover:bg-neutral-100 transition-all text-[11px] rounded-xl shadow-[0_25px_45px_-10px_rgba(255,42,42,0.45),0_10px_20px_-5px_rgba(255,42,42,0.2)] active:scale-95 cta-lean"
        >
          {isEditMode && step !== 7 ? "Refine" : nextLabel}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 flex justify-center items-start overflow-y-auto text-white relative">
       <Background isAuth />
       <div className="max-w-3xl w-full bg-neutral-800/40 backdrop-blur-3xl border border-white/10 p-6 md:p-10 relative z-10 shadow-2xl rounded-[3rem] animate-in fade-in zoom-in duration-700" style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.4)', outline: '1px solid rgba(255,255,255,0.06)' }}>
         
         <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-neutral-900 pb-8 gap-4">
           <div>
             <h2 className="text-4xl font-bold text-white uppercase tracking-tighter font-display">
                {isComplete ? "Your member card" : "You’ve arrived"}
             </h2>
             <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mt-1.5 opacity-90">
                {isComplete ? "Your presence, refined over time." : "Building your member card"}
             </p>
           </div>
           {currentUser.identityLabel && isEditMode && (
             <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl group transition-all hover:bg-white/10 cursor-default">
               <span className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-400 group-hover:text-white">{currentUser.identityLabel}</span>
             </div>
           )}
         </div>

         {!isEditMode && step < totalSteps && renderProgress()}

         {/* Narrative Beat 1 - Identity */}
         {step === 1 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="space-y-2 narrative-beat">
               <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">Who you are</h3>
               <p className="text-neutral-500 text-sm font-medium leading-snug max-w-md">We’ll take this step by step.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                 <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Age</label>
                 <input 
                    type="number" 
                    min="18" 
                    className="w-full px-6 py-0 bg-neutral-900/60 border-none shadow-[0_20px_40px_-12px_rgba(255,42,42,0.25)] focus:shadow-[0_25px_50px_-12px_rgba(255,42,42,0.5),0_10px_20px_-5px_rgba(255,42,42,0.2)] outline-none text-white text-left font-bold rounded-xl h-[64px] text-lg placeholder-neutral-700 transition-all" 
                    placeholder="e.g. 28"
                    value={currentUser.age || ''} 
                    onChange={(e) => handleUpdateProfile({age: parseInt(e.target.value) || 0})} 
                  />
               </div>
               <div className="space-y-3">
                 <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Gender</label>
                 <select 
                    className={`w-full px-6 py-0 bg-neutral-900/60 border-none shadow-[0_20px_40px_-12px_rgba(255,42,42,0.25)] focus:shadow-[0_25px_50px_-12px_rgba(255,42,42,0.5),0_10px_20px_-5px_rgba(255,42,42,0.2)] rounded-xl font-bold cursor-pointer h-[64px] text-base transition-all appearance-none ${!currentUser.gender ? 'text-neutral-500' : 'text-white'}`}
                    value={currentUser.gender || ""} 
                    onChange={(e) => handleUpdateProfile({gender: e.target.value as Gender})}
                  >
                    <option value="" disabled hidden>Select gender</option>
                    {Object.values(Gender).map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                  </select>
               </div>
             </div>
             <StepActionButtons onNext={isEditMode ? () => setStep(7) : nextStep} nextLabel="Go deeper" skip={!isEditMode} />
           </div>
         )}

         {/* Narrative Beat 2 - Positioning */}
         {step === 2 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="space-y-2 narrative-beat">
               <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">In the world</h3>
               <p className="text-neutral-500 text-sm font-medium leading-snug max-w-md">How you spend your time and energy gives us a bit of context.</p>
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

         {/* Narrative Beat 3 - Social Energy */}
         {step === 3 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="space-y-2 narrative-beat">
               <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">Social Energy</h3>
               <p className="text-neutral-500 text-sm font-medium leading-snug max-w-md">Choose what actually fits your life rhythm.</p>
             </div>
             <div className="space-y-8">
               <div className="space-y-4">
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest">Social Battery</label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.values(PersonalityType).map(t => (
                      <button key={t} type="button" onClick={() => handleUpdateProfile({personality: t})} className={`py-5 px-2 border-none text-[10px] font-black uppercase tracking-widest transition-all rounded-xl h-[64px] ${currentUser.personality === t ? 'bg-white text-black shadow-[0_15px_35px_-8px_rgba(255,42,42,0.35)]' : 'bg-neutral-800/50 text-neutral-600 hover:bg-neutral-700/50'}`}>{t}</button>
                    ))}
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest">General Availability</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.values(TimeOfDay).map(t => (
                      <button key={t} type="button" onClick={() => handleUpdateProfile({preferredTime: t})} className={`py-3 px-6 text-[10px] font-black uppercase border-none transition-all text-left rounded-xl h-[64px] flex items-center ${currentUser.preferredTime === t ? 'bg-white text-black shadow-[0_15px_35px_-8px_rgba(255,42,42,0.35)]' : 'bg-neutral-800/50 text-neutral-500 hover:bg-neutral-700/50'}`}>{t}</button>
                    ))}
                  </div>
               </div>
             </div>
             <StepActionButtons onNext={isEditMode ? () => setStep(7) : nextStep} onPrev={prevStep} nextLabel="Go deeper" />
           </div>
         )}

         {/* Narrative Beat 4 - Passions */}
         {step === 4 && (
           <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="space-y-2 narrative-beat">
               <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">Passions</h3>
               <p className="text-neutral-500 text-sm font-medium leading-snug max-w-md">What sparks curiosity in you?</p>
             </div>
             <div className="space-y-4">
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
                
                {triedToSubmit && currentUser.interests.length < 2 && (
                  <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in duration-300">
                    Shared interests are the anchor. Add at least 2.
                  </p>
                )}

                <div className="flex flex-wrap gap-2.5 min-h-[40px]">
                  {currentUser.interests.map(tag => (
                    <span key={tag} className="flex items-center gap-2 px-5 py-3 bg-neutral-900/50 text-white text-[10px] border border-neutral-800 font-black uppercase tracking-widest rounded-full hover:border-neutral-600 transition-all group animate-in zoom-in duration-500">
                      {tag}
                      <button type="button" onClick={() => handleUpdateProfile({ interests: currentUser.interests.filter(i => i !== tag) })} className="text-neutral-600 hover:text-white"><Icons.X className="w-3 h-3"/></button>
                    </span>
                  ))}
                </div>

                <div className="bg-black/10 rounded-[2rem] p-6 border border-neutral-800/20 space-y-4">
                  <h4 className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.3em]">
                    Points of Interest
                  </h4>
                  <div className="flex flex-wrap gap-2 opacity-60 hover:opacity-100 transition-opacity duration-500">
                     {POPULAR_INTERESTS.filter(i => !currentUser.interests.includes(i)).slice(0, 8).map(item => (
                       <button 
                         key={item}
                         type="button"
                         onClick={() => handleInterestSelect(item)}
                         className="px-4 py-2.5 bg-neutral-900/30 border border-neutral-800 rounded-xl hover:border-white transition-all text-[10px] font-bold text-neutral-500 hover:text-white"
                       >
                         {item}
                       </button>
                     ))}
                  </div>
               </div>
             </div>
             <StepActionButtons onNext={isEditMode ? () => setStep(7) : nextStep} onPrev={prevStep} nextLabel="Keep going" />
           </div>
         )}

         {/* Narrative Beat 5 - Depth */}
         {step === 5 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="space-y-2 narrative-beat">
               <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">Depth</h3>
               <p className="text-neutral-500 text-sm font-medium leading-snug max-w-md">Everyone starts somewhere - just pick what fits.</p>
             </div>
             <div className="space-y-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest">How long have you been into this?</label>
                  <div className="grid grid-cols-2 gap-4 max-w-sm">
                    <input 
                      type="number" 
                      min="1" 
                      className="w-full px-6 py-0 bg-neutral-900/60 border-none shadow-[0_20px_40px_-12px_rgba(255,42,42,0.25)] focus:shadow-[0_25px_50px_-12px_rgba(255,42,42,0.5),0_10px_20px_-5px_rgba(255,42,42,0.2)] outline-none text-white font-bold rounded-xl h-[64px] text-lg transition-all"
                      placeholder="e.g. 2"
                      value={currentUser.interestDuration?.value || ''}
                      onChange={(e) => handleUpdateProfile({ 
                        interestDuration: { 
                          value: parseInt(e.target.value) || 0, 
                          unit: currentUser.interestDuration?.unit || 'Years' 
                        } 
                      })}
                    />
                    <select 
                      className={`w-full px-6 py-0 bg-neutral-900/60 border-none shadow-[0_20px_40px_-12px_rgba(255,42,42,0.25)] focus:shadow-[0_25px_50px_-12px_rgba(255,42,42,0.5),0_10px_20px_-5px_rgba(255,42,42,0.2)] outline-none rounded-xl font-bold cursor-pointer h-[64px] text-base transition-all appearance-none ${!currentUser.interestDuration?.unit ? 'text-neutral-500' : 'text-white'}`}
                      value={currentUser.interestDuration?.unit || ""}
                      onChange={(e) => handleUpdateProfile({ 
                        interestDuration: { 
                          value: currentUser.interestDuration?.value || 0, 
                          unit: e.target.value as 'Weeks' | 'Months' | 'Years'
                        } 
                      })}
                    >
                      <option value="" disabled hidden>Unit</option>
                      <option value="Weeks">WEEKS</option>
                      <option value="Months">MONTHS</option>
                      <option value="Years">YEARS</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest">How do you see yourself?</label>
                  <div className="flex flex-wrap gap-2">
                    {SELF_DEFINITIONS.map(def => (
                      <button
                        key={def}
                        type="button"
                        onClick={() => handleUpdateProfile({ selfDefinition: def })}
                        className={`px-5 py-4 border-none text-[9px] font-black uppercase tracking-widest transition-all rounded-xl h-[64px] ${currentUser.selfDefinition === def ? 'bg-white text-black shadow-[0_15px_35px_-8px_rgba(255,42,42,0.35)]' : 'bg-neutral-800/50 text-neutral-600 hover:bg-neutral-700/50'}`}
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

         {/* Narrative Beat 6 - Expression */}
         {step === 6 && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="space-y-2 narrative-beat">
               <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">Expression</h3>
               <p className="text-neutral-500 text-sm font-medium leading-snug max-w-md">What matters to you in a good conversation?</p>
             </div>
             <div className="space-y-5">
                <div className="flex justify-end">
                  <button type="button" onClick={handleAutoBioInternal} disabled={isGeneratingBio} className="flex items-center gap-2 text-[10px] text-neutral-400 hover:text-white transition-all font-black uppercase tracking-widest bg-white/5 px-6 py-3 rounded-full border border-white/10 hover:border-white/30">
                    <Icons.Sparkles className="w-3.5 h-3.5" />
                    {isGeneratingBio ? 'Refining...' : 'Refine with AI'}
                  </button>
                </div>
                <textarea 
                  className="w-full h-40 p-8 bg-neutral-900/60 border-none shadow-[0_20px_40px_-12px_rgba(255,42,42,0.25)] focus:shadow-[0_25px_50px_-12px_rgba(255,42,42,0.5),0_10px_20px_-5px_rgba(255,42,42,0.2)] outline-none resize-none text-white placeholder-neutral-700 text-lg leading-snug rounded-3xl transition-all" 
                  placeholder="One or two sentences is enough. What makes a conversation meaningful to you?" 
                  value={currentUser.bio} 
                  onChange={(e) => handleUpdateProfile({bio: e.target.value})} 
                />
             </div>
             <StepActionButtons onNext={isEditMode ? () => setStep(7) : nextStep} onPrev={prevStep} nextLabel="Final Shape" skip={!isEditMode} />
           </div>
         )}

         {/* Narrative Beat 7 - Final Shape */}
         {step === 7 && (
           <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
             <div className="space-y-2 narrative-beat">
               <h3 className="text-3xl font-bold text-white uppercase tracking-tighter font-display">
                Final Shape
               </h3>
               <p className="text-neutral-500 text-sm font-medium leading-snug max-w-md italic opacity-70">
                You’ve arrived. Take a quiet look at the member card you’ve crafted.
               </p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/30 border border-neutral-800 p-6 rounded-2xl relative group">
                  <button onClick={() => setStep(1)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all uppercase text-[8px] font-black tracking-widest">Edit</button>
                  <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest block mb-2">Basics</label>
                  <p className="font-bold text-white">{currentUser.age || '?'} yrs · {currentUser.gender || 'Other'}</p>
                </div>
                <div className="bg-black/30 border border-neutral-800 p-6 rounded-2xl relative group">
                  <button onClick={() => setStep(2)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all uppercase text-[8px] font-black tracking-widest">Edit</button>
                  <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest block mb-2">Location & Work</label>
                  <p className="font-bold text-white">{currentUser.occupation || 'Wanderer'} in {currentUser.location.city || 'Secret'}</p>
                </div>
                <div className="bg-black/30 border border-neutral-800 p-6 rounded-2xl relative group col-span-1 md:col-span-2">
                  <button onClick={() => setStep(4)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all uppercase text-[8px] font-black tracking-widest">Edit</button>
                  <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest block mb-2">Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.interests.map(i => <span key={i} className="text-[9px] px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full font-bold">{i}</span>)}
                    {currentUser.interests.length === 0 && <span className="text-neutral-600 text-[10px] italic">None added</span>}
                  </div>
                </div>
                <div className="bg-black/30 border border-neutral-800 p-6 rounded-2xl relative group col-span-1 md:col-span-2">
                  <button onClick={() => setStep(6)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all uppercase text-[8px] font-black tracking-widest">Edit</button>
                  <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest block mb-2">Bio</label>
                  <p className="text-xs text-neutral-400 italic line-clamp-3 leading-snug font-medium">"{currentUser.bio || 'Your bio will appear here...'}"</p>
                </div>
             </div>

             {isEditMode && currentUser.milestones.length > 0 && (
               <div className="pt-10 border-t border-neutral-900 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em]">Your Journey</h4>
                    <p className="text-[9px] text-neutral-600 uppercase tracking-widest font-medium">Quiet progress is always happening.</p>
                  </div>
                  <div className="space-y-10">
                    {currentUser.milestones.map((milestone, idx) => (
                      <div key={milestone.id} className="flex gap-8 group">
                        <div className="flex flex-col items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.3)] group-hover:scale-125 transition-transform"></div>
                          {idx !== currentUser.milestones.length - 1 && <div className="w-[1px] flex-1 bg-neutral-800/60 mt-4 mb-4"></div>}
                        </div>
                        <div className="pb-4">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="text-xs font-bold text-white uppercase tracking-tighter group-hover:text-white transition-colors">{milestone.label}</span>
                            <span className="text-[8px] font-black text-neutral-700 uppercase tracking-widest">{milestone.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                          <p className="text-[10px] text-neutral-500 leading-snug font-semibold max-w-md noted-feedback">{milestone.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             )}

             <div className="pt-8 flex justify-between items-center">
                {isEditMode ? <div /> : <button type="button" onClick={prevStep} className="text-neutral-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-all">Back</button>}
                <button type="button" onClick={finishOnboarding} className="px-16 py-6 bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-neutral-100 transition-all text-[11px] rounded-2xl shadow-[0_25px_45px_-10px_rgba(255,42,42,0.45),0_10px_20px_-5px_rgba(255,42,42,0.2)] active:scale-95 cta-lean">
                  {isComplete ? "Save changes" : "Finish setup"}
                </button>
             </div>
           </div>
         )}
       </div>
    </div>
  );
};

const LandingView = ({ setAuthStep }: { setAuthStep: (step: AuthStep) => void }) => (
  <div className="min-h-screen flex flex-col justify-center items-center p-6 text-center">
    <Background isAuth />
    <div className="relative z-10">
      <h1 className="text-7xl md:text-9xl font-bold text-white tracking-tighter mb-16 font-display">KIND<span style={{ color: accentRed }}>RED.</span></h1>
      <p className="text-xl text-neutral-400 font-light mb-16">Where shared interests meet shared time.</p>
      
      <div className="relative inline-block">
        <StartJourney3DButton onClick={() => setAuthStep(AuthStep.SIGNUP)} />
      </div>
    </div>
  </div>
);

const SignupView = ({ currentUser, handleUpdateProfile, setAuthStep }: any) => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState(currentUser.name || '');

  const primaryButtonLabel = isLogin ? 'GO ON' : 'GET STARTED';
  const contextLine = isLogin ? 'GOOD TO HAVE YOU BACK' : 'LET’S SET YOU UP IN UNDER A MINUTE';

  const isEnabled = useMemo(() => {
    if (isLogin) return email.length > 3;
    return email.length > 3 && name.length > 1;
  }, [isLogin, email, name]);

  const handleTabSwitch = (loginMode: boolean) => {
    setIsLogin(loginMode);
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-[12vh] p-4 relative overflow-hidden">
      <Background isAuth />
      
      <div className="max-w-lg w-full relative z-10">
        {/* Subtle glow behind card */}
        <div 
          className="absolute -inset-[120px] rounded-full pointer-events-none opacity-40 z-0"
          style={{ 
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.00) 65%)',
            filter: 'blur(30px)'
          }}
        ></div>

        <div 
          className="w-full bg-neutral-900/80 backdrop-blur-xl border border-white/15 p-14 pb-12 rounded-[3rem] shadow-2xl shadow-black/60 animate-in fade-in zoom-in duration-500 relative z-[1]"
          style={{ 
            outline: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.05)'
          }}
        >
          {/* Tabs Switcher */}
          <div className="relative flex bg-black/60 p-1.5 rounded-2xl mb-4 shadow-inner">
             <div 
               className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] bg-white rounded-xl shadow-xl transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] z-0 ${isLogin ? 'left-[calc(50%+0.1875rem)]' : 'left-1.5'}`}
             ></div>
             
             <button 
               onClick={() => handleTabSwitch(false)} 
               className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors duration-200 ${!isLogin ? 'text-black' : 'text-[#B8B8B8] hover:text-[#F5F5F5]'}`}
             >
               NEW HERE
             </button>
             <button 
               onClick={() => handleTabSwitch(true)} 
               className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors duration-200 ${isLogin ? 'text-black' : 'text-[#B8B8B8] hover:text-[#F5F5F5]'}`}
             >
               WELCOME BACK
             </button>
          </div>

          <p className="text-[10px] font-bold text-[#B8B8B8] uppercase tracking-[0.2em] text-center mb-10 transition-all opacity-100">
            {contextLine}
          </p>

          <form className="space-y-8" onSubmit={(e) => { 
            e.preventDefault(); 
            if (!isEnabled) return;
            handleUpdateProfile({ name });
            setAuthStep(isLogin ? AuthStep.COMPLETED : AuthStep.PROFILE_SETUP); 
          }}>
            {!isLogin && (
              <div className="space-y-2 group">
                <label className="block text-[9px] font-black text-[#B8B8B8] uppercase tracking-widest ml-1 transition-colors group-focus-within:text-[#F5F5F5]">NAME</label>
                <input 
                  required 
                  type="text" 
                  className="w-full p-5 bg-neutral-900/60 border-none shadow-[0_20px_40px_-12px_rgba(255,42,42,0.25)] focus:shadow-[0_25px_50px_-12px_rgba(255,42,42,0.5),0_10px_20px_-5px_rgba(255,42,42,0.2)] transition-all outline-none text-white font-bold rounded-xl placeholder-[#7A7A7A]" 
                  placeholder="e.g. Alex Rivera" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
            )}
            <div className="space-y-2 group">
              <label className="block text-[9px] font-black text-[#B8B8B8] uppercase tracking-widest ml-1 transition-colors group-focus-within:text-[#F5F5F5]">EMAIL</label>
              <input 
                required 
                type="email" 
                className="w-full p-5 bg-neutral-900/60 border-none shadow-[0_20px_40px_-12px_rgba(255,42,42,0.25)] focus:shadow-[0_25px_50px_-12px_rgba(255,42,42,0.5),0_10px_20px_-5px_rgba(255,42,42,0.2)] transition-all outline-none text-white font-bold rounded-xl placeholder-[#7A7A7A]" 
                placeholder="alex@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={!isEnabled}
              className={`w-full py-6 font-black uppercase tracking-[0.2em] transition-all duration-[200ms] rounded-xl text-[11px] cta-lean relative ${
                isEnabled 
                  ? 'bg-[#F5F5F5] text-black shadow-[0_25px_50px_-12px_rgba(255,42,42,0.5),0_10px_20px_-5px_rgba(255,42,42,0.2)] hover:bg-white scale-100' 
                  : 'bg-neutral-800/80 text-[#B8B8B8] opacity-100 cursor-not-allowed scale-[0.98] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
              }`}
            >
              {primaryButtonLabel}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [view, setView] = useState<ViewState>(ViewState.DISCOVERY);
  const [authStep, setAuthStep] = useState<AuthStep>(AuthStep.LANDING);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USER_TEMPLATE);
  const [chatsOpen, setChatsOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<Gender | 'All'>('All');
  const [filterPersonality, setFilterPersonality] = useState<PersonalityType | 'All'>('All');
  const [filterTime, setFilterTime] = useState<TimeOfDay | 'All'>('All');

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

  const filteredUsers = useMemo(() => {
    return MOCK_USERS.filter(user => {
      const matchesSearch = !searchQuery || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.occupation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.interests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesGender = filterGender === 'All' || user.gender === filterGender;
      const matchesPersonality = filterPersonality === 'All' || user.personality === filterPersonality;
      const matchesTime = filterTime === 'All' || user.preferredTime === filterTime;

      return matchesSearch && matchesGender && matchesPersonality && matchesTime;
    });
  }, [searchQuery, filterGender, filterPersonality, filterTime]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterGender('All');
    setFilterPersonality('All');
    setFilterTime('All');
  };

  if (authStep === AuthStep.LANDING) {
    return <LandingView setAuthStep={setAuthStep} />;
  }

  if (authStep === AuthStep.SIGNUP) {
    return <SignupView currentUser={currentUser} handleUpdateProfile={handleUpdateProfile} setAuthStep={setAuthStep} />;
  }

  if (authStep !== AuthStep.COMPLETED && !currentUser.hasCompletedOnboarding) {
    return (
      <ProfileSetupView 
        currentUser={currentUser}
        handleUpdateProfile={handleUpdateProfile}
        setAuthStep={setAuthStep}
        handleAiBio={handleAiBio}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neutral-800/30">
      <Background />
      <Navbar 
        currentUser={currentUser} 
        view={view} 
        handleNav={handleNav} 
        setChatsOpen={setChatsOpen} 
        setNotifsOpen={setNotifsOpen} 
      />
      
      <main className="relative z-10 px-6 md:px-12 py-10 max-w-7xl mx-auto">
        {view === ViewState.DISCOVERY && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-neutral-900 pb-10">
              <div>
                <h1 className="text-6xl md:text-8xl font-bold text-white uppercase tracking-tighter font-display leading-[0.85]">Discover</h1>
                <p className="text-neutral-500 font-black uppercase tracking-widest text-xs mt-4">Meaningful, friendly connections.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="max-w-3xl mx-auto w-full group relative">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <Icons.Search className="w-5 h-5 text-neutral-600 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Explore interests, occupations, or names..."
                  className="w-full bg-neutral-900/40 border border-neutral-800 rounded-2xl py-5 pl-14 pr-6 text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-all backdrop-blur-xl hover:border-neutral-700 shadow-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="max-w-4xl mx-auto flex flex-wrap justify-center items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mr-1">Gender</span>
                  <select 
                    value={filterGender} 
                    onChange={(e) => setFilterGender(e.target.value as any)}
                    className="bg-black border border-neutral-800 rounded-xl px-4 py-2 text-[10px] font-bold text-neutral-400 outline-none hover:border-neutral-700 transition-all appearance-none cursor-pointer text-center min-w-[100px]"
                  >
                    <option value="All">ALL</option>
                    {Object.values(Gender).map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mr-1">Energy</span>
                  <select 
                    value={filterPersonality} 
                    onChange={(e) => setFilterPersonality(e.target.value as any)}
                    className="bg-black border border-neutral-800 rounded-xl px-4 py-2 text-[10px] font-bold text-neutral-400 outline-none hover:border-neutral-700 transition-all appearance-none cursor-pointer text-center min-w-[120px]"
                  >
                    <option value="All">ALL TYPES</option>
                    {Object.values(PersonalityType).map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mr-1">Availability</span>
                  <select 
                    value={filterTime} 
                    onChange={(e) => setFilterTime(e.target.value as any)}
                    className="bg-black border border-neutral-800 rounded-xl px-4 py-2 text-[10px] font-bold text-neutral-400 outline-none hover:border-neutral-700 transition-all appearance-none cursor-pointer text-center min-w-[140px]"
                  >
                    <option value="All">ANY TIME</option>
                    {Object.values(TimeOfDay).map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>

                {(searchQuery || filterGender !== 'All' || filterPersonality !== 'All' || filterTime !== 'All') && (
                  <button 
                    onClick={clearFilters}
                    className="ml-2 text-[9px] font-black text-neutral-500 hover:text-white uppercase tracking-widest transition-all"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <div key={user.id} className="bg-neutral-900/40 border border-neutral-800 rounded-3xl overflow-hidden transition-all group cursor-pointer shadow-2xl">
                    <div className="h-64 relative overflow-hidden">
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-2xl font-bold font-display uppercase tracking-tight">{user.name}, {user.age}</h3>
                        <p className="text-[10px] text-neutral-400 font-black uppercase tracking-[0.2em]">{user.occupation}</p>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <p className="text-sm text-neutral-400 line-clamp-2 italic font-medium">"{user.bio}"</p>
                      <div className="flex flex-wrap gap-2">
                        {user.interests.map(i => (
                          <span key={i} className="text-[9px] px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full font-bold uppercase tracking-widest text-neutral-500">{i}</span>
                        ))}
                      </div>
                      <button className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:bg-neutral-100 transition-all shadow-[0_15px_35px_-8px_rgba(255,42,42,0.35)] cta-lean active:scale-95">Connect</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center space-y-4 opacity-50">
                   <p className="text-neutral-500 font-black uppercase tracking-[0.3em]">No quiet connections found</p>
                   <button onClick={clearFilters} className="text-neutral-400 font-bold uppercase tracking-widest text-[10px] hover:underline">Clear exploration</button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === ViewState.MEETINGS && (
          <div className="space-y-10">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-bold uppercase tracking-tighter">Your Schedule</h2>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-2">Planned encounters and quiet moments.</p>
              </div>
            </div>
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
          />
        )}

        {(view === ViewState.PERKS || view === ViewState.GOLDEN) && (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
            <Icons.Crown className="w-16 h-16 text-amber-500 animate-pulse" />
            <h2 className="text-3xl font-bold uppercase tracking-tighter">Premium Access</h2>
            <p className="text-neutral-500 max-w-sm">This section is reserved for our golden members. Elevate your presence to unlock.</p>
            <button className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl shadow-[0_20px_50px_-12px_rgba(255,42,42,0.5),0_10px_20px_-5px_rgba(255,42,42,0.2)] transition-all hover:bg-neutral-50">Go Golden</button>
          </div>
        )}
      </main>

      {chatsOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-neutral-900 border-l border-neutral-800 z-[100] p-6 shadow-2xl animate-in slide-in-from-right duration-300">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold uppercase tracking-widest text-sm">Messages</h3>
              <button onClick={() => setChatsOpen(false)}><Icons.X className="w-5 h-5" /></button>
           </div>
           <div className="text-center py-20">
              <Icons.MessageCircle className="w-10 h-10 text-neutral-800 mx-auto mb-4" />
              <p className="text-neutral-600 text-xs font-bold uppercase tracking-widest">No active chats</p>
           </div>
        </div>
      )}

      {notifsOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-neutral-900 border-l border-neutral-800 z-[100] p-6 shadow-2xl animate-in slide-in-from-right duration-300">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold uppercase tracking-widest text-sm">Notifications</h3>
              <button onClick={() => setNotifsOpen(false)}><Icons.X className="w-5 h-5" /></button>
           </div>
           <div className="text-center py-20">
              <Icons.Bell className="w-10 h-10 text-neutral-800 mx-auto mb-4" />
              <p className="text-neutral-600 text-xs font-bold uppercase tracking-widest">All caught up</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;