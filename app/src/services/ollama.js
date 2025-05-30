const axios = require('axios');

async function roadmap(document) {
  const sentences = document.preprocessing.sentences;
  let responses = [];
  let i = 1;
  for (const entry of sentences) {
    try {
      console.log(`Processando sentença ${i} de ${sentences.length}...`);
      // Rodando o OLLAMA localmente
      const prompt = "Given the sentence, if you consider there is a future event with date to occur explicitly in the sentence, extract the future event and return a JSON file with: " +
        "forecast_text (the full future event in the sentence), and the date (the date or time in the sentence that the future event is predicted to occur - only numbers like 2050 or next decade; ignore numbers in brackets). " +
        "If you don't consider that is a future event, return only null. Sentence: ";

      // Envia a pergunta
      const response = await sendQuestionToOllama(prompt + entry.sentence);
      if (response.forecast_text !== "null") {
        responses.push({
            //index: entry.index,
            document: document ? document._id : null,
            sentence: entry && entry.sentence ? entry.sentence : null,
            forecast: response && response.forecast_text ? response.forecast_text : null,
            forecastDate: response && response.date ? response.date : null,
            explicitDate: response && response.date ? response.date : null,
            createdDate: new Date(),
            deleted: false
        });
      }
      console.log(`Sentença ${i} processada com sucesso!`);
      //responses.push(response);
    } catch (error) {
      console.log(`Sentença ${i} falhou!`);
      console.error(`Erro durante o processo OLLAMA: ${error}`);
      throw error; // Re-lança o erro para ser tratado por quem chamar `roadmap`
    }
    i++;
  }

  return responses;
}

async function refine(project) {
  const sentences = project.roadmap;
  let responses = [];
  let i = 1;
  for (const entry of sentences) {
    try {
      console.log(`Refinando forecast ${i} de ${sentences.length}...`);
      // Rodando o OLLAMA localmente

      const prompt = "Analyze the following text and determine if seems to be a text talking about a something that will happen in the future." +
                     "If yes, rreturn a json with the text inside field 'forecast_text'. " +
                     "Here is the input text to analyze: ";

      /* const prompt = "Analyze the following text and determine if it represents a future event (forecast) or if it is a phrase without relevance for forecasting purposes. " +
                     "If it is a meaningful forecast: " +
                     "Return a JSON object containing two keys: forecast_text (the original forecast text) and date (only the year in numeric format). " +
                     "For the date, convert expressions like 'next year' or 'by 2050' into a four-digit year based on the current year (2024)." +
                     "If the text is irrelevant or meaningless for forecasting: Return null. " +
                     "Here is the input text to analyze: "; */
      
      /* const prompt = "Analyzing the text, tell me if it is a complete a future event (forecast) with a meaning or seemns to be a text without meaning to be understood without any context. " + 
      "If it is a forecast, return a json with the forecast_text and the date. If not, return only null. " + 
      "And about the Date, I need only years. You can calculate for me considering we are in 2024 if is a expression like (in the next year, e.g.). " + 
      "Forecast: "; */

      // Envia a pergunta
      const response = await sendQuestionToOllama(prompt + entry.forecast);
      /* const response = await sendQuestionToOllama(prompt + entry.forecast + " Date: " + entry.explicitDate); */

      console.log('OLLAMA refinement response: ', response);
      if (response.forecast_text !== "null") {
        responses.push({
            //index: entry.index,
            sentence: entry && entry.sentence ? entry.sentence : null,
            forecast: response && response.forecast_text ? response.forecast_text : null,
            forecastDate: response && response.date ? response.date : null,
            explicitDate: response && response.date ? response.date : null,
            createdDate: new Date(),
            deleted: false
        });
      }
      console.log(`Forecast ${i} refinado com sucesso!`);
      console.log(`Novo Forecast: ${response.forecast_text}`);
      //responses.push(response);
    } catch (error) {
      console.log(`Forecast ${i} falhou!`);
      console.error(`Erro durante o processo OLLAMA: ${error}`);
      throw error; // Re-lança o erro para ser tratado por quem chamar `roadmap`
    }
    i++;
  }

  return responses;
}

async function sendQuestionToOllama(question) {
  try {
    const responseStream = await axios.post(
      'http://host.docker.internal:11434/api/generate',
      {
        model: "deepseek-r1:14b",
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
  roadmap,
  refine
};