const express = require('express')
const router = new express.Router()
const Projects = require('../models/Projects')
const DocumentSchema = require('../models/subSchemas/DocumentSchema')
const OpenAI = require('../services/openai')
//const GPT4All = require('../services/gpt4all')
const LocalAI = require('../services/localai')
const OLLAMA = require('../services/ollama')

router.get('/roadmap/document/:_id', async (req, res) => {
    const { _id } = req.params;

    const document = await DocumentSchema.findById(_id);
    if (!document) {
        return res.status(404).send({ message: 'Document not found' });
    }

    //const results = await LocalAI.roadmap(document);
    const results = await OLLAMA.roadmap(document);

    //console.log("Resultado:")
    //console.log(results);

    const project = await Projects.findOne({ 'bibliometrics.documents': document });

    console.log("Projeto" + project);
    try {
        project.roadmap.push(...results);
        await project.save();
    } catch (error) {
        throw new Error(error);
    }

    // document.roadmap = results;

    // try {
    //     await document.save();
    // } catch (error) {
    //     throw new Error(error);
    // }

    res.send(document);
});

router.get('/roadmap/refinement/project/:_id', async (req, res) => {
    const { _id } = req.params;

    const project = await Projects.findById(_id).populate('roadmap');
        if (!project) {
            return res.status(404).send({ message: 'Project not found' });
        }

    const results = await OLLAMA.refine(project);

    //console.log("Resultado:")
    //console.log(results);

    console.log("Projeto" + project);
    try {
        project.roadmap = results;
        //project.roadmap.push(...results);
        await project.save();
    } catch (error) {
        throw new Error(error);
    }

    res.send(project);
});

router.get('/old/roadmap/refinement/document/:_id', async (req, res) => {
    const { _id } = req.params;

    const document = await DocumentSchema.findById(_id);
    if (!document) {
        return res.status(404).send({ message: 'Document not found' });
    }

    const results = await LocalAI.roadmapAfterNER(document);

    console.log("Refinamento aplicado com sucesso! Resultado:")
    console.log(result);

    const project = await Projects.findOne({ 'bibliometrics.documents': document });
    console.log("Projeto" + project);
    try {
        project.roadmap.push(...resultsRoadmap);
        await project.save();
    } catch (error) {
        throw new Error(error);
    }

    res.send(document);
});


router.get('/roadmap/project:_id', async (req, res) => {
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

router.get('/roadmap', async (req, res) => {

    try {
        console.log("Estou no módulo de Roadmap")
        res.send("Página de Roadmap");
    } catch (e) {
        console.log(e)
        res.sendStatus(400)
    }
});

//chamar modulos de roadmap que estarão dentro de services

module.exports = router