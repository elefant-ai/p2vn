# Theme System

This directory contains modular CSS theme files for the visual novel framework.

**⚠️ CRITICAL**: Component code NEVER changes when switching themes. All components use universal `.vn-*` classes.

## Architecture

The theming system uses a universal pluggable architecture:

1. **Base styles** (`src/index.css`) - Universal `.vn-*` classes, theme-agnostic
2. **Theme CSS** (`src/themes/*.css`) - Theme-specific styling for `.vn-*` classes  
3. **Theme blueprints** (`public/themes/*.json`) - Color and UI variable definitions (language-agnostic)

**For comprehensive documentation**, see `agents/THEME_SYSTEM.md`

## Available Themes

### 1. Default Theme (`default.css`)
- Clean, modern design
- System fonts
- Minimal styling
- Good for professional or serious stories

### 2. Miami Metro (`miami-metro.css`)
- Retro 80s aesthetic
- Press Start 2P + VT323 fonts
- Pixelated rendering
- CRT effects with scanlines
- Neon text effects
- Perfect for retro/synthwave stories

### 3. Cyberpunk 2077 (`cyberpunk-2077.css`)
- Futuristic cyberpunk aesthetic
- Orbitron + Rajdhani fonts
- Holographic effects
- Animated glitch effects
- Neon glows and chrome text
- Cyber grid background
- Data stream animations
- Perfect for sci-fi/cyberpunk stories

## Switching Themes

To switch the active theme, edit `src/main.tsx`:

```typescript
// Change this line to use a different theme:
import './themes/cyberpunk-2077.css'  // Current theme

// Options:
// import './themes/default.css'
// import './themes/miami-metro.css'
// import './themes/cyberpunk-2077.css'
```

Then update your game blueprint (`public/blueprints/game.json`):

```json
{
  "theme": "cyberpunk_2077"
}
```

## Universal CSS Classes

All components use these universal classes. Every theme MUST style them:

### Required Classes
- `.vn-screen` - Full-screen containers
- `.vn-heading` - Headings and titles
- `.vn-text` - Body text and dialogue
- `.vn-box` - Containers and panels
- `.vn-button` - Primary buttons
- `.vn-button-secondary` - Secondary buttons
- `.vn-button-accent` - Accent buttons
- `.vn-input` - Text inputs

**These class names NEVER change**. Themes customize their appearance via CSS.

## Creating New Themes

**See `agents/THEME_SYSTEM.md` for complete guide**. Quick overview:

### 1. Create Theme CSS File

Create a new file in `src/themes/your-theme.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=YourFont&display=swap');

:root {
  /* Override CSS variables */
  --font-size-base: 16px;
  --button-padding: 12px 24px;
  /* ... other variables */
}

body {
  font-family: 'YourFont', sans-serif;
}

/* Style universal classes */
.vn-heading {
  /* Custom heading styles */
}

.vn-text {
  /* Custom text styles */
}

.vn-box {
  /* Custom box styles */
}

.vn-button {
  /* Custom button styles */
}

.vn-input {
  /* Custom input styles */
}

.vn-screen {
  /* Custom screen background */
}

/* Optional: Add theme-specific effects */
.custom-effect {
  /* ... */
}
```

### 2. Create Theme Blueprint

Create `public/themes/your_theme.json` (themes are language-agnostic):

```json
{
  "id": "your_theme",
  "name": "Your Theme Name",
  "colors": {
    "primary": "#FF0000",
    "secondary": "#00FF00",
    "background": "#000000",
    "text": "#FFFFFF",
    "accent": "#0000FF",
    "border": "#FF0000",
    "shadow": "#000000",
    "success": "#00FF00",
    "error": "#FF0000"
  },
  "fonts": {
    "heading": "'YourFont', sans-serif",
    "body": "'YourFont', sans-serif",
    "dialogue": "'YourFont', sans-serif"
  },
  "transitions": {
    "scene_fade_duration": 300,
    "text_speed": 30
  },
  "ui": {
    "border_width": "2px",
    "border_style": "solid",
    "box_shadow": "0 4px 6px rgba(0, 0, 0, 0.1)",
    "button_transform": "translateY(-2px)",
    "button_shadow_hover": "0 6px 12px rgba(0, 0, 0, 0.15)"
  }
}
```

### 3. Update Imports

1. Edit `src/main.tsx` to import your theme CSS
2. Update `game.json` to reference your theme ID

## CSS Variables

The `ThemeProvider` component automatically applies these CSS variables from your theme blueprint:

### Colors
- `--color-primary`
- `--color-secondary`
- `--color-background`
- `--color-text`
- `--color-accent`
- `--color-border`
- `--color-shadow`
- `--color-success`
- `--color-error`

### Fonts
- `--font-heading`
- `--font-body`
- `--font-dialogue`

### UI Properties
- All properties from `ui` object in theme blueprint
- Converted from snake_case to kebab-case (e.g., `border_width` → `--border-width`)

## Theme-Specific Classes

### Universal Classes (Required in all themes)
- `.vn-screen` - Full-screen container
- `.vn-heading` - Styled headings
- `.vn-text` - Body text
- `.vn-box` - Containers/boxes
- `.vn-button` - Primary buttons
- `.vn-button-secondary` - Secondary buttons
- `.vn-button-accent` - Accent buttons
- `.vn-input` - Text input fields

### Miami Metro Specific
- `.scanlines` - CRT scanline effect
- `.crt-effect` - CRT flicker animation
- `.pixel-corners` - Pixelated corner clipping
- `.neon-text` - Neon glow text effect

### Cyberpunk 2077 Specific
- `.cyber-grid` - Background grid overlay
- `.cyber-scanlines` - Cyberpunk scanlines
- `.glitch-text` - Glitch animation
- `.hologram` - Holographic flicker
- `.neon-text` - Neon pulse effect
- `.chrome-text` - Metallic chrome text
- `.data-stream` - Data stream animation
- `.terminal-cursor` - Blinking terminal cursor

## Best Practices

1. **Import only one theme** - Only import one theme CSS in `main.tsx` at a time
2. **Use CSS variables** - Reference CSS variables in your components for colors/fonts
3. **Use theme classes** - Use `.theme-*` classes instead of hardcoding styles
4. **Test thoroughly** - Test your theme with all UI components
5. **Keep it modular** - Don't modify `index.css` for theme-specific styles

## Troubleshooting

### Theme not loading
- Check that you imported the correct CSS file in `main.tsx`
- Verify the theme ID in `game.json` matches the blueprint filename
- Clear browser cache and restart dev server

### Fonts not displaying
- Verify the `@import` URL in your theme CSS is correct
- Check browser console for font loading errors
- Ensure font names in theme blueprint match the CSS font families

### Colors not applying
- Check that CSS variables are referenced correctly: `var(--color-primary)`
- Verify theme blueprint has all required color fields
- Inspect elements to see if CSS variables are being set

### Styles look wrong
- Check for conflicting class names
- Verify z-index values if elements overlap incorrectly
- Look for Tailwind classes that might override theme styles

## Examples

### Using Universal Classes in Components

```tsx
<div style={{ color: 'var(--color-primary)' }}>
  Primary colored text
</div>

<div className="vn-box">
  Themed container
</div>

<h1 className="vn-heading neon-text">
  Heading with neon effect (if theme supports it)
</h1>
```

### Combining Classes

```tsx
<button className="vn-button vn-button-secondary">
  Secondary Button
</button>

<div className="vn-screen cyber-scanlines hologram">
  Screen with theme-specific effects
</div>
```

## Future Improvements

Potential enhancements to the theming system:

- [ ] Dynamic theme switching without page reload
- [ ] Theme preview in settings menu
- [ ] Per-scene theme overrides
- [ ] Custom theme builder UI
- [ ] Theme animation presets
- [ ] Accessibility theme options
- [ ] Dark/light mode variants per theme

