import { perguntaIA, campo, LIMITE } from "../lib/lexian.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Use POST." });

  const corpo = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const relato = campo(corpo.relato);
  if (!relato || relato.length > LIMITE) {
    return res.status(400).json({ erro: "Relato inválido." });
  }

  try {
    const pergunta = await perguntaIA(relato);
    res.status(200).json({ pergunta });
  } catch (e) {
    console.error("Erro na pergunta:", e.message);
    res.status(500).json({ erro: "Falha ao falar com a IA." });
  }
}