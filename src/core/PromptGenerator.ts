import { BlueprintRegistry } from './BlueprintRegistry';

export class PromptGenerator {
  constructor(private registry: BlueprintRegistry) {}

  generateSystemPrompt(sceneId: string, characterId: string): string {
    const scene = this.registry.getScene(sceneId);
    const character = this.registry.getCharacter(characterId);
    const characterGoals = scene.goals.filter((g) => g.character_id === characterId);

    const languageInstruction = this.getLanguageInstruction(this.registry.getCurrentLanguage());

    const template = scene.prompt;

    return `
**SCENE**: ${scene.title}
**YOUR ROLE**: You are ${character.name}. ${character.identity.personality}
${languageInstruction}

**SCENE CONTEXT**:
${template}

**YOUR GOALS IN THIS SCENE**:
${characterGoals.map((g) => `- ${g.description}`).join('\n')}

**CHARACTER BACKGROUND**:
${character.identity.background}

**SPEAKING STYLE**:
${character.identity.speaking_style}

**TOOLS AVAILABLE**:
- player2_get_state: Read affinity, flags, vars
- player2_set_affinity: Adjust relationship
- player2_set_flag: Mark story moments
- player2_transfer_item: Give/take items
- player2_update_dossier: Update player objectives
- player2_end_scene: End scene when goal achieved

**INSTRUCTIONS**:
1. On first turn, call player2_get_state to check context
2. Respond naturally (1-3 sentences)
3. Use tools when player makes meaningful choices
4. Call player2_end_scene when your goals are achieved

Respond naturally as ${character.name}. Never break character.
    `.trim();
  }

  private getLanguageInstruction(languageCode: string): string {
    const languageNames: Record<string, string> = {
      en_US: 'English',

      fr_FR: 'French',
      de_DE: 'German',
      it_IT: 'Italian',
      pt_BR: 'Portuguese',
      ru_RU: 'Russian',
      ja_JP: 'Japanese',
      ko_KR: 'Korean',
      zh_CN: 'Chinese (Simplified)',
      zh_TW: 'Chinese (Traditional)',
      ar_SA: 'Arabic',
      hi_IN: 'Hindi',
    };

    const languageName = languageNames[languageCode] || 'English';

    if (languageCode === 'en_US') {
      return '';
    }

    return `\n**CRITICAL LANGUAGE REQUIREMENT**: You MUST respond ONLY in ${languageName}. Every word of your dialogue, thoughts, and responses must be in ${languageName}. This is MANDATORY.`;
  }
}
