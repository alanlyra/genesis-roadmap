const mongoose = require('mongoose');
const { Schema } = mongoose;

const ScenariosSchema = new Schema({
    plausible: String,
    pessimistic: String,
    optimistic: String
});

module.exports = ScenariosSchema;