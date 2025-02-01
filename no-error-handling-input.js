function someFunction(params, callback) {
    model1.find(params, function(err, doc1) {
        model2.find(params, function(err, doc2) {
            callback(null, doc1, doc2);
        });
    });
} 