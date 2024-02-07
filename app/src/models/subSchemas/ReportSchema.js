const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReportSchema = new Schema({
    text: String
});

module.exports = ReportSchema;