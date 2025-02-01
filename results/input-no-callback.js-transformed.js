
const mongoose = require('mongoose');
const model = mongoose.model('Model');

function someFunction(params) {
    model.find(params); // No callback provided
}
