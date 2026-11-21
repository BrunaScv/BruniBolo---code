
const transition = document.querySelector<HTMLElement>(".page-transition");

declare global {
    interface Window {
        transitionPage: (url: string) => void;
    }
}

window.transitionPage = (url: string) => {

    if (!transition) {
        window.location.href = url;
        return;
    }

    // Identifica a cor da página de destino
    const destino = url === "/cadastro" || url === "/cadastro.html"
        ? "#893293"
        : "#2e0651";

    // Define a cor da calda
    transition.style.setProperty("--transition-color", destino);

    // Reinicia a animação
    transition.classList.remove("active");

    void transition.offsetWidth;

    transition.classList.add("active");

    // Abre a próxima página depois de cobrir a tela
    setTimeout(() => {
        window.location.href = url;
    }, 900);
};

// Transição nos links
document.querySelectorAll<HTMLAnchorElement>("a").forEach(link => {

    link.addEventListener("click", event => {

        const url = link.getAttribute("href");

        if (url && url.startsWith("/") && !link.target) {
            event.preventDefault();
            window.transitionPage(url);
        }

    });

});
