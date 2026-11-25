// LÓGICA DA PÁGINA DO CLIENTE (chat com histórico completo)
const chat = document.getElementById('chatMessages');
const rolagem = document.getElementById('chatScroll');
const carregando = document.getElementById('aiLoading');
const form = document.getElementById('triageForm');
const campo = document.getElementById('caseInput');
const botaoEnviar = document.getElementById('submitBtn');
const botaoNova = document.getElementById('newBtn');

const MSG_FORA_ESCOPO =
    'Desculpe, mas este chat é exclusivo para a triagem de casos jurídicos e não posso ajudar com esse assunto. ' +
    'Se tiver dúvidas sobre o funcionamento do atendimento, consulte o nosso FAQ. ' +
    'Se quiser relatar um caso jurídico, é só me contar o que aconteceu.';

const MSG_DADO_SENSIVEL =
    'Por segurança, não é permitido informar dados sensíveis neste chat, como CPF, RG, senhas, códigos de verificação, ' +
    'dados de cartão ou dados bancários. Sua mensagem não foi registrada. Pode reenviar o relato sem esses dados?';

let etapa = 'nome'; // nome -> conversa -> fim
let nome = '';
let historico = []; // { papel: 'cliente' | 'lexian', texto, repeticao? }
let ocupado = false;

function rolarParaOFim() {
    setTimeout(() => {
        rolagem.scrollTop = rolagem.scrollHeight;
    }, 50);
}

function adicionarMensagemBot(texto, comFaq) {
    // botão fixo (HTML do próprio código, nunca vindo da IA) que abre o painel do FAQ
    const botaoFaq = comFaq
        ? '<button type="button" data-abrir-faq class="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-brand-emerald border border-brand-emerald/40 hover:bg-brand-emerald/10 rounded-lg px-3 py-1.5 transition"><i class="fa-solid fa-circle-question"></i> Abrir perguntas frequentes</button>'
        : '';
    const html = `
        <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl bg-brand-emerald/20 border border-brand-emerald/40 flex items-center justify-center text-brand-emerald shrink-0 shadow-sm">
                <i class="fa-solid fa-robot text-sm"></i>
            </div>
            <div class="max-w-[85%] bg-brand-card border border-brand-border rounded-2xl p-4 shadow-sm text-sm text-gray-200 leading-relaxed">
                <span class="font-semibold text-white text-xs block mb-1">LEXIAN Assistente</span>
                <p class="whitespace-pre-wrap">${escapeHtml(texto)}</p>
                ${botaoFaq}
            </div>
        </div>
    `;
    chat.insertAdjacentHTML('beforeend', html);
    rolarParaOFim();
}

// Devolve a bolha criada, para poder apagá-la da tela se necessário
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
    return chat.lastElementChild;
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
    historico = [];
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

async function postar(url, dados) {
    const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });
    if (!r.ok) throw new Error('Erro ' + r.status + ' em ' + url);
    return r.json();
}

// Monta o caso no formato que o seu salvarCaso/normalizarCaso já esperava
function montarCaso(ficha) {
    const doCliente = historico.filter((m) => m.papel === 'cliente').map((m) => m.texto);
    const daLexian = historico.filter((m) => m.papel === 'lexian').map((m) => m.texto);
    return normalizarCaso(Object.assign({}, ficha, {
        nome: nome,
        relato: doCliente[0] || '',
        pergunta: daLexian.join('\n'),
        resposta: doCliente.slice(1).join('\n'),
        // grava só papel e texto: a marca "repeticao" é de uso interno do chat
        conversa: historico.map((m) => ({ papel: m.papel, texto: m.texto })),
        criadoEm: new Date().toISOString()
    }));
}

async function enviar(e) {
    e.preventDefault();
    const texto = campo.value.trim();
    if (!texto || ocupado || etapa === 'fim') return;

    const bolha = adicionarMensagemUsuario(texto);
    campo.value = '';

    if (etapa === 'nome') {
        // O nome não passa pelo servidor nesta etapa, então a checagem aqui é simples:
        // sem números (a checagem completa é refeita no servidor ao gerar a ficha)
        if (/\d/.test(texto) || texto.length > 80) {
            bolha.remove();
            adicionarMensagemBot('Para sua segurança, informe apenas o seu nome, sem números ou documentos.');
            return;
        }
        nome = texto;
        adicionarMensagemBot('Prazer, ' + nome + '! Sou uma triagem automatizada e não substituo um advogado. Conte, com suas palavras, o que aconteceu.');
        etapa = 'conversa';
        return;
    }

    historico.push({ papel: 'cliente', texto: texto });
    definirOcupado(true);

    try {
        const passo = await postar('/api/pergunta', { historico: historico });

        if (passo.status === 'fora_do_escopo') {
            historico.pop(); // descarta a mensagem fora do tema
            adicionarMensagemBot(passo.mensagem || MSG_FORA_ESCOPO, true);
        } else if (passo.status === 'dado_sensivel') {
            historico.pop(); // não fica no histórico
            bolha.remove(); // some da tela
            // não devolve o texto ao campo, para o cliente não reenviar o dado sem querer
            adicionarMensagemBot(passo.mensagem || MSG_DADO_SENSIVEL);
        } else if (passo.status === 'pergunta') {
            // "repeticao": a Lexian só repetiu uma pergunta pendente, então não gasta o limite de perguntas
            historico.push({ papel: 'lexian', texto: passo.mensagem, repeticao: passo.repeticao === true });
            adicionarMensagemBot(passo.mensagem);
        } else if (passo.status === 'completo') {
            const { ficha, enviavel, motivo } = await postar('/api/ficha', { nome: nome, historico: historico });

            if (!enviavel) {
                // nada jurídico identificado ou dado sensível: não envia a triagem
                if (motivo === 'dado_sensivel') adicionarMensagemBot(MSG_DADO_SENSIVEL);
                else adicionarMensagemBot(MSG_FORA_ESCOPO, true);
            } else {
                if (!salvarCaso(montarCaso(ficha))) throw new Error('Não foi possível salvar o caso.');
                adicionarMensagemBot(
                    (passo.mensagem ? passo.mensagem + '\n\n' : '') +
                    'Organizei o seu caso e já encaminhei para o advogado responsável. Em breve entraremos em contato.'
                );
                etapa = 'fim';
                campo.placeholder = 'Triagem encerrada.';
                botaoNova.classList.remove('hidden');
                botaoNova.classList.add('flex');
            }
        } else {
            throw new Error('Resposta inesperada do servidor.');
        }
    } catch (erro) {
        console.error(erro);
        if (historico.length && historico[historico.length - 1].papel === 'cliente') historico.pop();
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