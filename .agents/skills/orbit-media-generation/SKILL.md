---
name: orbit-media-generation
description: "Generate professional 4K images and videos from text prompts using OpenAI APIs (DALL-E 3 for images, Sora for videos). Integrated with NexAI brand guidelines."
---

# Orbit Media Generation Skill

Generate high-quality marketing visuals and videos for NexAI Solutions CR from natural language prompts.

## What This Skill Does

- **Images**: OpenRouter (Flux, Gemini, etc.) → 4K photorealistic, consistent brand aesthetic
- **Videos**: OpenRouter (Seedance 2.0, Minimax Hailuo, etc.) → 1080p cinematic, professional quality
- **Output**: Direct download links, ready for marketing/sales use
- **Gateway**: Unified OpenRouter API (no need for multiple keys)

## When to Use This

- "Generate a professional image for [use case]"
- "Create a video showing [scenario]"
- "Make a 4K mockup of [product/concept]"
- Marketing collateral, sales decks, social media assets, product demos

## Prerequisites

1. **OpenClaw Gateway running** (routes to OpenRouter automatically)
   - OpenRouter is already configured in OpenClaw
   - No additional API keys needed — uses existing OpenRouter auth
   - Accessible at `http://127.0.0.1:18789`

2. **NexAI Brand Context** (loaded in `references/brand.md`)
   - Color palette, messaging, tone
   - Use when prompts don't specify brand direction

## Quick Start

### Generate an Image

```
/orbit:generate-image
Prompt: A professional team photo for NexAI Solutions CR website, 
Costa Rica tech consulting company, modern office aesthetic, 4K
```

**Output**: 4K PNG image, download link

### Generate a Video

```
/orbit:generate-video
Prompt: Drone shot of a modern tech office in Costa Rica, 
NexAI team working on AI solutions, morning light, 15 seconds, 4K
```

**Output**: MP4 video, 1080p, download link + preview

## How It Works

### Image Generation (DALL-E 3)

1. **Parse prompt** → enhance with brand guidelines if needed
2. **Call OpenAI API** → `/v1/images/generations`
3. **Save locally** → `~/.openclaw/workspace/media/generated/[timestamp].png`
4. **Return** → Download link + preview

### Video Generation (Sora)

1. **Parse prompt** → check duration (max 60 sec), enhance with cinematic direction
2. **Call OpenAI API** → `/v1/videos/generations` (Sora)
3. **Poll status** → wait for generation (2-5 min typical)
4. **Save locally** → `~/.openclaw/workspace/media/generated/[timestamp].mp4`
5. **Return** → Download link + preview

## Key Features

- **Brand-aware**: Automatically applies NexAI aesthetic if brand context needed
- **Async friendly**: Videos poll in background, no timeout
- **Local cache**: Generated files stored locally for re-use
- **Error handling**: Clear messages if API fails, quota exceeded, or prompt violates policy

## Cost & Quotas

| Service | Cost | Limit |
|---------|------|-------|
| Flux (image, 4K) | $0.02-0.05 per image | Pay-per-use (OpenRouter) |
| Seedance 2.0 (video, 1080p) | $0.05-0.15 per video | Pay-per-use (OpenRouter) |
| Minimax Hailuo (video) | $0.02-0.08 per video | Pay-per-use (OpenRouter) |

**Track spend**: Monitor `~/.openclaw/workspace/media/generation-costs.log`

## Limitations

- Images: 4K max (depends on model selected via OpenRouter)
- Videos: 60 seconds max, 1080p max (model dependent)
- Generation time: 10-30 sec for images, 1-5 min for videos (async)
- OpenRouter auto-selects best model or use `model` parameter to specify
- Cannot re-generate exact same asset (random seed each time)

## Examples

### Example 1: Product Marketing Image
```
Prompt: Professional mockup of NexAI AI agent dashboard, 
showing real-time metrics and chat interface, 
modern tech aesthetic, 4K, for website homepage
```
→ 4K image ready for marketing

### Example 2: Educational Video
```
Prompt: Animated walkthrough of how AI agents work,
step-by-step process visualization,
professional motion graphics style,
15 seconds, cinematic
```
→ MP4 video for training/sales

### Example 3: Social Media Asset
```
Prompt: NexAI Solutions CR brand post graphic,
Costa Rica flag colors, modern tech vibe,
text space for "Automation at scale",
4K social media size
```
→ Image for Instagram/LinkedIn

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key not found" | Ensure `OPENAI_API_KEY` in `~/.env` |
| "Quota exceeded" | Wait 24h or upgrade OpenAI plan |
| "Prompt violates policy" | Rephrase to avoid restricted content |
| "Video generation timed out" | Videos can take 5-10 min; check status manually |
| "Image too pixelated" | Request higher resolution (1024×1024 is max) |

## Script Location

- Image generation: `scripts/generate-image.py`
- Video generation: `scripts/generate-video.py`
- Shared utilities: `scripts/media-utils.py`

See `references/openai-api-guide.md` for API endpoint details.
