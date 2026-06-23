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
MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() in ("true", "1", "yes")
