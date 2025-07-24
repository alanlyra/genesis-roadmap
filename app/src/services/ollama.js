const axios = require('axios');

/**
 * Prompt com seed JSON e instruções reforçadas.
 */
function createPrompt(blockText, publicationYear, maxEventsPerBlock = 15) {
  return `
You are an AI trained to extract future-oriented forecasts from foresight reports.

From the document below (published in ${publicationYear}), extract at most ${maxEventsPerBlock} relevant future events.

Each event must include:
- "forecastDate": the predicted 4-digit year
- "forecast": a concise summary of the future event
- "sentence": a short quote (1 sentence max) that introduces the idea

Only return a valid JSON array of events. Start immediately with:

[
  {
    "forecastDate": 2050,
    "forecast": "Low-level journalism will be automated by AI tools.",
    "sentence": "By 2050, part of the workforce will be automated to better suit the new world market."
  },

Now extract the real forecasts from the following document:
"""${blockText}"""
`;
}

/**
 * Divide o texto completo em blocos de ~4000 palavras (~16000 caracteres).
 */
function splitTextIntoBlocks(text, maxChars = 16000) {
  const paragraphs = text.split(/\n+/);
  const blocks = [];
  let current = '';

  for (const p of paragraphs) {
    if ((current + p).length < maxChars) {
      current += p + '\n';
    } else {
      blocks.push(current.trim());
      current = p + '\n';
    }
  }

  if (current.trim()) {
    blocks.push(current.trim());
  }

  return blocks;
}

/**
 * Envia o prompt ao Ollama (stream: false).
 */
async function sendToOllama(prompt) {
  try {
    const res = await axios.post('http://host.docker.internal:11434/api/generate', {
      model: 'dolphin-llama3:latest',
      prompt,
      stream: false
    });

    return res.data.response;
  } catch (err) {
    console.error("❌ Erro na chamada ao Ollama:", err.message);
    return null;
  }
}

/**
 * Extrai bloco JSON da resposta.
 */
function extractJsonFromText(text) {
  const match = text.match(/\[.*\]/s);
  if (match) return match[0].trim();
  throw new Error("Não foi possível encontrar JSON na resposta.");
}

/**
 * Corrige strings JSON malformadas.
 */
function sanitizeJsonString(jsonStr) {
  return jsonStr.replace(/"(.*?)":\s*"([^"]*?)"([^",\n}])/g, (match, key, value, extra) => {
    const safeValue = value.replace(/"/g, '\\"');
    return `"${key}": "${safeValue}"${extra}`;
  });
}

/**
 * Adiciona metadados a cada previsão.
 */
function enrichForecasts(forecasts, document) {
  return forecasts.map(item => ({
    ...item,
    document: document._id,
    deleted: false
  }));
}

/**
 * Função principal: processa texto em blocos e concatena JSONs.
 */
async function roadmap(document) {
  const publicationYear = 2017;
  const fullText = document.preprocessing.text;
  const maxEventsPerBlock = 15;

  const blocks = splitTextIntoBlocks(fullText, 16000);
  let allForecasts = [];

  console.log(`📄 Documento dividido em ${blocks.length} bloco(s) (~4000 palavras cada).`);

  for (let i = 0; i < blocks.length; i++) {
    console.log(`🚀 Processando bloco ${i + 1} de ${blocks.length}...`);

    const prompt = createPrompt(blocks[i], publicationYear, maxEventsPerBlock);
    const response = await sendToOllama(prompt);

    if (!response) {
      console.warn(`⚠️ Nenhuma resposta recebida para o bloco ${i + 1}`);
      continue;
    }

    // Log da resposta crua (primeiros 1000 caracteres)
    console.log(`📤 Resposta bruta do bloco ${i + 1}:\n${response.slice(0, 1000)}\n---`);

    try {
      const jsonText = extractJsonFromText(response);
      const sanitized = sanitizeJsonString(jsonText);
      const parsed = JSON.parse(sanitized);

      if (Array.isArray(parsed)) {
        allForecasts = allForecasts.concat(parsed);
        console.log(`✅ Bloco ${i + 1}: ${parsed.length} evento(s) extraído(s).`);
      } else {
        console.warn(`⚠️ Bloco ${i + 1} não retornou um array válido.`);
      }
    } catch (err) {
      console.warn(`⚠️ Erro ao processar JSON do bloco ${i + 1}: ${err.message}`);
    }
  }

  const enriched = enrichForecasts(allForecasts, document);

  console.log(`\n📌 Total de eventos extraídos: ${enriched.length}`);
  return enriched;
}

module.exports = {
  roadmap
};