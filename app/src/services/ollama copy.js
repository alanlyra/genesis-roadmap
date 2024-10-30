const axios = require('axios');
const { spawn, spawnSync } = require('child_process');


async function roadmap(document) {
    const sentences = document.preprocessing.sentences;
    let responses = [];
    let i = 1;
    for (const entry of sentences) {

        try {
            // Rodando o OLLAMA localmente
            const prompt = "Given the sentence, if you consider thare is a future event wih date to occur explicited in the sentence, extract the future event and return a JSON file with: " +
                           "forecast_text (the full future event in the sentence), and the date (the date or time in the sentence that the future event is predicted to occur - like 2050 or next decade; ignore numbers in bracets). " +
                           "If you don't consider that is a future event, return only null. Sentence: ";

            // Envia a pergunta
            sendQuestionToOllama(prompt + entry.sentence);
        } catch (error) {
            console.error(`Erro durante o processo OLLAMA: ${error}`);
            throw error;  // Re-lança o erro para ser tratado por quem chamar `ner`
        } finally {
            // Limpeza: remover arquivos temporários
            //await fs.unlink(txtPath);
            //await fs.unlink(taggedFile);
        }
    }
   
    return responses
}

async function sendQuestionToOllama(question) {
    try {
      const responseStream = await axios.post(
        'http://host.docker.internal:11434/api/generate',
        {
          model: "llama2",
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
            const jsonLine = JSON.parse(line);
            if (jsonLine.response) {
              completeResponse += jsonLine.response;
            }
          }
        });
      });
  
      // Ao final do stream, processa o texto completo para extrair o JSON desejado
      responseStream.data.on('end', () => {
        const extractedJSON = extractJSON(completeResponse);
        console.log("JSON Extraído:", extractedJSON);
      });
    } catch (error) {
      console.error("Erro ao se comunicar com o Ollama:", error.message);
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














async function roadmapOld(document) {
    const sentences = document.preprocessing.sentences;
    let responses = [];
    let i = 1;
    for (const entry of sentences) {

        try {
            // Rodando o OLLAMA localmente

            const prompt = "Given the sentence, if you consider thare is a future event wih date to occur explicited in the sentence, extract the future event and return a JSON file with: " +
                           "forecast_text (the full future event in the sentence), and the date (the date or time in the sentence that the future event is predicted to occur - like 2050 or next decade; ignore numbers in bracets). " +
                           "If you don't consider that is a future event, return only null. Sentence: ";

            const ollamaProcess = spawnSync('ollama', ['run', 'llama3.1']);

            // Escuta a saída do terminal (stdout)
            ollamaProcess.stdout.on('data', (data) => {
                console.log(`Resposta do ollama: ${data}`);
            });
            
            // Escuta erros (stderr)
            ollamaProcess.stderr.on('data', (data) => {
                console.error(`Erro: ${data}`);
            });
            
            // Quando o processo termina
            ollamaProcess.on('close', (code) => {
                console.log(`Processo finalizado com o código: ${code}`);
            });

            ollamaProcess.stdin.write(prompt + entry.sentence); // Envia o comando para o processo
    
            // Ler o arquivo resultante
            //const response = await fs.readFile(taggedFile, 'utf8');
            //console.log(`NER aplicado com sucesso no documento ${document._id}`);
            //console.log(`Resultado do NER: ${response}`);
            return "";
        } catch (error) {
            console.error(`Erro durante o processo OLLAMA: ${error}`);
            throw error;  // Re-lança o erro para ser tratado por quem chamar `ner`
        } finally {
            // Limpeza: remover arquivos temporários
            //await fs.unlink(txtPath);
            //await fs.unlink(taggedFile);
        }
    }
   
    return responses
}

async function roadmapBatchOld(document) { //Utiliza o modelo de chat
    const sentences = document.preprocessing.sentences;
    let responses = [];
    const batchSize = 5;
    console.log(`Processing document in batch with size ${batchSize}: ${document._id}`);

    for (let batchIndex = 0; batchIndex < sentences.length; batchIndex += batchSize) {
        console.log(`Processing batch ${batchIndex / batchSize + 1} of ${Math.ceil(sentences.length / batchSize)}`);
        const sentenceBatch = sentences.slice(batchIndex, Math.min(batchIndex + batchSize, sentences.length));
        
        
        const requests = sentenceBatch.map((entry) => {
            const requestData = {
                model: "mistral-7b-openorca.Q4_0.gguf",
                messages: [
                    { role: 'system', content: 'Answer in a simple way' },
                    {
                        role: 'user',
                        content: 'Given the sentence, extract the future event and return a JSON file with: ' +
                            '1) forecast_text (the full forecast in the sentence, if exists. If there is no explicit date, return null), ' +
                            '2) and the date (the date or time in the sentence that the future event is predicted to occur, if exists. If there is no explicit date, return null). ' +
                            `Sentence: ${entry.sentence}`
                    }
                ]
            };
            return axios.post('http://local-ai-service:8080/v1/chat/completions', requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                const completion = extractJsonResponse(response.data.choices[0].message.content);
                return {
                    document: document ? document._id : null,
                    sentence: entry && entry.sentence ? entry.sentence : null,
                    forecast: completion && completion.forecast_text ? completion.forecast_text : null,
                    forecastDate: completion && completion.date ? completion.date : null,
                    explicitDate: completion && completion.date ? completion.date : null,
                    createdDate: new Date(),
                    deleted: false
                };
            }).catch(error => {
                console.error('Error in processing sentence:', entry.sentence, error);
                return null;  // Return null or handle it appropriately
            });
        });

        const batchResults = await Promise.all(requests);
        responses = responses.concat(batchResults.filter(result => result !== null));
        console.log(`Processed batch ${batchIndex / batchSize + 1} of ${Math.ceil(sentences.length / batchSize)}`);
    }

    return responses;
}

function extractJsonResponse(response) {
    // Encontrar o início do JSON
    const start = response.indexOf('{');

    // Encontrar o final do JSON
    const end = response.lastIndexOf('}') + 1;

    // Verificar se o JSON foi encontrado
    if (start !== -1 && end !== -1) {
        // Extrair o JSON da resposta
        const jsonStr = response.substring(start, end);

        // Analisar o JSON
        const jsonData = JSON.parse(jsonStr);

        return jsonData;
    } else {
        return null;
    }
}

module.exports = {
    roadmap
  };

