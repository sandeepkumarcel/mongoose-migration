function someFunction(params, callback) {
    model1.find(params)
        .then(doc1 => {
            if (doc1) {
                return model2.find(params)
                    .then(doc2 => someOtherFunction())
                    .then(result => callback(null, doc1, doc2, result));
            } else {
                callback(null, null);
            }
        })
        .catch(err => callback(err));
} 