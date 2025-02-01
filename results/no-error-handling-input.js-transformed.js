function someFunction(params, callback) {
    model1.find(params).then(doc1 => {
        model2.find(params).then(doc2 => {
            callback(null, doc1, doc2);
        }).catch(err => {
            callback();
        });
    }).catch(err => {
        callback();
    });
} 