CREATE TABLE Administrador (
    id_administrador SERIAL PRIMARY KEY,
    nome VARCHAR(20),
    email VARCHAR(50),
    senha VARCHAR(10),
    telefone VARCHAR(20)
);


CREATE TABLE Cliente (
    id_cliente SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    senha VARCHAR(20) NOT NULL,
    CONSTRAINT chk_senha_min_tamanho CHECK (CHAR_LENGTH(senha) >= 6)
);
    
    


CREATE TABLE Produto (
    id_produto SERIAL PRIMARY KEY,
    nome VARCHAR(50),
    descricao TEXT,
    ingredientes TEXT,
    calorias INT,
    preco DECIMAL(10,2),
    foto VARCHAR(255)
);


CREATE TABLE Agenda (
    id_agenda SERIAL PRIMARY KEY,
    data DATE,
    horario TIME
);


CREATE TABLE Pedido (
    id_pedido SERIAL PRIMARY KEY,
    id_cliente INT,
    id_produto INT,
    id_agenda INT,
    status VARCHAR(30),


    FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente),
    FOREIGN KEY (id_produto) REFERENCES Produto(id_produto),

    FOREIGN KEY (id_agenda) REFERENCES Agenda(id_agenda)
);

CREATE TABLE Postagem (
    id_postagem SERIAL PRIMARY KEY,
    titulo VARCHAR(100),
    descricao TEXT,
    data_postagem DATE,
    id_administrador INT,


    FOREIGN KEY (id_administrador) REFERENCES Administrador(id_administrador)
);

SELECT * FROM pg_tables 
WHERE schemaname = 'public';

SELECT * FROM Cliente;