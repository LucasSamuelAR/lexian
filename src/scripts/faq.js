// PAINEL DO FAQ NA TELA DO CLIENTE
// Abre faq.html dentro de um painel por cima do chat, sem recarregar a página
// (a conversa fica na memória da página, então não pode ser perdida).
(function () {
    const painel = document.getElementById('faqModal');
    const quadro = document.getElementById('faqFrame');
    const botaoFechar = document.getElementById('faqFechar');
    let focoAnterior = null;

    function abrirFaq() {
        // carrega o faq.html só na primeira abertura
        if (!quadro.getAttribute('src')) quadro.setAttribute('src', quadro.dataset.src);
        focoAnterior = document.activeElement;
        painel.classList.remove('hidden');
        botaoFechar.focus();
    }

    function fecharFaq() {
        painel.classList.add('hidden');
        if (focoAnterior && typeof focoAnterior.focus === 'function') focoAnterior.focus();
    }

    // Qualquer elemento com data-abrir-faq abre o painel (botão do topo e botão dentro do chat)
    document.addEventListener('click', function (e) {
        if (e.target.closest('[data-abrir-faq]')) {
            e.preventDefault();
            abrirFaq();
        }
    });

    botaoFechar.addEventListener('click', fecharFaq);

    // Clicar no fundo escuro fecha
    painel.addEventListener('click', function (e) {
        if (e.target === painel) fecharFaq();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !painel.classList.contains('hidden')) fecharFaq();
    });
})();