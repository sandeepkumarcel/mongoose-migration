const mongoose = require('mongoose');
const model = mongoose.model('Model');

function someFunction(params, callback) {
    model.find(params, (err, doc) => {
        if (err) return callback(err);
        return callback(null, doc);
    });
}
