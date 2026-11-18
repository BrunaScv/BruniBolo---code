<img width="1920" height="1080" alt="Bruni" src="https://github.com/user-attachments/assets/cb67d6f2-5832-47e2-a0ff-347c7b6cdaa7" />
nao faremos mais a agenda


# oqfizemoshoje5


oq fazer pra transformar algm em adm?
. Como transformar uma conta em administrador?
Essa parte é importante: não vamos colocar um campo de administrador no cadastro. Assim, qualquer pessoa que criar uma conta receberá automaticamente o papel de usuário comum.

Para escolher sua conta como administradora:
1. Execute o projeto e faça seu cadastro normalmente.
2. Abra o banco src/db.sqlite em um visualizador SQLite, como o DB Browser for SQLite.
3. Abra a aba de execução SQL.
4. Execute: no index.ts
   
db.query(`
    UPDATE users
    SET role = 'admin'
    WHERE username = ?
`).run("BruniBolo")

dps tem que d=remover isso pra n ficar fazendo a mesma alteração toda vex

Troque SEU_USUARIO pelo nome exato da conta que você cadastrou.

Para conferir:
SELECT id, username, role FROM users;



alterar o db.ts
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

// aq ele verifica se a coluna role já existe no banco antigo
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
//O que mudou? Adicionamos a coluna role, que identifica o tipo de conta:- user: usuário comum ou c é admin: administrador.



index.ts

import login from "../index.html"
import home from "./home.html"
import cadastro from "./cadastro.html"
import { db } from "./db"
import { mkdir, unlink } from "node:fs/promises"
import { basename } from "node:path"

type User = {
    username: string
    password: string
}

const loggedUsers: Record<string, any> = {}

const uploadDir = `${import.meta.dir}/uploads`

function getLoggedUser(req: any) {
    const session = req.cookies.get("ses")

    if (!session) {
        return null
    }

    return loggedUsers[session] || null
}

function isAdmin(req: any) {
    const user = getLoggedUser(req)

    return user && user.role === "admin"
}

const srv = Bun.serve({
    port: 3000,

    routes: {
        "/": login,
        "/home": home,
        "/cadastro": cadastro,

        // CADASTRO DE USUÁRIOS, n tem forma de ver se é adm ou usu pq ai todo mundo é usuario normal a nao ser qm eu disser no codigo msm
        "/user": {
            POST: async (req) => {
                const body = await req.json() as User

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
                ).get(body.username)

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
                const body = await req.json() as User

                const user: any = db.query(`
                    SELECT id, username, password_hash, role
                    FROM users
                    WHERE username = ?
                    LIMIT 1
                `).get(body.username)

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

                delete user.password_hash

                loggedUsers[session] = user

                req.cookies.set("ses", session, {
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
                `).all()

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

                const id = Number(req.params.id)
                const body = await req.json()

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

                const id = Number(req.params.id)

                if (!Number.isInteger(id) || id <= 0) {
                    return Response.json(
                        { msg: "Postagem inválida" },
                        { status: 400 }
                    )
                }

                const slide: any = db.query(`
                    SELECT image FROM slides WHERE id = ?
                `).get(id)

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
            const filename = req.params.filename

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




home:

<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Home</title>
    <link rel="stylesheet" href="../style/style.css">
</head>

<body>

    <h1>HOME</h1>

    <div class="profile">
        <div class="nome"></div>
        <div class="tipo-usuario"></div>
    </div>

    <div class="slider-wrapper">

        <div class="container-slider">

            <button id="prev-button">Anterior</button>

            <div class="container-images" id="images"></div>

            <button id="next-button">Próximo</button>

        </div>

        <p class="slider-text"></p>

        <div class="controls" id="admin-controls" hidden>

            <label for="image-input">Adicionar postagem</label>
            <input type="file" id="image-input" accept="image/png,image/jpeg,image/webp,image/gif">

            <button id="add-text">Editar descrição</button>

            <button id="remove-image">Excluir postagem</button>

        </div>

    </div>

    <script>
        async function init() {
            const response = await fetch("/login/user")

            if (!response.ok) {
                alert("Você precisa fazer login!")
                location.href = "/"
                return
            }

            const user = await response.json()

            document.querySelector(".profile .nome").textContent =
                "Olá, " + user.username

            document.querySelector(".profile .tipo-usuario").textContent =
                user.role === "admin" ? "Administrador" : "Usuário"

            if (user.role === "admin") {
                document.querySelector("#admin-controls").hidden = false
            }
        }

        init()
    </script>

    <script type="module" src="./slider.ts"></script>

</body>
</html>

slider 

type Slide = {
    id: number
    image: string
    text: string
}

let slides: Slide[] = []
let currentSlide = 0

const images = document.querySelector<HTMLDivElement>("#images")!
const text = document.querySelector<HTMLParagraphElement>(".slider-text")!

const nextButton = document.querySelector<HTMLButtonElement>("#next-button")!
const prevButton = document.querySelector<HTMLButtonElement>("#prev-button")!

const addTextButton = document.querySelector<HTMLButtonElement>("#add-text")!
const removeButton = document.querySelector<HTMLButtonElement>("#remove-image")!

const imageInput = document.querySelector<HTMLInputElement>("#image-input")!

// BUSCAR POSTAGENS DO BANCO
async function loadSlides() {
    const response = await fetch("/slides")

    if (!response.ok) {
        alert("Não foi possível carregar as postagens.")
        return
    }

    slides = await response.json()

    currentSlide = 0

    renderSlides()
}

// MOSTRAR POSTAGENS
function renderSlides() {
    images.innerHTML = ""

    if (slides.length === 0) {
        text.textContent = "Ainda não existem postagens."
        return
    }

    slides.forEach((slide, index) => {
        const img = document.createElement("img")

        img.src = slide.image
        img.alt = slide.text || "Imagem da postagem"
        img.classList.add("slider")

        if (index === currentSlide) {
            img.classList.add("on")
        }

        images.appendChild(img)
    })

    showSlide()
}

// MOSTRAR FOTO E DESCRIÇÃO ATUAL
function showSlide() {
    if (slides.length === 0) {
        text.textContent = "Ainda não existem postagens."
        return
    }

    if (currentSlide >= slides.length) {
        currentSlide = 0
    }

    if (currentSlide < 0) {
        currentSlide = slides.length - 1
    }

    const allImages = images.querySelectorAll("img")

    allImages.forEach((img, index) => {
        img.classList.toggle("on", index === currentSlide)
    })

    text.textContent = slides[currentSlide].text || "Sem descrição."
}

// PRÓXIMA FOTO
nextButton.addEventListener("click", () => {
    if (slides.length === 0) return

    currentSlide++

    if (currentSlide >= slides.length) {
        currentSlide = 0
    }

    showSlide()
})

// FOTO ANTERIOR
prevButton.addEventListener("click", () => {
    if (slides.length === 0) return

    currentSlide--

    if (currentSlide < 0) {
        currentSlide = slides.length - 1
    }

    showSlide()
})

// ADICIONAR FOTO E DESCRIÇÃO
imageInput.addEventListener("change", async () => {
    const file = imageInput.files?.[0]

    if (!file) return

    const description = prompt("Digite a descrição da foto:")

    if (description === null) {
        imageInput.value = ""
        return
    }

    const formData = new FormData()

    formData.append("image", file)
    formData.append("text", description)

    const response = await fetch("/slides", {
        method: "POST",
        body: formData
    })

    if (!response.ok) {
        const result = await response.json()
        alert(result.msg || "Erro ao adicionar postagem.")
        imageInput.value = ""
        return
    }

    alert("Postagem adicionada!")

    imageInput.value = ""

    await loadSlides()
})

// EDITAR DESCRIÇÃO
addTextButton.addEventListener("click", async () => {
    if (slides.length === 0) {
        alert("Não existe nenhuma postagem para editar.")
        return
    }

    const slide = slides[currentSlide]

    const newText = prompt(
        "Digite a nova descrição:",
        slide.text
    )

    if (newText === null) return

    const response = await fetch(`/slides/${slide.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            text: newText
        })
    })

    if (!response.ok) {
        alert("Não foi possível editar a descrição.")
        return
    }

    slides[currentSlide].text = newText

    showSlide()

    alert("Descrição atualizada!")
})

// EXCLUIR POSTAGEM
removeButton.addEventListener("click", async () => {
    if (slides.length === 0) {
        alert("Não existe nenhuma postagem para excluir.")
        return
    }

    const slide = slides[currentSlide]

    const confirmDelete = confirm(
        "Tem certeza que deseja excluir esta postagem?"
    )

    if (!confirmDelete) return

    const response = await fetch(`/slides/${slide.id}`, {
        method: "DELETE"
    })

    if (!response.ok) {
        alert("Não foi possível excluir a postagem.")
        return
    }

    alert("Postagem excluída!")

    await loadSlides()
})

// CARREGAR AO ABRIR A PÁGINA
loadSlides()


no fim do css

[hidden] {
    display: none !important;




    Como testar se funcionou
Faça o teste nesta ordem:
1. Inicie o servidor com bun run src/index.ts.
2. Entre com sua conta de administrador.
3. Acesse a página /home.
4. Adicione uma foto e escreva uma descrição.
5. Atualize a página: a postagem deverá continuar aparecendo.
6. Saia e entre com outra conta comum.
7. A outra conta deverá visualizar a postagem, mas não verá os controles de edição.

























CSS com keyframes
No seu style/style.css, substitua a parte antiga da animação por:
.page-transition {
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;

    background: var(--transition-color, #8b4513);

    clip-path: inset(0 0 100% 0);

    animation: none;
}

.page-transition.active {
    animation: chocolateDrip 1.4s ease-in-out forwards;
}

@keyframes chocolateDrip {
    0% {
        clip-path: inset(0 0 100% 0);
    }

    20% {
        clip-path: inset(0 0 75% 0);
    }

    45% {
        clip-path: inset(0 0 35% 0);
    }

    65% {
        clip-path: inset(0 0 0 0);
    }

    80% {
        clip-path: inset(0 0 0 0);
    }

    100% {
        clip-path: inset(100% 0 0 0);
    }
}


Essa versão usa clip-path para revelar e esconder a camada de calda. Mas podemos deixar o formato da borda mais orgânico usando pseudo-elementos.
3. Deixar a calda com aparência derretida
Acrescente:
.page-transition::before {
    content: "";
    position: absolute;

    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    background: var(--transition-color, #8b4513);

    border-radius: 0 0 45% 20%;
}

.page-transition::after {
    content: "";
    position: absolute;

    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    background:
        radial-gradient(ellipse at 15% 100%, var(--transition-color, #8b4513) 0 35px, transparent 37px),
        radial-gradient(ellipse at 45% 100%, var(--transition-color, #8b4513) 0 55px, transparent 57px),
        radial-gradient(ellipse at 80% 100%, var(--transition-color, #8b4513) 0 40px, transparent 42px);
}


As cores podem ser alteradas pela variável --transition-color que você já utiliza.
4. JavaScript para iniciar a animação
Onde você já adicionava a classe page-transition, pode usar:
function transitionPage(url) {
    const transition = document.createElement("div")

    transition.classList.add("page-transition")

    document.body.appendChild(transition)

    requestAnimationFrame(() => {
        transition.classList.add("active")
    })

    setTimeout(() => {
        window.location.href = url
    }, 1400)
}


E nos links:
document.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", event => {
        const url = link.href

        if (url && url.startsWith(window.location.origin)) {
            event.preventDefault()
            transitionPage(url)
        }
    })
})
