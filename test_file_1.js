test('should not allow to set _stackId on the wrapper for a stack that is shared, accepted but disabled', function(done) {
    new Stack({
      _userId: test.user._id,
      name: 'my-stack-eh-conn-stack',
      type: 'server',
      server: {
        hostURI: 'http://localhost',
        systemToken: 'abc'
      }
    }).save(function (err, st) {
      expect(err).toBeFalsy()

      new SShare(
        { _userId: test.user._id
        , _sharedWithUserId: test.user2._id
        , _stackId: st._id
        , accepted: true
        , disabled: true
        }
      ).save(function(err, doc) {
        expect(err).toBeFalsy()

        new Connection(
          { _userId: test.user2._id
          , type: 'wrapper'
          , wrapper: { pingFunction: 'abc', _stackId: st._id }
          }
        ).save(function (err, savedexp) {
          expect(err).toBeTruthy()
          // logger.info(err)

          let expected = {
            'wrapper._stackId':
            { message: '{"code":"invalid_ref","message":"Only a stack owned by the user or a stack shared with the user can be used.","path":"wrapper._stackId"}'
            , name: 'ValidatorError'
            , path: 'wrapper._stackId'
            , kind: 'user defined'
            , value: undefined
            }
          }

          expect(err.errors['wrapper._stackId'].name).toBe(expected['wrapper._stackId'].name)
          expect(err.errors['wrapper._stackId'].path).toBe(expected['wrapper._stackId'].path)
          expect(err.errors['wrapper._stackId'].kind).toBe(expected['wrapper._stackId'].kind)
          expect(err.errors['wrapper._stackId'].properties.message).toBe(expected['wrapper._stackId'].message)

          done()
        })
      })
    })
  })