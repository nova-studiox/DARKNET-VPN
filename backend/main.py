from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path
import sqlite3
from datetime import datetime, timezone

app = FastAPI(title="NOVA Messenger API", version="1.0.0")

DB_PATH = Path(__file__).parent / "nova.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(sender_id) REFERENCES users(id),
                FOREIGN KEY(receiver_id) REFERENCES users(id)
            )
        """)


init_db()


class RegisterRequest(BaseModel):
    phone: str
    display_name: str


class MessageRequest(BaseModel):
    sender_id: int
    receiver_id: int
    content: str


@app.get("/")
def home():
    return {"app": "NOVA Messenger", "status": "online"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/users/register")
def register(data: RegisterRequest):
    phone = data.phone.strip()
    name = data.display_name.strip()

    if not phone or not name:
        raise HTTPException(400, "شماره و نام الزامی است")

    try:
        with get_db() as db:
            cursor = db.execute(
                "INSERT INTO users (phone, display_name, created_at) VALUES (?, ?, ?)",
                (phone, name, datetime.now(timezone.utc).isoformat())
            )
            user_id = cursor.lastrowid

        return {"success": True, "user_id": user_id, "phone": phone, "display_name": name}

    except sqlite3.IntegrityError:
        raise HTTPException(409, "این شماره قبلاً ثبت شده است")


@app.get("/users/{user_id}")
def get_user(user_id: int):
    with get_db() as db:
        user = db.execute(
            "SELECT id, phone, display_name, created_at FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()

    if not user:
        raise HTTPException(404, "کاربر پیدا نشد")

    return dict(user)


@app.post("/messages")
def send_message(data: MessageRequest):
    content = data.content.strip()

    if not content:
        raise HTTPException(400, "متن پیام خالی است")

    if len(content) > 5000:
        raise HTTPException(400, "پیام بیش از حد طولانی است")

    with get_db() as db:
        users = db.execute(
            "SELECT id FROM users WHERE id IN (?, ?)",
            (data.sender_id, data.receiver_id)
        ).fetchall()

        if len(users) != 2:
            raise HTTPException(404, "فرستنده یا گیرنده پیدا نشد")

        cursor = db.execute(
            """INSERT INTO messages
               (sender_id, receiver_id, content, created_at)
               VALUES (?, ?, ?, ?)""",
            (
                data.sender_id,
                data.receiver_id,
                content,
                datetime.now(timezone.utc).isoformat()
            )
        )

        message_id = cursor.lastrowid

    return {"success": True, "message_id": message_id}


@app.get("/messages/{user_a}/{user_b}")
def get_messages(user_a: int, user_b: int):
    with get_db() as db:
        rows = db.execute(
            """SELECT id, sender_id, receiver_id, content, created_at
               FROM messages
               WHERE (sender_id = ? AND receiver_id = ?)
                  OR (sender_id = ? AND receiver_id = ?)
               ORDER BY id ASC LIMIT 200""",
            (user_a, user_b, user_b, user_a)
        ).fetchall()

    return {"messages": [dict(row) for row in rows]}
