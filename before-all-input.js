beforeAll(done => {
    const testAuditDoc = new integratorAdaptor.Audit({
      _userId: test.user._id,
      _byUserId: test.user._id,
      event: 'create',
      resourceType: 'accesstoken',
      source: 'system',
      time: new Date().getTime()
    })

    testAuditDoc.save((err, savedAudit) => {
      if (err) return done(err)
      testAuditId = savedAudit._id.toString()
      done()
    })
  })

  it('should restore a Flow and all of its descendants', done => {
    const options = {
      uri: `http://localhost:${PORT}/v1/recycleBinTTL/flows/${cascadeRestoreStandaloneFlow._id.toString()}/doCascadeRestore`,
      method: 'POST',
      auth: { bearer: test.user.jwt },
      headers: { 'content-type': 'application/json' }
    }

    request(options, (err, res, body) => {
      if (err) return done(err)
      res.statusCode.should.equal(204)
      body.should.equal('')

      findOneDocWithoutDeletedAt(Flow, cascadeRestoreStandaloneFlow._id, (err, doc) => {
        if (err) return done(err)
        should.not.exist(doc.deletedAt)

        Export.find({ _id: { $in: [cascadeRestoreStandaloneExport._id, cascadeRestoreStandaloneAsyncHelperExport._id] }, deletedAt: { $exists: false } }, { deletedAt: 1 }).lean().exec((err, docs) => {
          if (err) return done(err)
          docs.length.should.equal(2)

          findOneDocWithoutDeletedAt(Import, cascadeRestoreStandaloneImport._id, (err, doc) => {
            if (err) return done(err)
            should.not.exist(doc.deletedAt)

            Connection.find({ _id: { $in: [cascadeRestoreStandaloneConn._id, cascadeRestoreStandaloneFileDefConn._id, cascadeRestoreStandaloneAsyncHelperConn._id] }, deletedAt: { $exists: false } }, { deletedAt: 1 }).lean().exec((err, docs) => {
              if (err) return done(err)
              docs.length.should.equal(3)

              findOneDocWithoutDeletedAt(AsyncHelper, cascadeRestoreStandaloneAsyncHelper._id, (err, doc) => {
                if (err) return done(err)
                should.not.exist(doc.deletedAt)

                findOneDocWithoutDeletedAt(Script, cascadeRestoreStandaloneScript._id, (err, doc) => {
                  if (err) return done(err)
                  should.not.exist(doc.deletedAt)

                  findOneDocWithoutDeletedAt(FileDefinition, cascadeRestoreStandaloneFileDefinition._id, (err, doc) => {
                    if (err) return done(err)
                    should.not.exist(doc.deletedAt)
                    done()
                  })
                })
              })
            })
          })
        })
      })
    })
  })  