beforeAll(done => {
  const testAuditDoc = new integratorAdaptor.Audit({
    _userId: test.user._id,
    _byUserId: test.user._id,
    event: 'create',
    resourceType: 'accesstoken',
    source: 'system',
    time: new Date().getTime()
  })

  testAuditDoc.save().then(savedAudit => {
    testAuditId = savedAudit._id.toString()
    done()
  }).catch(err => {
    return done(err);
  })
})