#!/usr/bin/env python3
"""
Generate 4K images via local OpenClaw gateway (which routes to OpenRouter).
Usage: python3 generate-image.py "Your image prompt here" --model flux
"""

import os
import sys
import json
import time
from pathlib import Path
from datetime import datetime
import requests
import argparse

def enhance_prompt_with_brand(prompt):
    """Add NexAI brand guidelines to prompt"""
    brand_context = """
    For NexAI Solutions CR brand:
    - Modern, professional, tech-forward aesthetic
    - Colors: Dark blue, bright cyan/neon accents, white space
    - Style: Clean, minimalist, high-quality photography
    - Tone: Professional, innovative, Costa Rica-inspired when relevant
    """
    
    if len(prompt) < 100:
        return f"{prompt}. {brand_context}"
    return prompt

def generate_image(prompt, model="openrouter/auto"):
    """Generate image with OpenClaw gateway (routes to OpenRouter)"""
    
    enhanced_prompt = enhance_prompt_with_brand(prompt)
    
    print(f"🎨 Generating image via OpenClaw gateway...")
    print(f"📝 Model: {model}")
    print(f"📝 Prompt: {enhanced_prompt[:100]}...")
    
    # OpenClaw gateway endpoint
    gateway_url = "http://127.0.0.1:18789"
    
    # Get auth token from openclaw.json if needed
    token_file = Path.home() / ".openclaw" / "openclaw.json"
    auth_header = ""
    if token_file.exists():
        try:
            with open(token_file) as f:
                config = json.load(f)
                token = config.get("gateway", {}).get("auth", {}).get("token")
                if token:
                    auth_header = f"Bearer {token}"
        except:
            pass
    
    headers = {
        "Content-Type": "application/json"
    }
    if auth_header:
        headers["Authorization"] = auth_header
    
    # Use image generation tool via OpenClaw's API
    payload = {
        "model": model,
        "prompt": enhanced_prompt,
        "width": 1024,
        "height": 1024
    }
    
    try:
        print(f"📤 Calling OpenClaw gateway at {gateway_url}...")
        # Call OpenClaw's image generation endpoint
        response = requests.post(
            f"{gateway_url}/tools/image-generation",
            headers=headers,
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        data = response.json()
        
        if "error" in data:
            print(f"❌ Error: {data['error']}")
            return {
                "status": "error",
                "error": data['error']
            }
        
        image_url = data.get("url") or data.get("data", [{}])[0].get("url")
        if not image_url:
            print(f"❌ No image URL in response")
            return {
                "status": "error",
                "error": "No image URL in response",
                "response": data
            }
        
        print(f"✅ Image generated!")
        print(f"🔗 URL: {image_url}")
        
        # Save to local media directory
        media_dir = Path.home() / ".openclaw" / "workspace" / "media" / "generated"
        media_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = media_dir / f"image_{timestamp}.png"
        
        # Log without downloading (URL is public)
        cost_log = Path.home() / ".openclaw" / "workspace" / "media" / "generation-costs.log"
        cost_estimate = 0.05
        with open(cost_log, "a") as f:
            f.write(f"{datetime.now().isoformat()} | {model} image | ~${cost_estimate} | {image_url}\n")
        
        print(f"📁 URL saved to costs log")
        
        return {
            "status": "success",
            "url": image_url,
            "model": model,
            "cost_estimate": cost_estimate
        }
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate images via OpenClaw")
    parser.add_argument("prompt", help="Image description prompt")
    parser.add_argument("--model", default="openrouter/auto", help="Model (default: auto)")
    
    args = parser.parse_args()
    result = generate_image(args.prompt, args.model)
    print(json.dumps(result, indent=2))
