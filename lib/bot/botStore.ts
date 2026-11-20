import type {
  BotConnection,
  CallEvent,
  Pair,
  PairMember,
  Profile,
} from '../../src/types/game.js';
import {
  claimWebhookUpdate,
  createMissedCallEvent,
  findExpiredPendingAnimations,
  getEventById,
  getEventsForPair,
  releaseWebhookUpdate,
  updateEventLifecycle,
} from './events.js';
import { isUpstashConfigured } from './redis.js';
import {
  bindGroupChat,
  createPair,
  getPairById,
  getPairMembers,
  getUserPairId,
  joinPairByCode,
  leavePair,
  recordPlayedScene,
  updateSettings,
} from './storage.js';
import {
  getBotConnectionByUserId,
  getChatPanelMessageId,
  getPendingUserInput,
  getUserById,
  setChatPanelMessageId,
  setPendingUserInput,
  updateUserProfile,
  upsertTelegramUser,
} from './users.js';

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
  releaseWebhookUpdate?(updateId: number): Promise<void>;
  upsertTelegramUser(params: {
    telegramId: string;
    privateChatId?: string;
    displayName: string;
    username: string | null;
  }): Promise<Profile>;
  updateUserProfile(params: {
    userId: string;
    displayName?: string;
    pixelCharacter?: string;
  }): Promise<Profile | null>;
  getPairContextForUser(userId: string): Promise<PairContext>;
  getPairContextById(pairId: string): Promise<PairContext>;
  createPair(userId: string, groupChatId?: string | null): Promise<Pair>;
  joinPairByCode(userId: string, code: string, groupChatId?: string | null): Promise<Pair>;
  leavePair(userId: string): Promise<{ left: boolean; pair: Pair | null; partnerUserIds: string[] }>;
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
    fastAnimation?: boolean;
  }): Promise<void>;
  findExpiredPendingAnimations(nowIso?: string): Promise<CallEvent[]>;
  getChatPanelMessageId(chatId: string): Promise<number | null>;
  setChatPanelMessageId(chatId: string, messageId: number | null): Promise<void>;
  getPendingUserInput(userId: string): Promise<'name' | null>;
  setPendingUserInput(userId: string, mode: 'name' | null): Promise<void>;
}

export class UpstashBotStore implements BotStore {
  constructor(_persistPath?: string | null) {}

  isPersistentDatabase(): boolean {
    return isUpstashConfigured();
  }

  async claimWebhookUpdate(updateId: number): Promise<boolean> {
    return await claimWebhookUpdate(updateId);
  }

  async releaseWebhookUpdate(updateId: number): Promise<void> {
    await releaseWebhookUpdate(updateId);
  }

  async upsertTelegramUser(params: {
    telegramId: string;
    privateChatId?: string;
    displayName: string;
    username: string | null;
  }): Promise<Profile> {
    return await upsertTelegramUser(params);
  }

  async updateUserProfile(params: {
    userId: string;
    displayName?: string;
    pixelCharacter?: string;
  }): Promise<Profile | null> {
    return await updateUserProfile(params);
  }

  async getPairContextById(pairId: string): Promise<PairContext> {
    const [pair, members, events] = await Promise.all([
      getPairById(pairId),
      getPairMembers(pairId),
      getEventsForPair(pairId),
    ]);

    if (!pair) {
      return { pair: null, members: [], profiles: [], events: [], botConnections: [] };
    }

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

    return await this.getPairContextById(pairId);
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

  async leavePair(userId: string): Promise<{ left: boolean; pair: Pair | null; partnerUserIds: string[] }> {
    return await leavePair(userId);
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
    fastAnimation?: boolean;
  }): Promise<void> {
    await updateSettings(params);
  }

  async findExpiredPendingAnimations(nowIso?: string): Promise<CallEvent[]> {
    return await findExpiredPendingAnimations(nowIso);
  }

  async getChatPanelMessageId(chatId: string): Promise<number | null> {
    return await getChatPanelMessageId(chatId);
  }

  async setChatPanelMessageId(chatId: string, messageId: number | null): Promise<void> {
    await setChatPanelMessageId(chatId, messageId);
  }

  async getPendingUserInput(userId: string): Promise<'name' | null> {
    return await getPendingUserInput(userId);
  }

  async setPendingUserInput(userId: string, mode: 'name' | null): Promise<void> {
    await setPendingUserInput(userId, mode);
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
