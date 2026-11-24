import { fichaIA, campo, limparHistorico } from "../lib/lexian.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Use POST." });

  const corpo = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const nome = campo(corpo.nome);
  const historico = limparHistorico(corpo.historico);

  if (!nome || !historico) {
    return res.status(400).json({ erro: "Nome e histórico válidos são obrigatórios." });
  }

  try {
    const ficha = await fichaIA(nome, historico);
    // enviavel = false quando a IA não identificou nada jurídico
    res.status(200).json({ ficha, enviavel: ficha.area !== "indeterminada" });
  } catch (e) {
    console.error("Erro na ficha:", e.message);
    res.status(500).json({ erro: "Falha ao gerar ficha do caso." });
  }
}
