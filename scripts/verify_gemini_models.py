"""Verify available Gemini models for the configured API key."""

import os
import sys
import dotenv
import httpx

dotenv.load_dotenv()

api_key = os.getenv("LLM_API_KEY") or os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: Neither LLM_API_KEY nor GEMINI_API_KEY is configured in .env")
    sys.exit(1)

print(f"Loaded API key (length: {len(api_key)}, prefix: {api_key[:6]}...)")

# Call ListModels
list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
resp = httpx.get(list_url, timeout=20.0)

if resp.status_code != 200:
    print(f"Error querying ListModels endpoint: HTTP {resp.status_code}")
    print(resp.text)
    sys.exit(1)

data = resp.json()
models = data.get("models", [])
print(f"\nTotal models returned: {len(models)}")

generate_content_models = []
for m in models:
    methods = m.get("supportedGenerationMethods", [])
    if "generateContent" in methods:
        generate_content_models.append(m.get("name"))

print("\nModels supporting 'generateContent':")
for name in sorted(generate_content_models):
    print(f"  - {name}")

target_model = "models/gemini-3.8-flash"
target_short = "gemini-3.8-flash"

has_target = any(m == target_model or m.endswith(target_short) for m in generate_content_models)
print(f"\nChecking target model '{target_short}': {'FOUND' if has_target else 'NOT FOUND'}")

# Test an actual generateContent call to verify accessibility
model_to_test = target_short
test_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_to_test}:generateContent?key={api_key}"
print(f"\nTesting generateContent call to {model_to_test}...")

test_payload = {
    "contents": [{"parts": [{"text": "Say 'OK' if you can read this."}]}]
}

test_resp = httpx.post(test_url, json=test_payload, timeout=20.0)
print(f"HTTP Status: {test_resp.status_code}")
if test_resp.status_code == 200:
    candidate_text = test_resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    print(f"Model Response: {candidate_text}")
    print("\nSUCCESS: Model is active and fully functional for this API key!")
else:
    print(f"Error: {test_resp.text}")
