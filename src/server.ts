
import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
import nlpParserHandler from "./routes/nlp-parser.js";
import generateFinalHandler from "./routes/generate-final.js";

dotenv.config();

const app = express();
app.use(json({ limit: "2mb" }));
app.use(cors());

app.post("/api/nlp-parser", nlpParserHandler);
app.post("/api/generate-final", generateFinalHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 TS backend running at http://localhost:${PORT}`));
