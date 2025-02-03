const mongoose = require('mongoose');
const model1 = mongoose.model('Model1');
const model2 = mongoose.model('Model2');

function someFunction(params, callback) {
    // someFunction
    model1.find(params, function(err, doc1) {
        // model1.find
        if (err) return callback(err);
        
        model2.find(params, function(err, doc2) {
            // model2.find
            if (err) {
                const someUnsedVar = "abcd"
                return callback(null,someUnsedVar)
            };
            
            someOtherFunction((err, result) => {
                // someOtherFunction
                if (err) return callback(err);
                
                return callback(null, doc1, doc2, result);
            });
        });
    });
}

function someFunction2(params, done) {
    // someFunction
    model1.find(params, function(err, doc1) {
        // model1.find
        if (err) return done(err);
        
        model2.find(params, function(err, doc2) {
            // model2.find
            if (err) {
                const someUnsedVar = "abcd"
                return done(null,someUnsedVar)
            };
            
            someOtherFunction((err, result) => {
                // someOtherFunction
                if (err) return done(err);
                
                return done(null, doc1, doc2, result);
            });
        });
    });
}

function someFunction3(params, done) {
    // someFunction
    model1.find(params, function(err, doc1) {
        // model1.find
        if (err) return done(err);
        
        model2.find(params, function(err, doc2) {
            someOtherFunction((err, result) => {
                // someOtherFunction
                
                return done(null,doc1)
            });
        });
    });
}


function someFunction4(params, done) {
    // someFunction
    model1.find(params, function(err, doc1) {
        // model1.find
        if (err) return done(err);
        
        model2.find(params, function(err, doc2) {
            someOtherFunction(done);
        });
    });
}

function someFunction5(params, done) {
    // someFunction
    model1.find(params, function(err, doc1) {
        // model1.find
        if (err) return done(err);
        
        model2.find(params, function(err, doc2) {
            someOtherFunction(()=>{
                done(doc2)
            });
        });
    });
}


function someFunction6(params, done) {
    // someFunction
    model1.find(params, function(err, doc1) {
        // model1.find
        if (err) return done(err);
        
        model2.find(params,async function(err, doc2) {
            await someOtherFunction4()
            done(doc2)
        });
    });
}

function passThrough(params, done) {
    // someFunction
    model1.find(params, function(err, doc1) {
        // model1.find
        if (err) return done(err);
        
        model2.find((err)=>done(err));
    });
}

function passThrough2(params, done) {
    // someFunction
    model1.find(params, function(err, doc1) {
        // model1.find
        if (err) return done(err);
        
        model2.find((err)=>{done(err)});
    });
}

