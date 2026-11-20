export type ActiveTab = 'simulator' | 'scenes' | 'deploy';

export type AsciiSceneCategory =
  | 'duel'
  | 'animal'
  | 'transport'
  | 'magic'
  | 'sci_fi'
  | 'disaster'
  | 'absurd'
  | 'sport';

export interface SceneSummary {
  id: string;
  title: string;
  type: AsciiSceneCategory;
  typeLabel: string;
  description: string;
  durationMs: number;
}

export interface ScenesInventoryResponse {
  ok: boolean;
  totalScenes: number;
  byType: Record<string, number>;
  scenes: SceneSummary[];
  profileTemplate?: {
    shortDescription: string;
    description: string;
    commands: Array<{ command: string; description: string }>;
  };
}

export interface SceneFramesResponse {
  ok: boolean;
  scene: {
    id: string;
    title: string;
    type: AsciiSceneCategory;
    description: string;
    frameDelayMs: number;
  };
  frames: string[];
}

export interface DiagnosticCheckItem {
  id: string;
  label: string;
  status: 'ok' | 'warn' | 'fail';
  detail: string;
  hint?: string;
}

export interface HealthResponse {
  ok: boolean;
  checks: DiagnosticCheckItem[];
  expectedWebhookUrl: string | null;
  botProfile?: {
    username: string | null;
    firstName: string | null;
    avatarReady: boolean;
    desiredShortDescription: string;
    desiredDescription: string;
    liveShortDescription: string | null;
    liveDescription: string | null;
    synced: boolean;
  };
  service: string;
  database: string;
  telegramConfigured: boolean;
  webhookSecretConfigured: boolean;
  asciiScenes?: {
    totalScenes: number;
    byType: Record<string, number>;
  };
  serverTime: string;
}

export type SimPanelMode = 'menu' | 'score' | 'history' | 'stats' | 'settings';

export interface SimPlayer {
  id: 'kirill' | 'denis';
  name: string;
  missed: number;
  callbacks: number;
}

export interface SimMissEvent {
  id: string;
  actorId: 'kirill' | 'denis';
  recipientId: 'kirill' | 'denis';
  sceneId: string;
  sceneTitle: string;
  status: 'animating' | 'pending' | 'confirmed' | 'disputed' | 'cancelled';
  createdAt: string;
}
