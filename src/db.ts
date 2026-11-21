import { Database } from "bun:sqlite"

const db = new Database(`${import.meta.dir}/database.sqlite`)

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
    )
`)

// Verifica se a coluna role já existe no banco antigo
const columns = db.query("PRAGMA table_info(users)").all() as { name: string }[]

if (!columns.some(column => column.name === "role")) {
    db.exec(`
        ALTER TABLE users
        ADD COLUMN role TEXT NOT NULL DEFAULT 'user'
    `)
}

db.exec(`
    CREATE TABLE IF NOT EXISTS slides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        image TEXT NOT NULL,
        text TEXT DEFAULT '',
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`)

export { db }