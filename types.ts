
export interface User {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  role: 'user' | 'admin';
  isVerified?: boolean;
  isMuted?: boolean;
  bio?: string;
}

export interface AppSettings {
  appName: string;
  appSlogan: string;
  appLogo: string;
  headerColor: string;
  backgroundUrl?: string; // إضافة رابط خلفية الدردشة
}

export interface Room {
  id: string;
  name: string;
  description: string;
  icon: string;
  createdBy: string;
  onlineCount?: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
  isAi?: boolean;
  isVerifiedSender?: boolean;
}

export interface VoiceSlot {
  id: string;
  userId: string | null;
  userName: string | null;
  userAvatar: string | null;
  isSpeaking: boolean;
  isMutedByAdmin: boolean;
  isLocalMuted?: boolean; // كتم محلي للمستخدم
}

export type AuthMode = 'login' | 'register';
