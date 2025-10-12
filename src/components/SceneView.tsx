import { useState, useEffect, useCallback } from 'react';
import { useRegistry } from '../contexts/RegistryContext';
import { useGameStore } from '../stores/gameStore';
import { GameEngine, SceneUpdate } from '../core/GameEngine';
import { CharacterModel } from '../types/models';
import { DialogBox } from './DialogBox';
import { CharacterSprite } from './CharacterSprite';
import { PlayerInput } from './PlayerInput';
import { Typewriter } from './Typewriter';
import { HamburgerMenu } from './HamburgerMenu';
import { CharacterIntro } from './CharacterIntro';

export function SceneView() {
  const registry = useRegistry();
  const gameStore = useGameStore();
  const game = registry.getGame();

  const [inputResolve, setInputResolve] = useState<((text: string) => void) | null>(null);
  const [continueResolve, setContinueResolve] = useState<(() => void) | null>(null);

  const playerInputEnabled = inputResolve !== null;
  const showContinue = continueResolve !== null;

  const [sceneState, setSceneState] = useState({
    background: null as string | null,
    characters: [] as CharacterModel[],
    dialogText: '',
    speakerName: null as string | null,
    activeCharacterId: null as string | null,
    isAIThinking: false,
    showTypewriter: false,
    typewriterText: '',
    currentTurn: 'npc' as 'npc' | 'player',
    playerMessage: null as string | null,
    showPlayerMessage: false,
    showingIntro: false,
    playerMessageNeedsContinue: false,
  });

  const [pendingCharacterIntro, setPendingCharacterIntro] = useState<string | null>(null);

  const [engine] = useState(() => new GameEngine(registry, useGameStore, handleUpdate));

  useEffect(() => {
    engine.setPlayerInputHandler((resolve) => setInputResolve(() => resolve));
    engine.setContinueHandler((resolve) => setContinueResolve(() => resolve));

    // Check if scene has any unintroduced NPCs
    const scene = registry.getScene(gameStore.current_scene);
    const unintroducedNPCs = scene.characters.filter((charId) => {
      const char = registry.getCharacter(charId);
      return (
        char.role !== 'player' &&
        !gameStore.introduced_characters.includes(charId) &&
        char.introduction
      );
    });

    if (unintroducedNPCs.length > 0) {
      // Show intro for first unintroduced NPC
      setPendingCharacterIntro(unintroducedNPCs[0]);
    } else {
      engine.startScene(gameStore.current_scene);
    }
  }, [engine, gameStore.current_scene, registry, gameStore.introduced_characters]);

  function handleUpdate(update: SceneUpdate) {
    switch (update.type) {
      case 'scene_loaded':
        setSceneState({
          background: update.scene!.blueprint.view.default.uri!,
          characters: Array.from(update.scene!.characters.values()),
          dialogText: '',
          speakerName: null,
          activeCharacterId: update.scene!.activeCharacter,
          isAIThinking: false,
          showTypewriter: false,
          typewriterText: '',
          currentTurn: 'npc',
          playerMessage: null,
          showPlayerMessage: false,
          showingIntro: false,
          playerMessageNeedsContinue: false,
        });
        break;

      case 'dialogue_chunk':
        setSceneState((prev) => ({
          ...prev,
          dialogText: update.text as string,
          speakerName: update.speaker_name as string,
          activeCharacterId: update.speaker_id as string, // Update active character to the speaker
          isAIThinking: false,
          currentTurn: 'npc',
          showPlayerMessage: false,
        }));
        break;

      case 'typewriter':
        setSceneState((prev) => ({
          ...prev,
          showTypewriter: true,
          typewriterText: update.text as string,
          // If we haven't had any dialogue yet, this is the intro
          showingIntro: prev.dialogText === '',
        }));
        setTimeout(
          () => {
            setSceneState((prev) => ({ ...prev, showTypewriter: false }));
          },
          (update.text as string).length * 50
        );
        break;

      case 'ai_thinking':
        setSceneState((prev) => ({
          ...prev,
          isAIThinking: true,
          dialogText: '',
          speakerName: null,
          currentTurn: 'npc',
          showPlayerMessage: false,
          playerMessageNeedsContinue: false,
        }));
        break;

      case 'scene_transition':
        // Update current scene in store and save progress
        gameStore.setCurrentScene(
          gameStore.current_route,
          gameStore.current_chapter,
          update.next_scene as string
        );
        gameStore.save();
        engine.startScene(update.next_scene as string);
        break;

      case 'scene_ended':
        console.log('Scene ended:', update.result, update.summary);
        break;
    }
  }

  const handlePlayerSubmit = (text: string) => {
    if (inputResolve) {
      // Show player's message and wait for continue
      setSceneState((prev) => ({
        ...prev,
        playerMessage: text,
        showPlayerMessage: true,
        currentTurn: 'player',
        playerMessageNeedsContinue: true,
      }));
    }
  };

  const handlePlayerContinue = useCallback(() => {
    if (inputResolve && sceneState.playerMessage) {
      // Send the message to AI
      inputResolve(sceneState.playerMessage);
      setInputResolve(null);
      // Clear player message state
      setSceneState((prev) => ({
        ...prev,
        playerMessageNeedsContinue: false,
        showPlayerMessage: false,
      }));
    }
  }, [inputResolve, sceneState.playerMessage]);

  const handleContinue = useCallback(() => {
    if (continueResolve) {
      continueResolve();
      setContinueResolve(null);
      // Clear intro state when continuing
      setSceneState((prev) => ({
        ...prev,
        showingIntro: false,
      }));
    }
  }, [continueResolve]);

  const handleCharacterIntroContinue = useCallback(() => {
    if (pendingCharacterIntro) {
      // Mark character as introduced
      gameStore.markCharacterIntroduced(pendingCharacterIntro);
      setPendingCharacterIntro(null);
      // Start the scene
      engine.startScene(gameStore.current_scene);
    }
  }, [pendingCharacterIntro, gameStore, engine]);

  // Get player character
  const playerCharacter = sceneState.characters.find(
    (char) => char.blueprint.id === game.player_character_id
  );

  // Get currently active/speaking character
  const activeCharacter = sceneState.characters.find(
    (char) => char.blueprint.id === sceneState.activeCharacterId
  );

  // Determine visible character based on turn
  const visibleCharacters: CharacterModel[] = [];
  if (sceneState.currentTurn === 'player') {
    // Show player character when it's their turn
    if (playerCharacter) {
      visibleCharacters.push(playerCharacter);
    }
  } else {
    // Show the character who is currently speaking (activeCharacterId is updated from speaker_id)
    if (activeCharacter && activeCharacter.blueprint.id !== game.player_character_id) {
      // Only show if it's not the player character
      visibleCharacters.push(activeCharacter);
    }
  }

  // When player input is enabled, switch to player turn
  useEffect(() => {
    if (playerInputEnabled) {
      setSceneState((prev) => ({
        ...prev,
        currentTurn: 'player',
        showPlayerMessage: false,
      }));
    }
  }, [playerInputEnabled]);

  // Handle Enter key during intro
  useEffect(() => {
    if (!sceneState.showingIntro || !showContinue) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleContinue();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [sceneState.showingIntro, showContinue, handleContinue]);

  // Show character intro if pending
  if (pendingCharacterIntro) {
    return (
      <CharacterIntro
        characterId={pendingCharacterIntro}
        onContinue={handleCharacterIntroContinue}
      />
    );
  }

  return (
    <div className="vn-screen fixed inset-0 w-full h-full">
      {/* Background Layer */}
      {sceneState.background && (
        <div className="absolute inset-0 z-0">
          <img
            src={sceneState.background}
            className="w-full h-full object-cover"
            alt="Scene background"
          />
        </div>
      )}

      {/* Characters Layer - Hidden during intro, single character centered */}
      {!sceneState.showingIntro && visibleCharacters.length > 0 && (
        <div className="absolute inset-0 z-10 flex items-end justify-center pb-32 px-8 pointer-events-none">
          <CharacterSprite
            key={visibleCharacters[0].blueprint.id}
            character={visibleCharacters[0]}
            isActive={true}
            position="center"
          />
        </div>
      )}

      {/* Intro overlay - shown during intro */}
      {sceneState.showingIntro && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-70">
          <div className="flex flex-col items-center gap-6">
            {/* Intro text with typewriter effect */}
            {sceneState.showTypewriter ? (
              <Typewriter text={sceneState.typewriterText} />
            ) : (
              <div className="vn-box p-8 max-w-3xl mx-4">
                <div
                  className="vn-text text-2xl text-center"
                  style={{ color: 'var(--color-text)' }}
                >
                  {sceneState.typewriterText}
                </div>
              </div>
            )}

            {/* Show continue prompt after typewriter finishes */}
            {!sceneState.showTypewriter && showContinue && (
              <div
                className="vn-text text-xl animate-pulse pointer-events-auto cursor-pointer"
                onClick={handleContinue}
                style={{ color: 'var(--color-accent)' }}
              >
                ▼ Press Enter to continue ▼
              </div>
            )}
          </div>
        </div>
      )}

      {/* Player Turn UI - Hidden during intro */}
      {!sceneState.showingIntro && sceneState.currentTurn === 'player' && (
        <>
          {/* Show input if waiting for player, or show their message if they've sent it */}
          {!sceneState.showPlayerMessage && (
            <PlayerInput enabled={playerInputEnabled} onSubmit={handlePlayerSubmit} />
          )}

          {sceneState.showPlayerMessage && sceneState.playerMessage && (
            <DialogBox
              speakerName={playerCharacter?.blueprint.name || 'You'}
              text={sceneState.playerMessage}
              showContinue={sceneState.playerMessageNeedsContinue}
              onContinue={handlePlayerContinue}
              isAIThinking={false}
              characterColor="var(--color-character-player)"
            />
          )}
        </>
      )}

      {/* NPC Turn UI - Hidden during intro */}
      {!sceneState.showingIntro && sceneState.currentTurn === 'npc' && (
        <DialogBox
          speakerName={sceneState.speakerName}
          text={sceneState.dialogText}
          showContinue={showContinue}
          onContinue={handleContinue}
          isAIThinking={sceneState.isAIThinking}
          characterColor="var(--color-character-npc)"
        />
      )}

      {/* Hamburger Menu - Top right */}
      <HamburgerMenu />
    </div>
  );
}
