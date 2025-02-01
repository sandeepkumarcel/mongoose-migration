function someFunction(params, callback) {
    model1.find(params, function(err, doc1) {
        if (err) return callback(err);
        if (doc1) {
            model2.find(params, function(err, doc2) {
                if (err) return callback(err);
                someOtherFunction((err, result) => {
                    if (err) return callback(err);
                    callback(null, doc1, doc2, result);
                });
            });
        } else {
            callback(null, null);
        }
    });
} 