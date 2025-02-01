const mongoose = require('mongoose');
const model1 = mongoose.model('Model1');
const model2 = mongoose.model('Model2');

function someFunction(params, callback) {
    model1.find(params).then(doc1 => {
        someOtherFunction(doc1, function(err, result) {
            if (err) return callback(err);

            model2.find({ related: result }).then(doc2 => {
                return callback(null, doc1, result, doc2);
            }).catch(err => {
                return callback(err);
            });
        });
    }).catch(err => {
        return callback(err);
    });
}
