function someFunction(params, callback) {
    model1.find(params, function(err, doc1) {
        callback();
    });
} 