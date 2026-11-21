//            BANCO DE DADOS     HTTP
// [C]reat    insert             post
// [R]read    select             get
// [U]pdate   update             put
// [U]pdate   update             patch
// [D]elete   delete             delete

import { db } from "./db"

const srv = Bun.serve({
    port: 3000,
    routes: {
        "/user": {
            GET: () => {
                const query = db.query(`SELECT * FROM users`)
                const data = query.all()
                return Response.json(data)
            },

            POST: async (req) => {
                const body = await req.body.json()
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

            PUT: async (req) => {
                const body = await req.body.json()
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

        "/coisa": {
            GET: () => Response.json({}, { status: 501 }),
            POST: () => Response.json({}, { status: 501 }),
        },

        "/produto": {
            GET: () => {
                const query = db.query(`
            SELECT * FROM Produto
        `);

                return Response.json(query.all());
            },

            POST: async (req) => {
                const body = await req.json();

                const query = db.query(`
            INSERT INTO Produto (
                nome,
                descricao,
                ingredientes,
                calorias,
                preco,
                foto
            )
            VALUES (
                :nome,
                :descricao,
                :ingredientes,
                :calorias,
                :preco,
                :foto
            )
        `);

                const dbResp = query.run({
                    ":nome": body.nome,
                    ":descricao": body.descricao,
                    ":ingredientes": body.ingredientes,
                    ":calorias": body.calorias,
                    ":preco": body.preco,
                    ":foto": body.foto
                });

                return Response.json(dbResp, { status: 201 });
            }
        }
    }
})

console.log(`Servidor em ${srv.url}`)