import { Database } from "bun:sqlite"

const db = new Database("database.sqlite")

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
    )
`)

export { db }

db.run(`
    CREATE TABLE IF NOT EXISTS slides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        image TEXT NOT NULL,
        text TEXT DEFAULT '',
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`);