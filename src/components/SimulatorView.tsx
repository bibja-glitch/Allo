import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PhoneMissed,
  PhoneIncoming,
  RotateCcw,
  FastForward,
  Check,
  ShieldAlert,
  Zap,
  Eye,
  RotateCw,
} from 'lucide-react';
import { getRankForSteps } from '../game/rules';
import type {
  SceneFramesResponse,
  SceneSummary,
  SimMissEvent,
  SimPanelMode,
  SimPlayer,
} from '../types/ui';

interface SimulatorViewProps {
  scenes: SceneSummary[];
  requestedScene: { id: string; nonce: number } | null;
}

const DEFAULT_SHORT_DESC =
  'АЛЛО, РОУД — минималистичная игра для двух друзей. Не взял трубку — получил +1 шаг к финалу.';

const DEFAULT_FULL_DESC = [
  'АЛЛО, РОУД — дуэль на внимательность для двух друзей.',
  '— Создайте пару и отправьте код другу',
  '— Если друг не поднял телефон — зафиксируйте пропуск',
  '— В чат прилетит короткая ASCII-сцена и счётчик раунда',
].join('\n');

function buildBar(steps: number, limit: number): string {
  const width = 10;
  const filled = Math.min(width, Math.max(0, Math.round((steps / Math.max(1, limit)) * width)));
  return '▰'.repeat(filled) + '▱'.repeat(width - filled);
}

export function SimulatorView({ scenes, requestedScene }: SimulatorViewProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [finishLimit, setFinishLimit] = useState<number>(10);
  const [fastMode, setFastMode] = useState<boolean>(false);
  const [dmEnvelopeMode, setDmEnvelopeMode] = useState<boolean>(false);
  const [actorId, setActorId] = useState<'kirill' | 'denis'>('kirill');
  const [panelMode, setPanelMode] = useState<SimPanelMode>('menu');

  const [players, setPlayers] = useState<Record<'kirill' | 'denis', SimPlayer>>({
    kirill: { id: 'kirill', name: 'Кирилл', missed: 0, callbacks: 0 },
    denis: { id: 'denis', name: 'Денис', missed: 0, callbacks: 0 },
  });

  const [events, setEvents] = useState<SimMissEvent[]>([]);
  const [activePlayback, setActivePlayback] = useState<{
    eventId: string | null;
    previewOnly: boolean;
    waitingOpen: boolean;
    sceneId: string;
    actorName: string;
    recipientName: string;
    sceneTitle: string;
    frames: string[];
    frameIndex: number;
    frameDelayMs: number;
    finished: boolean;
  } | null>(null);

  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [statusNote, setStatusNote] = useState<string>(
    'Выберите действие слева или внутри меню бота — интерфейс повторяет логику Telegram.'
  );

  const timerRef = useRef<number | null>(null);

  const recipientId: 'kirill' | 'denis' = actorId === 'kirill' ? 'denis' : 'kirill';
  const actor = players[actorId];
  const recipient = players[recipientId];

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  useEffect(() => {
    if (!activePlayback || activePlayback.finished || activePlayback.waitingOpen) return;
    if (activePlayback.frameIndex >= activePlayback.frames.length - 1) {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        setActivePlayback((prev) => (prev ? { ...prev, finished: true } : null));
        if (activePlayback.eventId) {
          setEvents((prev) =>
            prev.map((e) => (e.id === activePlayback.eventId ? { ...e, status: 'pending' } : e))
          );
        }
      }, activePlayback.frameDelayMs);
      return;
    }

    clearTimer();
    timerRef.current = window.setTimeout(() => {
      setActivePlayback((prev) =>
        prev ? { ...prev, frameIndex: Math.min(prev.frames.length - 1, prev.frameIndex + 1) } : null
      );
    }, activePlayback.frameDelayMs);

    return () => clearTimer();
  }, [activePlayback]);

  const startScenePlayback = async (
    sceneId: string,
    previewOnly: boolean,
    options?: { existingEventId?: string | null; holdAsEnvelope?: boolean }
  ) => {
    try {
      const winnerSide = actorId === 'kirill' ? 'left' : 'right';
      const params = new URLSearchParams({
        id: sceneId,
        side: winnerSide,
        winner: actor.name,
        loser: recipient.name,
        fast: fastMode ? '1' : '0',
      });
      const res = await fetch(`/api/scenes?${params.toString()}`);
      const data = (await res.json()) as SceneFramesResponse;
      if (!data.ok || !data.frames?.length) return;

      clearTimer();
      setRecentIds((prev) => [sceneId, ...prev.filter((x) => x !== sceneId)].slice(0, 6));

      let eventId: string | null = options?.existingEventId ?? null;
      const holdAsEnvelope = Boolean(options?.holdAsEnvelope && !previewOnly);

      if (!previewOnly && !eventId) {
        eventId = `ev_${Date.now()}`;
        const newEv: SimMissEvent = {
          id: eventId,
          actorId,
          recipientId,
          sceneId: data.scene.id,
          sceneTitle: data.scene.title,
          status: holdAsEnvelope ? 'pending' : 'animating',
          createdAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        };
        setEvents((prev) => [newEv, ...prev].slice(0, 20));
        setStatusNote(
          holdAsEnvelope
            ? `Друг получил закрытый конверт «${data.scene.title}» — анимация запустится при открытии.`
            : `Сцена «${data.scene.title}» воспроизводится. После финала появится карточка.`
        );
      } else if (previewOnly) {
        setStatusNote(`Превью сцены «${data.scene.title}» — счёт раунда не изменён.`);
      } else {
        setStatusNote(`Повтор сцены «${data.scene.title}» внутри карточки.`);
      }

      setActivePlayback({
        eventId,
        previewOnly,
        waitingOpen: holdAsEnvelope,
        sceneId: data.scene.id,
        actorName: actor.name,
        recipientName: recipient.name,
        sceneTitle: data.scene.title,
        frames: data.frames,
        frameIndex: 0,
        frameDelayMs: fastMode ? 550 : Math.min(850, data.scene.frameDelayMs || 850),
        finished: false,
      });
    } catch {
      setStatusNote('Не удалось загрузить кадры сцены с локального API.');
    }
  };

  useEffect(() => {
    if (!requestedScene) return;
    if (requestedScene.id === '__random__') {
      if (scenes.length === 0) return;
      const pool = scenes.filter((s) => !recentIds.includes(s.id));
      const pick = (pool.length > 0 ? pool : scenes)[Math.floor(Math.random() * (pool.length || scenes.length))];
      void startScenePlayback(pick.id, true);
    } else {
      void startScenePlayback(requestedScene.id, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedScene?.nonce]);

  const handleMissedCall = () => {
    if (scenes.length === 0) return;
    const pool = scenes.filter((s) => !recentIds.includes(s.id));
    const pick = (pool.length > 0 ? pool : scenes)[Math.floor(Math.random() * (pool.length || scenes.length))];
    void startScenePlayback(pick.id, false, { holdAsEnvelope: dmEnvelopeMode });
  };

  const handleOpenEnvelope = () => {
    if (!activePlayback) return;
    setActivePlayback((prev) =>
      prev ? { ...prev, waitingOpen: false, frameIndex: 0, finished: false } : null
    );
    setStatusNote(`Друг открыл сцену «${activePlayback.sceneTitle}» — анимация играет в реальном времени.`);
  };

  const handleReplayScene = () => {
    if (!activePlayback) return;
    void startScenePlayback(activePlayback.sceneId, activePlayback.previewOnly, {
      existingEventId: activePlayback.eventId,
      holdAsEnvelope: false,
    });
  };

  const handleCallback = () => {
    setPlayers((prev) => ({
      ...prev,
      [actorId]: { ...prev[actorId], callbacks: prev[actorId].callbacks + 1 },
    }));
    setStatusNote(`${actor.name} отметил перезвон (+1 в недельную сводку).`);
  };

  const handleRespond = (action: 'confirm' | 'dispute') => {
    if (!activePlayback?.eventId) return;
    const targetId = activePlayback.eventId;
    const ev = events.find((e) => e.id === targetId);
    if (!ev || ev.status !== 'pending') return;

    setEvents((prev) =>
      prev.map((item) =>
        item.id === targetId
          ? { ...item, status: action === 'confirm' ? 'confirmed' : 'disputed' }
          : item
      )
    );

    if (action === 'confirm') {
      setPlayers((prev) => ({
        ...prev,
        [ev.recipientId]: {
          ...prev[ev.recipientId],
          missed: prev[ev.recipientId].missed + 1,
        },
      }));
      setStatusNote(`${players[ev.recipientId].name} признал пропуск (+1 к счёту).`);
    } else {
      setStatusNote(`${players[ev.recipientId].name} оспорил событие — шаг не начислен.`);
    }
  };

  const handleResetRound = () => {
    clearTimer();
    setActivePlayback(null);
    setEvents([]);
    setPlayers({
      kirill: { id: 'kirill', name: 'Кирилл', missed: 0, callbacks: 0 },
      denis: { id: 'denis', name: 'Денис', missed: 0, callbacks: 0 },
    });
    setStatusNote('Раунд сброшен. Новый счёт 0 : 0.');
  };

  const finishPlaybackNow = () => {
    if (!activePlayback) return;
    clearTimer();
    setActivePlayback((prev) =>
      prev ? { ...prev, frameIndex: prev.frames.length - 1, finished: true } : null
    );
    if (activePlayback.eventId) {
      setEvents((prev) =>
        prev.map((e) => (e.id === activePlayback.eventId ? { ...e, status: 'pending' } : e))
      );
    }
  };

  const activeEvent = useMemo(
    () => (activePlayback?.eventId ? events.find((e) => e.id === activePlayback.eventId) || null : null),
    [activePlayback, events]
  );

  const kirillRank = getRankForSteps(players.kirill.missed, finishLimit);
  const denisRank = getRankForSteps(players.denis.missed, finishLimit);
  const champion =
    players.kirill.missed >= finishLimit
      ? players.kirill
      : players.denis.missed >= finishLimit
        ? players.denis
        : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left column: Bot Profile Preview & Pair Controls */}
      <div className="space-y-5 lg:col-span-5">
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-[#111214]">
              {avatarError ? (
                <div className="flex h-full w-full items-center justify-center font-mono text-lg font-semibold text-white">
                  АР
                </div>
              ) : (
                <img
                  src="/src/assets/images/bot_avatar_minimal_1795174484247.jpg"
                  alt="Минималистичный аватар Telegram-бота АЛЛО, РОУД!"
                  onError={() => setAvatarError(true)}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold text-zinc-950">АЛЛО, РОУД!</h2>
                <span className="font-mono text-xs text-zinc-500">bot · deploy-sync</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600">{DEFAULT_SHORT_DESC}</p>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3.5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              Экран «Что умеет этот бот?»
            </p>
            <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-zinc-700">
              {DEFAULT_FULL_DESC}
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-zinc-950">Управление дуэлью</h3>
            <span className="font-mono text-xs tabular-nums text-zinc-500">
              {players.kirill.missed} : {players.denis.missed} · лимит {finishLimit}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {([players.kirill, players.denis] as const).map((p) => {
              const rank = p.id === 'kirill' ? kirillRank.current : denisRank.current;
              const isSelected = actorId === p.id;
              return (
                <div
                  key={p.id}
                  className={`rounded-md border p-3 transition-colors ${
                    isSelected ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-950">{p.name}</span>
                      <span className="text-xs text-zinc-500">· {rank.title}</span>
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums text-zinc-950">
                      {p.missed}/{finishLimit}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="font-mono text-xs tracking-wider text-zinc-800">
                      {buildBar(p.missed, finishLimit)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActorId(p.id)}
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                        isSelected
                          ? 'bg-zinc-950 text-white'
                          : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {isSelected ? 'Звонит сейчас' : 'Выбрать звонящим'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleMissedCall}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#E5484D] px-3.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#cf393e]"
            >
              <PhoneMissed className="h-4 w-4" />
              <span>Он не поднял трубку</span>
            </button>
            <button
              type="button"
              onClick={handleCallback}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
            >
              <PhoneIncoming className="h-4 w-4" />
              <span>Перезвонил</span>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFastMode((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>{fastMode ? 'Темп: быстрый (5 кадр.)' : 'Темп: полный (8 кадр.)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setDmEnvelopeMode((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
                  dmEnvelopeMode
                    ? 'border-zinc-900 bg-zinc-950 text-white'
                    : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{dmEnvelopeMode ? 'Личка: конверт' : 'Чат: авто-запуск'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sim-limit" className="text-xs text-zinc-500">
                Финиш:
              </label>
              <select
                id="sim-limit"
                value={finishLimit}
                onChange={(e) => setFinishLimit(Number(e.target.value))}
                className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-800 tabular-nums"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
              <button
                type="button"
                onClick={handleResetRound}
                aria-label="Сбросить раунд"
                className="inline-flex items-center gap-1 rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Сброс</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Right column: Minimalist Telegram Chat Viewport */}
      <div className="lg:col-span-7">
        <section className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-[#111214] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 overflow-hidden rounded border border-zinc-700 bg-zinc-900">
                <img
                  src="/src/assets/images/bot_avatar_minimal_1795174484247.jpg"
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">АЛЛО, РОУД!</div>
                <div className="text-[11px] text-zinc-400">
                  чат {actor.name} → {recipient.name}
                </div>
              </div>
            </div>
            <span className="font-mono text-[11px] text-zinc-400">HTML · zero-clutter</span>
          </div>

          <div className="flex-1 space-y-4 bg-zinc-50 p-4 sm:p-5">
            {/* Active DM unopened envelope, ASCII playback, or Shame card */}
            {activePlayback && activePlayback.waitingOpen && (
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-zinc-950">ПРОПУЩЕННЫЙ ЗВОНОК</div>
                    <p className="mt-1 text-xs text-zinc-600">
                      {activePlayback.actorName} отметил пропуск · сработает, когда друг откроет сообщение
                    </p>
                  </div>
                  <span className="font-mono text-xs text-zinc-400">DM · конверт</span>
                </div>
                <div className="mt-3 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
                  Сцена «{activePlayback.sceneTitle}» ждёт открытия
                </div>
                <div className="mt-3.5 space-y-2">
                  <button
                    type="button"
                    onClick={handleOpenEnvelope}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-zinc-950 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Открыть сцену</span>
                  </button>
                  {activeEvent?.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleRespond('confirm')}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Признаю</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond('dispute')}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Оспорить</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activePlayback && !activePlayback.waitingOpen && !activePlayback.finished && (
              <div className="rounded-lg border border-zinc-800 bg-[#111214] p-4 text-zinc-100">
                <div className="mb-2.5 flex items-center justify-between gap-2 text-xs text-zinc-400">
                  <span className="font-medium text-white">{activePlayback.sceneTitle}</span>
                  <span className="font-mono tabular-nums">
                    {activePlayback.frameIndex + 1} / {activePlayback.frames.length}
                  </span>
                </div>
                <pre className="overflow-x-auto rounded bg-black/50 p-3 font-mono text-[11px] leading-[1.3] text-zinc-100 sm:text-xs">
                  {activePlayback.frames[activePlayback.frameIndex]}
                </pre>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-400">
                    {activePlayback.previewOnly
                      ? 'Режим превью · без записи в счёт'
                      : 'После финала кадры заменятся на карточку'}
                  </span>
                  <button
                    type="button"
                    onClick={finishPlaybackNow}
                    className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
                  >
                    <FastForward className="h-3.5 w-3.5" />
                    <span>К финалу</span>
                  </button>
                </div>
              </div>
            )}

            {activePlayback && activePlayback.finished && activePlayback.previewOnly && (
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-500">
                    Превью завершено · {activePlayback.sceneTitle}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleReplayScene}
                      className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-950"
                    >
                      <RotateCw className="h-3 w-3" />
                      <span>Повторить сцену</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePlayback(null)}
                      className="text-xs text-zinc-500 hover:text-zinc-900"
                    >
                      Скрыть
                    </button>
                  </div>
                </div>
                <pre className="mt-2.5 overflow-x-auto rounded bg-[#111214] p-3 font-mono text-[11px] leading-[1.3] text-zinc-100 sm:text-xs">
                  {activePlayback.frames[activePlayback.frames.length - 1]}
                </pre>
              </div>
            )}

            {activePlayback && activePlayback.finished && !activePlayback.previewOnly && activeEvent && (
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-zinc-950">Он не поднял трубку</div>
                    <p className="mt-1 text-xs text-zinc-600">
                      Звонил: <span className="font-medium text-zinc-900">{activePlayback.actorName}</span> ·
                      Не ответил: <span className="font-medium text-zinc-900">{activePlayback.recipientName}</span>
                    </p>
                  </div>
                  <span className="font-mono text-xs text-zinc-500">{activePlayback.sceneTitle}</span>
                </div>

                <div className="mt-3 border-l-2 border-zinc-300 pl-3 text-xs text-zinc-600">
                  {activeEvent.status === 'pending' &&
                    `Ожидает ответа ${activePlayback.recipientName} · +1 шаг при подтверждении`}
                  {activeEvent.status === 'confirmed' &&
                    `Подтверждено · ${players[activeEvent.recipientId].missed}/${finishLimit}`}
                  {activeEvent.status === 'disputed' && 'Оспорено получателем · балл не начислен'}
                </div>

                <div className="mt-3.5 space-y-2">
                  {activeEvent.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleRespond('confirm')}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-950 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Признаю (+1)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond('dispute')}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Оспорить</span>
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleReplayScene}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Повторить сцену</span>
                  </button>
                </div>
              </div>
            )}

            {champion && (
              <div className="rounded-lg border border-[#E5484D]/40 bg-[#E5484D]/5 p-4">
                <div className="text-sm font-bold text-zinc-950">Раунд завершён</div>
                <p className="mt-1 text-xs text-zinc-700">
                  {champion.name} набрал {champion.missed}/{finishLimit} пропусков и получил титул{' '}
                  <span className="font-semibold">ПРИДУРОК ГОДА</span>.
                </p>
              </div>
            )}

            {/* In-place Bot Panel (mirrors editOrSendPanel) */}
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                <span className="font-mono text-xs text-zinc-500">
                  Панель бота (обновляется на месте, не засоряя чат)
                </span>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      { id: 'menu', label: 'Меню' },
                      { id: 'score', label: 'Счёт' },
                      { id: 'stats', label: 'Сводка' },
                      { id: 'history', label: 'История' },
                      { id: 'settings', label: 'Настройки' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPanelMode(t.id)}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                        panelMode === t.id
                          ? 'bg-zinc-950 text-white'
                          : 'text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3.5 text-sm text-zinc-800">
                {panelMode === 'menu' && (
                  <div className="space-y-2.5">
                    <div className="font-semibold text-zinc-950">АЛЛО, РОУД</div>
                    <p className="text-xs leading-relaxed text-zinc-600">
                      Дуэль: Кирилл — Денис · Темп: {fastMode ? 'быстрый (5 кадр.)' : 'полный (8 кадр.)'}
                    </p>
                    <div className="space-y-1 font-mono text-xs text-zinc-800">
                      <div>
                        Кирилл: {players.kirill.missed}/{finishLimit} {buildBar(players.kirill.missed, finishLimit)}
                      </div>
                      <div>
                        Денис: &nbsp;{players.denis.missed}/{finishLimit} {buildBar(players.denis.missed, finishLimit)}
                      </div>
                    </div>
                  </div>
                )}

                {panelMode === 'score' && (
                  <div className="space-y-2">
                    <div className="font-semibold text-zinc-950">Счёт раунда</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-1.5">
                        <span>Кирилл · {kirillRank.current.title}</span>
                        <span className="font-mono font-semibold tabular-nums">
                          {players.kirill.missed}/{finishLimit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Денис · {denisRank.current.title}</span>
                        <span className="font-mono font-semibold tabular-nums">
                          {players.denis.missed}/{finishLimit}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {panelMode === 'stats' && (
                  <div className="space-y-2 text-xs">
                    <div className="font-semibold text-sm text-zinc-950">Сводка за неделю</div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="rounded border border-zinc-200 p-2.5">
                        <div className="font-semibold text-zinc-950">Кирилл</div>
                        <div className="mt-1 text-zinc-600 tabular-nums">
                          Пропусков: {players.kirill.missed} · Перезвонов: {players.kirill.callbacks}
                        </div>
                      </div>
                      <div className="rounded border border-zinc-200 p-2.5">
                        <div className="font-semibold text-zinc-950">Денис</div>
                        <div className="mt-1 text-zinc-600 tabular-nums">
                          Пропусков: {players.denis.missed} · Перезвонов: {players.denis.callbacks}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {panelMode === 'history' && (
                  <div className="space-y-2 text-xs">
                    <div className="font-semibold text-sm text-zinc-950">Последние события</div>
                    {events.length === 0 ? (
                      <p className="text-zinc-500">История пока пуста — нажмите «Он не поднял трубку».</p>
                    ) : (
                      <ul className="divide-y divide-zinc-100">
                        {events.slice(0, 6).map((ev) => (
                          <li key={ev.id} className="flex items-center justify-between py-1.5">
                            <span>
                              {ev.createdAt} · {players[ev.actorId].name} → {players[ev.recipientId].name} (
                              {ev.sceneTitle})
                            </span>
                            <span className="font-mono text-zinc-500">
                              {ev.status === 'confirmed'
                                ? '+1'
                                : ev.status === 'disputed'
                                  ? 'спор'
                                  : ev.status === 'pending'
                                    ? 'ждёт'
                                    : 'кадр'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {panelMode === 'settings' && (
                  <div className="space-y-2 text-xs text-zinc-600">
                    <div className="font-semibold text-sm text-zinc-950">Настройки пары</div>
                    <div>Лимит финиша: {finishLimit} пропусков</div>
                    <div>Анимация: {fastMode ? 'Быстрая (5 кадров)' : 'Полная (8 кадров)'}</div>
                    <div>База сцен: {scenes.length} вариантов без повторов подряд</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-500">
            {statusNote}
          </div>
        </section>
      </div>
    </div>
  );
}
