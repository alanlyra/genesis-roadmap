const axios = require('axios');

async function roadmap(document) {
  const sentences = document.preprocessing.sentences;
  let responses = [];
  for (const entry of sentences) {
    try {
      // Rodando o OLLAMA localmente
      const prompt = "Given the sentence, if you consider there is a future event with date to occur explicitly in the sentence, extract the future event and return a JSON file with: " +
        "forecast_text (the full future event in the sentence), and the date (the date or time in the sentence that the future event is predicted to occur - like 2050 or next decade; ignore numbers in brackets). " +
        "If you don't consider that is a future event, return only null. Sentence: ";

      // Envia a pergunta
      const response = await sendQuestionToOllama(prompt + entry.sentence);
      responses.push(response);
    } catch (error) {
      console.error(`Erro durante o processo OLLAMA: ${error}`);
      throw error; // Re-lança o erro para ser tratado por quem chamar `roadmap`
    }
  }

  return responses;
}

async function sendQuestionToOllama(question) {
  try {
    const responseStream = await axios.post(
      'http://host.docker.internal:11434/api/generate',
      {
        model: "llama3.1",
        prompt: question,
      },
      {
        responseType: 'stream',
      }
    );

    let completeResponse = '';

    // Processa cada fragmento de resposta que chega
    responseStream.data.on('data', (chunk) => {
      const data = chunk.toString().trim().split('\n');
      data.forEach((line) => {
        if (line) {
          try {
            const jsonLine = JSON.parse(line);
            if (jsonLine.response) {
              completeResponse += jsonLine.response;
            }
          } catch (error) {
            console.error("Erro ao analisar JSON:", error.message);
          }
        }
      });
    });

    // Ao final do stream, processa o texto completo para extrair o JSON desejado
    return new Promise((resolve) => {
      responseStream.data.on('end', () => {
        const extractedJSON = extractJSON(completeResponse);
        //console.log("JSON Extraído:", extractedJSON);
        resolve(extractedJSON);
      });
    });
  } catch (error) {
    console.error("Erro ao se comunicar com o Ollama:", error.message);
    return {
      "forecast_text": "null",
      "date": "null"
    };
  }
}

// Função para extrair o JSON da resposta, caso exista
function extractJSON(responseText) {
  // Expressão regular para capturar um padrão JSON de previsão
  const jsonMatch = responseText.match(/({\s*"forecast_text":\s*".*?",\s*"date":\s*".*?"\s*})/);

  if (jsonMatch) {
    // Se o JSON for encontrado, parse e retorne
    return JSON.parse(jsonMatch[0]);
  } else {
    // Retorna o JSON padrão se não houver previsão
    return {
      "forecast_text": "null",
      "date": "null"
    };
  }
}

module.exports = {
  roadmap
};