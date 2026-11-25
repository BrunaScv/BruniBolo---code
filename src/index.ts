import login from "../index.html"
import home from "./home.html"
import cadastro from "./cadastro.html"
import { db } from "./db"
import { mkdir, unlink } from "fs/promises"
import { basename } from "path"

type UserInput = {
    username?: string
    password?: string
}

type UserFromDb = {
    id: number
    username: string
    password_hash: string
    role: "admin" | "user"
}

type SlideFromDb = {
    id: number
    image: string
    text: string
}

// db.query(`
//     UPDATE users
//     SET role = 'admin'
//     WHERE username = ?
// `).run("BruniBolo")

const loggedUsers: Record<string, Omit<UserFromDb, "password_hash">> = {}

const uploadDir = `${import.meta.dir}/uploads`

function getLoggedUser(req: Request): Omit<UserFromDb, "password_hash"> | null {
    const session = req.headers.get("cookie") // No Bun HTTP server moderno, pode-se ler cookies via req.cookies ou cabeçalhos
    // Mantendo a compatibilidade com a sua estrutura de requisição:
    const sessionCookie = (req as any).cookies?.get("ses")

    if (!sessionCookie) {
        return null
    }

    return loggedUsers[sessionCookie] || null
}

function isAdmin(req: Request): boolean {
    const user = getLoggedUser(req)
    return user !== null && user.role === "admin"
}

const srv = Bun.serve({
    port: 3000,

    routes: {
        "/": login,
        "/home": home,
        "/cadastro": cadastro,

        // CADASTRO DE USUÁRIOS
        "/user": {
            POST: async (req) => {
                const body = (await req.json()) as UserInput

                if (!body.username || !body.password) {
                    return Response.json(
                        { msg: "Preencha todos os campos" },
                        { status: 400 }
                    )
                }

                if (body.password.length < 6) {
                    return Response.json(
                        { msg: "A senha precisa ter pelo menos 6 caracteres" },
                        { status: 400 }
                    )
                }

                const existingUser = db.query(
                    "SELECT id FROM users WHERE username = ?"
                ).get(body.username) as { id: number } | undefined

                if (existingUser) {
                    return Response.json(
                        { msg: "Nome de usuário já cadastrado" },
                        { status: 409 }
                    )
                }

                const hash = await Bun.password.hash(body.password)

                db.query(`
                    INSERT INTO users (username, password_hash)
                    VALUES (?, ?)
                `).run(body.username, hash)

                return Response.json({
                    msg: "Usuário cadastrado com sucesso"
                })
            }
        },

        // LOGIN
        "/login": {
            POST: async (req) => {
                const body = (await req.json()) as UserInput

                if (!body.username || !body.password) {
                    return Response.json(
                        { msg: "Preencha todos os campos" },
                        { status: 400 }
                    )
                }

                const user = db.query(`
                    SELECT id, username, password_hash, role
                    FROM users
                    WHERE username = ?
                    LIMIT 1
                `).get(body.username) as UserFromDb | undefined

                if (!user) {
                    return Response.json(
                        { msg: "Usuário não encontrado" },
                        { status: 404 }
                    )
                }

                const passwordCorrect = await Bun.password.verify(
                    body.password,
                    user.password_hash
                )

                if (!passwordCorrect) {
                    return Response.json(
                        { msg: "Senha incorreta" },
                        { status: 401 }
                    )
                }

                const session = crypto.randomUUID()

                const userSessionData = {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }

                loggedUsers[session] = userSessionData

                ;(req as any).cookies.set("ses", session, {
                    httpOnly: true,
                    sameSite: "lax",
                    path: "/"
                })

                return Response.json({
                    msg: "Login realizado",
                    role: user.role
                })
            }
        },

        // INFORMAÇÕES DO USUÁRIO LOGADO
        "/login/user": (req) => {
            const user = getLoggedUser(req)

            if (!user) {
                return Response.json(
                    { msg: "Usuário não logado" },
                    { status: 401 }
                )
            }

            return Response.json(user)
        },

        // LISTAR POSTAGENS
        "/slides": {
            // caso fossemos fazer um gerenciamento do adm das imagens
            GET: (req) => {
                const user = getLoggedUser(req)

                if (!user) {
                    return Response.json(
                        { msg: "Não autorizado" },
                        { status: 401 }
                    )
                }

                const slides = db.query(`
                    SELECT id, image, text
                    FROM slides
                    ORDER BY id DESC
                `).all() as SlideFromDb[]

                return Response.json(slides)
            },

            // ADICIONAR POSTAGEM
            POST: async (req) => {
                const user = getLoggedUser(req)

                if (!user || user.role !== "admin") {
                    return Response.json(
                        { msg: "Apenas o administrador pode publicar" },
                        { status: 403 }
                    )
                }

                const form = await req.formData()

                const image = form.get("image")
                const text = String(form.get("text") || "")

                if (!(image instanceof File)) {
                    return Response.json(
                        { msg: "Selecione uma imagem" },
                        { status: 400 }
                    )
                }

                const extensions: Record<string, string> = {
                    "image/jpeg": ".jpg",
                    "image/png": ".png",
                    "image/webp": ".webp",
                    "image/gif": ".gif"
                }

                const extension = extensions[image.type]

                if (!extension) {
                    return Response.json(
                        { msg: "Formato de imagem não permitido" },
                        { status: 400 }
                    )
                }

                if (image.size > 5 * 1024 * 1024) {
                    return Response.json(
                        { msg: "A imagem deve ter no máximo 5 MB" },
                        { status: 413 }
                    )
                }

                await mkdir(uploadDir, { recursive: true })

                const filename = `${crypto.randomUUID()}${extension}`
                const imagePath = `${uploadDir}/${filename}`

                await Bun.write(imagePath, image)

                const imageUrl = `/uploads/${filename}`

                const result = db.query(`
                    INSERT INTO slides (user_id, image, text)
                    VALUES (?, ?, ?)
                `).run(user.id, imageUrl, text)

                return Response.json({
                    id: Number(result.lastInsertRowid),
                    image: imageUrl,
                    text
                })
            }
        },

        // EDITAR DESCRIÇÃO
        "/slides/:id": {
            PUT: async (req) => {
                if (!isAdmin(req)) {
                    return Response.json(
                        { msg: "Apenas o administrador pode editar" },
                        { status: 403 }
                    )
                }

                const id = Number((req as any).params.id)
                const body = (await req.json()) as { text?: string }

                if (!Number.isInteger(id) || id <= 0) {
                    return Response.json(
                        { msg: "Postagem inválida" },
                        { status: 400 }
                    )
                }

                db.query(`
                    UPDATE slides
                    SET text = ?
                    WHERE id = ?
                `).run(String(body.text || ""), id)

                return Response.json({
                    msg: "Descrição atualizada"
                })
            },

            // EXCLUIR POSTAGEM
            DELETE: async (req) => {
                if (!isAdmin(req)) {
                    return Response.json(
                        { msg: "Apenas o administrador pode excluir" },
                        { status: 403 }
                    )
                }

                const id = Number((req as any).params.id)

                if (!Number.isInteger(id) || id <= 0) {
                    return Response.json(
                        { msg: "Postagem inválida" },
                        { status: 400 }
                    )
                }

                const slide = db.query(`
                    SELECT image FROM slides WHERE id = ?
                `).get(id) as { image: string } | undefined

                if (!slide) {
                    return Response.json(
                        { msg: "Postagem não encontrada" },
                        { status: 404 }
                    )
                }

                db.query(`
                    DELETE FROM slides WHERE id = ?
                `).run(id)

                if (slide.image.startsWith("/uploads/")) {
                    const filename = basename(slide.image)

                    await unlink(`${uploadDir}/${filename}`).catch(() => {})
                }

                return Response.json({
                    msg: "Postagem excluída"
                })
            }
        },

        // MOSTRAR IMAGENS SALVAS
        "/uploads/:filename": async (req) => {
            const filename = (req as any).params.filename as string

            if (!/^[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(filename)) {
                return new Response("Arquivo inválido", { status: 400 })
            }

            const file = Bun.file(`${uploadDir}/${filename}`)

            if (!(await file.exists())) {
                return new Response("Imagem não encontrada", { status: 404 })
            }

            return new Response(file)
        }
    }
})

console.log(`Servidor rodando em ${srv.url}`)