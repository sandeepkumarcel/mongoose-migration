function someFunction(params, callback) {
    model1.find(params, function(err, doc1) {
        const unused1 = "foo";
        model2.find(params, function(err, doc2) {
            const unused2 = "bar";
            callback(null, doc1, doc2);
        });
    });
} 