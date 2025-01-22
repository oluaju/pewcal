export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  created_at: string;
  updated_at: string;
}

export interface Calendar {
  id: string;
  google_calendar_id: string;
  name: string;
  owner_id: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarShare {
  id: string;
  calendar_id: string;
  user_id: string;
  role: 'editor' | 'viewer';
  created_at: string;
  updated_at: string;
} 