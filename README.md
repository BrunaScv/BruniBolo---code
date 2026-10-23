# Prog1.tri3.ativ1
<!DOCTYPE html>
<html lang='pt-BR'>

<head>
    <meta charset='utf-8'>
    <title>App</title>
</head>

<body>
    <ul></ul>
    <div>Cadastrar Usuário</div>
    
    <form id="formulario">
        <input type="text" id="username" placeholder="Usuário" required>
        <input type="email" id="email" placeholder="E-mail" required>
        <input type="password" id="password" placeholder="Senha" required>

        <button type="submit">Cadastrar</button>
    </form>



    <input type="number" id = "buscar">
    <button id = "buscar" onclick="buscar()">buscar um</button>
    <div>o valor aqui</div>

    <script>
        const form = document.querySelector("#formulario")
        const mostra = document.querySelector("div");
        const list = document.querySelector("ul");
        const inputId = document.querySelector("#buscar");
        let body = []

        async function init() {
            const response = await fetch("/user");
            body = await response.json();
            body.forEach(user => {
                list.innerHTML += `<li>${user.username}</li>`;
            });
        }

        async function buscar() {
            const idBuscado = inputId.value;
            body.forEach(user => {
                if (user.id == idBuscado) {
                    mostra.innerHTML = `<p><strong>Nome:</strong> ${user.username}</p>`;
                }
            });
        }

        async function Cadastrar() {

            const username = document.querySelector("#username").value;
            const email = document.querySelector("#email").value;
            const password = document.querySelector("#password").value;

            const response = await fetch("/user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },

                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });

        const data = await response.json();
        console.log(data);

        }
        document.querySelector("#formulario").addEventListener("submit", (event) => {
            event.preventDefault();
            Cadastrar()

        })

        init()
    </script>
</body>

</html>
