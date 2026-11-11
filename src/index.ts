import login from "../index.html"
import home from "./home.html"
import cadastro from "./cadastro.html"
import { db } from "./db.ts"

const loggedUsers: any = {}

type User = {
    username: string
    password: string
}

const srv = Bun.serve({
    port: 3000,

    routes: {
        "/": login,

        "/home": home,

        "/cadastro": cadastro,

        "/user": {
            // ROTA NOVA: Lista os usuários do banco de dados
            GET: () => {
                const query = db.query(`
                    SELECT id, username FROM users
                `)
                const users = query.all()
                return Response.json(users)
            },

            POST: async (req) => {

                const body = await req.json() as User

                // Valida se os campos vieram preenchidos
                if (!body?.username || !body?.password) {
                    return Response.json(
                        { msg: "Preencha usuário e senha!" },
                        { status: 400 }
                    )
                }

                // Valida o tamanho da senha (mínimo 6 caracteres)
                if (body.password.length < 6) {
                    return Response.json(
                        { msg: "A senha deve ter no mínimo 6 caracteres!" },
                        { status: 400 }
                    )
                }

                // Verifica se o usuário já existe no banco
                const checkQuery = db.query(`
                    SELECT id FROM users WHERE username = :username LIMIT 1
                `)
                const existingUser = checkQuery.get({ ":username": body.username })

                if (existingUser) {
                    return Response.json(
                        { msg: "Este nome de usuário já está cadastrado!" },
                        { status: 409 } // 409 = Conflito
                    )
                }

                const hash = await Bun.password.hash(body?.password)

                const query = db.query(`
                    INSERT INTO users(username, password_hash)
                    VALUES(:username, :password_hash)
                `)

                const data = query.run({ ":username": body?.username, ":password_hash": hash })
                return Response.json(data)
            }
        },

        "/login": {
            POST: async (req) => {

                const body = await req.json() as User

                const query = db.query(`
                    SELECT * FROM users
                    WHERE username = :username
                    LIMIT 1
                `)

                const data: any = query.get({ ":username": body.username })

                if (!data) {
                    return Response.json(
                        { msg: "Usuário não encontrado" },
                        { status: 404 }
                    )
                }

                const hash = data.password_hash

                const isMatch = await Bun.password.verify(body.password, hash)

                if (!isMatch) {
                    return Response.json(
                        { msg: "Senha incorreta" },
                        { status: 401 }
                    )
                }

                const uuid = crypto.randomUUID()

                delete data.password_hash

                loggedUsers[uuid] = data

                req.cookies.set("ses", uuid)

                return Response.json(true)
            }
        },

        "/login/user": (req) => {

            const ses = req.cookies.get("ses") as string

            const data = loggedUsers[ses]

            if (!ses || !data) {
                return Response.json(
                    { msg: "Usuário não logado" },
                    { status: 401 }
                )
            }

            return Response.json(data)
        }
    }
})

console.log(`Server running on ${srv.url}`)
