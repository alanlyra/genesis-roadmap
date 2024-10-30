/*
var { createCompletion, loadModel } = require("gpt4all");
const fs = require('fs').promises;

async function roadmap(sentences) {
    const model = await loadModel('mistral-7b-openorca.Q4_0.gguf');

    const maxTokensPerRequest = 2000;
    let responses = [];

    for (const entry of sentences) {
        const response = await createCompletion(model, [
            { role: 'system', content: 'Answer in a simple way' },
            { role: 'user', content: 'Given the Sentence1, let me know if there is any future event prediction (forecast) in the text. ' +
                                     'If there is, extract the future event and organize it into a JSON file with two fields with index for each Sentence1:  ' +
                                     //'1) forecast? (boolean state. True if the sentence contains a forecast with a real event with a meaning — not only the date; or false otherwise), ' +
                                     //'2) date (year of the event\'s occurrence, only if there is a date in the sentence — do not create a date that doesn\'t exists in the sentence". Or null if not), ' +
                                     '1) the forecast_text (the full forecast in the Sentence1), ' +
                                     '2) and the explicit_date (the explicit date, such as \'2050\', in the Sentence1. If there is no explicit date, return null), ' +
                                     '3) and the boolean_date (boolean state: Is there an explicit date, such as \'2050\', in the sentence?). ' +
                                     //'4) and the explicit_date (boolean state: Is there an explicit date, such as \'2050\', in the sentence?). ' +
                                     'If there is no forecast in the Sentence1, return null for both fields. ' +
                                     'Sentence1: \'' + entry.sentence + '\''}
        ]);

        responses.push({
            index: entry.index,
            sentence: entry.sentence,
            completion: response.choices[0].message.content
        });
    }

    // Salva as respostas no arquivo responses.json
    return responses
}

module.exports.roadmap = roadmap;
*/
