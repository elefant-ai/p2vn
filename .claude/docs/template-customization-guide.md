# Template Usage Guide

This document provides a checklist for customizing the P2VN framework template for your own visual novel game.

---

## Quick Overview

**P2VN is a template, not a complete game.** The example content (characters "mc" and "riley") demonstrates the framework but should be replaced with your own game content.

---

## Renaming the Project

When using this template, update the following identifiers:

### 1. Package Configuration

**File**: `package.json`

```json
{
  "name": "p2vn",              // ← Change to: "my-game-name"
  "version": "0.0.0",          // ← Change to: "0.1.0" or your version
  "private": true,
  ...
}
```

### 2. Game Metadata

**File**: `public/blueprints/game.json` (language-agnostic)

Update the single game metadata file:

```json
{
  "id": "example_game",                    // ← Change to your game ID
  "title": "My Visual Novel",              // ← Your game title
  "description": "An AI-driven story...",  // ← Your description
  "authors": ["Your Name"],                // ← Your name/team
  "version": "1.0.0",                      // ← Match package.json
  ...
}
```

**Note**: Game metadata is now language-agnostic and shared across all languages.

### 3. README Documentation

**File**: `README.md`

Update the title and description at the top:

```markdown
# P2VN - AI-Driven Visual Novel Framework  ← Change to your game title
```

---

## Content Replacement Workflow

### Phase 1: Understand the Framework

1. ✅ Run the example game: `npm run dev`
2. ✅ Play through all scenes to understand the flow
3. ✅ Read `PLAN.md` sections 1-3 (architecture overview)
4. ✅ Familiarize yourself with blueprint structure

### Phase 2: Plan Your Game

1. ✅ Define your story (routes, chapters, scenes)
2. ✅ Create character profiles (personality, background, speaking style)
3. ✅ Sketch scene progression and goals
4. ✅ Choose/design your theme (use `agents/THEME_SYSTEM.md`)

### Phase 3: Generate Blueprints

**Option A: Use PLANNER Agent (Recommended)**

1. ✅ Read `agents/PLANNER.md` for instructions
2. ✅ Run conversational blueprint generation
3. ✅ PLANNER creates all JSON files automatically

**Option B: Manual Creation**

1. ✅ Copy existing blueprints as templates
2. ✅ Modify character, scene, chapter, and route JSONs
3. ✅ Validate JSON syntax: `find public/blueprints -name "*.json" -exec node -e "JSON.parse(require('fs').readFileSync('{}'))" \;`

### Phase 4: Create Assets

1. ✅ Generate or create character sprites (PNG/SVG)
2. ✅ Generate or create background images (PNG/SVG)
3. ✅ Place in `public/assets/characters/` and `public/assets/backgrounds/`
4. ✅ Update blueprint URIs to match filenames

### Phase 5: Validate Your Game

1. ✅ Run `npm run typecheck` - Check for TypeScript errors
2. ✅ Run `npm run validate` - Full validation suite
3. ✅ Read `agents/BUILDER.md` for scene-by-scene testing guide
4. ✅ Play through your game start-to-finish

### Phase 6: Multi-Language (Optional)

1. ✅ Duplicate blueprint folder: `cp -r public/blueprints/en_US public/blueprints/fr_FR`
2. ✅ Translate all text content in new language folder
3. ✅ Create UI translations: `public/locales/fr_FR.json`
4. ✅ Add language code to `public/blueprints/languages.json`
5. ✅ Test language switching in-game

---

## File-by-File Replacement Guide

### Must Replace

| File/Folder | Description | Action |
|-------------|-------------|--------|
| `public/blueprints/game.json` | Game metadata (language-agnostic) | Update all fields |
| `public/blueprints/*/characters/*.json` | Character definitions | Replace with your characters |
| `public/blueprints/*/scenes/*.json` | Scene configurations | Replace with your scenes |
| `public/blueprints/*/chapters.json` | Chapter structure | Replace with your chapters |
| `public/blueprints/*/routes.json` | Story routes | Replace with your routes |
| `public/assets/characters/` | Character sprites | Add your character images |
| `public/assets/backgrounds/` | Scene backgrounds | Add your background images |
| `package.json` | Project name | Change `name` field |

### Keep As-Is (Framework)

| File/Folder | Description | Action |
|-------------|-------------|--------|
| `src/` (all files) | Framework code | **DO NOT MODIFY** (unless customizing framework) |
| `public/locales/` | UI translations | Keep, add new languages as needed |
| `public/themes/` | Theme definitions | Keep, add custom themes if desired |
| `PLAN.md` | Architecture reference | Keep for reference |
| `PROMPT.md` | Implementation guide | Keep for reference |
| `agents/` | AI agent guides | Keep for using PLANNER/BUILDER |

### Optional Customization

| File/Folder | Description | Action |
|-------------|-------------|--------|
| `public/themes/` | Visual themes | Add custom themes (see `agents/THEME_SYSTEM.md`) |
| `src/themes/` | Theme CSS files | Add custom theme stylesheets |
| `src/index.css` | Global styles | Modify if needed (advanced) |
| `tailwind.config.js` | Tailwind config | Extend if needed (advanced) |

---

## Customization Checklist

Use this checklist to track your progress:

### Project Setup
- [ ] Cloned/forked repository
- [ ] Ran `npm install`
- [ ] Tested example game with `npm run dev`
- [ ] Read PLAN.md architecture overview

### Project Renaming
- [ ] Updated `package.json` name and version
- [ ] Updated `README.md` title and description
- [ ] Updated `public/blueprints/game.json` (title, description, authors)

### Content Creation
- [ ] Removed or replaced example characters (mc, riley)
- [ ] Created my own character blueprints
- [ ] Removed or replaced example scenes
- [ ] Created my own scene blueprints
- [ ] Updated chapters.json with my chapters
- [ ] Updated routes.json with my routes
- [ ] Created character sprite images
- [ ] Created background images
- [ ] Verified all asset URIs are correct

### Theme Customization (Optional)
- [ ] Chose an existing theme OR
- [ ] Created custom theme blueprint (see `agents/THEME_SYSTEM.md`)
- [ ] Created custom theme CSS file
- [ ] Updated `public/blueprints/game.json` theme field
- [ ] Updated `src/main.tsx` theme import

### Multi-Language (Optional)
- [ ] Duplicated blueprint folder for new language
- [ ] Translated all text content
- [ ] Created UI translation file in `public/locales/`
- [ ] Added language to `languages.json`
- [ ] Tested language switching

### Validation
- [ ] Ran `npm run typecheck` (passes)
- [ ] Ran `npm run validate` (passes)
- [ ] Completed scene-by-scene testing (see `agents/BUILDER.md`)
- [ ] Played through game start-to-finish
- [ ] Fixed all validation errors
- [ ] No console errors in browser

### Finalization
- [ ] Updated README with game-specific information
- [ ] Committed all changes to git
- [ ] Created production build: `npm run build`
- [ ] Tested production build: `npm run preview`

---

## Common Pitfalls

### ❌ Modifying Framework Code

**Problem**: Editing files in `src/` to customize behavior

**Solution**: Use blueprints and themes instead. Framework code should remain generic.

### ❌ Forgetting to Update All Languages

**Problem**: Updating blueprints in `en_US/` but forgetting other languages

**Solution**: Update blueprints in ALL language folders, or remove unused languages from `languages.json`. Note: `game.json` is language-agnostic and only needs to be updated once at `public/blueprints/game.json`

### ❌ Broken Asset References

**Problem**: Blueprint URIs don't match actual file paths

**Solution**: Verify all URIs with: `grep -r '"uri"' public/blueprints/ | grep -o '"/assets/[^"]*"'`

### ❌ Invalid JSON Syntax

**Problem**: Malformed JSON in blueprint files

**Solution**: Validate JSON: `find public/blueprints -name "*.json" -exec node -e "JSON.parse(require('fs').readFileSync('{}'))" \;`

### ❌ Inconsistent Character IDs

**Problem**: Scene references character ID that doesn't exist

**Solution**: Verify all character IDs exist in `characters/index.json` and have corresponding JSON files

---

## Getting Help

If you encounter issues:

1. **Check documentation**: PLAN.md, PROMPT.md, agents/ guides
2. **Validate your blueprints**: Run `npm run validate`
3. **Check console errors**: Browser console and terminal output
4. **Review example blueprints**: See how example game is structured
5. **Use BUILDER agent**: Follow `agents/BUILDER.md` validation guide

---

## Example: Complete Rename

Here's a complete example of renaming from template to "Mystery Manor":

```bash
# 1. Update package.json
{
  "name": "mystery-manor",
  "version": "0.1.0",
  ...
}

# 2. Update game.json (single file, language-agnostic)
{
  "id": "mystery_manor",
  "title": "Mystery Manor",
  "description": "Uncover the secrets of the abandoned manor",
  "authors": ["Detective Games Studio"],
  "version": "0.1.0",
  ...
}

# 3. Update README.md
# Mystery Manor - AI-Driven Mystery Game

# 4. Replace blueprints
rm -rf public/blueprints/*/characters/mc.json
rm -rf public/blueprints/*/characters/riley.json
# Create detective.json, butler.json, etc.

# 5. Replace assets
rm -rf public/assets/characters/mc_default.svg
rm -rf public/assets/characters/riley_default.svg
# Add detective_default.png, butler_default.png, etc.

# 6. Validate
npm run validate

# 7. Test
npm run dev
```

---

**Remember**: This template provides the framework. Your creativity provides the story!

