

# Swippee Logo Generation

## Approach
Use the Nano banana 2 (gemini-3.1-flash-image-preview) AI image model to generate a logo that combines:
- Crypto symbolism (coin/blockchain motif)
- Nepal reference (mountain/triangle shape evoking Himalaya or Nepal's flag)
- Currency symbols (NPR ₨ and $)

The logo will be clean, minimal, and work at favicon size (32x32 / 64x64).

## Steps

1. **Generate logo** via edge function calling the AI image generation endpoint with a detailed prompt for a minimal, icon-style logo
2. **Upload** the generated image to storage, then copy to `public/favicon.png` and `public/logo.png`
3. **Update `index.html`** to reference the new favicon
4. **Update brand references** to use the new logo where needed (e.g., navbar, landing page)

## Prompt Direction
"Minimal flat icon logo for 'Swippee', a crypto exchange in Nepal. Combine a stylized coin with a mountain silhouette or Nepal flag triangle shape. Include subtle ₨ and $ symbols. Colors: dark zinc/slate with a gold accent. Clean vector style, works at 32x32px. White background."

