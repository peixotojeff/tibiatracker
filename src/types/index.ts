// src/types/index.ts
export type XPLog = {
  id: string;
  user_id: string;
  character_name: string;
  xp: number;
  date: string; // formato ISO: "2026-01-14"
  created_at?: string;
};