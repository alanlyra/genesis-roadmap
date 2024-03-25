const axios = require('axios');

async function roadmap(document) {
    const sentences = document.preprocessing.sentences;
    let responses = [];
    let i = 1;
    for (const entry of sentences) {
        const requestData = {
            //model: "phi-2",
            model: "mistral-7b-openorca.Q4_0.gguf",
            messages: [{ role: 'system', content: 'Answer in a simple way' },
            {
                role: 'user', content: 'Given the Sentence, extract the future event and return only a JSON file with:  ' +
                    '1) the forecast_text (the full forecast in the Sentence, if exists. If there is no explicit date, return null), ' +
                    '2) and the date (the date or time in the Sentence that future event is predicted to occur, if exists. If there is no explicit date, return null). ' +
                    'Sentence: \'' + entry.sentence + '\''
            }
            ]

        };
        console.log('Processando: ', i++ + ' de ' + sentences.length);
        try {
            const response = await axios.post('http://local-ai-service:8080/v1/chat/completions', requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            console.log('Resposta:', extractJsonResponse(response.data.choices[0].message.content));
            const completion = extractJsonResponse(response.data.choices[0].message.content);
            responses.push({
                //index: entry.index,
                document: document._id,
                sentence: entry.sentence,
                forecast: completion.forecast_text,
                forecastDate: completion.date,
                explicitDate: completion.date
            });
        } catch (error) {
            console.error('Erro:', error);
        }

    }
   
    return responses
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


module.exports.roadmap = roadmap;

