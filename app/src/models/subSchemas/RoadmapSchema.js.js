const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoadmapSchema = new Schema({
    document: Number,
    sentence: Number,
    forecast: String,
    forecastDate: String,
    explicitDate: String
});

module.exports = RoadmapSchema;