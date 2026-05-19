#!/usr/bin/env python3
"""
Generate videos via OpenRouter video generation API.
Supports Seedance 2.0, Minimax Hailuo, Kling, and other models.
Usage: python3 generate-video.py "Your video prompt" --duration 15 --model seedance
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from datetime import datetime
import requests
from urllib.request import urlopen

def get_api_key():
    """Get OpenRouter API key from environment"""
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        env_file = Path.home() / ".env"
        if env_file.exists():
            with open(env_file) as f:
                for line in f:
                    if line.startswith("OPENROUTER_API_KEY="):
                        key = line.split("=", 1)[1].strip().strip('"\'')
                        break
    
    if not key:
        raise ValueError("❌ OPENROUTER_API_KEY not found in environment or ~/.env")
    return key

def enhance_prompt_for_video(prompt, duration):
    """Add cinematic direction to prompt"""
    cinematic_hints = f"""
    Video requirements:
    - Duration: {duration} seconds
    - Quality: 1080p, cinematic, professional motion
    - Style: Modern, well-lit, smooth camera work
    """
    return f"{prompt}. {cinematic_hints}"

def generate_video(prompt, duration=15, model="openrouter/auto"):
    """Generate video with OpenRouter"""
    api_key = get_api_key()
    
    enhanced_prompt = enhance_prompt_for_video(prompt, duration)
    duration = min(duration, 60)  # OpenRouter max 60 seconds
    
    print(f"🎬 Generating video with OpenRouter...")
    print(f"⏱️  Duration: {duration}s")
    print(f"📝 Model: {model}")
    print(f"📝 Prompt: {enhanced_prompt[:100]}...")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nexai.solutions",
        "X-Title": "NexAI Media Generator"
    }
    
    payload = {
        "model": model,
        "prompt": enhanced_prompt,
        "duration": duration
    }
    
    try:
        # Create job
        print(f"📤 Submitting video generation request...")
        response = requests.post(
            "https://openrouter.ai/api/v1/videos/generations",
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        job_id = data.get("id")
        status = data.get("status")
        
        if not job_id:
            print(f"❌ No job ID in response: {data}")
            return {
                "status": "error",
                "error": "No job ID returned"
            }
        
        print(f"✅ Job created: {job_id}")
        print(f"📊 Status: {status}")
        
        # Poll until complete
        return poll_video_status(api_key, job_id, headers)
    
    except requests.exceptions.RequestException as e:
        print(f"❌ API Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_data = e.response.json()
                print(f"   Details: {error_data.get('error', {}).get('message', 'Unknown error')}")
            except:
                print(f"   Response: {e.response.text}")
        return {
            "status": "error",
            "error": str(e)
        }

def poll_video_status(api_key, job_id, headers, max_wait=600):
    """Poll until video generation completes"""
    print(f"⏳ Polling video generation (max {max_wait}s)...")
    start_time = time.time()
    poll_count = 0
    
    while time.time() - start_time < max_wait:
        try:
            poll_count += 1
            response = requests.get(
                f"https://openrouter.ai/api/v1/videos/generations/{job_id}",
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            
            status = data.get("status")
            progress = data.get("progress", "?")
            
            elapsed = int(time.time() - start_time)
            print(f"  [{elapsed}s] Status: {status} | Progress: {progress}", end="\r")
            
            if status == "completed":
                video_url = data.get("url")
                if not video_url:
                    print(f"\n❌ No video URL in completed response")
                    return {
                        "status": "error",
                        "error": "No video URL returned"
                    }
                
                print(f"\n✅ Video ready! Downloading...")
                
                # Download video
                vid_response = urlopen(video_url)
                vid_data = vid_response.read()
                
                # Save locally
                media_dir = Path.home() / ".openclaw" / "workspace" / "media" / "generated"
                media_dir.mkdir(parents=True, exist_ok=True)
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filepath = media_dir / f"video_{timestamp}.mp4"
                
                with open(filepath, "wb") as f:
                    f.write(vid_data)
                
                # Log cost
                cost_log = Path.home() / ".openclaw" / "workspace" / "media" / "generation-costs.log"
                cost_estimate = 0.10  # Rough estimate
                with open(cost_log, "a") as f:
                    f.write(f"{datetime.now().isoformat()} | OpenRouter video (1080p) | ~${cost_estimate} | {filepath}\n")
                
                print(f"📁 Saved: {filepath}")
                return {
                    "status": "success",
                    "filepath": str(filepath),
                    "url": video_url,
                    "job_id": job_id,
                    "polls": poll_count,
                    "cost_estimate": cost_estimate
                }
            
            elif status == "failed":
                error = data.get("error", "Unknown error")
                print(f"\n❌ Video generation failed: {error}")
                return {
                    "status": "error",
                    "error": error
                }
            
            time.sleep(5)  # Poll every 5 seconds
        
        except requests.exceptions.RequestException as e:
            print(f"\n❌ Poll error: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    print(f"\n⚠️  Timeout waiting for video (>{max_wait}s)")
    print(f"   Job ID: {job_id}")
    print(f"   Check status later or check the API dashboard")
    return {
        "status": "timeout",
        "job_id": job_id,
        "polls": poll_count,
        "message": "Video generation still in progress. Check status later."
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate videos with OpenRouter")
    parser.add_argument("prompt", help="Video description prompt")
    parser.add_argument("--duration", type=int, default=15, help="Duration in seconds (max 60)")
    parser.add_argument("--model", default="openrouter/auto", help="Model to use (default: auto-select)")
    
    args = parser.parse_args()
    
    result = generate_video(args.prompt, args.duration, args.model)
    print(json.dumps(result, indent=2))
