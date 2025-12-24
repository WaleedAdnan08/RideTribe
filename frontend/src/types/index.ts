// src/types/index.ts

export interface User {
  id: string; // Mapped from _id
  _id?: string; // Raw from backend
  name: string;
  phone: string;
  phoneNumber?: string; // Legacy support
  created_at?: string;
}

export type TrustLevel = "direct" | "activity-specific" | "emergency-only";
export type TribeMembershipStatus = "pending" | "accepted" | "declined";

export interface Tribe {
  id: string;
  _id?: string;
  owner_id: string;
  name: string;
  member_count: number;
  created_at?: string;
  membership_status?: TribeMembershipStatus;
}

export interface TribeMember {
  user: User;
  trust_level: TrustLevel;
  status: TribeMembershipStatus;
  joined_at: string;
}

export type RecurrencePattern = "once" | "daily" | "weekly";
export type ScheduleEntryStatus = "active" | "completed" | "cancelled";

export interface Geo {
  lat: number;
  lng: number;
}

export interface Destination {
  id: string;
  _id?: string;
  name: string;
  address: string;
  google_place_id?: string;
  geo?: Geo;
  category?: string;
  created_by?: string;
  created_at?: string;
  
  // Legacy/Mock compatibility
  latitude?: number;
  longitude?: number;
  verified_date?: string;
}

export interface ScheduleEntry {
  id: string;
  _id?: string;
  user_id: string;
  child_name: string;
  destination_id: string;
  destination?: Destination; // Enriched
  pickup_time: string; // ISO string
  dropoff_time?: string; // ISO string
  recurrence: RecurrencePattern;
  status: ScheduleEntryStatus;
  created_at?: string;
  
  // Legacy/Mock compatibility
  recurrence_pattern?: string;
  recurrence_details?: string;
  created_date?: string;
  last_modified_date?: string;
}

export type RideMatchStatus = "suggested" | "accepted" | "declined" | "completed" | "cancelled";

export interface RideMatch {
  id: string;
  _id?: string;
  requester_id: string;
  provider_id: string;
  schedule_entry_id: string;
  provider_schedule_id?: string;
  match_score: number;
  status: RideMatchStatus;
  created_at?: string;
  
  // Enriched fields
  requester?: User;
  provider?: User;
  schedule?: ScheduleEntry;

  // Legacy/Mock compatibility
  suggested_date?: string;
  created_date?: string;
}

export interface Notification {
  id: string;
  _id?: string;
  user_id: string;
  type: "match_found" | "invite_received" | "invite_accepted" | "ride_accepted";
  message: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}