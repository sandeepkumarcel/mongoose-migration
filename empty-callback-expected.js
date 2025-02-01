function someFunction(params, callback) {
    model1.find(params)
        .then(doc1 => {
            callback();
        })
        .catch(err => {callback()});
} 