function someFunction(params, callback) {
    model1.find(params)
        .then(doc1 => model2.find(params))
        .then(doc2 => model3.find(params))
        .then(doc3 => callback(null, doc1, doc2, doc3))
        .catch(err => callback(err));
} 