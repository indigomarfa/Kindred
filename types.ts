export enum ViewState {
  DISCOVERY = 'DISCOVERY',
  PROFILE = 'PROFILE',
  MEETINGS = 'MEETINGS',
  LIKES = 'LIKES',
  SUBSCRIPTION = 'SUBSCRIPTION',
  PERKS = 'PERKS',
  GOLDEN = 'GOLDEN',
  USER_DETAILS = 'USER_DETAILS'
}

export enum AuthStep {
  LANDING = 'LANDING',
  SIGNUP = 'SIGNUP',
  PROFILE_SETUP = 'PROFILE_SETUP',
  AVAILABILITY = 'AVAILABILITY',
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

export enum ConversationDepth {
  LIGHT = 'Light & curious',
  THOUGHTFUL = 'Warm & thoughtful',
  DEEP = 'Deep & inside out',
  INTENSE = 'Bold & challenging'
}

export enum MeetingIntent {
  ONE_OFF = 'One-off',
  OCCASIONAL = 'Maybe a few sessions, if it clicks',
  FOLLOW_UP = 'Ongoing, if it clicks'
}

export type SelfDefinition = 'Pro' | 'Fierce enthusiast' | 'Fan' | 'Learner' | 'First-stepper';

export interface Milestone {
  id: string;
  label: string;
  description: string;
  date: Date;
}

export interface User {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  rating: number;
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
  interestDuration?: {
    value: number;
    unit: 'Weeks' | 'Months' | 'Years';
  };
  selfDefinition?: SelfDefinition;
  personality: PersonalityType;
  preferredTime: TimeOfDay;
  depth?: ConversationDepth;
  intent?: MeetingIntent;
  isGolden?: boolean;
  isOnline?: boolean;
  hasCompletedOnboarding?: boolean;
  milestones: Milestone[];
  identityLabel?: string;
  availability?: string[];
  automation?: {
    enabled: boolean;
    frequency: 'WEEKLY' | 'MONTHLY' | null;
  };
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