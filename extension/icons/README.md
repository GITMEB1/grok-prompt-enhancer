# Extension Icons

This directory should contain the following icon files for the Chrome extension:

## Required Icons

- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels  
- `icon128.png` - 128x128 pixels

## Creating Icons

You can create these icons using:

1. **Online Icon Generators:**
   - [Favicon.io](https://favicon.io/) - Generate from text, image, or emoji
   - [Canva](https://www.canva.com/) - Design custom icons
   - [Figma](https://www.figma.com/) - Professional design tool

2. **Icon Design Tools:**
   - Adobe Illustrator
   - Sketch
   - GIMP (free)
   - Inkscape (free)

## Icon Design Guidelines

- Use a simple, recognizable design
- Ensure good contrast and visibility
- Test at small sizes (16x16)
- Use PNG format with transparency
- Keep file sizes reasonable (< 50KB each)

## Suggested Design

For the Grok Prompt Enhancer, consider using:
- ⚡ Lightning bolt symbol
- 🚀 Rocket symbol
- 🧠 Brain symbol
- Or a custom "GP" (Grok Prompt) design

## Quick Setup

If you need placeholder icons quickly, you can:

1. Use any existing icon and resize it to the required dimensions
2. Create a simple colored square with text
3. Use an emoji converted to PNG at the required sizes

## Example Command (using ImageMagick)

```bash
# Create a simple colored square icon
convert -size 16x16 xc:#667eea icon16.png
convert -size 48x48 xc:#667eea icon48.png
convert -size 128x128 xc:#667eea icon128.png
```

Replace the icons in this directory before loading the extension in Chrome. 