#!/usr/bin/env python3
"""Small dependency-free backend for Ambassador Cre8tive's static site.

Features:
- First-run admin password setup (PBKDF2 password hashing)
- Signed, expiring admin session cookie
- Project CRUD backed by data/projects.json
- Authenticated project CRUD using public project-image links
- Static file serving for the public site
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import mimetypes
import os
import secrets
import time
import uuid
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parent
ASSET_DIR = ROOT / "assets"
DATA_DIR = ROOT / "data"
ADMIN_CONFIG = DATA_DIR / "admin.json"
PROJECTS_FILE = DATA_DIR / "projects.json"
MAX_JSON_BYTES = 1 * 1024 * 1024
SESSION_SECONDS = 60 * 60 * 12
ALLOWED_CATEGORIES = {"identity", "campaign", "digital", "print"}
PUBLIC_ROOT_FILES = {
    "index.html", "about.html", "services.html", "portfolio.html", "project.html", "blog.html", "post.html", "contact.html", "search.html", "privacy.html", "admin.html", "unsubscribe.html", "confirm-subscription.html", "robots.txt",
    "styles.css", "app.js", "posts.js", "projects.js", "project.js", "firebase-config.js", "admin.css", "admin.js", "contact.js", "newsletter.js", "integrations.js", "unsubscribe.js", "confirm-subscription.js",
}
PUBLIC_ASSET_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".ico", ".ttf", ".woff", ".woff2", ".mp3", ".mp4", ".pdf"}

DEFAULT_PROJECTS = [
    {
        "id": "orbit-co",
        "title": "Orbit & Co.",
        "client": "Brand identity project",
        "category": "identity",
        "description": "A refined visual identity and print direction built for a contemporary lifestyle brand.",
        "image": "assets/project_01.jpg",
        "imageAlt": "African-inspired brand identity stationery and packaging",
        "date": "2026-05-14",
        "featured": True,
        "published": True,
        "createdAt": "2026-05-14T10:00:00Z",
        "updatedAt": "2026-05-14T10:00:00Z",
    },
    {
        "id": "wealthwise",
        "title": "Wealthwise",
        "client": "Digital content direction",
        "category": "digital",
        "description": "A digital campaign system for clear, confident social communication.",
        "image": "assets/project_02.jpg",
        "imageAlt": "African creative professional working on a digital design project",
        "date": "2026-04-21",
        "featured": False,
        "published": True,
        "createdAt": "2026-04-21T10:00:00Z",
        "updatedAt": "2026-04-21T10:00:00Z",
    },
    {
        "id": "common-ground",
        "title": "Common Ground",
        "client": "Campaign creative direction",
        "category": "campaign",
        "description": "Bold campaign imagery created to bring a vibrant brand story to life.",
        "image": "assets/project_03.jpg",
        "imageAlt": "African fashion campaign photographed in an urban setting",
        "date": "2026-03-03",
        "featured": False,
        "published": True,
        "createdAt": "2026-03-03T10:00:00Z",
        "updatedAt": "2026-03-03T10:00:00Z",
    },
    {
        "id": "northstar",
        "title": "Northstar",
        "client": "Product packaging identity",
        "category": "identity",
        "description": "A product identity system that combines contemporary form with African-inspired pattern.",
        "image": "assets/project_04.jpg",
        "imageAlt": "African-inspired artisan product packaging and brand visuals",
        "date": "2026-02-10",
        "featured": False,
        "published": True,
        "createdAt": "2026-02-10T10:00:00Z",
        "updatedAt": "2026-02-10T10:00:00Z",
    },
    {
        "id": "gather-together",
        "title": "Gather Together",
        "client": "Print and publication design",
        "category": "print",
        "description": "A tactile print system for editorial materials, invitations, and campaign collateral.",
        "image": "assets/project_05.jpg",
        "imageAlt": "African-inspired printed publications and invitations on a studio table",
        "date": "2026-01-22",
        "featured": False,
        "published": True,
        "createdAt": "2026-01-22T10:00:00Z",
        "updatedAt": "2026-01-22T10:00:00Z",
    },
]

# The starter portfolio is intentionally descriptive rather than claim-heavy. It gives the public
# case-study template meaningful content while leaving verified client quotes optional.
DEFAULT_CASE_STUDY_DETAILS = {
    "orbit-co": {
        "challenge": "Create a polished visual identity that could give Orbit & Co. a clear, recognisable presence across everyday brand touchpoints.",
        "approach": "We shaped a refined creative direction, then translated it into a flexible visual system so type, tone, and printed details could feel connected.",
        "deliverables": ["Core visual identity", "Colour and typography system", "Stationery direction", "Print-ready assets"],
        "outcome": "A cohesive identity foundation designed to make every customer-facing touchpoint feel intentional and recognisable.",
    },
    "wealthwise": {
        "challenge": "Make complex financial ideas feel more approachable through a confident, easy-to-follow digital content direction.",
        "approach": "We established a focused content system with clear hierarchy, adaptable layouts, and a visual rhythm suited to everyday digital communication.",
        "deliverables": ["Digital content direction", "Social content layouts", "Campaign graphic system", "Reusable visual guidance"],
        "outcome": "A practical direction designed to help financial messages feel clearer, more consistent, and easier to engage with.",
    },
    "common-ground": {
        "challenge": "Give a campaign story enough visual distinction to cut through while keeping every touchpoint part of one clear idea.",
        "approach": "We used a bold image-led direction and a repeatable set of campaign elements to create consistency from the hero visual through supporting assets.",
        "deliverables": ["Campaign creative direction", "Hero visual direction", "Digital campaign assets", "Launch-ready artwork"],
        "outcome": "A cohesive campaign toolkit built to carry one memorable idea across multiple customer moments.",
    },
    "northstar": {
        "challenge": "Create a product identity with enough personality to feel distinctive while remaining practical across packaging and digital materials.",
        "approach": "We balanced contemporary form with considered pattern, material, and typography decisions to build a recognisable identity system.",
        "deliverables": ["Product identity system", "Packaging direction", "Typography and colour rules", "Digital visual assets"],
        "outcome": "An adaptable identity designed to give the product a confident, coherent presence wherever people meet it.",
    },
    "gather-together": {
        "challenge": "Create printed materials that could make an occasion feel considered, warm, and consistently branded from invitation to follow-up piece.",
        "approach": "We developed a tactile editorial direction with a clear information hierarchy and visual details that translate beautifully in print.",
        "deliverables": ["Editorial print direction", "Invitation and collateral layouts", "Print-ready artwork", "Production guidance"],
        "outcome": "A unified print system designed to make each physical touchpoint feel purposeful and memorable.",
    },
}
for _project in DEFAULT_PROJECTS:
    _project.update(DEFAULT_CASE_STUDY_DETAILS.get(_project["id"], {}))


def ensure_storage() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    if not PROJECTS_FILE.exists():
        write_json(PROJECTS_FILE, DEFAULT_PROJECTS)


def read_json(path: Path, fallback: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return fallback


def write_json(path: Path, value: Any) -> None:
    temp_path = path.with_suffix(path.suffix + ".tmp")
    temp_path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temp_path.replace(path)


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def password_hash(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), base64.urlsafe_b64decode(salt.encode("ascii")), 310_000).hex()


def admin_config() -> dict[str, str] | None:
    config = read_json(ADMIN_CONFIG, None)
    if not isinstance(config, dict) or not {"salt", "passwordHash", "secret"}.issubset(config):
        return None
    return config


def make_session(config: dict[str, str]) -> str:
    expires = str(int(time.time()) + SESSION_SECONDS)
    signature = hmac.new(
        base64.urlsafe_b64decode(config["secret"].encode("ascii")),
        expires.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()
    return f"{expires}.{signature}"


def session_is_valid(token: str | None) -> bool:
    config = admin_config()
    if not token or not config:
        return False
    try:
        expires, signature = token.split(".", 1)
        if int(expires) < int(time.time()):
            return False
        expected = hmac.new(
            base64.urlsafe_b64decode(config["secret"].encode("ascii")),
            expires.encode("ascii"),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(signature, expected)
    except (ValueError, TypeError):
        return False


def clean_text(value: Any, limit: int = 5000) -> str:
    return str(value or "").strip()[:limit]


def clean_list(value: Any, maximum_items: int = 12, item_limit: int = 140) -> list[str]:
    """Accept an admin textarea/list and keep only short, useful list items."""
    if isinstance(value, list):
        candidates = value
    else:
        text = clean_text(value, maximum_items * (item_limit + 4))
        candidates = text.replace("\r", "").split("\n") if "\n" in text else text.split(",")
    cleaned: list[str] = []
    for item in candidates:
        entry = clean_text(item, item_limit).lstrip("•-– ").strip()
        if entry and entry not in cleaned:
            cleaned.append(entry)
        if len(cleaned) >= maximum_items:
            break
    return cleaned


def normalise_image_url(value: Any) -> str:
    image = clean_text(value, 1000)
    if not image:
        return ""
    # Existing starter images stay valid locally. New project media must use public HTTPS.
    if image.startswith("assets/"):
        relative = Path(image)
        image_suffixes = {".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"}
        candidate = (ROOT / relative).resolve()
        if (
            all(part not in {".", ".."} for part in relative.parts)
            and ASSET_DIR in candidate.parents
            and candidate.suffix.lower() in image_suffixes
            and candidate.is_file()
        ):
            return image
        return ""
    parsed = urlparse(image)
    if parsed.scheme == "https" and parsed.netloc and not parsed.username and not parsed.password:
        return image
    return ""


def validate_project(payload: dict[str, Any], existing: dict[str, Any] | None = None) -> dict[str, Any]:
    title = clean_text(payload.get("title"), 120)
    category = clean_text(payload.get("category"), 40).lower()
    if not title:
        raise ValueError("Project title is required.")
    if category not in ALLOWED_CATEGORIES:
        raise ValueError("Choose a valid project category.")

    image = normalise_image_url(payload.get("image"))
    if not image:
        raise ValueError("Enter a public HTTPS project-image link before saving.")

    current = existing or {}
    record = {
        "id": current.get("id") or uuid.uuid4().hex,
        "title": title,
        "client": clean_text(payload.get("client"), 120),
        "category": category,
        "description": clean_text(payload.get("description"), 650),
        "challenge": clean_text(payload.get("challenge"), 700),
        "approach": clean_text(payload.get("approach"), 700),
        "deliverables": clean_list(payload.get("deliverables")),
        "outcome": clean_text(payload.get("outcome"), 700),
        "testimonial": clean_text(payload.get("testimonial"), 650),
        "testimonialAttribution": clean_text(payload.get("testimonialAttribution"), 160),
        "image": image,
        "imageAlt": clean_text(payload.get("imageAlt"), 180) or f"Project image for {title}",
        "date": clean_text(payload.get("date"), 20),
        "featured": bool(payload.get("featured")),
        "published": bool(payload.get("published", True)),
        "createdAt": current.get("createdAt") or now_iso(),
        "updatedAt": now_iso(),
    }
    return record


class SiteHandler(BaseHTTPRequestHandler):
    server_version = "AmbassadorCre8tive/1.0"

    def log_message(self, format: str, *args: Any) -> None:
        # Concise development log.
        print(f"[{self.log_date_time_string()}] {self.address_string()} {format % args}")

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        super().end_headers()

    def send_json(self, status: int, payload: Any, headers: dict[str, str] | None = None) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(data)

    def send_error_json(self, status: int, message: str) -> None:
        self.send_json(status, {"ok": False, "error": message})

    def read_body(self, maximum: int) -> bytes:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ValueError("Invalid request length.")
        if length < 1:
            raise ValueError("Request body is required.")
        if length > maximum:
            raise ValueError("Request is too large.")
        return self.rfile.read(length)

    def json_body(self) -> dict[str, Any]:
        body = self.read_body(MAX_JSON_BYTES)
        try:
            value = json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise ValueError("Invalid JSON request.")
        if not isinstance(value, dict):
            raise ValueError("JSON request must be an object.")
        return value

    def cookie_value(self, name: str) -> str | None:
        try:
            cookies = SimpleCookie(self.headers.get("Cookie", ""))
            morsel = cookies.get(name)
            return morsel.value if morsel else None
        except Exception:
            return None

    def authorised(self) -> bool:
        return session_is_valid(self.cookie_value("ambassador_admin"))

    def require_auth(self) -> bool:
        if not self.authorised():
            self.send_error_json(HTTPStatus.UNAUTHORIZED, "Please sign in to continue.")
            return False
        return True

    def set_session_headers(self, config: dict[str, str]) -> dict[str, str]:
        return {
            "Set-Cookie": f"ambassador_admin={make_session(config)}; Max-Age={SESSION_SECONDS}; Path=/; HttpOnly; SameSite=Strict"
        }

    def clear_session_headers(self) -> dict[str, str]:
        return {"Set-Cookie": "ambassador_admin=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict"}

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        if path == "/api/auth/status":
            configured = admin_config() is not None
            self.send_json(HTTPStatus.OK, {"ok": True, "configured": configured, "authenticated": configured and self.authorised()})
            return
        if path == "/api/projects":
            projects = read_json(PROJECTS_FILE, DEFAULT_PROJECTS)
            if not self.authorised():
                projects = [project for project in projects if project.get("published", True)]
            self.send_json(HTTPStatus.OK, {"ok": True, "projects": projects})
            return
        if path in {"/admin", "/admin/"}:
            self.serve_file(ROOT / "admin.html")
            return
        self.serve_static(path)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/auth/setup":
            self.setup_admin()
            return
        if path == "/api/auth/login":
            self.login()
            return
        if path == "/api/auth/logout":
            self.send_json(HTTPStatus.OK, {"ok": True}, self.clear_session_headers())
            return
        if path == "/api/projects":
            if self.require_auth():
                self.create_project()
            return
        self.send_error_json(HTTPStatus.NOT_FOUND, "Route not found.")

    def do_PUT(self) -> None:
        path = urlparse(self.path).path
        if path.startswith("/api/projects/"):
            if self.require_auth():
                self.update_project(path.rsplit("/", 1)[-1])
            return
        self.send_error_json(HTTPStatus.NOT_FOUND, "Route not found.")

    def do_DELETE(self) -> None:
        path = urlparse(self.path).path
        if path.startswith("/api/projects/"):
            if self.require_auth():
                self.delete_project(path.rsplit("/", 1)[-1])
            return
        self.send_error_json(HTTPStatus.NOT_FOUND, "Route not found.")

    def setup_admin(self) -> None:
        if admin_config() is not None:
            self.send_error_json(HTTPStatus.CONFLICT, "Administrator setup is already complete.")
            return
        try:
            payload = self.json_body()
            password = clean_text(payload.get("password"), 500)
            confirmation = clean_text(payload.get("confirmation"), 500)
            if len(password) < 10:
                raise ValueError("Use a password with at least 10 characters.")
            if password != confirmation:
                raise ValueError("Passwords do not match.")
            salt = base64.urlsafe_b64encode(secrets.token_bytes(16)).decode("ascii")
            config = {
                "salt": salt,
                "passwordHash": password_hash(password, salt),
                "secret": base64.urlsafe_b64encode(secrets.token_bytes(32)).decode("ascii"),
                "createdAt": now_iso(),
            }
            write_json(ADMIN_CONFIG, config)
            self.send_json(HTTPStatus.CREATED, {"ok": True, "authenticated": True}, self.set_session_headers(config))
        except ValueError as exc:
            self.send_error_json(HTTPStatus.BAD_REQUEST, str(exc))

    def login(self) -> None:
        config = admin_config()
        if config is None:
            self.send_error_json(HTTPStatus.PRECONDITION_REQUIRED, "Create an administrator password first.")
            return
        try:
            payload = self.json_body()
            supplied = clean_text(payload.get("password"), 500)
            if not hmac.compare_digest(password_hash(supplied, config["salt"]), config["passwordHash"]):
                self.send_error_json(HTTPStatus.UNAUTHORIZED, "Incorrect password.")
                return
            self.send_json(HTTPStatus.OK, {"ok": True, "authenticated": True}, self.set_session_headers(config))
        except ValueError as exc:
            self.send_error_json(HTTPStatus.BAD_REQUEST, str(exc))

    def create_project(self) -> None:
        try:
            project = validate_project(self.json_body())
            projects = read_json(PROJECTS_FILE, DEFAULT_PROJECTS)
            projects.insert(0, project)
            write_json(PROJECTS_FILE, projects)
            self.send_json(HTTPStatus.CREATED, {"ok": True, "project": project})
        except ValueError as exc:
            self.send_error_json(HTTPStatus.BAD_REQUEST, str(exc))

    def update_project(self, project_id: str) -> None:
        try:
            projects = read_json(PROJECTS_FILE, DEFAULT_PROJECTS)
            index = next((i for i, project in enumerate(projects) if project.get("id") == project_id), None)
            if index is None:
                self.send_error_json(HTTPStatus.NOT_FOUND, "Project not found.")
                return
            projects[index] = validate_project(self.json_body(), projects[index])
            write_json(PROJECTS_FILE, projects)
            self.send_json(HTTPStatus.OK, {"ok": True, "project": projects[index]})
        except ValueError as exc:
            self.send_error_json(HTTPStatus.BAD_REQUEST, str(exc))

    def delete_project(self, project_id: str) -> None:
        projects = read_json(PROJECTS_FILE, DEFAULT_PROJECTS)
        retained = [project for project in projects if project.get("id") != project_id]
        if len(retained) == len(projects):
            self.send_error_json(HTTPStatus.NOT_FOUND, "Project not found.")
            return
        write_json(PROJECTS_FILE, retained)
        self.send_json(HTTPStatus.OK, {"ok": True, "deleted": project_id})

    def serve_static(self, request_path: str) -> None:
        relative = "index.html" if request_path in {"", "/"} else unquote(request_path).lstrip("/")
        candidate = (ROOT / relative).resolve()
        parts = Path(relative).parts
        # Do not accidentally expose backend source, runtime data, or arbitrary workspace files.
        is_public_root_file = relative in PUBLIC_ROOT_FILES
        is_public_asset = (
            len(parts) > 1
            and parts[0] == "assets"
            and candidate.suffix.lower() in PUBLIC_ASSET_SUFFIXES
        )
        if (
            not (is_public_root_file or is_public_asset)
            or ROOT not in candidate.parents
            or DATA_DIR in candidate.parents
            or candidate == DATA_DIR
        ):
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        self.serve_file(candidate)

    def serve_file(self, path: Path) -> None:
        if not path.exists() or not path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        try:
            data = path.read_bytes()
            content_type = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
            if path.suffix == ".js":
                content_type = "application/javascript"
            elif path.suffix == ".css":
                content_type = "text/css"
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", f"{content_type}; charset=utf-8" if content_type.startswith("text/") or content_type in {"application/javascript", "application/json"} else content_type)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-cache" if path.suffix in {".html", ".css", ".js"} else "public, max-age=86400")
            self.end_headers()
            self.wfile.write(data)
        except OSError:
            self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR)


def main() -> None:
    ensure_storage()
    port = int(os.environ.get("PORT", "4173"))
    server = ThreadingHTTPServer(("0.0.0.0", port), SiteHandler)
    print(f"Ambassador Cre8tive site and admin backend running at http://0.0.0.0:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
