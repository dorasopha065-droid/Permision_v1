import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Google Sheets Configuration
# The name or key of your Google Spreadsheet
GOOGLE_SHEET_NAME = os.getenv("GOOGLE_SHEET_NAME", "School Attendance Management")

# Path to the Google Service Account JSON file (credentials.json)
# Place this file in the project root or configure via env
GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")

# Telegram Bot Integration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_TELEGRAM_BOT_TOKEN_HERE")

# Server Configuration
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 8000))

# Simple mock database/credentials flag for development without API keys
# This allows testing the UI even if the user hasn't configured APIs yet.
# If a Postgres URL is provided, we default MOCK_MODE to False unless explicitly overridden.
POSTGRES_URL = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL")

MOCK_MODE_ENV = os.getenv("MOCK_MODE")
if MOCK_MODE_ENV is not None:
    MOCK_MODE = MOCK_MODE_ENV.lower() in ("true", "1", "yes")
else:
    MOCK_MODE = not bool(POSTGRES_URL)

