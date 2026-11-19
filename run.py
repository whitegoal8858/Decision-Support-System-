import os
import sys
import subprocess
import time
import socket
import webbrowser

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
RUN_BACKEND_SCRIPT = os.path.join(ROOT_DIR, "run_backend.py")

def free_port(port: int):
    """Automatically terminate any stale process locking the target port on Windows/POSIX."""
    try:
        if os.name == "nt":
            output = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True, text=True)
            for line in output.strip().split("\n"):
                parts = line.split()
                if len(parts) >= 5 and "LISTENING" in parts:
                    pid = parts[-1]
                    if pid != "0" and int(pid) != os.getpid():
                        print(f"  [Auto-Clean] Releasing port {port} (Terminating lingering PID {pid})...")
                        subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
        else:
            subprocess.run(f"fuser -k {port}/tcp", shell=True, capture_output=True)
    except Exception:
        pass

def wait_for_port(port: int, host: str = "127.0.0.1", timeout: int = 15) -> bool:
    """Wait until a TCP socket becomes open and reachable."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection((host, port), timeout=1.0):
                return True
        except (ConnectionRefusedError, OSError):
            time.sleep(0.5)
    return False

def main():
    print("=" * 70)
    print("   DEPARTMENT OF TOURISM & CULTURE • GOVERNMENT OF UTTAR PRADESH")
    print("      Project Monitoring & Decision Support System (DSS)")
    print("=" * 70)

    # 1. Port sanitation
    print("\n[1/4] Checking and clearing ports 8000 & 5173...")
    free_port(8000)
    free_port(5173)
    time.sleep(0.5)

    # 2. Start Backend using run_backend.py (ensures sys.path priority)
    print("\n[2/4] Starting FastAPI Backend Server (Port 8000)...")
    backend_proc = subprocess.Popen(
        [sys.executable, RUN_BACKEND_SCRIPT],
        cwd=ROOT_DIR
    )

    # Wait for backend to be live
    backend_ready = wait_for_port(8000, timeout=12)
    if backend_ready:
        print("  ✓ Backend API is active at http://localhost:8000")
    else:
        print("  ⚠ Backend still initializing, proceeding...")

    # 3. Start Frontend Dev Server
    print("\n[3/4] Starting Vite Frontend Server (Port 5173)...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen(
        f"{npm_cmd} run dev -- --host 0.0.0.0 --port 5173",
        cwd=FRONTEND_DIR,
        shell=True
    )

    # Wait for frontend to be live
    frontend_ready = wait_for_port(5173, timeout=10)

    # 4. Open in browser
    target_url = "http://localhost:5173" if frontend_ready else "http://localhost:8000"
    print(f"\n[4/4] Opening UP Tourism DSS Portal: {target_url}")
    webbrowser.open(target_url)

    print("\n" + "=" * 70)
    print("  🚀 SYSTEM IS FULLY OPERATIONAL:")
    print("  • Frontend Live URL : http://localhost:5173")
    print("  • Backup Direct UI  : http://localhost:8000")
    print("  • Backend API Docs  : http://localhost:8000/docs")
    print("  • Login Credentials : See LOGIN_CREDENTIALS.txt")
    print("=" * 70)
    print("\nPress Ctrl+C to stop all services.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping services...")
        try:
            frontend_proc.terminate()
            backend_proc.terminate()
        except Exception:
            pass
        free_port(8000)
        free_port(5173)
        print("Servers stopped successfully. Goodbye!")

if __name__ == "__main__":
    main()
