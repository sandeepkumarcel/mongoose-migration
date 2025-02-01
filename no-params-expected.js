function someFunction(callback) {
    model1.find({})
        .then(doc1 => callback(null, doc1))
        .catch(err => callback(err));
} 