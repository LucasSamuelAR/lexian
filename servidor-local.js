import "dotenv/config";
import express from "express";
import pergunta from "./api/pergunta.js";
import ficha from "./api/ficha.js";

const app = express();
app.use(express.json({ limit: "20kb" }));
app.post("/api/pergunta", pergunta);
app.post("/api/ficha", ficha);
app.use(express.static(".", { dotfiles: "deny" }));

const porta = process.env.PORT || 3000;
app.listen(porta, () => console.log(`LEXIAN local em http://localhost:${porta}`));