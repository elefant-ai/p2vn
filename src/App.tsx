import { useState, useEffect } from 'react';
import { BlueprintRegistry } from './core/BlueprintRegistry';
import { RegistryContext } from './contexts/RegistryContext';
import { useGameStore } from './stores/gameStore';
import { ThemeProvider } from './components/ThemeProvider';
import { MainMenu } from './components/MainMenu';
import { RouteSelection } from './components/RouteSelection';
import { CharacterIntro } from './components/CharacterIntro';
import { ChapterIntro } from './components/ChapterIntro';
import { SceneView } from './components/SceneView';
import { ApiKeyModal } from './components/ApiKeyModal';
import { player2Service } from './services/player2';

export function App() {
  const [registry] = useState(() => new BlueprintRegistry());
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<'menu' | 'route' | 'character-intro' | 'chapter' | 'scene'>(
    'menu'
  );
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const gameStore = useGameStore();

  // Load game data on mount and initialize player2Service
  useEffect(() => {
    async function init() {
      await registry.load();
      await player2Service.initialize();
      setLoaded(true);
      const game = registry.getGame();
      const startRoute = game.starting_route;
      const route = registry.getRoute(startRoute);
      const firstChapter = route.starting_chapter;
      const chapter = registry.getChapter(firstChapter);
      const firstScene = chapter.scenes[0];

      gameStore.setCurrentScene(startRoute, firstChapter, firstScene);
      gameStore.unlockRoute(startRoute);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - registry and gameStore are stable

  const handleApiKeySubmit = async (key: string) => {
    setApiKeyError(null);
    player2Service.setApiKey(key);

    const isValid = await player2Service.healthCheck();

    if (isValid) {
      setShowApiKeyModal(false);
      // Continue to scene
      setScreen('scene');
    } else {
      player2Service.clearApiKey();
      setApiKeyError('Invalid API key. Please check and try again.');
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen vn-screen">
        <div className="vn-text text-2xl" style={{ color: 'var(--color-text)' }}>
          Loading...
        </div>
      </div>
    );
  }

  const handleRouteSelect = (routeId: string) => {
    const route = registry.getRoute(routeId);
    const firstChapter = route.starting_chapter;
    const chapter = registry.getChapter(firstChapter);
    const firstScene = chapter.scenes[0];

    gameStore.setCurrentScene(routeId, firstChapter, firstScene);
    gameStore.save(); // Save progress after route selection
    setScreen('character-intro');
  };

  const handleChapterContinue = async () => {
    // Check authentication before entering gameplay
    const hasValidAuth = await player2Service.healthCheck();

    if (!hasValidAuth) {
      // If cookie auth failed and no API key, show modal
      if (!player2Service.hasApiKey()) {
        setShowApiKeyModal(true);
        return;
      }
      // If we have API key but health check still failed, show modal to re-enter
      setShowApiKeyModal(true);
      return;
    }

    gameStore.save(); // Save progress when entering scene
    setScreen('scene');
  };

  const handleContinue = () => {
    // Load saved game state
    gameStore.load();

    // Determine what screen to show based on saved state
    if (!gameStore.current_scene) {
      // No saved scene, start from beginning
      setScreen('route');
    } else {
      // Resume from saved scene
      setScreen('scene');
    }
  };

  return (
    <RegistryContext.Provider value={registry}>
      <ThemeProvider theme={registry.getTheme(registry.getGame().theme)}>
        {screen === 'menu' && (
          <MainMenu onStart={() => setScreen('route')} onContinue={handleContinue} />
        )}
        {screen === 'route' && <RouteSelection onSelect={handleRouteSelect} />}
        {screen === 'character-intro' && (
          <CharacterIntro
            characterId={registry.getGame().player_character_id}
            onContinue={() => setScreen('chapter')}
          />
        )}
        {screen === 'chapter' && (
          <ChapterIntro chapterId={gameStore.current_chapter} onContinue={handleChapterContinue} />
        )}
        {screen === 'scene' && <SceneView />}

        {/* Auth modal overlays the current screen */}
        {showApiKeyModal && <ApiKeyModal onSubmit={handleApiKeySubmit} error={apiKeyError} />}
      </ThemeProvider>
    </RegistryContext.Provider>
  );
}
