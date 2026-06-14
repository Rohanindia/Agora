"""Quick diagnostic script to find the source of [Errno 22] Invalid argument."""
import asyncio
import sys
import os

# Load env same as main.py
from dotenv import load_dotenv
load_dotenv()

print(f"Python version: {sys.version}")
print(f"Platform: {sys.platform}")
print(f"Event loop policy: {asyncio.get_event_loop_policy().__class__.__name__}")
print(f"OPENAI_BASE_URL: {os.getenv('OPENAI_BASE_URL')}")
print(f"OPENAI_API_KEY exists: {bool(os.getenv('OPENAI_API_KEY'))}")
print(f"LLM_PROVIDER: {os.getenv('LLM_PROVIDER')}")
print(f"GROUNDING_PROVIDER: {os.getenv('GROUNDING_PROVIDER')}")
print()

async def test_httpx_call():
    """Test 1: Can we make an httpx call to Groq?"""
    print("=== TEST 1: httpx call to Groq ===")
    try:
        import httpx
        base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        api_key = os.getenv("OPENAI_API_KEY")
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": os.getenv("OPENAI_MODEL", "llama-3.1-8b-instant"),
                    "messages": [
                        {"role": "user", "content": "Say hello in JSON: {\"greeting\": \"...\"}"}
                    ],
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"},
                },
            )
            response.raise_for_status()
            print(f"  SUCCESS: {response.status_code}")
            print(f"  Response: {response.json()['choices'][0]['message']['content'][:200]}")
    except Exception as e:
        print(f"  FAILED: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    print()

async def test_grounding():
    """Test 2: Can the grounding provider work?"""
    print("=== TEST 2: Grounding provider ===")
    try:
        from grounding import build_grounding_provider
        gp = build_grounding_provider()
        print(f"  Provider type: {type(gp).__name__}")
        result = await gp.search("Metformin is first-line for type 2 diabetes")
        print(f"  SUCCESS: {result}")
    except Exception as e:
        print(f"  FAILED: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    print()

async def test_concurrent_httpx():
    """Test 3: Can we run multiple concurrent httpx calls (like the 5 agents)?"""
    print("=== TEST 3: Concurrent httpx calls ===")
    try:
        import httpx
        base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        api_key = os.getenv("OPENAI_API_KEY")
        
        async def single_call(i):
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    f"{base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": os.getenv("OPENAI_MODEL", "llama-3.1-8b-instant"),
                        "messages": [
                            {"role": "user", "content": f"Say 'hello {i}' in JSON"}
                        ],
                        "temperature": 0.2,
                        "response_format": {"type": "json_object"},
                    },
                )
                response.raise_for_status()
                return f"Call {i}: {response.status_code}"

        tasks = [single_call(i) for i in range(3)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in results:
            if isinstance(r, Exception):
                print(f"  FAILED: {type(r).__name__}: {r}")
            else:
                print(f"  {r}")
    except Exception as e:
        print(f"  FAILED: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    print()

async def test_build_agents():
    """Test 4: Can we build agents and call one?"""
    print("=== TEST 4: Build agents ===")
    try:
        from agents.builder import build_agents
        agents = build_agents()
        print(f"  Built {len(agents)} agents")
        for name, agent in agents.items():
            print(f"    {name}: provider={agent.provider}, model={agent.model}")
    except Exception as e:
        print(f"  FAILED: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    print()

async def test_storage():
    """Test 5: Can storage work?"""
    print("=== TEST 5: Storage ===")
    try:
        from storage.db import init_db
        init_db()
        print("  SUCCESS: DB initialized")
    except Exception as e:
        print(f"  FAILED: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    print()

async def main():
    await test_storage()
    await test_build_agents()
    await test_grounding()
    await test_httpx_call()
    await test_concurrent_httpx()
    print("=== ALL TESTS COMPLETE ===")

if __name__ == "__main__":
    asyncio.run(main())
