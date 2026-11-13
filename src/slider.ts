type Slide = {
    id: number;
    src: string;
    text: string;
};

let slides: Slide[] = [
    {
        id: 1,
        src: "img/bolobanoffe.png",
        text: "nos divas"
    },
    {
        id: 2,
        src: "img/bolochocolate.png",
        text: "eu e o paizao"
    },
    {
        id: 3,
        src: "img/bolomaracuja.png",
        text: "fofuxos"
    }
];

let currentSlide = 0;

const images = document.querySelector<HTMLDivElement>("#images")!;
const text = document.querySelector<HTMLParagraphElement>(".slider-text")!;

const nextBtn = document.querySelector<HTMLButtonElement>("#next-button")!;
const prevBtn = document.querySelector<HTMLButtonElement>("#prev-button")!;

const removeBtn = document.querySelector<HTMLButtonElement>("#remove-image")!;
const addTextBtn = document.querySelector<HTMLButtonElement>("#add-text")!;
const imageInput = document.querySelector<HTMLInputElement>("#image-input")!;

function renderSlides(): void {

    images.innerHTML = "";

    slides.forEach((slide, index) => {

        const img = document.createElement("img");

        img.src = slide.src;
        img.classList.add("slider");

        if (index === currentSlide) {
            img.classList.add("on");
        }

        images.appendChild(img);

    });

    showSlide();
}

function showSlide(): void {

    if (slides.length === 0) {
        currentSlide = 0;
        text.textContent = "Nenhuma imagem disponível";
        return;
    }

    if (currentSlide >= slides.length) {
        currentSlide = slides.length - 1;
    }

    if (currentSlide < 0) {
        currentSlide = 0;
    }

    const activeSlide = slides[currentSlide];

    if (!activeSlide) return;

    text.textContent = activeSlide.text;

    images.querySelectorAll("img").forEach((img, index) => {
        img.classList.toggle("on", index === currentSlide);
    });
}

// Próxima imagem
nextBtn.addEventListener("click", () => {

    if (slides.length === 0) return;

    currentSlide = (currentSlide + 1) % slides.length;

    showSlide();

});

// Imagem anterior
prevBtn.addEventListener("click", () => {

    if (slides.length === 0) return;

    currentSlide = (currentSlide - 1 + slides.length) % slides.length;

    showSlide();

});

// Remover imagem
removeBtn.addEventListener("click", () => {

    if (slides.length === 0) return;

    slides.splice(currentSlide, 1);

    if (currentSlide >= slides.length) {
        currentSlide = Math.max(0, slides.length - 1);
    }

    renderSlides();

});

// Adicionar texto
addTextBtn.addEventListener("click", (): void => {
    const slide = slides[currentSlide];

    if (!slide) return;

    const novoTexto = prompt("Digite o novo texto:");

    if (novoTexto === null) return;

    slide.text = novoTexto;

    showSlide();

});

// Adicionar imagem
imageInput.addEventListener("change", () => {

    const file = imageInput.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Selecione uma imagem válida!");
        return;
    }

    const url = URL.createObjectURL(file);

    slides.push({
        id: Date.now(),
        src: url,
        text: ""
    });

    currentSlide = slides.length - 1;

    renderSlides();

    imageInput.value = "";

});

// Inicialização
renderSlides();