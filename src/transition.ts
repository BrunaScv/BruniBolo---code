
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

    // Identifica a cor da próxima página

const destino =
    url === "/cadastro" || url === "/cadastro.html"
        ? "#893293"
        : url === "/home"
            ? "#2e0651"
            : "#2e0651";

    // Define a cor da calda

    transition.style.setProperty("--transition-color", destino);

    // Reinicia a animação

    transition.classList.remove("active");

    void transition.offsetWidth;

    transition.classList.add("active");

    // Aguarda a calda cobrir a página

setTimeout(() => {
    window.location.href = url;
}, 1200);

};

// Transição nos links

document.querySelectorAll<HTMLAnchorElement>("a").forEach(link => {

    link.addEventListener("click", event => {

        const url = link.getAttribute("href");

        if (
            url &&
            url.startsWith("/") &&
            !link.target
        ) {

            event.preventDefault();

            window.transitionPage(url);

        }

    });

});
