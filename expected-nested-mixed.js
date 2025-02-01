const mongoose = require('mongoose');
const model1 = mongoose.model('Model1');
const model2 = mongoose.model('Model2');

function someFunction(params, callback) {
    model1.find(params)
        .then(doc1 => {
            return new Promise((resolve, reject) => {
                someOtherFunction(doc1, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            }).then(result => {
                return model2.find({ related: result })
                    .then(doc2 => callback(null, doc1, result, doc2));
            });
        })
        .catch(err => callback(err));
}
