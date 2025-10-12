import { useRegistry } from '../contexts/RegistryContext';
import { useGameStore } from '../stores/gameStore';

interface RouteSelectionProps {
  onSelect: (routeId: string) => void;
}

export function RouteSelection({ onSelect }: RouteSelectionProps) {
  const registry = useRegistry();
  const game = registry.getGame();
  const { unlocked_routes } = useGameStore();

  const routes = game.routes.map((id) => registry.getRoute(id));

  return (
    <div className="vn-screen flex items-center justify-center min-h-screen cyber-scanlines hologram p-8">
      <div className="cyber-grid" />
      <div className="max-w-4xl w-full">
        <h2
          className="vn-heading neon-text text-3xl md:text-4xl mb-12 text-center"
          style={{ color: 'var(--color-primary)' }}
        >
          Choose Your Path
        </h2>

        <div className="grid gap-6">
          {routes.map((route) => {
            const isLocked = route.requirements && !unlocked_routes.includes(route.id);

            return (
              <button
                key={route.id}
                onClick={() => !isLocked && onSelect(route.id)}
                disabled={isLocked}
                className={`
                  vn-box p-6 text-left transition-all
                  ${
                    isLocked
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:translate-x-2 hover:translate-y-2'
                  }
                `}
              >
                <h3
                  className="vn-heading text-lg md:text-xl mb-3"
                  style={{ color: isLocked ? 'var(--color-text)' : 'var(--color-secondary)' }}
                >
                  {route.title} {isLocked && '🔒'}
                </h3>
                <p className="vn-text text-lg" style={{ color: 'var(--color-text)' }}>
                  {route.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
