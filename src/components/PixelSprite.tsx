import { resolvePixelCharacter } from '../../lib/bot/pixelCharacters';

interface PixelSpriteProps {
  characterId?: string | null;
  laneIndex?: 0 | 1;
  size?: number;
  flipped?: boolean;
  className?: string;
}

export function PixelSprite({
  characterId,
  laneIndex = 0,
  size = 36,
  flipped = false,
  className = '',
}: PixelSpriteProps) {
  const spec = resolvePixelCharacter(characterId, laneIndex);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      aria-label={spec.name}
      role="img"
      className={className}
      style={flipped ? { transform: 'scaleX(-1)' } : undefined}
    >
      {spec.grid.map((row, y) =>
        Array.from(row).map((cell, x) => {
          if (cell === '.') return null;
          const fill =
            cell === '#' ? '#111214' : cell === '@' ? spec.accentHex : '#FFFFFF';
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}
