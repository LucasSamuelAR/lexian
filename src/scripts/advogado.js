// LÓGICA DO PAINEL DO ADVOGADO
const AREAS = {
    trabalhista: 'Trabalhista',
    familia: 'Família',
    consumidor: 'Consumidor',
    civel: 'Cível',
    penal: 'Penal',
    previdenciario: 'Previdenciário',
    outra: 'Outra',
    indeterminada: 'Indeterminada'
};

const URGENCIAS = {
    alta: { rotulo: 'Alta', ordem: 0, classe: 'bg-red-500/20 text-red-300 border-red-500/40' },
    media: { rotulo: 'Média', ordem: 1, classe: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
    baixa: { rotulo: 'Baixa', ordem: 2, classe: 'bg-green-500/20 text-green-300 border-green-500/40' }
};

const listaEl = document.getElementById('listaCasos');
const fichaEl = document.getElementById('fichaCaso');

let casos = [];
let selecionadoId = null;

function carregarCasos() {
    casos = lerCasos().map(normalizarCaso).sort((a, b) => {
        const diferenca = URGENCIAS[a.urgencia].ordem - URGENCIAS[b.urgencia].ordem;
        if (diferenca !== 0) return diferenca;
        return a.criadoEm < b.criadoEm ? 1 : -1;
    });
}

function formatarHora(iso) {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? NAO_INFORMADO : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarDataHora(iso) {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? NAO_INFORMADO : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function listaHtml(itens) {
    return '<ul class="space-y-1.5 text-xs text-gray-300">' + itens.map(i => `
        <li class="flex items-start gap-2 bg-brand-dark/40 p-2 rounded border border-brand-border/40">
            <i class="fa-solid fa-chevron-right text-brand-emerald text-[10px] mt-1"></i>
            <span>${escapeHtml(i)}</span>
        </li>`).join('') + '</ul>';
}

function renderLista() {
    if (casos.length === 0) {
        listaEl.innerHTML = '<p class="text-xs text-gray-500 italic p-2">Nenhum caso recebido.</p>';
        return;
    }
    listaEl.innerHTML = casos.map(c => {
        const u = URGENCIAS[c.urgencia];
        const ativo = c.criadoEm === selecionadoId ? 'border-brand-emerald bg-brand-emerald/10' : 'border-brand-border hover:border-brand-emerald/50';
        return `
            <button type="button" data-id="${escapeHtml(c.criadoEm)}" class="w-full text-left p-3 rounded-lg border ${ativo} bg-brand-card transition">
                <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="text-sm font-semibold text-white truncate">${escapeHtml(c.nome)}</span>
                    <span class="text-[10px] text-gray-500 shrink-0">${escapeHtml(formatarHora(c.criadoEm))}</span>
                </div>
                <div class="flex items-center justify-between gap-2">
                    <span class="text-xs text-gray-400 truncate">${escapeHtml(AREAS[c.area])}</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${u.classe}">${u.rotulo}</span>
                </div>
            </button>`;
    }).join('');
}

function renderFicha() {
    const c = casos.find(item => item.criadoEm === selecionadoId);
    if (!c) {
        fichaEl.innerHTML = '<p class="text-sm text-gray-500 italic">Selecione um caso na lista para ver a ficha completa.</p>';
        return;
    }
    const u = URGENCIAS[c.urgencia];
    fichaEl.innerHTML = `
        <div class="max-w-3xl bg-brand-card border border-brand-border rounded-2xl p-5 shadow-lg space-y-4">

            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-3">
                <div>
                    <span class="font-bold text-white text-base block">${escapeHtml(c.nome)}</span>
                    <span class="text-[11px] text-gray-500">Recebido em ${escapeHtml(formatarDataHora(c.criadoEm))}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs bg-brand-emerald text-brand-dark font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <i class="fa-solid fa-tag text-[10px]"></i>${escapeHtml(AREAS[c.area])}
                    </span>
                    <span class="text-xs font-bold px-3 py-1 rounded-full border ${u.classe}">Urgência ${u.rotulo}</span>
                </div>
            </div>

            <div class="bg-brand-dark/40 p-3 rounded-lg border border-brand-border/40 text-xs">
                <span class="font-bold text-gray-300 block mb-1">Motivo da urgência:</span>
                <span class="text-gray-400">${escapeHtml(c.motivo_urgencia)}</span>
            </div>

            <div class="space-y-2">
                <h4 class="text-xs font-bold text-brand-emerald uppercase tracking-wider flex items-center gap-1.5"><i class="fa-solid fa-file-lines"></i> Resumo</h4>
                <p class="text-xs text-gray-300 leading-relaxed bg-brand-dark/60 p-3 rounded-lg border border-brand-border/60">${escapeHtml(c.resumo)}</p>
            </div>

            <div class="space-y-2">
                <h4 class="text-xs font-bold text-brand-emerald uppercase tracking-wider flex items-center gap-1.5"><i class="fa-solid fa-list"></i> Fatos</h4>
                ${listaHtml(c.fatos)}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div class="space-y-2">
                    <h4 class="text-xs font-bold text-brand-emerald uppercase tracking-wider">Partes</h4>
                    ${listaHtml(c.partes)}
                </div>
                <div class="space-y-2">
                    <h4 class="text-xs font-bold text-brand-emerald uppercase tracking-wider">Datas</h4>
                    ${listaHtml(c.datas)}
                </div>
            </div>

            <div class="space-y-2">
                <h4 class="text-xs font-bold text-brand-emerald uppercase tracking-wider flex items-center gap-1.5"><i class="fa-solid fa-folder-open"></i> Documentos citados</h4>
                ${listaHtml(c.documentos_citados)}
            </div>

            <div class="bg-brand-dark/40 p-3 rounded-lg border border-brand-border/40 text-xs">
                <span class="font-bold text-gray-300 block mb-1">Pedido do cliente:</span>
                <span class="text-gray-400">${escapeHtml(c.pedido_do_cliente)}</span>
            </div>

            <div class="space-y-1.5 bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg">
                <h4 class="text-xs font-bold text-yellow-400 flex items-center gap-1.5"><i class="fa-solid fa-triangle-exclamation"></i> Informações faltantes</h4>
                ${listaHtml(c.informacoes_faltantes)}
            </div>

            <div class="space-y-2">
                <h4 class="text-xs font-bold text-brand-emerald uppercase tracking-wider">Relato original</h4>
                <p class="text-xs text-gray-300 leading-relaxed bg-brand-dark/60 p-3 rounded-lg border border-brand-border/60 whitespace-pre-wrap break-words">${escapeHtml(c.relato)}</p>
            </div>

            <div class="space-y-2">
                <h4 class="text-xs font-bold text-brand-emerald uppercase tracking-wider">Pergunta de acompanhamento e resposta</h4>
                <div class="bg-brand-dark/40 p-3 rounded-lg border border-brand-border/40 text-xs space-y-2">
                    <p><span class="font-bold text-gray-300">Pergunta:</span> <span class="text-gray-400">${escapeHtml(c.pergunta)}</span></p>
                    <p class="whitespace-pre-wrap break-words"><span class="font-bold text-gray-300">Resposta:</span> <span class="text-gray-400">${escapeHtml(c.resposta)}</span></p>
                </div>
            </div>

        </div>`;
}

function atualizarTela() {
    carregarCasos();
    renderLista();
    renderFicha();
}

listaEl.addEventListener('click', (e) => {
    const item = e.target.closest('[data-id]');
    if (!item) return;
    selecionadoId = item.dataset.id;
    renderLista();
    renderFicha();
});

document.getElementById('clearBtn').addEventListener('click', () => {
    if (!confirm('Apagar todos os casos salvos neste navegador?')) return;
    limparCasos();
    selecionadoId = null;
    atualizarTela();
});

// Atualiza se um novo caso for salvo em outra aba
window.addEventListener('storage', (e) => {
    if (e.key === CHAVE_CASOS) atualizarTela();
});

atualizarTela();