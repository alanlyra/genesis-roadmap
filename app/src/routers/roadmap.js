const express = require('express')
const router = new express.Router()
const Projects = require('../models/Projects')

router.get('/roadmap', async (req, res) => {

    try {
        res.send("Página de Roadmap");
    } catch (e) {
        console.log(e)
        res.sendStatus(400)
    }
});

//chamar modulos de roadmap que estarão dentro de services

module.exports = router