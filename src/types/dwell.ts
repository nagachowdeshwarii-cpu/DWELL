export type SleepSchedule = 'early' | 'balanced' | 'night';
export type FoodHabit = 'vegetarian' | 'eggetarian' | 'non-veg' | 'vegan';
export type SmokingStatus = 'non-smoker' | 'outside-only' | 'smoker';
export type PetStatus = 'no-pets' | 'pet-friendly' | 'has-pet';
export type SocialVibe = 'quiet' | 'balanced' | 'social';
export type RoleType = 'Student' | 'Fresher';
export type GenderType = 'Woman' | 'Man' | 'Non-binary';

export interface DealBreakers {
  noSmoking: boolean;
  vegetarianKitchenOnly: boolean;
  noPets: boolean;
  quietAfterEleven: boolean;
  verifiedOnly: boolean;
  sameGenderOnly: boolean;
}

export interface FaceVerificationChecks {
  singleFaceDetected: boolean;
  clearUnobstructedFace: boolean;
  antiSpoofPassed: boolean;
  idFaceMatch: boolean;
  idCompared: boolean;
  captureSource: 'camera' | 'upload';
  verifiedAt: string;
}

export interface UserProfile {
  name: string;
  age: number;
  avatarUrl?: string;
  role: RoleType;
  institution: string;
  targetCity: string;
  moveInMonth: string;
  monthlyBudgetUsd: number;
  gender: GenderType;
  sleepSchedule: SleepSchedule;
  quietAfterEleven: boolean;
  cleanliness: number; // 1 to 5
  foodHabit: FoodHabit;
  cookingFrequency: 'daily' | 'weekly' | 'rarely';
  languages: string[];
  culturalOpenness: 'same-culture' | 'mixed-culture';
  socialVibe: SocialVibe;
  smoking: SmokingStatus;
  pets: PetStatus;
  verified: boolean;
  faceVerified?: boolean;
  faceConfidence?: number;
  verificationMethod?: string;
  verificationChecks?: FaceVerificationChecks;
  bio: string;
  dealBreakers: DealBreakers;
  quizCompleted: boolean;
}

export interface RoommateProfile {
  id: string;
  name: string;
  age: number;
  avatarUrl: string;
  role: RoleType;
  institution: string;
  city: string;
  neighborhoods: string[];
  moveInMonth: string;
  monthlyBudgetUsd: number;
  gender: GenderType;
  sleepSchedule: SleepSchedule;
  quietAfterEleven: boolean;
  cleanliness: number; // 1 to 5
  foodHabit: FoodHabit;
  cookingFrequency: 'daily' | 'weekly' | 'rarely';
  languages: string[];
  culturalBackground: string;
  socialVibe: SocialVibe;
  smoking: SmokingStatus;
  pets: PetStatus;
  verified: boolean;
  verificationDetail: string;
  bio: string;
  autoReplyHints: string[];
}

export type ConnectionState = 'none' | 'incoming' | 'sent' | 'mutual' | 'declined';

export interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  timestamp: string;
}

export interface CompatibilityBreakdown {
  overallScore: number;
  sleepScore: number;
  cleanlinessScore: number;
  foodScore: number;
  cultureLanguageScore: number;
  sharedLanguages: string[];
  highlights: string[];
  differences: string[];
  dealBreakerResult: {
    passed: boolean;
    violatedRules: string[];
  };
}

export type ActiveTab = 'discover' | 'quiz' | 'requests' | 'messages';
