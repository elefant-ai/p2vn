import { CharacterModel } from '../types/models';

interface CharacterSpriteProps {
  character: CharacterModel;
  isActive: boolean;
  position: 'left' | 'center' | 'right';
}

export function CharacterSprite({ character, isActive, position }: CharacterSpriteProps) {
  const positionClasses = {
    left: 'items-end justify-start',
    center: 'items-end justify-center',
    right: 'items-end justify-end',
  };

  const imageUri = character.blueprint.view.default.uri;

  return (
    <div className={`flex flex-1 ${positionClasses[position]} transition-all duration-300`}>
      <img
        src={imageUri}
        alt={character.blueprint.name}
        className={`
          h-[500px] w-auto object-contain transition-all duration-300 pointer-events-auto
          ${isActive ? 'opacity-100 scale-110' : 'opacity-60 scale-100'}
        `}
        style={{
          filter: isActive
            ? 'drop-shadow(0 0 20px var(--color-primary))'
            : 'grayscale(100%) brightness(0.7)',
        }}
      />
    </div>
  );
}
