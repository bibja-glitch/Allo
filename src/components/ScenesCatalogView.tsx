import { useMemo, useState } from 'react';
import { Play, Search } from 'lucide-react';
import type { AsciiSceneCategory, SceneSummary } from '../types/ui';

interface ScenesCatalogViewProps {
  scenes: SceneSummary[];
  loading: boolean;
  onPlayScene: (sceneId: string) => void;
}

const CATEGORY_ORDER: Array<{ id: 'all' | AsciiSceneCategory; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'duel', label: 'Дуэли' },
  { id: 'animal', label: 'Звери' },
  { id: 'transport', label: 'Транспорт' },
  { id: 'magic', label: 'Магия' },
  { id: 'sci_fi', label: 'Космос' },
  { id: 'disaster', label: 'Стихия' },
  { id: 'absurd', label: 'Абсурд' },
  { id: 'sport', label: 'Спорт' },
];

export function ScenesCatalogView({ scenes, loading, onPlayScene }: ScenesCatalogViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | AsciiSceneCategory>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scenes.filter((scene) => {
      if (selectedCategory !== 'all' && scene.type !== selectedCategory) return false;
      if (!q) return true;
      return (
        scene.title.toLowerCase().includes(q) ||
        scene.description.toLowerCase().includes(q) ||
        scene.typeLabel.toLowerCase().includes(q)
      );
    });
  }, [scenes, selectedCategory, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-zinc-950">Каталог мини-сцен</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Симметричная сетка 32×11, чистые заголовки без визуального шума · {scenes.length} сцен в базе
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск сцены..."
            aria-label="Поиск сцены"
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Фильтр по категориям">
        {CATEGORY_ORDER.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-zinc-950 bg-zinc-950 text-white'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
          Загрузка каталога сцен...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
          По этому фильтру сцены не найдены.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((scene) => (
            <article
              key={scene.id}
              className="flex flex-col justify-between rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
                  <span>{scene.typeLabel}</span>
                  <span className="font-mono tabular-nums">
                    {(scene.durationMs / 1000).toFixed(1)}с
                  </span>
                </div>
                <h3 className="mt-1.5 font-display text-base font-semibold text-zinc-950">
                  {scene.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600">{scene.description}</p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                <span className="font-mono text-[11px] text-zinc-400">{scene.id}</span>
                <button
                  type="button"
                  onClick={() => onPlayScene(scene.id)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Смотреть</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
