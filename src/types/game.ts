import type { PixelCharacterId } from '../../lib/bot/pixelCharacters.js';

export type EventStatus = 'pending' | 'confirmed' | 'disputed' | 'cancelled';

export type EventType = 'missed_call' | 'callback';

export type SpriteState =
  | 'idle'
  | 'walking'
  | 'celebrating'
  | 'falling'
  | 'victory'
  | 'fatality_ready'
  | 'fatality_strike';

export type AvatarId = 'photo_hero' | 'fox_orange' | 'frog_green' | 'cat_amber' | 'owl_brown';

export interface Profile {
  id: string;
  display_name: string;
  custom_name?: boolean;
  pixel_character?: PixelCharacterId;
  avatar: AvatarId;
  telegram_id: string | null;
  telegram_username: string | null;
  created_at: string;
}

export interface RankTier {
  min_steps: number;
  title: string;
}

export interface Pair {
  id: string;
  invitation_code: string;
  status: 'waiting' | 'active';
  finish_threshold: number;
  cooldown_seconds: number;
  custom_ranks: RankTier[] | null;
  group_chat_id?: string | null;
  last_animation_file?: string | null;
  recent_scenes?: string[] | null;
  round_started_at?: string | null;
  fast_animation?: boolean;
  web_token?: string;
  created_at: string;
}

export interface PairMember {
  id: string;
  pair_id: string;
  user_id: string;
  lane_index: 0 | 1;
  joined_at: string;
}

export interface CallEvent {
  id: string;
  pair_id: string;
  actor_id: string;
  recipient_id: string;
  event_type: EventType;
  status: EventStatus;
  steps_awarded: number;
  note: string | null;
  target_chat_id?: string | null;
  scene_id?: string | null;
  animation_file?: string | null;
  animation_message_id?: string | null;
  animation_expires_at?: string | null;
  animation_deleted_at?: string | null;
  result_message_id?: string | null;
  created_at: string;
  resolved_at: string | null;
  idempotency_key: string;
}

export interface BotConnection {
  id: string;
  user_id: string;
  telegram_chat_id: string;
  connected_at: string;
  notification_enabled: boolean;
}

export interface DemoNotificationLog {
  id: string;
  recipient_user_id: string;
  recipient_name: string;
  title: string;
  message: string;
  buttons: string[];
  delivered: boolean;
  mode: 'demo' | 'telegram';
  created_at: string;
}

export interface PlayerProgress {
  userId: string;
  profile: Profile;
  laneIndex: 0 | 1;
  confirmedSteps: number;
  pendingSteps: number;
  disputedCount: number;
  callbacksCount: number;
  remainingSteps: number;
  progressPercent: number;
  currentRank: RankTier;
  nextRank: RankTier | null;
  hasReachedFinish: boolean;
  botConnected: boolean;
}

export interface GameStats {
  totalConfirmedMisses: number;
  totalCallbacks: number;
  weekEventsCount: number;
  monthEventsCount: number;
  mostMissedUserId: string | null;
  mostCallbacksUserId: string | null;
  weeklyLeaderUserId: string | null;
  weeklyBreakdown: Array<{
    userId: string;
    displayName: string;
    missedWeek: number;
    callbacksWeek: number;
    missedMonth: number;
    confirmedTotal: number;
    currentRankTitle: string;
  }>;
}

export interface GameSnapshot {
  mode: 'demo' | 'supabase';
  telegramConfigured: boolean;
  telegramBotUsername: string | null;
  currentUserId: string;
  pair: Pair | null;
  members: Profile[];
  laneMembers: PairMember[];
  players: [PlayerProgress, PlayerProgress] | PlayerProgress[];
  events: CallEvent[];
  stats: GameStats;
  botConnections: BotConnection[];
  demoNotifications: DemoNotificationLog[];
  cooldownRemainingSeconds: number;
  serverTime: string;
}
