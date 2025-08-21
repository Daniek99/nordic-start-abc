// Temporary database types until Supabase types are properly generated
export interface Profile {
  id: string;
  name: string;
  email?: string;
  l1?: string;
  role: 'admin' | 'teacher' | 'learner';
  difficulty_level: number;
  classroom_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Classroom {
  id: string;
  name: string;
  created_at: string;
}

export interface DailyWord {
  id: string;
  norwegian: string;
  date: string;
  theme?: string;
  approved: boolean;
  created_by?: string;
  classroom_id: string;
  image_url?: string;
  image_alt?: string;
  created_at: string;
}

export interface AdminInviteLink {
  id: string;
  code: string;
  role: 'admin' | 'teacher' | 'learner';
  classroom_id: string;
  active: boolean;
  created_at: string;
}

export interface LevelText {
  id: string;
  dailyword_id: string;
  level: number;
  text: string;
  image_url?: string;
  image_alt?: string;
}

export interface Translation {
  id: string;
  dailyword_id: string;
  language_code: string;
  text: string;
}

export interface Task {
  id: string;
  dailyword_id: string;
  type: string;
  level: number;
  prompt?: string;
  answer?: any;
  data?: any;
}