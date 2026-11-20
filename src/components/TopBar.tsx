import { Play } from 'lucide-react';
import type { ActiveTab } from '../types/ui';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onQuickPlay: () => void;
}

const NAV_ITEMS: Array<{ id: ActiveTab; label: string; mobileLabel?: string }> = [
  { id: 'simulator', label: 'Симулятор' },
  { id: 'scenes', label: 'Сцены' },
  { id: 'deploy', label: 'Деплой и статус', mobileLabel: 'Деплой' },
];

export function TopBar({ activeTab, onSelectTab, onQuickPlay }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="h-7 w-7 overflow-hidden rounded border border-zinc-200 bg-[#111214] shrink-0">
            <img
              src="/src/assets/images/bot_avatar_minimal_1795174484247.jpg"
              alt="Аватар бота АЛЛО, РОУД!"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-xs sm:text-sm font-bold tracking-tight text-zinc-950 whitespace-nowrap">
              АЛЛО, РОУД!
            </span>
            <span className="hidden md:inline text-xs text-zinc-400 whitespace-nowrap">
              · Telegram-дуэль
            </span>
          </div>
        </div>

        <nav aria-label="Разделы" className="flex items-center gap-0.5 sm:gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`px-2 py-1.5 text-xs sm:px-3 sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                {item.mobileLabel ? (
                  <>
                    <span className="sm:hidden">{item.mobileLabel}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </>
                ) : (
                  item.label
                )}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onQuickPlay}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-[#E5484D] px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#cf393e] whitespace-nowrap shrink-0"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Запустить сцену</span>
        </button>
      </div>
    </header>
  );
}
