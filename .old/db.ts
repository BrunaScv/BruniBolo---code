import { Database } from "bun:sqlite";

const db = new Database("database.sqlite");

// USUÁRIOS
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
    )
`);

// ADMINISTRADOR
db.run(`
    CREATE TABLE IF NOT EXISTS Administrador (
        id_administrador INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        email TEXT,
        senha TEXT,
        telefone TEXT
    )
`);

// CLIENTE
db.run(`
    CREATE TABLE IF NOT EXISTS Cliente (
        id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        email TEXT,
        senha TEXT,
        telefone TEXT
    )
`);

// PRODUTO
db.run(`
    CREATE TABLE IF NOT EXISTS Produto (
        id_produto INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        descricao TEXT,
        ingredientes TEXT,
        calorias INTEGER,
        preco REAL,
        foto TEXT
    )
`);

// AGENDA
db.run(`
    CREATE TABLE IF NOT EXISTS Agenda (
        id_agenda INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        horario TEXT
    )
`);

// PEDIDO
db.run(`
    CREATE TABLE IF NOT EXISTS Pedido (
        id_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
        id_cliente INTEGER,
        id_produto INTEGER,
        id_agenda INTEGER,
        status TEXT,

        FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente),
        FOREIGN KEY (id_produto) REFERENCES Produto(id_produto),
        FOREIGN KEY (id_agenda) REFERENCES Agenda(id_agenda)
    )
`);

// POSTAGEM
db.run(`
    CREATE TABLE IF NOT EXISTS Postagem (
        id_postagem INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT,
        descricao TEXT,
        data_postagem TEXT,
        id_administrador INTEGER,

        FOREIGN KEY (id_administrador)
        REFERENCES Administrador(id_administrador)
    )
`);

export { db };