const mongoose = require('mongoose');
const model1 = mongoose.model('Model1');
const model2 = mongoose.model('Model2');

function someFunction(params, callback) {
    model1.find(params, function(err, doc1) {
        if (err) return callback(err);
        
        model2.updateOne({ _id: doc1._id }, { updated: true }, function(err, doc2) {
            if (err) return callback(err);
            return callback(null, doc1, doc2);
        });
    });
}
