function someFunction(params, callback) {
    model1.find(params)
        .then(doc1 => {
            const unused1 = "foo";
            return model2.find(params);
        })
        .then(doc2 => {
            const unused2 = "bar";
            callback(null, doc1, doc2);
        })
        .catch(err => callback(err));
} 