var { createCompletion, loadModel, InferenceModelOptions } = require("gpt4all");
const fs = require('fs');

async function roadmap() {
    const sentences = [
        { "index": 4, "sentence": "com/in/alan-lyra (LinkedIn) Principais competências Java JavaScript Node." },
        { "index": 5, "sentence": "By 2050, 86% of the developed countries’ population, and 64% of the developing countries’ population will be urbanized." },
        { "index": 13, "sentence": "\nFull stack development using multiple technologies, including Java (Java EE, JSF), JavaScript, HTML, CSS, PHP, Mobile (Java) ." },
        { "index": 15, "sentence": "By 2050, part of the workforce will be automated to better suit the new world market." },
        { "index": 16, "sentence": "\nAlso using project management tools such as Redmine, as well as versioning with both Git and Subversion, and continuous integration with Jenkins." }
    ];

    // Carrega o modelo localmente
    //const modelPath = './src/models/gpt4all/mistral-7b-openorca.Q4_0.gguf';
    const modelPath = '../models/gpt4all/mistral-7b-openorca.Q4_0.gguf';
    const tempModelPath = await createModelFromFile(modelPath);
    
    const model = await createModelFromFile(tempModelPath);

    const systemPrompt = "Answer in a simple way"; 

    let responses = [];

    for (const entry of sentences) {
        const response = await createCompletion(model, [
            { role: 'system', content: systemPrompt },

            {
                role: 'user', content: 'Given the Sentence1, let me know if there is any future event prediction (forecast) in the text. ' +
                    'If there is, extract the future event and organize it into a JSON file with two fields with index for each Sentence1:  ' +
                    //'1) forecast? (boolean state. True if the sentence contains a forecast with a real event with a meaning — not only the date; or false otherwise), ' +
                    //'2) date (year of the event\'s occurrence, only if there is a date in the sentence — do not create a date that doesn\'t exists in the sentence". Or null if not), ' +
                    '1) the forecast_text (the full forecast in the Sentence1), ' +
                    '2) and the explicit_date (the explicit date, such as \'2050\', in the Sentence1. If there is no explicit date, return null), ' +
                    '3) and the boolean_date (boolean state: Is there an explicit date, such as \'2050\', in the sentence?). ' +
                    //'4) and the explicit_date (boolean state: Is there an explicit date, such as \'2050\', in the sentence?). ' +
                    'If there is no forecast in the Sentence1, return null for both fields. ' +
                    'Sentence1: \'' + entry.sentence + '\''
            }
        ]);

        responses.push({
            index: entry.index,
            sentence: entry.sentence,
            completion: response.choices[0].message.content
        });
    }

    // Salva as respostas no arquivo responses.json
    console.log(responses);
    return responses
}

async function createModelFromFile(modelPath) {
    return new Promise((resolve, reject) => {
        const tempFilePath = 'temp_model.txt';
        const writeStream = fs.createWriteStream(tempFilePath);

        const readStream = fs.createReadStream(modelPath, { encoding: 'utf8' });

        readStream.on('data', chunk => {
            writeStream.write(chunk);
        });

        readStream.on('end', () => {
            writeStream.end();
            writeStream.on('finish', () => {
                resolve(tempFilePath);
            });
        });

        readStream.on('error', err => {
            reject(err);
        });
    });
}

roadmap();