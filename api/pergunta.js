import { proximoPassoIA, limparHistorico } from "../lib/lexian.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Use POST." });

  const corpo = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const historico = limparHistorico(corpo.historico);
  if (!historico || historico[historico.length - 1].papel !== "cliente") {
    return res.status(400).json({ erro: "Histórico inválido." });
  }

  try {
    res.status(200).json(await proximoPassoIA(historico));
  } catch (e) {
    console.error("Erro na pergunta:", e.message);
    res.status(500).json({ erro: "Falha ao falar com a IA." });
  }
}