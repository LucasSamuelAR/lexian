// Único ponto de comunicação com a IA. Fala com o backend (server.js).
// Nenhuma chave de API existe no front-end.

const PERGUNTA_PADRAO =
    'Você pode me contar as datas aproximadas dos fatos e se tem algum documento relacionado ao que aconteceu?';

// guarda a última pergunta feita, para enviar junto na hora da ficha
let ultimaPergunta = '';

async function chamarApi(caminho, dados) {
    const resp = await fetch(caminho, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });
    if (!resp.ok) throw new Error('Erro no servidor: ' + resp.status);
    return resp.json();
}

// Recebe o relato e devolve UMA pergunta de acompanhamento (string).
async function gerarPergunta(relato) {
    try {
        const dados = await chamarApi('/api/pergunta', { relato: relato });
        ultimaPergunta = dados.pergunta || PERGUNTA_PADRAO;
    } catch (erro) {
        console.error('Falha ao gerar pergunta:', erro);
        ultimaPergunta = PERGUNTA_PADRAO;
    }
    return ultimaPergunta;
}

// Recebe nome, relato e resposta e devolve a ficha (objeto no formato combinado).
async function gerarFicha(nome, relato, resposta) {
    try {
        const d = await chamarApi('/api/ficha', {
            nome: nome,
            relato: relato,
            resposta: resposta,
            pergunta: ultimaPergunta
        });
        return {
            nome: nome,
            area: d.area,
            urgencia: d.urgencia,
            motivo_urgencia: d.motivo_urgencia,
            resumo: d.resumo,
            fatos: d.fatos,
            partes: d.partes,
            datas: d.datas,
            documentos_citados: d.documentos_citados,
            pedido_do_cliente: d.pedido_do_cliente,
            informacoes_faltantes: d.informacoes_faltantes
        };
    } catch (erro) {
        console.error('Falha ao gerar ficha:', erro);
        return {
            nome: nome,
            area: 'indeterminada',
            urgencia: 'media',
            motivo_urgencia: 'Falha ao analisar o caso automaticamente. Revisar manualmente.',
            resumo: 'não informado',
            fatos: ['não informado'],
            partes: ['não informado'],
            datas: ['não informado'],
            documentos_citados: ['não informado'],
            pedido_do_cliente: 'não informado',
            informacoes_faltantes: ['não informado']
        };
    }
}