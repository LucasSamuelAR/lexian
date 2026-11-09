// ESTADO DA APLICAÇÃO
let currentTab = 'chat';
let savedHistory = [];

// BASE DE DADOS MOCK PARA SIMULAÇÃO DA IA
const mockResponses = {
    trabalhista: {
        area: 'Direito Trabalhista',
        fatos: 'Relato envolve demissão sem pagamento correto de verbas rescisórias e não quitação de horas extras acumuladas nos últimos meses.',
        partes: 'Ex-empregado (Relator) vs. Empresa Empregadora.',
        datas: 'Demissão relatada recente; período de horas extras nos últimos 12 meses.',
        lacunas: 'Falta esclarecer se havia controle formal de ponto e se o aviso prévio foi trabalhado ou indenizado.',
        perguntas: [
            'Existia registro formal de ponto (cartão de ponto, biometria ou aplicativo)?',
            'As verbas da rescisão foram pagas dentro do prazo legal de 10 dias?',
            'Você possui testemunhas que presenciavam a jornada extraordinária?'
        ],
        documentos: [
            'Carteira de Trabalho (CTPS física ou digital)',
            'Termo de Rescisão do Contrato de Trabalho (TRCT)',
            'Extrato analítico do FGTS',
            'Comprovantes de pagamento de salário (Holerites)'
        ]
    },
    consumidor: {
        area: 'Direito do Consumidor',
        fatos: 'Aquisição de produto eletrônico com defeito de fabricação. O fornecedor e a assistência técnica ultrapassaram o prazo de 30 dias sem solução.',
        partes: 'Consumidor (Relator) vs. Loja Vendedora / Fabricante do Produto.',
        datas: 'Data da compra recente; prazo de 30 dias de assistência esgotado.',
        lacunas: 'Não foi informado se a reclamação foi registrada no Procon ou em canais oficiais de atendimento (SAC/Ouvidoria).',
        perguntas: [
            'Você possui a Nota Fiscal de compra do produto?',
            'Possui a ordem de serviço emitida pela assistência técnica autorizada?',
            'Houve tentativa de solução diretamente com o fabricante?'
        ],
        documentos: [
            'Nota Fiscal de compra do produto',
            'Ordem de Serviço da assistência técnica',
            'Comprovantes de protocolo de atendimento (SAC / E-mails)',
            'Fotos ou vídeos do defeito do produto'
        ]
    },
    civil: {
        area: 'Direito Civil / Imobiliário',
        fatos: 'Notificação de desocupação de imóvel alugado sob alegação de descumprimento de cláusula contratual sem aviso prévio formal.',
        partes: 'Inquilino (Relator) vs. Proprietário do Imóvel / Imobiliária.',
        datas: 'Início do contrato de locação há mais de 1 ano; notificação recebida esta semana.',
        lacunas: 'Necessário verificar se o contrato possui garantia locatícia (fiador, caução ou seguro-fiança).',
        perguntas: [
            'O contrato de locação possui firma reconhecida ou assinatura digital?',
            'Os comprovantes de pagamento dos aluguéis estão em dia?',
            'A notificação foi entregue via carta registrada ou cartório?'
        ],
        documentos: [
            'Contrato de locação do imóvel',
            'Comprovantes de pagamento dos últimos aluguéis e condomínio',
            'Cópia da notificação de desocupação recebida',
            'Troca de mensagens com a imobiliária ou proprietário'
        ]
    }
};

// INICIALIZAÇÃO AO CARREGAR A PÁGINA
window.addEventListener('DOMContentLoaded', () => {
    loadLocalStorageHistory();
    setupSidebarControls();
});

// TROCA DE ABAS
function switchTab(tab) {
    currentTab = tab;
    
    // Oculta todas as views
    document.getElementById('view-chat').classList.add('hidden');
    document.getElementById('view-tests').classList.add('hidden');
    document.getElementById('view-prompts').classList.add('hidden');

    // Reset estilos dos botões
    ['chat', 'tests', 'prompts'].forEach(t => {
        const btn = document.getElementById(`tabBtn-${t}`);
        if (btn) {
            btn.className = 'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition text-gray-300 hover:bg-brand-border/40 hover:text-white';
        }
    });

    // Exibe view selecionada e destaca botão
    const activeBtn = document.getElementById(`tabBtn-${tab}`);
    if (activeBtn) {
        activeBtn.className = 'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/30';
    }

    if (tab === 'chat') {
        document.getElementById('view-chat').classList.remove('hidden');
        document.getElementById('currentTabTitle').innerHTML = '<i class="fa-solid fa-comments text-brand-emerald"></i><span>Assistente Virtual de Triagem Jurídica</span>';
    } else if (tab === 'tests') {
        document.getElementById('view-tests').classList.remove('hidden');
        document.getElementById('currentTabTitle').innerHTML = '<i class="fa-solid fa-vial-circle-check text-brand-emerald"></i><span>Painel de Testes com Usuários Reais</span>';
    } else if (tab === 'prompts') {
        document.getElementById('view-prompts').classList.remove('hidden');
        document.getElementById('currentTabTitle').innerHTML = '<i class="fa-solid fa-code-branch text-brand-emerald"></i><span>Documentação da Engenharia de Prompts</span>';
    }
}

// CARREGAR CASO FICTÍCIO EXEMPLO
function loadExampleCase() {
    switchTab('chat');
    const textarea = document.getElementById('caseInput');
    textarea.value = "Trabalhei durante 2 anos em uma empresa de logística. Fui demitido no mês passado sem justa causa, porém a empresa não pagou minhas horas extras acumuladas nos últimos 8 meses nem depositou os últimos meses de FGTS. Tenho mensagens no WhatsApp comprovando que eu ficava até mais tarde.";
    textarea.focus();
}

// SUBMETER RELATO PARA PROCESSAMENTO
function handleFormSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('caseInput');
    const text = input.value.trim();

    if (!text) return;

    // 1. Adiciona relato do usuário no chat
    addUserMessage(text);
    input.value = '';

    // 2. Exibe o indicador de carregamento
    document.getElementById('aiLoading').classList.remove('hidden');
    scrollToBottom();

    // 3. Simula tempo de resposta da IA (1.5 segundos)
    setTimeout(() => {
        document.getElementById('aiLoading').classList.add('hidden');
        generateAITriageResponse(text);
    }, 1600);
}

// ADICIONAR MENSAGEM DO USUÁRIO
function addUserMessage(text) {
    const container = document.getElementById('chatMessages');
    const userHtml = `
        <div class="flex items-start gap-4 justify-end">
            <div class="max-w-2xl bg-brand-border/60 border border-brand-border rounded-2xl p-4 shadow-sm text-sm text-gray-100 leading-relaxed">
                <span class="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Seu Relato Enviado:</span>
                <p>${escapeHtml(text)}</p>
            </div>
            <div class="w-9 h-9 rounded-xl bg-brand-border flex items-center justify-center text-white shrink-0 font-bold text-xs border border-gray-600">
                VOCÊ
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', userHtml);
    scrollToBottom();
}

// GERAR E EXIBIR A FICHA DE TRIAGEM ESTRUTURADA
function generateAITriageResponse(userText) {
    // Seleciona o tipo de caso com base em palavras-chave simples
    let data = mockResponses.trabalhista;
    const lower = userText.toLowerCase();

    if (lower.includes('defeito') || lower.includes('compra') || lower.includes('loja') || lower.includes('produto') || lower.includes('assistência')) {
        data = mockResponses.consumidor;
    } else if (lower.includes('imóvel') || lower.includes('aluguel') || lower.includes('despejo') || lower.includes('inquilino')) {
        data = mockResponses.civil;
    }

    const container = document.getElementById('chatMessages');
    const triageId = 'TRIAGEM-' + Math.floor(1000 + Math.random() * 9000);

    const aiHtml = `
        <div class="flex items-start gap-4">
            <div class="w-9 h-9 rounded-xl bg-brand-emerald/20 border border-brand-emerald/40 flex items-center justify-center text-brand-emerald shrink-0 shadow-sm mt-1">
                <i class="fa-solid fa-robot text-sm"></i>
            </div>
            
            <div class="flex-1 space-y-4 max-w-3xl">
                <!-- BANNER DE CONCLUSÃO DA TRIAGEM -->
                <div class="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-lg space-y-4">
                    
                    <div class="flex items-center justify-between border-b border-brand-border pb-3">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-white text-base">Ficha Estruturada de Triagem</span>
                            <span class="text-[10px] bg-brand-emerald/20 text-brand-emerald font-semibold px-2 py-0.5 rounded border border-brand-emerald/30">${triageId}</span>
                        </div>
                        <span class="text-xs bg-brand-emerald text-brand-dark font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <i class="fa-solid fa-tag text-[10px]"></i>
                            ${data.area}
                        </span>
                    </div>

                    <!-- RESUMO DOS FATOS -->
                    <div class="space-y-2">
                        <h4 class="text-xs font-bold text-brand-emerald uppercase tracking-wider flex items-center gap-1.5">
                            <i class="fa-solid fa-file-text"></i> Resumo Estruturado dos Fatos
                        </h4>
                        <p class="text-xs text-gray-300 leading-relaxed bg-brand-dark/60 p-3 rounded-lg border border-brand-border/60">
                            ${data.fatos}
                        </p>
                    </div>

                    <!-- PARTES E CRONOLOGIA -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div class="bg-brand-dark/40 p-3 rounded-lg border border-brand-border/40">
                            <span class="font-bold text-gray-300 block mb-1">Partes Mencionadas:</span>
                            <span class="text-gray-400">${data.partes}</span>
                        </div>
                        <div class="bg-brand-dark/40 p-3 rounded-lg border border-brand-border/40">
                            <span class="font-bold text-gray-300 block mb-1">Cronologia / Datas:</span>
                            <span class="text-gray-400">${data.datas}</span>
                        </div>
                    </div>

                    <!-- LACUNAS -->
                    <div class="space-y-1.5 bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg">
                        <h4 class="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                            <i class="fa-solid fa-triangle-exclamation"></i> Lacunas e Informações Faltantes
                        </h4>
                        <p class="text-xs text-gray-300">${data.lacunas}</p>
                    </div>

                    <!-- PERGUNTAS COMPLEMENTARES -->
                    <div class="space-y-2">
                        <h4 class="text-xs font-bold text-brand-emerald uppercase tracking-wider flex items-center gap-1.5">
                            <i class="fa-solid fa-circle-question"></i> Perguntas Complementares para o Atendimento
                        </h4>
                        <ul class="space-y-1.5 text-xs text-gray-300">
                            ${data.perguntas.map(q => `<li class="flex items-start gap-2 bg-brand-dark/40 p-2 rounded border border-brand-border/40"><i class="fa-solid fa-chevron-right text-brand-emerald text-[10px] mt-1"></i><span>${q}</span></li>`).join('')}
                        </ul>
                    </div>

                    <!-- CHECKLIST DE DOCUMENTOS -->
                    <div class="space-y-2">
                        <h4 class="text-xs font-bold text-brand-emerald uppercase tracking-wider flex items-center gap-1.5">
                            <i class="fa-solid fa-folder-open"></i> Checklist de Documentos Sugeridos
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            ${data.documentos.map(doc => `
                                <label class="flex items-center gap-2 bg-brand-dark/50 p-2 rounded border border-brand-border/40 cursor-pointer hover:border-brand-emerald/50 transition">
                                    <input type="checkbox" class="accent-brand-emerald rounded">
                                    <span class="text-gray-300">${doc}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', aiHtml);
    scrollToBottom();

    // Salva no LocalStorage
    saveToLocalStorage({
        id: triageId,
        area: data.area,
        relato: userText,
        dataHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
}

// SALVAR HISTÓRICO NO LOCALSTORAGE
function saveToLocalStorage(item) {
    savedHistory.unshift(item);
    if (savedHistory.length > 10) savedHistory.pop(); // Limite de 10
    localStorage.setItem('lexian_history', JSON.stringify(savedHistory));
    renderHistoryList();
}

// CARREGAR HISTÓRICO SALVO
function loadLocalStorageHistory() {
    const data = localStorage.getItem('lexian_history');
    if (data) {
        try {
            savedHistory = JSON.parse(data);
        } catch(e) {
            savedHistory = [];
        }
    }
    renderHistoryList();
}

// RENDERIZAR LISTA NA SIDEBAR
function renderHistoryList() {
    const listContainer = document.getElementById('historyList');
    if (!savedHistory || savedHistory.length === 0) {
        listContainer.innerHTML = '<p class="text-xs text-gray-500 italic p-2">Nenhuma triagem salva.</p>';
        return;
    }

    listContainer.innerHTML = savedHistory.map(item => `
        <div class="group flex items-center justify-between p-2 rounded-lg hover:bg-brand-border/40 cursor-pointer transition border border-transparent hover:border-brand-border" onclick="loadHistoryItem('${item.id}')">
            <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between mb-0.5">
                    <span class="text-xs font-semibold text-white truncate">${item.area}</span>
                    <span class="text-[10px] text-gray-500">${item.dataHora}</span>
                </div>
                <p class="text-[11px] text-gray-400 truncate">${escapeHtml(item.relato)}</p>
            </div>
        </div>
    `).join('');
}

// RECARREGAR ITEM DO HISTÓRICO
function loadHistoryItem(id) {
    const item = savedHistory.find(i => i.id === id);
    if (item) {
        switchTab('chat');
        addUserMessage(item.relato);
        document.getElementById('aiLoading').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('aiLoading').classList.add('hidden');
            generateAITriageResponse(item.relato);
        }, 800);
    }
}

// LIMPAR HISTÓRICO
function clearHistory() {
    savedHistory = [];
    localStorage.removeItem('lexian_history');
    renderHistoryList();
}

// REINICIAR CHAT DE TRIAGEM
function startNewChat() {
    switchTab('chat');
    const container = document.getElementById('chatMessages');
    container.innerHTML = `
        <div class="flex items-start gap-4">
            <div class="w-9 h-9 rounded-xl bg-brand-emerald/20 border border-brand-emerald/40 flex items-center justify-center text-brand-emerald shrink-0 shadow-sm">
                <i class="fa-solid fa-robot text-sm"></i>
            </div>
            <div class="flex-1 bg-brand-card border border-brand-border rounded-2xl p-5 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                    <span class="font-semibold text-white text-sm">LEXIAN Assistente</span>
                    <span class="text-[11px] text-gray-500">Novo Atendimento Iniciado</span>
                </div>
                <p class="text-sm text-gray-300 leading-relaxed">
                    Pronto para uma nova triagem jurídica! Digite o relato no campo abaixo.
                </p>
            </div>
        </div>
    `;
    document.getElementById('caseInput').value = '';
    document.getElementById('caseInput').focus();
}

// CONTROLADORES DA SIDEBAR (EXPANDIR/RECOLHER)
function setupSidebarControls() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    const openMobileBtn = document.getElementById('openSidebarMobileBtn');

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('-ml-72');
    });

    openMobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('-ml-72');
    });
}

// HELPER PARA ROLAR O CHAT ATÉ O FIM
function scrollToBottom() {
    const container = document.getElementById('mainScrollContainer');
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// HELPER SANITIZAR HTML
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}