const express = require('express')
const router = new express.Router()
const Projects = require('../models/Projects')
const DocumentSchema = require('../models/subSchemas/DocumentSchema')
const NER = require('../services/ner')

router.get('/ner/document/:_id', async (req, res) => {
    const { _id } = req.params;

    const document = await DocumentSchema.findById(_id);
    if (!document) {
        return res.status(404).send({ message: 'Document not found' });
    }

    const result = await NER.ner(document);

    console.log("NER aplicado! Resultado:")
    console.log(result);

    try {
        document.preprocessing.nerTaggedText = result;
        await document.save();
    } catch (error) {
        throw new Error(error);
    }

    const resultsRoadmap = await NER.roadmapByNER(document);

    const project = await Projects.findOne({ 'bibliometrics.documents': document });
    console.log("Bla bla bla Projeto" + project);
    console.log("Bla bla bla Resultado NER: " + resultsRoadmap);
    try {
        project.roadmap.push(...resultsRoadmap);
        await project.save();
    } catch (error) {
        throw new Error(error);
    }

    res.send(document);
});


router.get('/ner/project:_id', async (req, res) => {
    const { _id } = req.params;

    const project = await Projects.findById(_id).populate('bibliometrics.documents');
    if (!project) {
        return res.status(404).send({ message: 'Project not found' });
    }

    const responses = [];

    console.log(project.bibliometrics.documents.length)
    project.bibliometrics.documents.forEach(document => {
        // responses.push(LocalAI.roadmap(document.preprocessing.sentences));
    });

    //console.log(responses[0].completions);
    res.send(project.bibliometrics.documents[1]);
});

router.get('/ner', async (req, res) => {

    try {
        console.log("Estou no módulo de Roadmap aplicando NER")
        res.send("Página de Roadmap aplicando NER");
    } catch (e) {
        console.log(e)
        res.sendStatus(400)
    }
});

//chamar modulos de ner que estarão dentro de services

module.exports = router