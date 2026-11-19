import type {
  BotConnection,
  CallEvent,
  Pair,
  PairMember,
  Profile,
} from '../../src/types/game';
import {
  claimWebhookUpdate,
  createMissedCallEvent,
  findExpiredPendingAnimations,
  getEventById,
  getEventsForPair,
  updateEventLifecycle,
} from './events';
import { isUpstashConfigured } from './redis';
import {
  bindGroupChat,
  createPair,
  getPairById,
  getPairMembers,
  getUserPairId,
  joinPairByCode,
  recordPlayedScene,
  updateSettings,
} from './storage';
import {
  getBotConnectionByUserId,
  getUserById,
  upsertTelegramUser,
} from './users';

export interface PairContext {
  pair: Pair | null;
  members: PairMember[];
  profiles: Profile[];
  events: CallEvent[];
  botConnections: BotConnection[];
}

export interface BotStore {
  isPersistentDatabase(): boolean;
  claimWebhookUpdate(updateId: number): Promise<boolean>;
  upsertTelegramUser(params: {
    telegramId: string;
    privateChatId?: string;
    displayName: string;
    username: string | null;
  }): Promise<Profile>;
  getPairContextForUser(userId: string): Promise<PairContext>;
  createPair(userId: string, groupChatId?: string | null): Promise<Pair>;
  joinPairByCode(userId: string, code: string, groupChatId?: string | null): Promise<Pair>;
  bindGroupChat(pairId: string, groupChatId: string | null): Promise<void>;
  recordPlayedScene(pairId: string, sceneId: string): Promise<void>;
  createMissedCallEvent(ev: Omit<CallEvent, 'id'>): Promise<CallEvent>;
  getEventById(eventId: string): Promise<CallEvent | null>;
  updateEventLifecycle(
    eventId: string,
    patch: Partial<
      Pick<
        CallEvent,
        | 'status'
        | 'resolved_at'
        | 'target_chat_id'
        | 'scene_id'
        | 'animation_file'
        | 'animation_message_id'
        | 'animation_expires_at'
        | 'animation_deleted_at'
        | 'result_message_id'
      >
    >
  ): Promise<CallEvent>;
  updateSettings(params: {
    userId: string;
    pairId: string;
    finishThreshold?: number;
    cooldownSeconds?: number;
    notificationEnabled?: boolean;
    roundStartedAt?: string;
  }): Promise<void>;
  findExpiredPendingAnimations(nowIso?: string): Promise<CallEvent[]>;
}

export class UpstashBotStore implements BotStore {
  constructor(_persistPath?: string | null) {}

  isPersistentDatabase(): boolean {
    return true;
  }

  async claimWebhookUpdate(updateId: number): Promise<boolean> {
    return await claimWebhookUpdate(updateId);
  }

  async upsertTelegramUser(params: {
    telegramId: string;
    privateChatId?: string;
    displayName: string;
    username: string | null;
  }): Promise<Profile> {
    return await upsertTelegramUser(params);
  }

  async getPairContextForUser(userId: string): Promise<PairContext> {
    const pairId = await getUserPairId(userId);
    if (!pairId) {
      const [profile, conn] = await Promise.all([
        getUserById(userId),
        getBotConnectionByUserId(userId),
      ]);
      return {
        pair: null,
        members: [],
        profiles: profile ? [profile] : [],
        events: [],
        botConnections: conn ? [conn] : [],
      };
    }

    const [pair, members, events] = await Promise.all([
      getPairById(pairId),
      getPairMembers(pairId),
      getEventsForPair(pairId),
    ]);

    const userIds = members.map((m: PairMember) => m.user_id);
    const [profiles, botConnections] = await Promise.all([
      Promise.all(userIds.map((uid: string) => getUserById(uid))),
      Promise.all(userIds.map((uid: string) => getBotConnectionByUserId(uid))),
    ]);

    return {
      pair,
      members,
      profiles: profiles.filter((p: Profile | null): p is Profile => Boolean(p)),
      events,
      botConnections: botConnections.filter((b: BotConnection | null): b is BotConnection => Boolean(b)),
    };
  }

  async createPair(userId: string, groupChatId?: string | null): Promise<Pair> {
    return await createPair(userId, groupChatId);
  }

  async joinPairByCode(
    userId: string,
    code: string,
    groupChatId?: string | null
  ): Promise<Pair> {
    return await joinPairByCode(userId, code, groupChatId);
  }

  async bindGroupChat(pairId: string, groupChatId: string | null): Promise<void> {
    await bindGroupChat(pairId, groupChatId);
  }

  async recordPlayedScene(pairId: string, sceneId: string): Promise<void> {
    await recordPlayedScene(pairId, sceneId);
  }

  async createMissedCallEvent(ev: Omit<CallEvent, 'id'>): Promise<CallEvent> {
    return await createMissedCallEvent(ev);
  }

  async getEventById(eventId: string): Promise<CallEvent | null> {
    return await getEventById(eventId);
  }

  async updateEventLifecycle(
    eventId: string,
    patch: Partial<
      Pick<
        CallEvent,
        | 'status'
        | 'resolved_at'
        | 'target_chat_id'
        | 'scene_id'
        | 'animation_file'
        | 'animation_message_id'
        | 'animation_expires_at'
        | 'animation_deleted_at'
        | 'result_message_id'
      >
    >
  ): Promise<CallEvent> {
    return await updateEventLifecycle(eventId, patch);
  }

  async updateSettings(params: {
    userId: string;
    pairId: string;
    finishThreshold?: number;
    cooldownSeconds?: number;
    notificationEnabled?: boolean;
    roundStartedAt?: string;
  }): Promise<void> {
    await updateSettings(params);
  }

  async findExpiredPendingAnimations(nowIso?: string): Promise<CallEvent[]> {
    return await findExpiredPendingAnimations(nowIso);
  }
}

export { UpstashBotStore as LocalBotStore };

let sharedStore: BotStore | null = null;

export function getDefaultBotStore(): BotStore {
  if (isUpstashConfigured()) {
    return new UpstashBotStore();
  }
  if (!sharedStore) {
    sharedStore = new UpstashBotStore();
  }
  return sharedStore;
}
