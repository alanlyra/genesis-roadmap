// Adiciona fetch e Headers ao escopo global para uso com @google/genai
const fetch = require('node-fetch');
globalThis.fetch = fetch;
globalThis.Headers = fetch.Headers;

const axios = require('axios');
const { GoogleGenAI, createUserContent } = require("@google/genai");


// 📌 SUA CHAVE DE API DO GEMINI
const GOOGLE_API_KEY = "AIzaSyAGhbLEWypBM4C5zRmvoLhK0w_bZbStTE4";

/**
 * Gera o prompt para análise de um texto prospectivo.
 */
function createTimelinePrompt(text, publicationYear) {
  return `
You are analyzing a foresight or future-oriented report, published in the year ${publicationYear}. The following text was extracted from this report.

Your task is to extract and synthesize **future events or projections** mentioned in the text, and organize them into a **chronological roadmap**.

Each future event must contain:
1. A **predicted year** (e.g., 2030, 2045), either explicitly stated or inferred from relative expressions (e.g., "in ten years").
2. A **concise, clear description** of the event based on the surrounding context — summarize it semantically, do not copy vague sentences.
3. A **short quote (1 sentence max)** from the beginning of the paragraph or section where the prediction appears, which best introduces or anchors the idea.

Requirements:
- Read and interpret the full context of each prediction (e.g., sections like "pessimist scenario").
- Do **not** include vague phrases like "In this scenario..." unless they are followed by substantive explanation.
- Do **not** include unrelated present/historical facts.
- Ensure each event is meaningful on its own.
- The quote ("source") should come from the **start of the paragraph or subsection** where the prediction begins to be developed.
- Output format must be **structured JSON**.

Output example:
[
  {
    "forecastDate": 2050,
    "forecast": "High automation will lead to mass unemployment in the absence of social policies, particularly affecting low-skilled workers.",
    "sentence": "In this scenario, we present a pessimist foresight of how working will be in the year of 2050."
  },
  {
    "forecastDate": 2050,
    "forecast": "Universal Basic Income will be partially implemented to support those displaced by automation.",
    "sentence": "Governments and companies will recognize the need to train workers that will lose their jobs due to automation."
  }
]

Now analyze the following report and return only the structured JSON list of future events:

"""${text}"""
`;
}

/**
 * Extrai a timeline prospectiva de um documento processado.
 */
async function roadmap(document) {
  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  const pdfText = document.preprocessing.text;
  const publicationYear = 2017;

  console.log(pdfText);
  try {
    const prompt = createTimelinePrompt(pdfText, publicationYear);

    const result = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: createUserContent([prompt]),
    });

    console.log(result.text);


    const outputText = extractJsonFromText(result.text);
    if (!outputText) {
      throw new Error("Nenhuma resposta de texto foi retornada pela IA.");
    }

    let parsed;
    try {
      parsed = JSON.parse(outputText);
    } catch (err) {
      console.error("Erro ao fazer parse do JSON:", err.message);
      throw new Error("O texto retornado pela IA não é um JSON válido.");
    }

    if (!Array.isArray(parsed)) {
      throw new Error("O conteúdo analisado não é uma lista JSON de previsões.");
    }

    const responses = adicionarCamposPrevisoes(parsed, document);

    console.log("\n Timeline prospectiva detectada:\n");
    console.log(responses);

    return responses;

  } catch (error) {
    console.error("Erro ao processar o PDF:", error.message);
    throw error;
  }
}

/**
 * Enriquecer cada previsão com metadados do documento original.
 */
function adicionarCamposPrevisoes(forecasts, document) {
  return forecasts.map(item => ({
    ...item,
    document: document._id,
    deleted: false
  }));
}

function extractJsonFromText(text) {
  const jsonRegex = /```(?:json)?([\s\S]*?)```/i;
  const match = text.match(jsonRegex);
  if (match) return match[1].trim();

  // fallback: tenta encontrar JSON diretamente (sem crases)
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1) {
    return text.slice(firstBracket, lastBracket + 1);
  }

  throw new Error("Não foi possível extrair JSON da resposta.");
}

module.exports = {
  roadmap
};