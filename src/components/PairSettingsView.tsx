import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  ExternalLink,
  LogOut,
  RefreshCw,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  PIXEL_CHARACTERS,
  resolvePixelCharacter,
  type PixelCharacterId,
} from '../../lib/bot/pixelCharacters';
import type { PairStateResponse } from '../types/ui';
import { PixelDuelArena } from './PixelDuelArena';
import { PixelSprite } from './PixelSprite';

interface PairSettingsViewProps {
  pairId: string | null;
  pairToken: string | null;
  viewerId: string | null;
  onOpenSimulator: () => void;
  onPairLeft?: () => void;
}

interface PlayerDraft {
  userId: string;
  laneIndex: 0 | 1;
  displayName: string;
  pixelCharacter: PixelCharacterId;
}

export function PairSettingsView({
  pairId,
  pairToken,
  viewerId,
  onOpenSimulator,
  onPairLeft,
}: PairSettingsViewProps) {
  const [data, setData] = useState<PairStateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leftPair, setLeftPair] = useState(false);

  const [playerDrafts, setPlayerDrafts] = useState<PlayerDraft[]>([]);
  const [finishThreshold, setFinishThreshold] = useState<number>(20);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(60);
  const [fastAnimation, setFastAnimation] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  const hydrateDrafts = useCallback((res: PairStateResponse) => {
    if (!res.ok || !res.pair || !res.players) return;
    setPlayerDrafts(
      res.players.map((p) => ({
        userId: p.userId,
        laneIndex: p.laneIndex,
        displayName: p.profile.display_name,
        pixelCharacter: resolvePixelCharacter(p.profile.pixel_character, p.laneIndex).id,
      }))
    );
    setFinishThreshold(res.pair.finish_threshold);
    setCooldownSeconds(res.pair.cooldown_seconds);
    setFastAnimation(Boolean(res.pair.fast_animation));
    setNotificationsEnabled(res.viewerNotificationsEnabled ?? true);
  }, []);

  const loadPair = useCallback(async () => {
    if (!pairId || !pairToken) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const qs = new URLSearchParams({ pair: pairId, token: pairToken });
      if (viewerId) qs.set('u', viewerId);
      const res = await fetch(`/api/pair/state?${qs.toString()}`);
      const json = (await res.json()) as PairStateResponse;
      if (!res.ok || !json.ok) {
        setErrorMsg(json.error || 'Не удалось загрузить настройки пары.');
        setData(null);
      } else {
        setData(json);
        hydrateDrafts(json);
      }
    } catch {
      setErrorMsg('Ошибка сети при загрузке пары.');
    } finally {
      setLoading(false);
    }
  }, [pairId, pairToken, viewerId, hydrateDrafts]);

  useEffect(() => {
    if (pairId && pairToken) {
      void loadPair();
    }
  }, [pairId, pairToken, loadPair]);

  const handleSave = async (resetRound = false) => {
    if (!pairId || !pairToken) return;
    setSaving(true);
    setSaveNotice(null);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/pair/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairId,
          token: pairToken,
          viewerId: data?.viewerId || viewerId || undefined,
          players: playerDrafts.map((p) => ({
            userId: p.userId,
            displayName: p.displayName.trim(),
            pixelCharacter: p.pixelCharacter,
          })),
          finishThreshold,
          cooldownSeconds,
          fastAnimation,
          notificationEnabled: notificationsEnabled,
          resetRound,
        }),
      });
      const json = (await res.json()) as PairStateResponse;
      if (!res.ok || !json.ok) {
        setErrorMsg(json.error || 'Не удалось сохранить изменения.');
      } else {
        setData(json);
        hydrateDrafts(json);
        setConfirmReset(false);
        setSaveNotice(
          resetRound
            ? 'Новый раунд начат — счёт 0:0, изменения сохранены в боте.'
            : 'Сохранено — имена и пиксельные персонажи обновлены в Telegram.'
        );
      }
    } catch {
      setErrorMsg('Ошибка сети при сохранении.');
    } finally {
      setSaving(false);
    }
  };

  const handleLeavePair = async () => {
    if (!pairId || !pairToken) return;
    setLeaving(true);
    setErrorMsg(null);
    setSaveNotice(null);
    try {
      const res = await fetch('/api/pair/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairId,
          token: pairToken,
          viewerId: data?.viewerId || viewerId || undefined,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setErrorMsg(json.error || 'Не удалось выйти из пары.');
      } else {
        window.history.replaceState({}, '', window.location.pathname);
        setLeftPair(true);
        setData(null);
        setConfirmLeave(false);
        onPairLeft?.();
      }
    } catch {
      setErrorMsg('Ошибка сети при выходе из пары.');
    } finally {
      setLeaving(false);
    }
  };

  if (leftPair) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500">
          <LogOut className="h-3.5 w-3.5" />
          <span>Пара завершена</span>
        </div>
        <h2 className="mt-2 font-display text-lg font-bold text-zinc-950">Вы вышли из пары</h2>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-zinc-600">
          Связка отключена для обоих друзей. Теперь в Telegram-боте можно сразу создать новую
          пару или ввести код приглашения от другого друга.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenSimulator}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Открыть симулятор</span>
          </button>
        </div>
      </div>
    );
  }

  // Unlinked view (visited website directly without ?pair=...&token=...)
  if (!pairId || !pairToken) {
    return (
      <div className="space-y-6">
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500">
                <Sliders className="h-3.5 w-3.5" />
                <span>Настройки пары в вебе</span>
              </div>
              <h2 className="font-display text-lg font-bold text-zinc-950">
                Откройте настройки прямо из Telegram-бота
              </h2>
              <p className="text-sm leading-relaxed text-zinc-600">
                Чтобы в чате Telegram оставалась только одна чистая кнопка действия без лишних
                панелей, все настройки вынесены сюда. Нажмите <b>«Настройки ↗»</b> в меню бота —
                эта страница откроется уже с вашей парой.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenSimulator}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Открыть симулятор</span>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-zinc-100 pt-5 sm:grid-cols-3">
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3.5">
              <div className="font-mono text-xs text-zinc-400">01 · ИМЕНА</div>
              <div className="mt-1 text-sm font-semibold text-zinc-950">Ники без «...»</div>
              <p className="mt-1 text-xs text-zinc-600">
                Задайте короткие понятные имена для обоих друзей в боте (/name) или здесь на сайте.
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3.5">
              <div className="font-mono text-xs text-zinc-400">02 · ПЕРСОНАЖИ</div>
              <div className="mt-1 text-sm font-semibold text-zinc-950">Пиксельная шкала</div>
              <p className="mt-1 text-xs text-zinc-600">
                Каждый выбирает своего 12×12 пиксельного героя, который шагает по трассе к финишу.
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3.5">
              <div className="font-mono text-xs text-zinc-400">03 · ЧИСТЫЙ ЧАТ</div>
              <div className="mt-1 text-sm font-semibold text-zinc-950">Авто-очистка</div>
              <p className="mt-1 text-xs text-zinc-600">
                Бот сам удаляет старые панели, команды и кадры — в чате всегда только актуальная карточка.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-zinc-950">
                Коллекция пиксельных героев
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                8 персонажей 12×12 — можно примерить в симуляторе или назначить для своей пары из Telegram.
              </p>
            </div>
            <span className="font-mono text-xs text-zinc-400">8 героев</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PIXEL_CHARACTERS.map((hero) => (
              <div
                key={hero.id}
                className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50/70 p-3"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-zinc-200 bg-white">
                  <PixelSprite characterId={hero.id} size={32} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-950">{hero.name}</div>
                  <div className="truncate text-[11px] text-zinc-500">{hero.tagline}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-zinc-400">
                    TG: {hero.tgGlyph}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
        Загружаем данные вашей пары...
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-white p-6">
        <h2 className="font-display text-base font-bold text-zinc-950">Не удалось открыть пару</h2>
        <p className="mt-1 text-sm text-red-600">{errorMsg}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadPair()}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Повторить</span>
          </button>
          <button
            type="button"
            onClick={onOpenSimulator}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
          >
            <span>Перейти в симулятор</span>
          </button>
        </div>
      </div>
    );
  }

  const pair = data?.pair;
  const players = data?.players || [];
  const events = data?.events || [];

  const arenaEntries = players.map((p) => {
    const draft = playerDrafts.find((d) => d.userId === p.userId);
    return {
      id: p.userId,
      name: draft?.displayName.trim() || p.profile.display_name,
      laneIndex: p.laneIndex,
      characterId: draft?.pixelCharacter || p.profile.pixel_character,
      confirmedSteps: p.confirmedSteps,
      pendingSteps: p.pendingSteps,
      rankTitle: p.currentRank.title,
      isViewer: p.userId === data?.viewerId,
    };
  });

  return (
    <div className="space-y-6">
      {/* Live Pixel Duel Arena reflecting unsaved preview in real time */}
      <PixelDuelArena players={arenaEntries} finishThreshold={finishThreshold} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Names & Pixel Character Selectors */}
        <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-zinc-950">
                Имена и пиксельные герои
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Отображаются на шкале счёта в боте и на сайте вместо системного ника Telegram.
              </p>
            </div>
            {pair && (
              <span className="font-mono text-xs text-zinc-400">{pair.invitation_code}</span>
            )}
          </div>

          <div className="space-y-5">
            {playerDrafts.map((draft, idx) => (
              <div
                key={draft.userId}
                className="rounded-md border border-zinc-200 bg-zinc-50/60 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white">
                      <PixelSprite
                        characterId={draft.pixelCharacter}
                        laneIndex={draft.laneIndex}
                        size={32}
                      />
                    </div>
                    <div>
                      <div className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                        Игрок {idx + 1}
                        {draft.userId === data?.viewerId ? ' · вы' : ''}
                      </div>
                      <div className="text-sm font-semibold text-zinc-950">
                        {resolvePixelCharacter(draft.pixelCharacter, draft.laneIndex).name}
                      </div>
                    </div>
                  </div>

                  <div className="sm:w-56">
                    <label
                      htmlFor={`player-name-${draft.userId}`}
                      className="sr-only"
                    >
                      Имя игрока {idx + 1}
                    </label>
                    <input
                      id={`player-name-${draft.userId}`}
                      type="text"
                      maxLength={24}
                      value={draft.displayName}
                      placeholder="Короткое имя (до 24 симв.)"
                      onChange={(e) => {
                        const val = e.target.value;
                        setPlayerDrafts((prev) =>
                          prev.map((item) =>
                            item.userId === draft.userId ? { ...item, displayName: val } : item
                          )
                        );
                      }}
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-8">
                  {PIXEL_CHARACTERS.map((hero) => {
                    const selected = draft.pixelCharacter === hero.id;
                    return (
                      <button
                        key={hero.id}
                        type="button"
                        onClick={() =>
                          setPlayerDrafts((prev) =>
                            prev.map((item) =>
                              item.userId === draft.userId
                                ? { ...item, pixelCharacter: hero.id }
                                : item
                            )
                          )
                        }
                        title={`${hero.name} — ${hero.tagline}`}
                        className={`flex flex-col items-center justify-center rounded border p-1.5 transition-colors ${
                          selected
                            ? 'border-zinc-950 bg-white ring-1 ring-zinc-950'
                            : 'border-zinc-200 bg-white/70 hover:bg-white'
                        }`}
                      >
                        <PixelSprite characterId={hero.id} size={24} />
                        <span className="mt-1 truncate text-[10px] font-medium text-zinc-700">
                          {hero.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Rules, Notifications & Save */}
        <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="font-display text-base font-bold text-zinc-950">Правила раунда</h2>
            <button
              type="button"
              onClick={() => void loadPair()}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Обновить</span>
            </button>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <label
                htmlFor="pair-threshold"
                className="flex items-center justify-between text-xs font-medium text-zinc-700"
              >
                <span>Лимит финиша (шагов до титула)</span>
                <span className="font-mono font-semibold text-zinc-950 tabular-nums">
                  {finishThreshold}
                </span>
              </label>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 20].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setFinishThreshold(v)}
                    className={`rounded border py-1.5 font-mono text-xs font-medium transition-colors tabular-nums ${
                      finishThreshold === v
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="pair-cooldown"
                className="flex items-center justify-between text-xs font-medium text-zinc-700"
              >
                <span>Пауза между пропусками</span>
                <span className="font-mono font-semibold text-zinc-950 tabular-nums">
                  {cooldownSeconds}с
                </span>
              </label>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {[0, 30, 60, 180].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCooldownSeconds(v)}
                    className={`rounded border py-1.5 font-mono text-xs font-medium transition-colors tabular-nums ${
                      cooldownSeconds === v
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {v === 0 ? 'Без' : `${v}с`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFastAnimation((v) => !v)}
                className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                  fastAnimation
                    ? 'border-zinc-950 bg-zinc-950 text-white'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <div className="font-semibold">Темп анимации</div>
                <div className={`mt-0.5 ${fastAnimation ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  {fastAnimation ? 'Быстрый (5 кадров)' : 'Полный (8 кадров)'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNotificationsEnabled((v) => !v)}
                className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                  notificationsEnabled
                    ? 'border-zinc-950 bg-zinc-50 text-zinc-950'
                    : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                <div className="font-semibold">Личные уведомления</div>
                <div className="mt-0.5 text-zinc-500">
                  {notificationsEnabled ? 'Включены' : 'Выключены'}
                </div>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {saveNotice && (
            <div className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span>{saveNotice}</span>
            </div>
          )}

          <div className="space-y-2 border-t border-zinc-100 pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave(false)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#E5484D] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#cf393e] disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Сохраняем...' : 'Сохранить настройки'}</span>
            </button>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Начать новый раунд (сбросить счёт)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50/70 p-2">
                <span className="flex-1 text-xs font-medium text-red-900">
                  Сбросить текущий счёт?
                </span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave(true)}
                  className="rounded bg-[#E5484D] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#cf393e]"
                >
                  Да
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                >
                  Отмена
                </button>
              </div>
            )}

            {!confirmLeave ? (
              <button
                type="button"
                onClick={() => setConfirmLeave(true)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:border-red-200 hover:bg-red-50/50 hover:text-red-700"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Выйти из пары</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50/70 p-2">
                <span className="flex-1 text-xs font-medium text-red-900">
                  Точно выйти из пары для обоих?
                </span>
                <button
                  type="button"
                  disabled={leaving}
                  onClick={() => void handleLeavePair()}
                  className="rounded bg-[#E5484D] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#cf393e] disabled:opacity-60"
                >
                  {leaving ? '...' : 'Да, выйти'}
                </button>
                <button
                  type="button"
                  disabled={leaving}
                  onClick={() => setConfirmLeave(false)}
                  className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                >
                  Отмена
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Pair Event Feed */}
      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-500" />
            <h3 className="font-display text-sm font-semibold text-zinc-950">
              Последние события пары
            </h3>
          </div>
          <span className="font-mono text-xs text-zinc-400 tabular-nums">
            {events.length} записей
          </span>
        </div>

        {events.length === 0 ? (
          <p className="mt-3 text-xs text-zinc-500">
            Пока событий нет — нажмите «Он не поднял трубку» в Telegram-боте.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100 text-xs">
            {events.slice(0, 10).map((ev) => {
              const actor = players.find((p) => p.userId === ev.actor_id);
              const rec = players.find((p) => p.userId === ev.recipient_id);
              const actorName =
                playerDrafts.find((d) => d.userId === ev.actor_id)?.displayName ||
                actor?.profile.display_name ||
                'Игрок';
              const recName =
                playerDrafts.find((d) => d.userId === ev.recipient_id)?.displayName ||
                rec?.profile.display_name ||
                'Друг';
              const stamp = new Date(ev.created_at).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <li key={ev.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="text-zinc-700">
                    <span className="font-mono text-zinc-400 tabular-nums">{stamp}</span>
                    {' · '}
                    {ev.event_type === 'callback'
                      ? `${actorName} перезвонил(а) ${recName}`
                      : `${actorName} → ${recName}`}
                  </span>
                  <span className="font-mono text-zinc-500">
                    {ev.event_type === 'callback'
                      ? 'перезвон'
                      : ev.status === 'confirmed'
                        ? '+1 шаг'
                        : ev.status === 'disputed'
                          ? 'оспорен'
                          : ev.status === 'cancelled'
                            ? 'отменён'
                            : 'ожидает'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
