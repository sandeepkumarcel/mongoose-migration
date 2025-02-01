function someFunction(callback) {
    model1.find({}).then(doc1 => {
        callback(err, doc1);
    }).catch(err => {
        callback();
    });
} 