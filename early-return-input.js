function someFunction(params, callback) {
    model1.find(params, function(err, doc1) {
        if (err) return callback(err);
        if (!doc1) return callback(null, null);
        model2.find(params, function(err, doc2) {
            callback(null, doc1, doc2);
        });
    });
} 