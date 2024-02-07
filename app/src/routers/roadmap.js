const express = require('express')
const router = new express.Router()
const Projects = require('../models/Projects')

router.get('/roadmap/:_id', async (req, res) => {
    const { _id } = req.params;

    const project = await Projects.findById(_id).populate('bibliometrics.documents');
    if (!project) {
        return res.status(404).send({ message: 'Project not found' });
    }

    project.bibliometrics.documents.forEach(document => {
        console.log(document);
      });

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