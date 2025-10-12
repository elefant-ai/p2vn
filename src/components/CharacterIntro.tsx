import { useEffect } from 'react';
import { useRegistry } from '../contexts/RegistryContext';

interface CharacterIntroProps {
  characterId: string;
  onContinue: () => void;
}

export function CharacterIntro({ characterId, onContinue }: CharacterIntroProps) {
  const registry = useRegistry();
  const character = registry.getCharacter(characterId);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onContinue();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onContinue]);

  return (
    <div className="vn-screen fixed inset-0 w-full h-full">
      {/* Dark overlay background */}
      <div className="absolute inset-0 bg-black bg-opacity-80" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-8 max-w-4xl w-full">
          {/* Character Image */}
          <div className="flex justify-center">
            <img
              src={character.view.default.uri}
              alt={character.name}
              className="h-[400px] w-auto object-contain"
              style={{ filter: 'drop-shadow(0 0 30px var(--color-primary))' }}
            />
          </div>

          {/* Character Introduction Text */}
          <div className="vn-box p-8 w-full">
            <div
              className="vn-text text-2xl text-center leading-relaxed"
              style={{ color: 'var(--color-text)' }}
            >
              {character.introduction || `I'm ${character.name}.`}
            </div>
          </div>

          {/* Continue prompt */}
          <div
            className="vn-text text-xl animate-pulse cursor-pointer"
            onClick={onContinue}
            style={{ color: 'var(--color-accent)' }}
          >
            ▼ Press Enter to continue ▼
          </div>
        </div>
      </div>
    </div>
  );
}
