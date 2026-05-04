#!/usr/bin/env python
import sys
import os

# Add backend directory to path
backend_dir = r'd:\safeclicker\backend'
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

print(f"Python path: {sys.path}")
print(f"Current dir: {os.getcwd()}")

try:
    from app.main import app
    print("✅ Successfully imported app")
    
    if __name__ == "__main__":
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
