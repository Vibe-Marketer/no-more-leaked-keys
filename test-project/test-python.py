# Test reading API key from .env file
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.environ.get("TEST_API_KEY")

if api_key:
    print("[SUCCESS] TEST_API_KEY loaded from .env")
    print(f"Key starts with: {api_key[:4]}...")
    print(f"Key length: {len(api_key)} characters")
else:
    print("[ERROR] TEST_API_KEY not found in .env")
