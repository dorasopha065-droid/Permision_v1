import os
import sys

# Add parent directory to path so backend package can be imported
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.app import app
