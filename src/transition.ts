const transition = document.querySelector<HTMLElement>(".page-transition");
let isTransitioning = false;

declare global {
    interface Window {
        transitionPage: (url: string) => void;
    }
}

// =====================================
// EFEITO DE ENTRADA (QUANDO A PÁGINA ABRE)
// =====================================
window.addEventListener("DOMContentLoaded", () => {
    if (!transition) return;

    // Pega a cor da página atual pelo body
    const corAtual = document.body.classList.contains("cadastro")
        ? "#893293"
        : "#2e0651";

    transition.style.setProperty("--transition-color", corAtual);

    // Começa com a tela cheia de calda e depois escorre para fora
    transition.classList.add("entering");

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            transition.classList.remove("entering");
        });
    });
});

// =====================================
// EFEITO DE SAÍDA (AO TROCAR DE PÁGINA)
// =====================================
window.transitionPage = (url: string) => {
    if (isTransitioning) return;

    if (!transition) {
        window.location.href = url;
        return;
    }

    isTransitioning = true;

    // Identifica a cor da próxima página
    const destino =
        url.includes("cadastro")
            ? "#893293"
            : "#2e0651";

    // Define a cor da calda
    transition.style.setProperty("--transition-color", destino);

    // Reinicia e dispara a animação
    transition.classList.remove("active", "entering");
    void transition.offsetWidth;
    transition.classList.add("active");

    // Aguarda a calda cobrir 100% da página antes de redirecionar
    setTimeout(() => {
        window.location.href = url;
    }, 1200);
};

// =====================================
// INTERCEPTA CLIQUES NOS LINKS
// =====================================
document.querySelectorAll<HTMLAnchorElement>("a").forEach(link => {
    link.addEventListener("click", event => {
        const url = link.getAttribute("href");

        if (
            url &&
            (url.startsWith("/") || url.endsWith(".html")) &&
            !link.target
        ) {
            event.preventDefault();
            window.transitionPage(url);
        }
    });
});
