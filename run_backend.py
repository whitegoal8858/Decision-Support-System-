import os
import sys
import uvicorn

# Add backend directory to sys.path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

if __name__ == "__main__":
    os.chdir(backend_path)
    print("=" * 60)
    print("Starting UP Tourism Decision Support System Backend...")
    print("API Documentation: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
