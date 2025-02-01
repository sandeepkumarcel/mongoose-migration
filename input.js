const mongoose = require('mongoose');
const model1 = mongoose.model('Model1');
const model2 = mongoose.model('Model2');

function someFunction(params, callback) {
    // someFunction
    model1.find(params, function(err, doc1) {
        // model1.find
        if (err) return callback(err);
        
        model2.find(params, function(err, doc2) {
            // model2.find
            if (err) {
                const someUnsedVar = "abcd"
                return callback(null,someUnsedVar)
            };
            
            someOtherFunction((err, result) => {
                // someOtherFunction
                if (err) return callback(err);
                
                return callback(null, doc1, doc2, result);
            });
        });
    });
}
