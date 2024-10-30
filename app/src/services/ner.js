const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises; // Usando promisify para transformar fs em promessa
const path = require('path');
const { spawnSync } = require('child_process');

async function ner(document) {
    const text = document.preprocessing.text;
    console.log(`Aplicando NER no documento ${document._id}`);

    // Gera um hash aleatório
    const hash = crypto.randomBytes(16).toString('hex');

    // Crie o nome do arquivo com o hash
    const fileName = `tmp_text_ner_${hash}.txt`;

    // Especifique o caminho para o arquivo
    const txtPath = path.join(__dirname, fileName);
    const taggedFile = processString(txtPath).concat("-tagged.txt")

    try {
        // Crie o arquivo temporário para o NER rodar
        await fs.writeFile(txtPath, text);

        const ner7ClassModelPath = './ner/classifiers/english.muc.7class.distsim.crf.ser.gz'; // Caminho para o modelo do Stanford NER muc.7class
        const nerOwnModelPath = './ner/classifiers/own-ner-model.ser.gz'; // Caminho para o modelo do Stanford NER próprio para termos indicativos de futuro
        const stanfordNERPath = './ner/lib/stanford-ner.jar'; // Caminho para o arquivo JAR do Stanford NER

        const cmd = `java -mx1g -cp "${stanfordNERPath}" edu.stanford.nlp.ie.NERClassifierCombiner -textFile "${txtPath}" -outputFormat inlineXML -ner.model "${ner7ClassModelPath}","${nerOwnModelPath}" > "${taggedFile}"`;

        // Executar comando sincronamente
        const { stdout, stderr } = spawnSync(cmd, { shell: true });

        console.log(`ERRO: ${stderr}`);

        // Ler o arquivo resultante
        const response = await fs.readFile(taggedFile, 'utf8');
        console.log(`NER aplicado com sucesso no documento ${document._id}`);
        console.log(`Resultado do NER: ${response}`);
        return response;
    } catch (error) {
        console.error(`Erro durante o processo NER: ${error}`);
        throw error;  // Re-lança o erro para ser tratado por quem chamar `ner`
    } finally {
        // Limpeza: remover arquivos temporários
        await fs.unlink(txtPath);
        await fs.unlink(taggedFile);
    }
}

function processString(input) {
    console.log(`Processando path REGEX: ${input}`);
    const txtPattern = /txt\\/; // Padrão para a ocorrência "txt\"
    const extensionPattern = /\.[^.]+$/; // Padrão para a extensão do arquivo
  
    // Remove a primeira ocorrência de "txt\"
    const processedString = input.replace(txtPattern, '');
  
    // Remove a primeira ocorrência de "txt/"
    //const processedString2 = removeBeforeFirstSlash(processedString)
  
    // Remove a extensão do arquivo
    const id = processedString.replace(extensionPattern, '');
  

    console.log(`REGEX processado: ${id}`);

    return id;
  }

  async function roadmapByNER(document) {
    const nerTaggedText = document.preprocessing.nerTaggedText;
    let responses = [];
    
    const paragraphs = nerTaggedText.split('\n'); // Dividir por parágrafos (assumindo que os parágrafos são separados por uma quebra de linha)
  
    paragraphs.forEach(async (paragraph) => {
        if (paragraph.includes('/DATE') &&
            (paragraph.includes('/U_TEMPPRED') ||
            paragraph.includes('/B_TEMPPRED') ||
            paragraph.includes('/M_TEMPPRED') ||
            paragraph.includes('/E_TEMPPRED'))) {
            let event = buildEventFromNER(paragraph, document);
            responses.push(event);
        } 
    });

    return responses
}

function buildEventFromNER(paragraph, document) {
    const dateRegex = /<DATE>(.*?)<\/DATE>/;
    const fitRegex = /<(U_TEMPPRED|B_TEMPPRED|M_TEMPPRED|E_TEMPPRED)>(.*?)<\/(U_TEMPPRED|B_TEMPPRED|M_TEMPPRED|E_TEMPPRED)>/g;
    const eventRegex = /<.*?>/g;
    
    const dateMatch = paragraph.match(dateRegex);
    const fitMatches = Array.from(paragraph.matchAll(fitRegex));
    
    const date = dateMatch ? dateMatch[1] : null;
    const fit = fitMatches.map(match => match[2]);
    const forecast = paragraph.replace(eventRegex, '');

    const result = {
        document: document ? document._id : null,
        sentence: paragraph ? paragraph : null,
        forecast: forecast ? forecast : null,
        forecastDate: date ? date : null,
        explicitDate: date ? date : null,
        createdDate: new Date(),
        deleted: false,
        generatedByNER: true
      };
      
      return result;
}

module.exports = {
    ner,
    roadmapByNER
  };

