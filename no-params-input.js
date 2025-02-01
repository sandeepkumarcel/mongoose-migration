function someFunction(callback) {
    model1.find({}, function(err, doc1) {
        callback(err, doc1);
    });
} 