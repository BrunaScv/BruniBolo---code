# Prog1.tri3.ativ1




	//            BANCO DE DADOS     HTTP
// [C]reat    insert             post
// [R]read    select             get
// [U]pdate   update             put
// [U]pdate   update             patch
// [D]elete   delete             delete
import frontend from "./index.html"
import { db } from "./db"

const srv = Bun.serve({
    port: 3000,
    routes: {

        "/": frontend,
        "/user": {
            GET: () => {
                const query = db.query(`SELECT * FROM users`)
                const data = query.all()
                return Response.json(data)
            },

            POST: async (req) => {
                const body = await req.body?.json()
                const query = db.query(`
                    INSERT INTO users(username, email, password_hash)
                    VALUES(:username, :email, :password_hash)
                `)
                const dbResp = query.run({
                    ':username': body.username,
                    ':email': body.email,
                    ':password_hash': body.password
                })
                return Response.json({
                    "message": "deu boa garote!",
                    dbResp
                })
            },
        },

        "/user/:id": {
            GET: (req) => {
                const id = req.params.id
                const query = db.query(`SELECT * FROM users WHERE id=:id`)
                const data = query.get({ ':id': id })
                return Response.json(data)
            },

            PUT: async(req) => {
                const body = await req.body?.json()
                const query = db.query(`UPDATE users SET username = :username, email = :email, password_hash = :password WHERE id = :id`)
                const dbResp = query.run({
                    ':username': body.username,
                    ':email': body.email,
                    ':password': body.password,
                    ':id': req.params.id
                })
                return Response.json(dbResp)
            },

            DELETE: (req) => {
                const query = db.query(`DELETE FROM users WHERE id=:id`)
                const data = query.run({ ':id': req.params.id })
                return Response.json(data)
            },
        },

    }
})

console.log(`Servidor em ${srv.url}`)

















<!DOCTYPE html>
<html lang='pt-BR'>

<head>
    <meta charset='utf-8'>
    <title>App</title>
</head>

<body>
    <ul></ul>
    <div>Cadastrar Usuário</div>
    
    <form id="formulario">
        <input type="text" id="username" placeholder="Usuário" required>
        <input type="email" id="email" placeholder="E-mail" required>
        <input type="password" id="password" placeholder="Senha" required>

        <button type="submit">Cadastrar</button>
    </form>



    <input type="number" id = "buscar">
    <button id = "buscar" onclick="buscar()">buscar um</button>
    <div>o valor aqui</div>

    <script>
        const form = document.querySelector("#formulario")
        const mostra = document.querySelector("div");
        const list = document.querySelector("ul");
        const inputId = document.querySelector("#buscar");
        let body = []

        async function init() {
            const response = await fetch("/user");
            body = await response.json();
            body.forEach(user => {
                list.innerHTML += `<li>${user.username}</li>`;
            });
        }

        async function buscar() {
            const idBuscado = inputId.value;
            body.forEach(user => {
                if (user.id == idBuscado) {
                    mostra.innerHTML = `<p><strong>Nome:</strong> ${user.username}</p>`;
                }
            });
        }

        async function Cadastrar() {

            const username = document.querySelector("#username").value;
            const email = document.querySelector("#email").value;
            const password = document.querySelector("#password").value;

            const response = await fetch("/user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },

                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });

        const data = await response.json();
        console.log(data);

        }
        document.querySelector("#formulario").addEventListener("submit", (event) => {
            event.preventDefault();
            Cadastrar()

        })

        init()
    </script>
</body>

</html>
