import json
import logging
import os
import secrets
import sqlite3
import threading
import time
from http.cookies import CookieError, SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import queries


API_HOST = "127.0.0.1"
API_PORT = int(os.environ.get("HUB_API_PORT", "8001"))
SESSION_TTL_SECONDS = 8 * 60 * 60
SESSION_COOKIE = "hub_session"
ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.environ.get(
        "HUB_ALLOWED_ORIGINS",
        "http://localhost:8080,http://127.0.0.1:8080",
    ).split(",")
    if origin.strip()
}
sessions = {}
sessions_lock = threading.Lock()


class APIHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        origin = self.headers.get("Origin")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.send_header("Vary", "Origin")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        if not self._origin_is_allowed():
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "600")
        self.end_headers()

    def do_GET(self):
        if not self._origin_is_allowed():
            return
        if self.path != "/api/dashboard":
            self._send_json(404, {"error": "Endpoint not found."})
            return

        email = self._session_email()
        if email is None:
            self._send_json(401, {"error": "Please log in to view your dashboard."})
            return

        try:
            dashboard = queries.get_user_dashboard(email)
        except sqlite3.Error:
            logging.exception("Could not load the signed-in user's dashboard")
            self._send_json(500, {"error": "Could not load dashboard data."})
            return

        if dashboard is None:
            self._send_json(401, {"error": "Please log in to view your dashboard."})
            return
        self._send_json(200, dashboard)

    def do_POST(self):
        if not self._origin_is_allowed():
            return
        if self.path == "/api/login":
            self._login()
        elif self.path == "/api/logout":
            self._logout()
        else:
            self._send_json(404, {"error": "Endpoint not found."})

    def _login(self):
        payload = self._read_json()
        if payload is None:
            return
        email = payload.get("email")
        password = payload.get("password")
        if not isinstance(email, str) or not isinstance(password, str):
            self._send_json(400, {"error": "Enter a valid email address and password."})
            return
        if len(email) > 320 or len(password) > 1024:
            self._send_json(400, {"error": "The login details are too long."})
            return

        try:
            authenticated = queries.verify_login(email, password)
            dashboard = queries.get_user_dashboard(email) if authenticated else None
        except sqlite3.Error:
            logging.exception("Could not authenticate the login request")
            self._send_json(500, {"error": "Could not complete login."})
            return

        if not authenticated or dashboard is None:
            self._send_json(401, {"error": "Email or password was not recognized."})
            return

        now = time.time()
        session_id = secrets.token_urlsafe(32)
        with sessions_lock:
            expired = [key for key, (_, expires) in sessions.items() if expires <= now]
            for key in expired:
                sessions.pop(key, None)
            sessions[session_id] = (email.strip(), now + SESSION_TTL_SECONDS)

        self._send_json(
            200,
            {"user": {"name": dashboard["user"]["name"]}},
            headers={
                "Set-Cookie": (
                    f"{SESSION_COOKIE}={session_id}; Path=/; HttpOnly; "
                    f"SameSite=Lax; Max-Age={SESSION_TTL_SECONDS}"
                )
            },
        )

    def _logout(self):
        session_id = self._session_id()
        if session_id:
            with sessions_lock:
                sessions.pop(session_id, None)
        self._send_json(
            200,
            {"ok": True},
            headers={"Set-Cookie": f"{SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"},
        )

    def _read_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_json(400, {"error": "Invalid request body."})
            return None
        if length <= 0 or length > 16_384:
            self._send_json(400, {"error": "Request body is missing or too large."})
            return None
        try:
            payload = json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send_json(400, {"error": "Request body must be valid JSON."})
            return None
        if not isinstance(payload, dict):
            self._send_json(400, {"error": "Request body must be a JSON object."})
            return None
        return payload

    def _session_id(self):
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
        except CookieError:
            return None
        morsel = cookie.get(SESSION_COOKIE)
        return morsel.value if morsel is not None else None

    def _session_email(self):
        session_id = self._session_id()
        if session_id is None:
            return None
        with sessions_lock:
            session = sessions.get(session_id)
            if session is None:
                return None
            email, expires = session
            if expires <= time.time():
                sessions.pop(session_id, None)
                return None
        return email

    def _origin_is_allowed(self):
        origin = self.headers.get("Origin")
        if origin is None or origin in ALLOWED_ORIGINS:
            return True
        self._send_json(403, {"error": "This page is not allowed to access the local API."})
        return False

    def _send_json(self, status, payload, headers=None):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    server = ThreadingHTTPServer((API_HOST, API_PORT), APIHandler)
    logging.info("The Hub local API is listening at http://%s:%s", API_HOST, API_PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logging.info("Shutting down the local API")
    finally:
        server.server_close()
