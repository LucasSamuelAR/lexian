import { fichaIA, campo, LIMITE } from "../lib/lexian.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Use POST." });

  const corpo = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const nome = campo(corpo.nome);
  const relato = campo(corpo.relato);
  const resposta = campo(corpo.resposta);
  const pergunta = campo(corpo.pergunta);

  if (!nome || !relato || !resposta ||
      [nome, relato, resposta, pergunta].some((c) => c.length > LIMITE)) {
    return res.status(400).json({ erro: "Dados inválidos." });
  }

  try {
    const ficha = await fichaIA(nome, relato, pergunta, resposta);
    res.status(200).json({
      nome,
      ...ficha,
      relato,
      pergunta: pergunta || "não informado",
      resposta,
      criadoEm: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Erro na ficha:", e.message);
    res.status(500).json({ erro: "Falha ao falar com a IA." });
  }
}