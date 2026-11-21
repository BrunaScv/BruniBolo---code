function transitionPage(destination: string): void {
    const transition = document.querySelector<HTMLDivElement>(
        ".page-transition"
    )

    if (!transition) {
        window.location.href = destination
        return
    }

    transition.classList.remove("active")

    // Reinicia a animação
    void transition.offsetWidth

    transition.classList.add("active")

    setTimeout(() => {
        window.location.href = destination
    }, 1100)
}

// Torna a função acessível aos outros scripts
declare global {
    interface Window {
        transitionPage: (destination: string) => void
    }
}

window.transitionPage = transitionPage

// Animação dos links
document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach(link => {
    link.addEventListener("click", event => {
        const destination = link.href
        const url = new URL(destination)

        if (url.origin !== window.location.origin) return
        if (link.target === "_blank") return
        if (link.hasAttribute("download")) return
        if (destination === window.location.href) return

        event.preventDefault()

        transitionPage(destination)
    })
})