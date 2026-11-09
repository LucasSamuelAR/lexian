// CHAMADOR DE PAGES
// Lê data-page e data-script do #app, injeta a page e depois carrega o script.js.

async function loadPage() {
    const app = document.getElementById('app');

    // 1. Carrega o HTML da page
    try {
        const response = await fetch(app.dataset.page);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        app.innerHTML = await response.text();
    } catch (err) {
        app.innerHTML = '<div class="p-6 text-sm text-red-400">Não foi possível carregar a página (' + app.dataset.page + '). Abra o projeto por um servidor local (ex: Live Server), não direto pelo arquivo.</div>';
        console.error(err);
        return;
    }

    // 2. Só depois da page injetada, carrega o script.js
    const script = document.createElement('script');
    script.src = app.dataset.script;
    script.onload = () => {
        // O script.js escuta DOMContentLoaded, que já ocorreu antes de ele existir.
        // Disparamos o evento manualmente para a inicialização rodar sem alterar o script.js.
        window.dispatchEvent(new Event('DOMContentLoaded'));
    };
    document.body.appendChild(script);
}

loadPage();