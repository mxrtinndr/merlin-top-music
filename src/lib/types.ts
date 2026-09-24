export type Member = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** URL pública de la foto de perfil (Supabase Storage). Sin foto se usa el emoji. */
  avatar_url: string | null;
  has_pin: boolean;
  active: boolean;
  created_at: string;
};

/** Fila de la vista `daily_picks_summary`: la canción con sus estadísticas. */
export type DailyPick = {
  id: string;
  /** Fecha ISO (YYYY-MM-DD) en hora de Madrid. */
  date: string;
  presenter_id: string;
  song_title: string;
  song_artist: string;
  song_url: string | null;
  presenter_comment: string | null;
  next_presenter_id: string;
  created_at: string;
  ratings_count: number;
  avg_score: number | null;
};

export type Rating = {
  id: string;
  daily_pick_id: string;
  member_id: string;
  score: number;
  comment: string | null;
  created_at: string;
};

export type LeaderboardRow = {
  member_id: string;
  name: string;
  emoji: string;
  color: string;
  avatar_url: string | null;
  active: boolean;
  picks_count: number;
  ratings_count: number;
  avg_score: number | null;
  last_pick_date: string | null;
};

export type PickInput = {
  song_title: string;
  song_artist: string;
  song_url: string | null;
  presenter_comment: string | null;
  next_presenter_id: string;
};

export type MemberInput = {
  name: string;
  emoji: string;
  color: string;
};
