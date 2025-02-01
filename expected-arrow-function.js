const mongoose = require('mongoose');
const model = mongoose.model('Model');

function someFunction(params, callback) {
    model.find(params)
        .then(doc => callback(null, doc))
        .catch(err => callback(err));
}
