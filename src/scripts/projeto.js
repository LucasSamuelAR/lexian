// LÓGICA DA ÁREA DO PROJETO (modelos vazios, sem dados inventados)
const CHAVE_PROJETO = 'lexian_projeto';

const USUARIOS = [
    { id: 'u1', nome: 'Usuário 1', caso: 'Trabalhista' },
    { id: 'u2', nome: 'Usuário 2', caso: 'Consumidor' },
    { id: 'u3', nome: 'Usuário 3', caso: 'Família' }
];

const COLUNAS = [
    { id: 'tempo', rotulo: 'Tempo de conclusão' },
    { id: 'clareza', rotulo: 'Clareza das informações' },
    { id: 'utilidade', rotulo: 'Utilidade da ficha' },
    { id: 'facilidade', rotulo: 'Facilidade de uso' },
    { id: 'classificacao', rotulo: 'Qualidade da classificação', sub: 'área sugerida x área de referência' }
];

const PROMPTS = [
    { id: 'p1', titulo: 'Prompt 1 – Classificação' },
    { id: 'p2', titulo: 'Prompt 2 – Pergunta de acompanhamento' }
];

const CAMPOS_PROMPT = [
    { id: 'versao', rotulo: 'Versão', tipo: 'input', padrao: 'Versão 1' },
    { id: 'texto', rotulo: 'Texto do prompt', tipo: 'textarea' },
    { id: 'caso', rotulo: 'Caso testado', tipo: 'input' },
    { id: 'resultado', rotulo: 'Resultado', tipo: 'textarea' },
    { id: 'ajuste', rotulo: 'Ajuste feito', tipo: 'textarea' }
];

const EXEMPLOS = [
    { titulo: 'Trabalhista', texto: 'Trabalhei durante 2 anos em uma empresa de logística. Fui demitido no mês passado sem justa causa, porém a empresa não pagou minhas horas extras acumuladas nos últimos 8 meses nem depositou os últimos meses de FGTS. Tenho mensagens no WhatsApp comprovando que eu ficava até mais tarde.' },
    { titulo: 'Consumidor', texto: 'Comprei um celular em uma loja há 40 dias e ele apresentou defeito na tela. Levei na assistência técnica, mas até hoje não resolveram nem devolveram o aparelho. Tenho a nota fiscal da compra.' },
    { titulo: 'Família', texto: 'Estou separada há 1 ano e o pai do meu filho de 6 anos parou de pagar a pensão alimentícia há 3 meses. Não temos acordo formal e quero saber como regularizar a pensão e a guarda.' }
];

const CLASSE_CAMPO = 'w-full bg-brand-dark border border-brand-border rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-emerald';

let dados = lerStorage(CHAVE_PROJETO, {});
if (!dados || typeof dados !== 'object') dados = {};

function campoHtml(chave, tipo, padrao) {
    const valor = dados[chave] != null ? dados[chave] : (padrao || '');
    if (tipo === 'textarea') {
        return `<textarea data-campo="${escapeHtml(chave)}" rows="3" placeholder="a preencher" class="${CLASSE_CAMPO} resize-y">${escapeHtml(valor)}</textarea>`;
    }
    return `<input type="text" data-campo="${escapeHtml(chave)}" value="${escapeHtml(valor)}" placeholder="a preencher" class="${CLASSE_CAMPO}">`;
}

function renderTabela() {
    document.getElementById('tabelaCabecalho').innerHTML = '<tr><th class="p-3">Usuário / caso</th>' + COLUNAS.map(c => `
        <th class="p-3">${escapeHtml(c.rotulo)}${c.sub ? '<span class="block normal-case text-gray-500 font-normal">' + escapeHtml(c.sub) + '</span>' : ''}</th>`).join('') + '</tr>';

    document.getElementById('tabelaCorpo').innerHTML = USUARIOS.map(u => `
        <tr class="hover:bg-brand-border/20">
            <td class="p-3 font-semibold text-white">${escapeHtml(u.nome)}<span class="block text-gray-400 font-normal">Caso: ${escapeHtml(u.caso)}</span></td>
            ${COLUNAS.map(c => '<td class="p-2">' + campoHtml(c.id + '_' + u.id, 'input') + '</td>').join('')}
        </tr>`).join('');
}

function renderPrompts() {
    document.getElementById('blocosPrompts').innerHTML = PROMPTS.map(p => `
        <div class="bg-brand-card border border-brand-border rounded-xl p-4 space-y-3">
            <h3 class="font-bold text-white text-sm border-b border-brand-border pb-2">${escapeHtml(p.titulo)}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${CAMPOS_PROMPT.map(c => `
                    <label class="block text-xs text-gray-400 font-semibold ${c.tipo === 'textarea' ? 'md:col-span-2' : ''}">
                        <span class="block mb-1">${escapeHtml(c.rotulo)}</span>
                        ${campoHtml(p.id + '_' + c.id, c.tipo, c.padrao)}
                    </label>`).join('')}
            </div>
        </div>`).join('');
}

// Salva cada campo ao digitar
document.addEventListener('input', (e) => {
    const chave = e.target.dataset ? e.target.dataset.campo : null;
    if (!chave) return;
    dados[chave] = e.target.value;
    gravarStorage(CHAVE_PROJETO, dados);
});

// CASOS FICTÍCIOS DE EXEMPLO
const exemplosEl = document.getElementById('exemplos');

document.getElementById('exemploBtn').addEventListener('click', () => {
    exemplosEl.classList.toggle('hidden');
    if (exemplosEl.dataset.pronto) return;
    exemplosEl.innerHTML = EXEMPLOS.map((ex, i) => `
        <div class="bg-brand-card border border-brand-border rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-brand-emerald uppercase tracking-wider">${escapeHtml(ex.titulo)}</span>
                <button type="button" data-copiar="${i}" class="text-[11px] bg-brand-dark hover:bg-brand-border border border-brand-border text-gray-300 px-2.5 py-1 rounded-lg transition">Copiar relato</button>
            </div>
            <p class="text-xs text-gray-300 leading-relaxed bg-brand-dark/60 p-3 rounded-lg border border-brand-border/60 select-text">${escapeHtml(ex.texto)}</p>
        </div>`).join('');
    exemplosEl.dataset.pronto = '1';
});

exemplosEl.addEventListener('click', async (e) => {
    const botao = e.target.closest('[data-copiar]');
    if (!botao) return;
    const texto = EXEMPLOS[Number(botao.dataset.copiar)].texto;
    try {
        await navigator.clipboard.writeText(texto);
        botao.textContent = 'Copiado!';
    } catch (erro) {
        botao.textContent = 'Selecione e copie o texto';
    }
    setTimeout(() => { botao.textContent = 'Copiar relato'; }, 2000);
});

renderTabela();
renderPrompts();