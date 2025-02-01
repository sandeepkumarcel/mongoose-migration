const mongoose = require('mongoose');
const model1 = mongoose.model('Model1');
const model2 = mongoose.model('Model2');

function someFunction(params, callback) {
    model1.find(params).then(doc1 => {
        if (err) return callback(err);

        model2.updateOne({ _id: doc1._id }, { updated: true }).then(doc2 => {
            if (err) return callback(err);
            return callback(null, doc1, doc2);
        }).catch(err => {
            callback(err);
        });
    }).catch(err => {
        callback(err);
    });
}
