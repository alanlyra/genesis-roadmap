const axios = require('axios');
const apiKey = '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';

//Models
//gpt-3.5-turbo
//text-davinci-003

// Função para fazer a requisição à API do ChatGPT
async function chatGPTRequest(prompt) {
    const apiUrl = 'https://api.openai.com/v1/completions';

    const response = await axios.post(apiUrl, {
        model: 'text-davinci-003',
        prompt,
        max_tokens: 400,
        temperature: 0.5,
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        }
    });

    const message = response.data.choices[0].text;
    return message;
}



// Função principal
async function openai() {
    const sentences = [
        {
            id: 1,
            sentence: 'HOW ABOUT MY LABOR RIGHTS? According to the International Labor Organization (ILO) [57], '
        },
        {
            id: 2,
            sentence: 'Non-Standard forms of Employment have become a contemporary feature of labor markets around the world'
        },
        {
            id: 3,
            sentence: 'In South America, 6 out of 10 young people who get a job today do so in the informal economy [51]'
        },
        {
            id: 4,
            sentence: 'This trend is not exclusive to countries in development; Petrie [58] predicts that 40% of the US labor force will be self-employed by 2020.'
        },
        {
            id: 5,
            sentence: 'These new employment types share a common feature of deviating from the standard employment relationship'
        }
    ];
    try {
        // Prompt fixo para ser usado com cada sentença
        const fixedPrompt = "Given the text below, extract the forecasts (future events) and organize them into a JSON file with date and the forecast found: ";

        // Itera sobre cada sentença
        for (const s of sentences) {
            // Constrói o prompt com a sentença atual
            const prompt = fixedPrompt + s.sentence;

            // Chama a função chatGPTRequest com a sentença atual
            const response = await chatGPTRequest(prompt);
            console.log(response);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Execute o código principal
//openai(sentences);

module.exports.openai = openai;
