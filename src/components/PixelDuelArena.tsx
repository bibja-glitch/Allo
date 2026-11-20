import { Flag } from 'lucide-react';
import { resolvePixelCharacter } from '../../lib/bot/pixelCharacters';
import { PixelSprite } from './PixelSprite';

export interface ArenaPlayerEntry {
  id: string;
  name: string;
  laneIndex: 0 | 1;
  characterId?: string | null;
  confirmedSteps: number;
  pendingSteps?: number;
  rankTitle: string;
  isViewer?: boolean;
}

interface PixelDuelArenaProps {
  players: ArenaPlayerEntry[];
  finishThreshold: number;
  compact?: boolean;
}

export function PixelDuelArena({
  players,
  finishThreshold,
  compact = false,
}: PixelDuelArenaProps) {
  const safeLimit = Math.max(1, finishThreshold);
  const cellCount = Math.min(20, safeLimit);

  return (
    <section
      aria-label="Пиксельная арена счёта"
      className={`rounded-lg border border-zinc-200 bg-white ${compact ? 'p-4' : 'p-5'}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-zinc-950">
            Пиксельная шкала счёта
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Каждый подтверждённый пропуск продвигает персонажа на шаг к финишу.
          </p>
        </div>
        <span className="font-mono text-xs tabular-nums text-zinc-500">
          лимит {safeLimit}
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {players.map((player) => {
          const hero = resolvePixelCharacter(player.characterId, player.laneIndex);
          const ratio = Math.min(1, Math.max(0, player.confirmedSteps / safeLimit));
          const pendingRatio = Math.min(
            1,
            Math.max(ratio, (player.confirmedSteps + (player.pendingSteps ?? 0)) / safeLimit)
          );
          const percent = Math.round(ratio * 100);
          const filledCells = Math.min(cellCount, Math.round(ratio * cellCount));
          const pendingCells = Math.min(cellCount, Math.round(pendingRatio * cellCount));

          return (
            <div key={player.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-50">
                    <PixelSprite
                      characterId={hero.id}
                      laneIndex={player.laneIndex}
                      size={22}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5 truncate">
                      <span className="truncate text-sm font-semibold text-zinc-950">
                        {player.name}
                      </span>
                      {player.isViewer && (
                        <span className="font-mono text-[11px] text-zinc-400">(вы)</span>
                      )}
                      <span className="hidden sm:inline text-xs text-zinc-400">
                        · {hero.name}
                      </span>
                    </div>
                    <div className="truncate text-[11px] text-zinc-500">
                      {player.rankTitle}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="font-mono text-sm font-bold tabular-nums text-zinc-950">
                    {player.confirmedSteps}
                    <span className="text-zinc-400">/{safeLimit}</span>
                  </div>
                  {(player.pendingSteps ?? 0) > 0 && (
                    <div className="font-mono text-[10px] text-amber-600 tabular-nums">
                      +{player.pendingSteps} ждёт
                    </div>
                  )}
                </div>
              </div>

              {/* Pixel track runway */}
              <div className="relative rounded-md border border-zinc-200 bg-zinc-50 px-2.5 pb-2 pt-7">
                {/* Sprite gliding along runway */}
                <div
                  className="pointer-events-none absolute top-1.5 z-10 -translate-x-1/2 transition-all duration-300 ease-out"
                  style={{ left: `calc(16px + ${Math.min(92, Math.max(4, percent * 0.92))}%)` }}
                >
                  <PixelSprite
                    characterId={hero.id}
                    laneIndex={player.laneIndex}
                    size={26}
                  />
                </div>

                {/* Finish flag */}
                <div
                  className="pointer-events-none absolute right-2 top-1.5 flex items-center text-[#E5484D]"
                  title={`Финиш: ${safeLimit}`}
                >
                  <Flag className="h-3.5 w-3.5" />
                </div>

                {/* Pixel cells */}
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${cellCount}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: cellCount }).map((_, idx) => {
                    const isFilled = idx < filledCells;
                    const isPending = !isFilled && idx < pendingCells;
                    return (
                      <div
                        key={idx}
                        className="h-2.5 rounded-[1px] transition-colors"
                        style={{
                          backgroundColor: isFilled
                            ? hero.accentHex
                            : isPending
                              ? '#FDE68A'
                              : '#E4E4E7',
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
