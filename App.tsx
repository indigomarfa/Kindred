import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Icons } from './components/Icons';
import { Calendar } from './components/Calendar';
import { 
  generateSmartBio, 
  generateFullProfile, 
  getInterestSuggestions, 
  getRelatedInterests 
} from './services/geminiService';
import { 
  User, Meeting, ViewState, PersonalityType, TimeOfDay, AuthStep, Gender, SelfDefinition 
} from './types';

// --- CONSTANTS ---

const OCCUPATION_SUGGESTIONS = [
  "Software Engineer", "Digital Artist", "Data Scientist", "Architect", "Chef", 
  "UX Designer", "Product Manager", "Marketing Lead", "Musician", "Marine Biologist",
  "Photographer", "Entrepreneur", "Writer", "Psychologist", "Teacher"
];

const CITY_SUGGESTIONS = [
  "New York", "London", "Paris", "Berlin", "San Francisco", "Tokyo", "Sydney", 
  "Kyiv", "Toronto", "Dubai", "Mumbai", "Singapore", "Barcelona", "Mexico City"
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
  interestDuration: { value: 1, unit: 'Years' },
  selfDefinition: 'Fan',
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

const Background = () => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-neutral-950">
    <div className="absolute inset-0 opacity-10" style={{ 
      backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`, 
      backgroundSize: '80px 80px' 
    }}></div>
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
  isLoading = false
}: { 
  value: string; 
  onChange: (val: string) => void; 
  suggestions: string[]; 
  placeholder: string; 
  label: string;
  onSelect?: (val: string) => void;
  showCustomFallback?: boolean;
  isLoading?: boolean;
}) => {
  const [show, setShow] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return suggestions.slice(0, 10);
  }, [suggestions]);

  const handleSelectInternal = useCallback((val: string) => {
    if (onSelect) {
      onSelect(val);
    } else {
      onChange(val);
    }
    setShow(false);
    // Maintain focus if it was an interest field to allow continuous adding
    if (onSelect) {
      inputRef.current?.focus();
    }
  }, [onSelect, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (show) {
      const totalItems = filtered.length + (showCustomFallback && value.length > 0 ? 1 : 0);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % totalItems);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex < filtered.length) {
          handleSelectInternal(filtered[highlightedIndex]);
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
      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 group-focus-within:text-red-500 transition-colors">{label}</label>
      <div className="relative">
        <input 
          ref={inputRef}
          type="text"
          className="w-full p-4 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white placeholder-neutral-800 rounded-xl transition-all font-medium"
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
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {show && (value.length > 0 || filtered.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {filtered.map((s, idx) => (
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
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${highlightedIndex === idx ? 'bg-red-600' : 'bg-neutral-700'}`}></div>
              {s}
            </button>
          ))}
          {showCustomFallback && value.length > 0 && !filtered.some(f => f.toLowerCase() === value.toLowerCase()) && (
            <button 
              type="button"
              onMouseEnter={() => setHighlightedIndex(filtered.length)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectInternal(value);
              }}
              className={`w-full text-left p-4 text-sm font-medium transition-colors flex items-center gap-3 border-b border-neutral-800 last:border-none ${highlightedIndex === filtered.length ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
            >
              <Icons.Sparkles className="w-4 h-4 text-red-500" />
              Add custom: "{value}"
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const Navbar = ({ currentUser, view, handleNav, chatsOpen, setChatsOpen, notifsOpen, setNotifsOpen }: any) => (
  <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-neutral-800 h-24 px-6 md:px-12 flex items-center justify-between transition-all">
    <div className="flex items-center gap-5 cursor-pointer group" onClick={() => handleNav(ViewState.DISCOVERY)}>
      <div className="w-10 h-10 bg-red-600 flex items-center justify-center text-white font-bold text-xl clip-diagonal group-hover:bg-white group-hover:text-black transition-all transform group-hover:scale-105">K</div>
      <span className="text-xl md:text-2xl font-bold tracking-tight text-white group-hover:text-red-500 transition-all font-display uppercase">KINDRED</span>
    </div>

    <div className="hidden md:flex items-center gap-8">
       {[
         { id: ViewState.DISCOVERY, label: 'Discover' },
         { id: ViewState.MEETINGS, label: 'Meetings' },
         { id: ViewState.PERKS, label: 'Perks' },
         { id: ViewState.GOLDEN, label: 'Golden', special: true },
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

    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <button onClick={() => setChatsOpen(!chatsOpen)} className="p-2 text-neutral-500 hover:text-white transition-all"><Icons.MessageCircle className="w-5 h-5" /></button>
        <button onClick={() => setNotifsOpen(!notifsOpen)} className="p-2 text-neutral-500 hover:text-white transition-all"><Icons.Bell className="w-5 h-5" /></button>
      </div>
      <button onClick={() => handleNav(ViewState.PROFILE)} className="w-12 h-12 rounded-full p-0.5 bg-neutral-800 hover:bg-red-600 transition-all group overflow-hidden">
         <img src={currentUser.avatar} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-black" />
      </button>
    </div>
  </nav>
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
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [relatedInterests, setRelatedInterests] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isMagicFilling, setIsMagicFilling] = useState(false);
  const [triedToSubmit, setTriedToSubmit] = useState(false);

  // Debounced Interest Suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (interestInput.length >= 2) {
        setIsSuggesting(true);
        const results = await getInterestSuggestions(interestInput);
        setAiSuggestions(results);
        setIsSuggesting(false);
      } else {
        setAiSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [interestInput]);

  // Fetch Related Interests when current interests change
  useEffect(() => {
    const fetchRelated = async () => {
      if (currentUser.interests.length > 0) {
        const results = await getRelatedInterests(currentUser.interests);
        setRelatedInterests(results.filter(r => !currentUser.interests.includes(r)));
      } else {
        setRelatedInterests([]);
      }
    };
    fetchRelated();
  }, [currentUser.interests]);

  const handleInterestSelect = useCallback((val: string) => {
    const trimmed = val.trim();
    if (trimmed && !currentUser.interests.includes(trimmed)) {
      handleUpdateProfile({ interests: [...currentUser.interests, trimmed] });
    }
    setInterestInput('');
    setAiSuggestions([]);
  }, [currentUser.interests, handleUpdateProfile]);

  const handleMagicFillInternal = async () => {
    if (!currentUser.name) {
      alert("Please enter your name first so AI can tailor your profile.");
      return;
    }
    setIsMagicFilling(true);
    const data = await generateFullProfile(currentUser.name);
    if (data) {
      handleUpdateProfile({
        occupation: data.occupation,
        location: { ...currentUser.location, city: data.city },
        interests: data.interests,
        personality: data.personality as PersonalityType,
        preferredTime: data.preferredTime as TimeOfDay,
        bio: data.bio
      });
    }
    setIsMagicFilling(false);
  };

  const handleAutoBioInternal = async () => {
    setIsGeneratingBio(true);
    await handleAiBio();
    setIsGeneratingBio(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTriedToSubmit(true);
    if (!currentUser.name || !currentUser.occupation || currentUser.age < 18 || currentUser.interests.length < 2) {
      return;
    }
    setAuthStep(AuthStep.COMPLETED);
  };

  const interestCount = currentUser.interests.length;

  return (
    <div className="min-h-screen py-20 px-4 flex justify-center items-start overflow-y-auto text-white relative">
       <Background />
       <div className="max-w-5xl w-full bg-neutral-900/60 backdrop-blur-3xl border border-neutral-800 p-10 md:p-16 relative z-10 shadow-2xl rounded-[2.5rem]">
         <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-neutral-900 pb-10 gap-6">
           <div>
             <h2 className="text-5xl font-bold text-white uppercase tracking-tighter font-display">Profile</h2>
             <p className="text-neutral-500 mt-2 font-semibold text-xl tracking-tight">Complete your member card.</p>
           </div>
           <button 
             type="button"
             onClick={handleMagicFillInternal}
             disabled={isMagicFilling}
             className="group flex items-center gap-3 bg-red-600/10 hover:bg-red-600 border border-red-600/30 hover:border-red-600 text-red-500 hover:text-white px-6 py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg"
           >
             <Icons.Sparkles className={`w-4 h-4 ${isMagicFilling ? 'animate-spin' : 'group-hover:animate-pulse'}`} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isMagicFilling ? 'Thinking...' : 'Magic Setup'}</span>
           </button>
         </div>

         <form onSubmit={handleSubmit} className="space-y-16">
           {/* Basic Info */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-24">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Age</label>
                    <input type="number" required min="18" className="w-full p-4 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white text-center font-bold rounded-xl" value={currentUser.age || ''} onChange={(e) => handleUpdateProfile({age: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Gender</label>
                    <select className="w-full p-4 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white rounded-xl font-bold cursor-pointer" value={currentUser.gender} onChange={(e) => handleUpdateProfile({gender: e.target.value as Gender})}>
                      {Object.values(Gender).map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>
                <AutocompleteInput 
                  label="Occupation" 
                  placeholder="e.g. Architect, Engineer..." 
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
              
              <div className="space-y-8">
                 <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Social Battery</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.values(PersonalityType).map(t => (
                        <button key={t} type="button" onClick={() => handleUpdateProfile({personality: t})} className={`py-4 px-2 border text-[9px] font-black uppercase tracking-widest transition-all rounded-xl ${currentUser.personality === t ? 'bg-white text-black border-white shadow-md' : 'bg-black/40 text-neutral-600 border-neutral-800 hover:border-neutral-500'}`}>{t}</button>
                      ))}
                    </div>
                </div>
                 <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Availability</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(TimeOfDay).map(t => (
                        <button key={t} type="button" onClick={() => handleUpdateProfile({preferredTime: t})} className={`py-3 px-4 text-[9px] font-black uppercase border transition-all text-left rounded-xl ${currentUser.preferredTime === t ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-black/40 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}>{t}</button>
                      ))}
                    </div>
                 </div>
              </div>
           </div>

           {/* Interests System */}
           <div className="space-y-8 pt-8 border-t border-neutral-900">
             <div className="flex justify-between items-baseline">
                <h3 className="text-xl font-bold text-white uppercase tracking-tighter font-display">Interests</h3>
                <span className={`text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${interestCount >= 3 ? 'opacity-20 text-neutral-400' : 'text-neutral-500'}`}>
                   Add at least 2–3 interests
                </span>
             </div>
             
             <div className="space-y-4">
                <AutocompleteInput 
                  label=""
                  placeholder="Start typing or pick from below..."
                  value={interestInput}
                  onChange={setInterestInput}
                  suggestions={aiSuggestions}
                  onSelect={handleInterestSelect}
                  showCustomFallback={true}
                  isLoading={isSuggesting}
                />
                
                {triedToSubmit && interestCount < 2 && (
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in duration-300">
                    Add at least one more interest to continue
                  </p>
                )}

                <div className="flex flex-wrap gap-2 py-2 min-h-[44px]">
                  {currentUser.interests.map(tag => (
                    <span key={tag} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-[9px] border border-neutral-800 font-black uppercase tracking-widest rounded-full hover:border-neutral-600 transition-all group">
                      {tag}
                      <button type="button" onClick={() => handleUpdateProfile({ interests: currentUser.interests.filter(i => i !== tag) })} className="text-neutral-600 hover:text-red-500"><Icons.X className="w-2.5 h-2.5"/></button>
                    </span>
                  ))}
                </div>
             </div>

             {/* Discovery / Related Interests */}
             {(relatedInterests.length > 0 || currentUser.interests.length === 0) && (
               <div className="bg-black/40 rounded-[2rem] p-8 border border-neutral-800/50 space-y-6">
                  <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
                    {currentUser.interests.length === 0 ? "Suggested for you" : "Related to your interests"}
                  </h4>
                  <div className="flex flex-wrap gap-3">
                     {(relatedInterests.length > 0 ? relatedInterests : ["Artificial Intelligence", "Stoicism", "Formula 1", "Cybersecurity", "Minimalism", "Digital Art"]).map(item => (
                       <button 
                         key={item}
                         type="button"
                         onClick={() => handleInterestSelect(item)}
                         className="group flex items-center gap-3 px-5 py-3 bg-neutral-900/40 border border-neutral-800 rounded-2xl hover:border-red-600 transition-all text-left"
                       >
                         <span className="text-[10px] font-bold text-neutral-400 group-hover:text-white transition-colors">{item}</span>
                         <Icons.Sparkles className="w-3 h-3 text-neutral-800 group-hover:text-red-600 transition-all" />
                       </button>
                     ))}
                  </div>
               </div>
             )}

             {/* Interest Duration Section - Styled to match standard fields */}
             <div className="space-y-4 pt-4">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest">How long have you been interested in this?</label>
                <div className="grid grid-cols-2 gap-4 max-w-lg">
                  <input 
                    type="number" 
                    min="1" 
                    className="w-full p-4 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white font-bold rounded-xl transition-all"
                    value={currentUser.interestDuration?.value || 1}
                    onChange={(e) => handleUpdateProfile({ 
                      interestDuration: { 
                        value: parseInt(e.target.value) || 1, 
                        unit: currentUser.interestDuration?.unit || 'Years' 
                      } 
                    })}
                  />
                  <select 
                    className="w-full p-4 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white rounded-xl font-bold cursor-pointer transition-all"
                    value={currentUser.interestDuration?.unit || 'Years'}
                    onChange={(e) => handleUpdateProfile({ 
                      interestDuration: { 
                        value: currentUser.interestDuration?.value || 1, 
                        unit: e.target.value as 'Weeks' | 'Months' | 'Years'
                      } 
                    })}
                  >
                    <option value="Weeks">WEEKS</option>
                    <option value="Months">MONTHS</option>
                    <option value="Years">YEARS</option>
                  </select>
                </div>
             </div>

             {/* Self Definition Section */}
             <div className="space-y-4 pt-4">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest">I define myself as</label>
                <div className="flex flex-wrap gap-2">
                  {SELF_DEFINITIONS.map(def => (
                    <button
                      key={def}
                      type="button"
                      onClick={() => handleUpdateProfile({ selfDefinition: def })}
                      className={`px-6 py-4 border text-[9px] font-black uppercase tracking-widest transition-all rounded-xl ${currentUser.selfDefinition === def ? 'bg-white text-black border-white shadow-md' : 'bg-black/40 text-neutral-600 border-neutral-800 hover:border-neutral-500'}`}
                    >
                      {def}
                    </button>
                  ))}
                </div>
             </div>
           </div>

           {/* Bio / Final Touches */}
           <div className="pt-8 border-t border-neutral-900">
              <div className="flex justify-between items-center mb-6">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest">Bio</label>
                <button type="button" onClick={handleAutoBioInternal} disabled={isGeneratingBio} className="flex items-center gap-2 text-[8px] text-red-500 hover:text-white transition-all font-black uppercase tracking-widest bg-red-600/10 px-4 py-2 rounded-full border border-red-600/30">
                  <Icons.Sparkles className="w-3 h-3" />
                  {isGeneratingBio ? 'Refining...' : 'AI Bio'}
                </button>
              </div>
              <textarea className="w-full h-32 p-6 bg-black border border-neutral-800 focus:border-red-600 outline-none resize-none text-white placeholder-neutral-800 text-sm leading-relaxed rounded-2xl shadow-inner transition-all" placeholder="Tell us about yourself..." value={currentUser.bio} onChange={(e) => handleUpdateProfile({bio: e.target.value})} />
           </div>

           <div className="pt-12 flex justify-end">
             <button type="submit" className="px-16 py-5 bg-white text-black font-black uppercase tracking-widest hover:bg-neutral-200 transition-all text-xs rounded-xl shadow-2xl active:scale-95">
               Finish Setup
             </button>
           </div>
         </form>
       </div>
    </div>
  );
};

const DiscoveryView = ({ searchQuery, setSearchQuery, filteredUsers, handleOpenProfile }: any) => {
  return (
    <div className="p-4 md:p-12 max-w-screen-2xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 border-b-2 border-neutral-900 pb-10">
        <div>
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-3 uppercase tracking-tighter font-display leading-[0.85]">Discover</h1>
          <p className="text-neutral-500 font-semibold text-lg tracking-tight">Real people. Shared interests.</p>
        </div>
      </div>
      <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 p-3 mb-14 sticky top-28 z-30 flex flex-col md:flex-row items-center max-w-4xl mx-auto shadow-2xl rounded-2xl">
         <div className="pl-6 pr-4 text-neutral-500"><Icons.Search className="w-5 h-5" /></div>
         <input type="text" placeholder="Interests, names, or occupations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-white h-12 px-4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 pb-32">
        {filteredUsers.map((user: User) => (
            <div key={user.id} className="group relative bg-neutral-900 border border-neutral-800 hover:border-white transition-all duration-500 cursor-pointer flex flex-col h-[520px] rounded-[2rem] overflow-hidden" onClick={() => handleOpenProfile(user)}>
              <div className="relative h-[65%] overflow-hidden">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full p-8">
                   <h3 className="font-bold text-3xl text-white uppercase font-display tracking-tight group-hover:text-red-500 transition-colors">{user.name}</h3>
                   <div className="flex items-center gap-2 text-red-500 text-[9px] font-black uppercase tracking-widest">{user.occupation}</div>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between bg-neutral-900/30">
                 <p className="text-neutral-400 text-xs leading-relaxed line-clamp-2 italic font-medium">"{user.bio}"</p>
                 <div className="mt-4 pt-4 border-t border-neutral-800 flex justify-between items-center">
                    <div className="flex gap-2">
                      {user.interests.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[8px] font-black uppercase text-neutral-500 border border-neutral-800 px-3 py-1 rounded-full">{tag}</span>
                      ))}
                    </div>
                 </div>
              </div>
            </div>
        ))}
      </div>
    </div>
  );
};

const MeetingsView = () => (
  <div className="p-12 max-w-5xl mx-auto">
    <h1 className="text-5xl font-bold text-white uppercase tracking-tighter font-display mb-12">Meetings</h1>
    <div className="bg-neutral-900 border border-neutral-800 p-10 rounded-[2rem]">
      <p className="text-neutral-500 font-display uppercase tracking-widest">Syncing your calendar...</p>
    </div>
  </div>
);

const PerksView = ({ currentUser }: { currentUser: User }) => (
  <div className="p-12 max-w-5xl mx-auto text-center">
    <h1 className="text-6xl font-bold text-white uppercase tracking-tighter mb-16 font-display">Perks</h1>
    <div className="grid grid-cols-3 border border-neutral-800 rounded-[2rem] overflow-hidden">
       <div className="p-12 border-r border-neutral-800">
          <div className="text-5xl font-bold text-white mb-2 font-display">850</div>
          <div className="text-neutral-500 text-[9px] font-black uppercase tracking-widest">Points</div>
       </div>
       <div className="p-12 border-r border-neutral-800">
          <div className="text-5xl font-bold text-white mb-2 font-display">Gold</div>
          <div className="text-neutral-500 text-[9px] font-black uppercase tracking-widest">Tier</div>
       </div>
       <div className="p-12">
          <div className="text-5xl font-bold text-white mb-2 font-display">3</div>
          <div className="text-neutral-500 text-[9px] font-black uppercase tracking-widest">Boosts</div>
       </div>
    </div>
  </div>
);

const GoldenView = () => (
  <div className="p-12 max-w-5xl mx-auto text-center">
    <h1 className="text-7xl font-bold text-white uppercase tracking-tighter mb-12 font-display">Become <span className="text-amber-500">Golden</span></h1>
    <div className="bg-neutral-900 border border-neutral-800 p-16 rounded-[3rem]">
       <button className="bg-amber-500 text-black font-black uppercase tracking-widest px-12 py-5 rounded-2xl">Upgrade Now</button>
    </div>
  </div>
);

export default function App() {
  const [authStep, setAuthStep] = useState<AuthStep>(AuthStep.LANDING);
  const [view, setView] = useState<ViewState>(ViewState.DISCOVERY);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USER_TEMPLATE);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatsOpen, setChatsOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  
  const filteredUsers = MOCK_USERS.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.interests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleNav = (v: ViewState) => { setView(v); window.scrollTo(0,0); };
  const handleUpdateProfile = (updated: Partial<User>) => { setCurrentUser(prev => ({ ...prev, ...updated })); };
  const handleAiBio = async () => {
    const newBio = await generateSmartBio(currentUser.interests, currentUser.occupation, currentUser.personality);
    handleUpdateProfile({ bio: newBio });
  };

  if (authStep === AuthStep.LANDING) return <LandingView setAuthStep={setAuthStep} />;
  if (authStep === AuthStep.SIGNUP) return <SignupView currentUser={currentUser} handleUpdateProfile={handleUpdateProfile} setAuthStep={setAuthStep} />;
  if (authStep === AuthStep.PROFILE_SETUP) return <ProfileSetupView currentUser={currentUser} handleUpdateProfile={handleUpdateProfile} setAuthStep={setAuthStep} handleAiBio={handleAiBio} />;

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-red-600 selection:text-white relative">
      <Background />
      <div className="relative z-10">
        <Navbar currentUser={currentUser} view={view} handleNav={handleNav} chatsOpen={chatsOpen} setChatsOpen={setChatsOpen} notifsOpen={notifsOpen} setNotifsOpen={setNotifsOpen} />
        <main className="max-w-[1920px] mx-auto w-full pt-6 px-6 md:px-12">
          {view === ViewState.DISCOVERY && <DiscoveryView searchQuery={searchQuery} setSearchQuery={setSearchQuery} filteredUsers={filteredUsers} handleOpenProfile={() => {}} />}
          {view === ViewState.MEETINGS && <MeetingsView />}
          {view === ViewState.PERKS && <PerksView currentUser={currentUser} />}
          {view === ViewState.GOLDEN && <GoldenView />}
          {view === ViewState.PROFILE && <ProfileSetupView currentUser={currentUser} handleUpdateProfile={handleUpdateProfile} setAuthStep={() => {}} handleAiBio={handleAiBio} />}
        </main>
      </div>
    </div>
  );
}

const LandingView = ({ setAuthStep }: { setAuthStep: (step: AuthStep) => void }) => (
  <div className="min-h-screen flex flex-col justify-center items-center p-6 text-center">
    <Background />
    <div className="relative z-10">
      <h1 className="text-7xl md:text-9xl font-bold text-white tracking-tighter mb-8 font-display">KIND<span className="text-red-600">RED</span>.</h1>
      <p className="text-xl text-neutral-400 font-light mb-16">Where shared interests meet shared time.</p>
      <button onClick={() => setAuthStep(AuthStep.SIGNUP)} className="px-16 py-6 bg-white text-black font-bold uppercase tracking-widest clip-diagonal hover:bg-neutral-200 transition-all shadow-2xl">Start Now</button>
    </div>
  </div>
);

const SignupView = ({ currentUser, handleUpdateProfile, setAuthStep }: any) => {
  const [isLogin, setIsLogin] = useState(false);
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <Background />
      <div className="max-w-lg w-full relative z-10 bg-neutral-900/40 backdrop-blur-3xl border border-neutral-800 p-12 rounded-[2.5rem] shadow-2xl">
        <div className="flex bg-black p-1.5 rounded-2xl mb-10">
           <button onClick={() => setIsLogin(false)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!isLogin ? 'bg-white text-black shadow-lg' : 'text-neutral-500'}`}>Sign Up</button>
           <button onClick={() => setIsLogin(true)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isLogin ? 'bg-white text-black shadow-lg' : 'text-neutral-500'}`}>Log In</button>
        </div>
        <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); setAuthStep(isLogin ? AuthStep.COMPLETED : AuthStep.PROFILE_SETUP); }}>
          {!isLogin && (
            <div>
              <label className="block text-[9px] font-black text-neutral-600 mb-2 uppercase tracking-widest">Full Name</label>
              <input required type="text" className="w-full p-5 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white font-bold rounded-xl" placeholder="Alex Rivera" value={currentUser.name} onChange={(e) => handleUpdateProfile({ name: e.target.value })} />
            </div>
          )}
          <div>
            <label className="block text-[9px] font-black text-neutral-600 mb-2 uppercase tracking-widest">Email</label>
            <input required type="email" className="w-full p-5 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white font-bold rounded-xl" placeholder="alex@example.com" />
          </div>
          <div>
            <label className="block text-[9px] font-black text-neutral-600 mb-2 uppercase tracking-widest">Password</label>
            <input required type="password" className="w-full p-5 bg-black border border-neutral-800 focus:border-red-600 outline-none text-white font-bold rounded-xl" />
          </div>
          <button type="submit" className="w-full py-6 bg-white text-black font-black uppercase tracking-widest hover:bg-neutral-100 transition-all rounded-xl shadow-lg">{isLogin ? 'Log In' : 'Continue'}</button>
        </form>
      </div>
    </div>
  );
};