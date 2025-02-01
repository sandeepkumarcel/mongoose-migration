const mongoose = require('mongoose');
const model1 = mongoose.model('Model1');
const model2 = mongoose.model('Model2');

function someFunction(params, callback) {
    model1.find(params).then(doc1 => {
        model2.updateOne({ _id: doc1._id }, { updated: true }).then(doc2 => {
            return callback(null, doc1, doc2);
        }).catch(err => {
            return callback(err);
        });
    }).catch(err => {
        return callback(err);
    });
}
