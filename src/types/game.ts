export type GameStatus = 'waiting' | 'playing' | 'reveal' | 'finished' | 'abandoned';
export type RoundStatus = 'waiting_scan' | 'answering' | 'revealed' | 'closed';

export type Song = {
  id: string;
  title: string;
  artist: string;
  release_year: number;
  decade: number;
  genre: string;
  country: string;
  spotify_url: string;
  difficulty: number;
  image_url: string | null;
  tags: string[];
  is_active: boolean;
};

export type Player = {
  id: string;
  user_id?: string;
  name: string;
  avatar_id: string;
  ready: boolean;
  connected: boolean;
  score: number;
  streak: number;
  max_streak: number;
  exact_hits: number;
  near_hits: number;
};

export type TimelineCard = {
  id: string;
  song_id: string;
  acquired_round: number;
  song: Pick<Song, 'id' | 'title' | 'artist' | 'release_year' | 'image_url' | 'genre'>;
};

export type RoundAnswer = {
  intended_index: number | null;
  title_guess: string | null;
  title_correct: boolean;
  title_score: number;
  distance: number | null;
  base_score: number;
  streak_bonus: number;
  total_score: number;
  is_exact: boolean;
  is_late: boolean;
  player?: Pick<Player, 'id' | 'name' | 'avatar_id'>;
};

export type GameState = {
  role: 'host' | 'player';
  game: {
    id: string;
    code: string;
    status: GameStatus;
    mode: string;
    current_round: number;
    total_rounds: number;
    time_limit: number;
    reveal_seconds: number;
    max_players: number;
    theme: string;
    scoring: Record<string, number>;
  };
  players: Player[];
  me: Player | null;
  round: null | {
    id: string;
    round_number: number;
    status: RoundStatus;
    started_at: string | null;
    answer_deadline: string | null;
    reveal_ends_at: string | null;
    scan_url?: string;
    response_count: number;
    song?: Pick<Song, 'id' | 'title' | 'artist' | 'release_year' | 'image_url' | 'genre' | 'country'>;
    answers?: RoundAnswer[];
    my_answer?: RoundAnswer | null;
  };
  timeline: TimelineCard[];
  results?: Array<{
    user_id: string;
    player_name: string;
    avatar_id: string;
    score: number;
    exact_hits: number;
    max_streak: number;
    rank: number;
  }>;
};
