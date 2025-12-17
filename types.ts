export enum ViewState {
  DISCOVERY = 'DISCOVERY',
  PROFILE = 'PROFILE',
  MEETINGS = 'MEETINGS',
  LIKES = 'LIKES',
  SUBSCRIPTION = 'SUBSCRIPTION',
  PERKS = 'PERKS', // New view
  GOLDEN = 'GOLDEN',
  USER_DETAILS = 'USER_DETAILS' // Visiting another profile
}

export enum AuthStep {
  LANDING = 'LANDING',
  SIGNUP = 'SIGNUP',
  PROFILE_SETUP = 'PROFILE_SETUP',
  COMPLETED = 'COMPLETED'
}

export enum PersonalityType {
  INTROVERT = 'Introvert',
  EXTROVERT = 'Extrovert',
  AMBIVERT = 'Ambivert'
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  NON_BINARY = 'Non-binary',
  OTHER = 'Other'
}

export enum TimeOfDay {
  MORNING = 'Morning',
  AFTERNOON = 'Afternoon',
  EVENING = 'Evening',
  WEEKEND = 'Weekends Only'
}

export interface User {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  rating: number; // New field
  avatar: string;
  location: {
    country: string;
    city: string;
    lat: number;
    lng: number;
  };
  occupation: string;
  bio: string;
  interests: string[];
  personality: PersonalityType;
  preferredTime: TimeOfDay;
  isGolden?: boolean;
  isOnline?: boolean;
}

export interface Meeting {
  id: string;
  partnerId: string;
  date: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'declined';
  topic: string;
  location: string;
}

export interface Notification {
  id: string;
  type: 'system' | 'user';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  partnerId: string;
  lastMessage: string;
  unreadCount: number;
  messages: ChatMessage[];
}
