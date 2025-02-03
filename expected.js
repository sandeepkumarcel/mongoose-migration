const mongoose = require('mongoose');
const model1 = mongoose.model('Model1');
const model2 = mongoose.model('Model2');

function someFunction(params, callback) {
    // someFunction
    model1.find(params).then(doc1 => {
        model2.find(params).then(doc2 => {
            someOtherFunction((err, result) => {
                // someOtherFunction
                if (err) return callback(err);
                
                return callback(null, doc1, doc2, result);
            });
        }).catch(err => {
            const someUnsedVar = "abcd"
            return callback(null,someUnsedVar)
        });
    }).catch(err => {
        return callback(err);
    });
}

function someFunction2(params, done) {
    // someFunction
    model1.find(params).then(doc1 => {
        model2.find(params).then(doc2 => {
            someOtherFunction((err, result) => {
                // someOtherFunction
                if (err) return done(err);
                
                return done(null, doc1, doc2, result);
            });
        }).catch(err => {
            const someUnsedVar = "abcd"
            return done(null,someUnsedVar)
        });
    }).catch(err => {
        return done(err);
    });
}

function someFunction3(params, done) {
    // someFunction
    model1.find(params).then(doc1 => {
        model2.find(params).finally(() => {
            someOtherFunction((err, result) => {
                // someOtherFunction
                
                return done(null,doc1)
            });
        });
    }).catch(err => {
        return done(err);
    });
}


function someFunction4(params, done) {
    // someFunction
    model1.find(params).then(doc1 => {
        model2.find(params).finally(() => {
            someOtherFunction(done);
        });
    }).catch(err => {
        return done(err);
    });
}

function someFunction5(params, done) {
    // someFunction
    model1.find(params).then(doc1 => {
        model2.find(params).finally(() => {
            someOtherFunction(()=>{
                done(doc2)
            });
        });
    }).catch(err => {
        return done(err);
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



