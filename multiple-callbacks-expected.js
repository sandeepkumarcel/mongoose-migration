function someFunction(params, callback1, callback2) {
    model1.find(params)
        .then(doc1 => {
            callback1(null, doc1);
            return model2.find(params);
        })
        .then(doc2 => callback2(null, doc2))
        .catch(err => {
            callback1(err);
            callback2(err);
        });
} 