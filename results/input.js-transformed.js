const mongoose = require('mongoose');
const model1 = mongoose.model('Model1');
const model2 = mongoose.model('Model2');

function someFunction(params, callback) {
    // someFunction
    model1.find(params).then(function(doc1) {
        model2.find(params).then(function(doc2) {
            someOtherFunction((err, result) => {
                // someOtherFunction
                if (err) return callback(err);
                
                return callback(null, doc1, doc2, result);
            });
        }).catch(function(err) {
            const someUnsedVar = "abcd"
            return callback(null,someUnsedVar)
        });
    }).catch(function(err) {
        return callback(err);
    });
}

function someFunction2(params, done) {
    // someFunction
    model1.find(params).then(function(doc1) {
        model2.find(params).then(function(doc2) {
            someOtherFunction((err, result) => {
                // someOtherFunction
                if (err) return done(err);
                
                return done(null, doc1, doc2, result);
            });
        }).catch(function(err) {
            const someUnsedVar = "abcd"
            return done(null,someUnsedVar)
        });
    }).catch(function(err) {
        return done(err);
    });
}

function someFunction3(params, done) {
    // someFunction
    model1.find(params).then(function(doc1) {
        model2.find(params).then(function(doc2) {
            someOtherFunction((err, result) => {
                // someOtherFunction
                
                return done(null,doc1)
            });
        }).catch(function(err) // fix_this_manually
        {
            done(err);
        });
    }).catch(function(err) {
        return done(err);
    });
}


function someFunction4(params, done) {
    // someFunction
    model1.find(params).then(function(doc1) {
        model2.find(params).catch(() => {}).finally(function() {
            someOtherFunction(done);
        });
    }).catch(function(err) {
        return done(err);
    });
}

function someFunction5(params, done) {
    // someFunction
    model1.find(params).then(function(doc1) {
        model2.find(params).then(function(doc2) {
            someOtherFunction(()=>{
                done(doc2)
            });
        }).catch(function(err) // fix_this_manually
        {
            done(err);
        });
    }).catch(function(err) {
        return done(err);
    });
}


function someFunction6(params, done) {
    // someFunction
    model1.find(params).then(function(doc1) {
        model2.find(params).then(async function(doc2) {
            await someOtherFunction4()
            done(doc2)
        }).catch(async function(err) // fix_this_manually
        {
            done(err);
        });
    }).catch(function(err) {
        return done(err);
    });
}

function passThrough(params, done) {
    // someFunction
    model1.find(params).then(function(doc1) {
        model2.find().then(result => {
            done(result);
        }).catch(err => // fix_this_manually
        {
            done(err);
        });
    }).catch(function(err) {
        return done(err);
    });
}

function passThrough2(params, done) {
    // someFunction
    model1.find(params).then(function(doc1) {
        model2.find().then(result => {
            done(err)
        }).catch(err => // fix_this_manually
        {
            done(err);
        });
    }).catch(function(err) {
        return done(err);
    });
}

