// LÓGICA DA PÁGINA DO CLIENTE (chat em etapas)
const chat = document.getElementById('chatMessages');
const rolagem = document.getElementById('chatScroll');
const carregando = document.getElementById('aiLoading');
const form = document.getElementById('triageForm');
const campo = document.getElementById('caseInput');
const botaoEnviar = document.getElementById('submitBtn');
const botaoNova = document.getElementById('newBtn');

let etapa = 'nome'; // nome -> relato -> resposta -> fim
let nome = '';
let relato = '';
let pergunta = '';
let resposta = '';
let ocupado = false;

function rolarParaOFim() {
    setTimeout(() => {
        rolagem.scrollTop = rolagem.scrollHeight;
    }, 50);
}

function adicionarMensagemBot(texto) {
    const html = `
        <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl bg-brand-emerald/20 border border-brand-emerald/40 flex items-center justify-center text-brand-emerald shrink-0 shadow-sm">
                <i class="fa-solid fa-robot text-sm"></i>
            </div>
            <div class="max-w-[85%] bg-brand-card border border-brand-border rounded-2xl p-4 shadow-sm text-sm text-gray-200 leading-relaxed">
                <span class="font-semibold text-white text-xs block mb-1">LEXIAN Assistente</span>
                <p class="whitespace-pre-wrap">${escapeHtml(texto)}</p>
            </div>
        </div>
    `;
    chat.insertAdjacentHTML('beforeend', html);
    rolarParaOFim();
}

function adicionarMensagemUsuario(texto) {
    const html = `
        <div class="flex items-start gap-3 justify-end">
            <div class="max-w-[85%] bg-brand-border/60 border border-brand-border rounded-2xl p-4 shadow-sm text-sm text-gray-100 leading-relaxed">
                <p class="whitespace-pre-wrap break-words">${escapeHtml(texto)}</p>
            </div>
            <div class="w-9 h-9 rounded-xl bg-brand-border flex items-center justify-center text-white shrink-0 font-bold text-[10px] border border-gray-600">
                VOCÊ
            </div>
        </div>
    `;
    chat.insertAdjacentHTML('beforeend', html);
    rolarParaOFim();
}

function definirOcupado(valor) {
    ocupado = valor;
    carregando.classList.toggle('hidden', !valor);
    const bloqueado = valor || etapa === 'fim';
    campo.disabled = bloqueado;
    botaoEnviar.disabled = bloqueado;
    if (valor) rolarParaOFim();
    if (!bloqueado) campo.focus();
}

function iniciar() {
    etapa = 'nome';
    nome = '';
    relato = '';
    pergunta = '';
    resposta = '';
    ocupado = false;
    chat.innerHTML = '';
    campo.value = '';
    campo.placeholder = 'Digite aqui...';
    campo.disabled = false;
    botaoEnviar.disabled = false;
    carregando.classList.add('hidden');
    botaoNova.classList.add('hidden');
    botaoNova.classList.remove('flex');
    adicionarMensagemBot('Olá! Eu sou a Lexian, assistente de triagem do escritório. Qual é o seu nome?');
    campo.focus();
}

async function enviar(e) {
    e.preventDefault();
    const texto = campo.value.trim();
    if (!texto || ocupado || etapa === 'fim') return;

    adicionarMensagemUsuario(texto);
    campo.value = '';

    if (etapa === 'nome') {
        nome = texto;
        adicionarMensagemBot('Prazer, ' + nome + '! Sou uma triagem automatizada e não substituo um advogado. Conte, com suas palavras, o que aconteceu.');
        etapa = 'relato';
        return;
    }

    definirOcupado(true);
    try {
        if (etapa === 'relato') {
            relato = texto;
            pergunta = await gerarPergunta(relato);
            adicionarMensagemBot(pergunta);
            etapa = 'resposta';
        } else if (etapa === 'resposta') {
            resposta = texto;
            const ficha = await gerarFicha(nome, relato, resposta);
            const caso = normalizarCaso(Object.assign({}, ficha, {
                nome: nome,
                relato: relato,
                pergunta: pergunta,
                resposta: resposta,
                criadoEm: new Date().toISOString()
            }));
            if (!salvarCaso(caso)) throw new Error('Não foi possível salvar o caso.');
            adicionarMensagemBot('Obrigada, ' + nome + '! Organizei o seu caso e já encaminhei para o advogado responsável. Em breve entraremos em contato.');
            etapa = 'fim';
            campo.placeholder = 'Triagem encerrada.';
            botaoNova.classList.remove('hidden');
            botaoNova.classList.add('flex');
        }
    } catch (erro) {
        console.error(erro);
        adicionarMensagemBot('Desculpe, ocorreu um erro. Por favor, envie sua mensagem novamente.');
        campo.value = texto;
    } finally {
        definirOcupado(false);
    }
}

form.addEventListener('submit', enviar);

// Enter envia; Shift+Enter quebra linha
campo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        form.requestSubmit();
    }
});

botaoNova.addEventListener('click', iniciar);

iniciar();