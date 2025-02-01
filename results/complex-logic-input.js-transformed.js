function someFunction(params, callback) {
    model1.find(params).then(doc1 => {
        if (doc1) {
            model2.find(params).then(doc2 => {
                someOtherFunction((err, result) => {
                    if (err) return callback(err);
                    callback(null, doc1, doc2, result);
                });
            }).catch(err => {
                return callback(err);
            });
        } else {
            callback(null, null);
        }
    }).catch(err => {
        return callback(err);
    });
} 