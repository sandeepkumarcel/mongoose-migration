const mongoose = require('mongoose');
const model1 = mongoose.model('Model1');
const model2 = mongoose.model('Model2');

function someFunction(params, callback) {
    model1.find(params, function(err, doc1) {
        if (err) return callback(err);

        someOtherFunction(doc1, function(err, result) {
            if (err) return callback(err);

            model2.find({ related: result }, function(err, doc2) {
                if (err) return callback(err);
                return callback(null, doc1, result, doc2);
            });
        });
    });
}
