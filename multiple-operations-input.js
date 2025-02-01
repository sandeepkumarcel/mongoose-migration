function someFunction(params, callback) {
    model1.find(params, function(err, doc1) {
        if (err) return callback(err);
        model2.find(params, function(err, doc2) {
            if (err) return callback(err);
            model3.find(params, function(err, doc3) {
                if (err) return callback(err);
                callback(null, doc1, doc2, doc3);
            });
        });
    });
} 