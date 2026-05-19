# Orbit Media Generation Skill

**Status:** ✅ Ready to use (integrates with existing OpenRouter access)

## Quick Start

### Generate Images (4K Professional)

```bash
# Via Python
python3 scripts/generate-image.py "Your image prompt"

# Via OpenClaw chat
/orbit:generate-image "NexAI Solutions website hero mockup"
```

### Generate Videos (1080p Cinematic)

```bash
# Via Python  
python3 scripts/generate-video.py "Your video prompt" --duration 15

# Via OpenClaw chat
/orbit:generate-video "Drone shot of modern tech office" --duration 15
```

## How It Works

This skill uses OpenRouter's image and video generation APIs, which are already configured in OpenClaw.

- **Images:** Flux, Gemini, Qwen models via OpenRouter
- **Videos:** Seedance 2.0, Minimax Hailuo, Kling models via OpenRouter
- **Auth:** Uses existing OpenRouter configuration from OpenClaw
- **Cost:** ~$0.03-0.15 per asset

## Integration with Orbit

Orbit (🪐) can invoke this skill to:
1. Generate marketing visuals on demand
2. Create product mockups and demos
3. Produce training/educational videos
4. Build social media content
5. Design customer presentations

## Key Features

✅ Brand-aware prompts (NexAI guidelines auto-applied)
✅ Async video polling (no timeouts)
✅ Local caching of generated assets
✅ Cost tracking per generation
✅ Multi-model support via OpenRouter

## Next: Manual Testing

To test immediately, run:
```bash
python3 scripts/test-connectivity.py
```

This will verify OpenRouter access and list available models.
