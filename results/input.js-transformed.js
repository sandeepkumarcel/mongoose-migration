const mongoose = require('mongoose');
const model1 = mongoose.model('Model1');
const model2 = mongoose.model('Model2');

function someFunction(params, callback) {
    // someFunction
    model1.find(params).then(doc1 => {
        model2.find(params).then(doc2 => {
            someOtherFunction((err, result) => {
                // someOtherFunction
                if (err) return callback(err);
                
                return callback(null, doc1, doc2, result);
            });
        }).catch(err => {
            const someUnsedVar = "abcd"
            return callback(null,someUnsedVar)
        });
    }).catch(err => {
        return callback(err);
    });
}
