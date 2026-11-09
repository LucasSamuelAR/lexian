// FUNÇÕES COMPARTILHADAS (todas as páginas)
const CHAVE_CASOS = 'lexian_casos';
const LIMITE_CASOS = 20;
const NAO_INFORMADO = 'não informado';
const AREAS_VALIDAS = ['trabalhista', 'familia', 'consumidor', 'civel', 'penal', 'previdenciario', 'outra', 'indeterminada'];
const URGENCIAS_VALIDAS = ['alta', 'media', 'baixa'];

// HELPER SANITIZAR HTML
function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// LEITURA / GRAVAÇÃO NO LOCALSTORAGE
function lerStorage(chave, padrao) {
    try {
        const valor = localStorage.getItem(chave);
        return valor ? JSON.parse(valor) : padrao;
    } catch (e) {
        return padrao;
    }
}

function gravarStorage(chave, valor) {
    try {
        localStorage.setItem(chave, JSON.stringify(valor));
        return true;
    } catch (e) {
        return false;
    }
}

function lerCasos() {
    const lista = lerStorage(CHAVE_CASOS, []);
    return Array.isArray(lista) ? lista.filter(c => c && typeof c === 'object') : [];
}

function salvarCaso(caso) {
    const lista = lerCasos();
    lista.unshift(caso);
    return gravarStorage(CHAVE_CASOS, lista.slice(0, LIMITE_CASOS));
}

function limparCasos() {
    try {
        localStorage.removeItem(CHAVE_CASOS);
    } catch (e) {}
}

// GARANTE TODOS OS CAMPOS DA FICHA ("não informado" quando faltar dado)
function normalizarCaso(c) {
    const texto = v => (typeof v === 'string' && v.trim()) ? v : NAO_INFORMADO;
    const lista = v => (Array.isArray(v) && v.length) ? v.map(String) : [NAO_INFORMADO];
    return {
        nome: texto(c.nome),
        area: AREAS_VALIDAS.includes(c.area) ? c.area : 'indeterminada',
        urgencia: URGENCIAS_VALIDAS.includes(c.urgencia) ? c.urgencia : 'media',
        motivo_urgencia: texto(c.motivo_urgencia),
        resumo: texto(c.resumo),
        fatos: lista(c.fatos),
        partes: lista(c.partes),
        datas: lista(c.datas),
        documentos_citados: lista(c.documentos_citados),
        pedido_do_cliente: texto(c.pedido_do_cliente),
        informacoes_faltantes: lista(c.informacoes_faltantes),
        relato: texto(c.relato),
        pergunta: texto(c.pergunta),
        resposta: texto(c.resposta),
        criadoEm: texto(c.criadoEm)
    };
}