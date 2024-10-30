const axios = require('axios');
//import GetRoadmap from '../connections/RoadmapConnection';

async function roadmap(document) {
    const sentences = document.preprocessing.sentences;
    let responses = [];
    let i = 1;
    for (const entry of sentences) {
        const requestData = {
            //model: "phi-2",
            model: "mistral-7b-openorca.Q4_0",
            messages: [{ role: 'system', content: 'Answer in a simple way' },
            {
                role: 'user', content: 'Given the Sentence, extract the future event and return only a JSON file with:  ' +
                    '1) the forecast_text (the full forecast in the Sentence, if exists. If there is no explicit date, return null), ' +
                    '2) and the date (the date or time in the Sentence that future event is predicted to occur, if exists. If there is no explicit date, return null). ' +
                    'Sentence: \'' + entry.sentence + '\''
            }
            ]

        };
        document.roadmapStatus = i + '/' + sentences.length;
        console.log('Processando: ', i++ + ' de ' + sentences.length);
        try {
            const teste = await axios.get('http://local-ai-service:8080');

            console.log('Teste: ', teste.data);

            const response = await axios.post('http://local-ai-service:8080/v1/chat/completions', requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            console.log('Resposta:', extractJsonResponse(response.data.choices[0].message.content));
            const completion = extractJsonResponse(response.data.choices[0].message.content);
            responses.push({
                //index: entry.index,
                document: document ? document._id : null,
                sentence: entry && entry.sentence ? entry.sentence : null,
                forecast: completion && completion.forecast_text ? completion.forecast_text : null,
                forecastDate: completion && completion.date ? completion.date : null,
                explicitDate: completion && completion.date ? completion.date : null,
                createdDate: new Date(),
                deleted: false
            });
        } catch (error) {
            console.error('Erro:', error);
        }

    }
   
    return responses
}

async function roadmapAfterNER(document) {}
/*
async function roadmapAfterNER(document) {

    let getRoadmap = GetRoadmap(_id, 'document');
    const roadmap = await getRoadmap();
    
    let roadmapRevisedByAI = [];
    let i = 1;
    for (const entry of roadmap) {
        const requestData = {
            //model: "phi-2",
            model: "mistral-7b-openorca.Q4_0.gguf",
            messages: [{ role: 'system', content: 'Answer in a simple way' },
            {
                role: 'user', content: 'Given the Text, extract the future event and return 1 if you consider if the text is a forecast or 0 if does not make sense to be a forecast. ' +
                    'Text: \'' + entry.forecast + '\''
            }
            ]

        };
        document.roadmapStatus = i + '/' + roadmap.length;
        console.log('Processando: ', i++ + ' de ' + roadmap.length);
        try {
            const response = await axios.post('http://local-ai-service:8080/v1/chat/completions', requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            console.log('Resposta:', extractJsonResponse(response.data.choices[0].message.content));
            const completion = extractJsonResponse(response.data.choices[0].message.content);
            roadmapRevisedByAI.push({
                //index: entry.index,
                document: document ? document._id : null,
                sentence: entry && entry.sentence ? entry.sentence : null,
                forecast: entry && entry.forecast_text ? entry.forecast_text : null,
                forecastDate: entry && entry.date ? entry.date : null,
                explicitDate: entry && entry.date ? entry.date : null,
                //createdDate: new Date(),
                deleted: false,
                revisedByAI: true,
                isForecastAI: completion ? completion : null
            });
        } catch (error) {
            console.error('Erro:', error);
        }

    }
   
    return roadmapRevisedByAI
}
*/

async function roadmapBatchCompletions(document) { //Utiliza o modelo de completions
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
                prompt: 'Given the sentence, extract the future event and return a JSON file with: ' +
                '1) forecast_text (the full forecast in the sentence, if exists. If there is no explicit date, return null), ' +
                '2) and the date (the date or time in the sentence that the future event is predicted to occur, if exists. If there is no explicit date, return null). ' +
                `Sentence: ${entry.sentence}`
            };
            return axios.post('http://local-ai-service:8080/v1/completions', requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                const completion = extractJsonResponse(response.data.choices[0].text);
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

async function roadmapBatch(document) { //Utiliza o modelo de chat
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

function extractJsonResponseBatch(content) {
    try {
        return JSON.parse(content);
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        return null;
    }
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
    roadmap,
    roadmapBatch,
    roadmapAfterNER
  };

