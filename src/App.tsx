import { useCallback, useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { SimulatorView } from './components/SimulatorView';
import { ScenesCatalogView } from './components/ScenesCatalogView';
import { DeployStatusView } from './components/DeployStatusView';
import type {
  ActiveTab,
  HealthResponse,
  SceneSummary,
  ScenesInventoryResponse,
} from './types/ui';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const [scenes, setScenes] = useState<SceneSummary[]>([]);
  const [scenesLoading, setScenesLoading] = useState(true);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [requestedScene, setRequestedScene] = useState<{ id: string; nonce: number } | null>(null);

  const loadScenes = useCallback(async () => {
    setScenesLoading(true);
    try {
      const res = await fetch('/api/scenes');
      const data = (await res.json()) as ScenesInventoryResponse;
      if (data.ok && Array.isArray(data.scenes)) {
        setScenes(data.scenes);
      }
    } catch {
      // Keep empty list cleanly if offline
    } finally {
      setScenesLoading(false);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/health');
      const data = (await res.json()) as HealthResponse;
      setHealth(data);
    } catch {
      // Non-blocking fallback
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadScenes();
    void loadHealth();
  }, [loadScenes, loadHealth]);

  const handlePlayScene = (sceneId: string) => {
    setActiveTab('simulator');
    setRequestedScene((prev) => ({ id: sceneId, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  const handleQuickPlay = () => {
    handlePlayScene('__random__');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-950">
      <TopBar activeTab={activeTab} onSelectTab={setActiveTab} onQuickPlay={handleQuickPlay} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-1 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-950">
              {activeTab === 'simulator' && 'Симулятор дуэли'}
              {activeTab === 'scenes' && 'Сцены 32×11'}
              {activeTab === 'deploy' && 'Деплой и диагностика'}
            </h1>
            <p className="mt-0.5 text-sm text-zinc-600">
              {activeTab === 'simulator' &&
                'Визуальный профиль бота, живое проигрывание ASCII-анимаций и чистые HTML-карточки.'}
              {activeTab === 'scenes' &&
                'Полная коллекция из 34 сценариев без лишних эмодзи и визуального шума.'}
              {activeTab === 'deploy' &&
                'Применение фото профиля и описаний строго на этапе деплоя, без нагрузки на чат.'}
            </p>
          </div>
          <span className="font-mono text-xs text-zinc-400 tabular-nums">
            {scenes.length > 0 ? `${scenes.length} сцен · 32×11` : 'Telegram Bot Console'}
          </span>
        </div>

        {activeTab === 'simulator' && (
          <SimulatorView scenes={scenes} requestedScene={requestedScene} />
        )}
        {activeTab === 'scenes' && (
          <ScenesCatalogView
            scenes={scenes}
            loading={scenesLoading}
            onPlayScene={handlePlayScene}
          />
        )}
        {activeTab === 'deploy' && (
          <DeployStatusView health={health} loading={healthLoading} onRefresh={loadHealth} />
        )}
      </main>
    </div>
  );
}
