function someFunction(params, callback) {
    model1.find(params)
        .then(doc1 => model2.find(params))
        .then(doc2 => someOtherFunction())
        .then(result => callback(null, doc1, doc2, result))
        .catch(err => callback(err));
} 