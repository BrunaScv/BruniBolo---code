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
async function loadSlides(): Promise<void> {
    const response = await fetch("/slides")

    if (!response.ok) {
        alert("Não foi possível carregar as postagens.")
        return
    }

    slides = (await response.json()) as Slide[]
    currentSlide = 0

    renderSlides()
}

// MOSTRAR POSTAGENS
function renderSlides(): void {
    images.innerHTML = ""

    if (slides.length === 0) {
        text.textContent = "Ainda não existem postagens."
        return
    }

    slides.forEach((slide, index) => {
        const img = document.createElement("img")

        img.src = slide.image
        img.alt = slide.text || "Imagem da postagem"
        img.classList.add("slider-img")

        if (index === currentSlide) {
            img.classList.add("on")
        }

        images.appendChild(img)
    })

    showSlide()
}

// MOSTRAR FOTO E DESCRIÇÃO ATUAL
function showSlide(): void {
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

    const slide = slides[currentSlide]
    text.textContent = slide?.text || "Sem descrição."
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
        const result = (await response.json()) as { msg?: string }
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
    if (!slide) return

    const newText = prompt("Digite a nova descrição:", slide.text)
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

    slide.text = newText
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
    if (!slide) return

    const confirmDelete = confirm("Tem certeza que deseja excluir esta postagem?")
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