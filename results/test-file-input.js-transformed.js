'use strict'

const nconf = require('nconf')
const should = require('should')
const request = require('request')
const { promisify } = require('util')
const requestPromise = promisify(request)
const async = require('async')
const assert = require('assert')
const co = require('co')
const jsonwebtoken = require('jsonwebtoken')
const modelUtil = require('../../../src/util/apiModelUtil.js')
const nsUtil = require('../../../src/routes/netsuite/netsuitUtil.js')
const testUtil = require('../../util/index.js')
const commonUtil = require('../../util/commonUtil.js')
const dbUtil1 = require('../template/util.js')
const integratorAdaptor = require('integrator-adaptor')
const { reject } = require('lodash')
const adaptorModelUtil = integratorAdaptor.modelUtil
const AsyncHelper = integratorAdaptor.AsyncHelper
const Connection = integratorAdaptor.Connection
const Export = integratorAdaptor.Export
const Import = integratorAdaptor.Import
const Flow = integratorAdaptor.Flow
const Stack = integratorAdaptor.Stack
const Integration = integratorAdaptor.Integration
const FileDefinition = integratorAdaptor.FileDefinition
const EDIProfile = integratorAdaptor.EDIProfile
const Script = integratorAdaptor.Script
const ImportFactory = integratorAdaptor.ImportFactory
const ExportFactory = integratorAdaptor.ExportFactory
const scriptUtil = integratorAdaptor.scriptUtil
const S3Util = integratorAdaptor.s3Util
const Agent = integratorAdaptor.Agent
const errorSource = testUtil.errorSource
const dbUtil = testUtil.dbUtil
const EventReport = integratorAdaptor.EventReport
const Connector = integratorAdaptor.Connector
const License = integratorAdaptor.License
const User = integratorAdaptor.User
const OneTimeToken = integratorAdaptor.OneTimeToken
const Sync = integratorAdaptor.Sync
const Dataset = integratorAdaptor.Dataset
const IClient = integratorAdaptor.IClient
const Notification = integratorAdaptor.Notification
const Tag = integratorAdaptor.Tag
const Job = integratorAdaptor.Job
const AShare = integratorAdaptor.AShare
const ObjectID = require('mongodb').ObjectId


const DELETED_AT_DATE = new Date()
const SCRIPT_CODE = 'function main(a, b) {return a + b}'
const SCRIPTS_S3U = new S3Util(nconf.get('JAVASCRIPT_S3_BUCKET'))
const RECYCLED_SCRIPTS_S3U = new S3Util(nconf.get('JAVASCRIPT_S3_REYCLEBIN_BUCKET'))
const userDbUtil = require('../../util/dbUtil.js')


const getRecycleBinSchemaFromModelPlural = require('../../../src/routes/recycleBinTTL/recycleBinTTLUtil.js').getRecycleBinSchemaFromModelPlural
let PORT

function findOneDocWithoutDeletedAt (model, _id, callback) {
  const query = { _id }
  adaptorModelUtil.skipDeletedAtPluginForRecycleBin(query, model.modelName.toLowerCase())
  model.findOne(query, '_id deletedAt').lean().exec(callback)
}

describe('Recycle Bin TTL', () => {
  let redisClient

  beforeAll((done) => {
    PORT = nconf.get('PORT')
    redisClient = dbUtil.getRedisClient()
    done()
  })

  describe('with invalid inputs should', () => {
    describe('return 403', () => {
      describe('for an invalid model plural', () => {
        // changed test cases from agents to audit because we are using supporting agents to recycleBin.
        let testAuditId

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

        it('for GET/', done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/audits`,
            method: 'GET',
            auth: { bearer: test.user.jwt },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(403)
              should.exist(body)
              const errorsObj = JSON.parse(body)
              errorsObj.should.deepEqual({ errors: [$E.get('ROUTES_RECYCLEBIN_OPS_UNSUPPORTED')] })
              done()
            } catch (er) {
              done(er)
            }
          })
        })

        it('for GET/:id', done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/audits/${testAuditId}`,
            method: 'GET',
            auth: { bearer: test.user.jwt },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(403)
              should.exist(body)
              const errorsObj = JSON.parse(body)
              errorsObj.should.deepEqual({ errors: [$E.get('ROUTES_RECYCLEBIN_OPS_UNSUPPORTED')] })
              done()
            } catch (e) {
              done(e)
            }
          })
        })

        it('for POST/:id', done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/audits/${testAuditId}`,
            method: 'POST',
            auth: { bearer: test.user.jwt },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(403)
              should.exist(body)
              const errorsObj = JSON.parse(body)
              errorsObj.should.deepEqual({ errors: [$E.get('ROUTES_RECYCLEBIN_OPS_UNSUPPORTED')] })
              done()
            } catch (e) {
              done(e)
            }
          })
        })

        it('for DELETE/:id', done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/audits/${testAuditId}`,
            method: 'DELETE',
            auth: { bearer: test.user.jwt },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(403)
              should.exist(body)
              const errorsObj = JSON.parse(body)
              errorsObj.should.deepEqual({ errors: [$E.get('ROUTES_RECYCLEBIN_OPS_UNSUPPORTED')] })
              done()
            } catch (e) {
              done(e)
            }
          })
        })
      })

      describe('for deleting/restoring connector components', () => {
        const Connector = integratorAdaptor.Connector
        const User = integratorAdaptor.User
        const AdaptorTestDBUtil = integratorAdaptor.testUtil.dbUtil

        let testConnectorUser1Token
        let testConnectorUser2Token
        let testConnectorUser1TokenJWT
        let testConnectorUser2TokenJWT
        let connectionToDelete
        let connectionToRestore

        beforeAll(done => {
          let userDoc1
          let userDoc2
          let testConnectorUser = new User({
            email: 'recyclebin_connector_user1@a.com',
            name: 'recycle bin connector user 1',
            developer: true,
            verified: true
          })

          AdaptorTestDBUtil.registerAndGenerateAccessToken(testConnectorUser, commonUtil.generatePassword(), true, async (err, userDoc, token) => {
            if (err) return done(err)
            if (!token || !token.token) return done(new Error('!token || !token.token'))
            testConnectorUser1Token = token.token
            userDoc1 = userDoc
            testConnectorUser = new User({
              email: 'recyclebin_connector_user2@b.com',
              name: 'recycle bin connector user 2',
              developer: true,
              verified: true
            })
            testConnectorUser1TokenJWT = jsonwebtoken.sign({
              iss: 'authentication.celigo.io',
              user: {
                _id: userDoc1._id,
                email: userDoc1.email,
                createdAt: userDoc1.createdAt
              },
              _accessTokenId: token._id,
              _tokenType: 'bearer',
              iat: Date.now()
            }, nconf.get('PRIVATE_KEY'), { algorithm: 'RS256', expiresIn: '1h' })

            const key = token._id.toString()
            await redisClient.set(key, JSON.stringify(token), { EX: 3600 })

            AdaptorTestDBUtil.registerAndGenerateAccessToken(testConnectorUser, commonUtil.generatePassword(), true, async (err, userDoc, token) => {
              if (err) return done(err)
              if (!token || !token.token) return done(new Error('!token || !token.token'))
              testConnectorUser2Token = token.token
              userDoc2 = userDoc

              testConnectorUser2TokenJWT = jsonwebtoken.sign({
                iss: 'authentication.celigo.io',
                user: {
                  _id: userDoc2._id,
                  email: userDoc2.email,
                  createdAt: userDoc2.createdAt
                },
                _accessTokenId: token._id,
                _tokenType: 'bearer',
                iat: Date.now()
              }, nconf.get('PRIVATE_KEY'), { algorithm: 'RS256', expiresIn: '1h' })

              const key = token._id.toString()
              await redisClient.set(key, JSON.stringify(token), { EX: 3600 })

              const connectionDocCore = {
                type: 'rest',
                rest: {
                  mediaType: 'json',
                  authType: 'custom',
                  baseURI: 'http://localhost'
                },
                name: 'Connector Member Connections'
              }

              co(function * () {
                let promises = []
                const testConnector1 = new Connector({
                  _userId: test.user2._id,
                  name: `testRecycleBinConnector1_${Date.now()}`
                })
                promises.push(testConnector1.save())

                const testConnector2 = new Connector({
                  _userId: test.user2._id,
                  name: `testRecycleBinConnector2_${Date.now()}`
                })
                promises.push(testConnector2.save())

                yield promises
                promises = []
                userDoc1.isConnectorUser = true
                userDoc2._oneTimeToken = {
                  _userId: test.user2._id,
                  _connectorId: testConnector2._id
                }

                connectionToDelete = new Connection(Connection.generateDoc(userDoc1, JSON.parse(JSON.stringify(connectionDocCore))))
                connectionToDelete._userId = userDoc1._id
                connectionToDelete.externalId = 'test_external_id'
                connectionToDelete._connectorId = testConnector1._id
                promises.push(connectionToDelete.save())

                connectionToRestore = new Connection(Connection.generateDoc(userDoc2, JSON.parse(JSON.stringify(connectionDocCore))))
                connectionToRestore._userId = userDoc2._id
                connectionToRestore.externalId = 'test_external_id'
                connectionToRestore._connectorId = testConnector2._id
                connectionToRestore.deletedAt = DELETED_AT_DATE
                promises.push(connectionToRestore.save())
                yield promises
              }).then(done).catch(done)
            })
          })
        })

        it('for DELETE/:id', done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/connections/${connectionToDelete._id.toString()}`,
            method: 'DELETE',
            auth: { bearer: testConnectorUser1TokenJWT },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(403)
              should.exist(body)
              const errorsObj = JSON.parse(body)
              errorsObj.should.deepEqual({ errors: [$E.get('MODELS_DELETE_CONNECTOR')] })
              done()
            } catch (e) {
              done(e)
            }
          })
        })

        it('for POST/:id', done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/connections/${connectionToRestore._id.toString()}`,
            method: 'POST',
            auth: { bearer: testConnectorUser2TokenJWT },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(403)
              should.exist(body)
              const errorsObj = JSON.parse(body)
              errorsObj.should.deepEqual({ errors: [$E.get('MODELS_RESTORE_CONNECTOR')] })
              done()
            } catch (e) {
              done(e)
            }
          })
        })
      })
    })

    describe('return 404 when a document cannot be found', () => {
      let restoredConnectionId
      let deletedConnectionId

      beforeAll(done => {
        const CONNECTION_OBJ = {
          _userId: test.user._id,
          type: 'http',
          http: {
            mediaType: 'xml',
            auth: { type: 'custom' },
            baseURI: 'http://localhost',
            headers: [
              { name: 'content-type', value: 'application/xml' },
              { name: 'Authorization', value: 'hello dolly' }
            ]
          },
          name: 'dummy test connection 0'
        }
        let testConnection = new Connection(CONNECTION_OBJ)

        testConnection.save().then(doc => {
          restoredConnectionId = doc._id.toString()
          testConnection = new Connection(CONNECTION_OBJ)
          testConnection.deletedAt = DELETED_AT_DATE

          testConnection.save().then(doc => {
            deletedConnectionId = doc._id.toString()
            done()
          }).catch(err => {
            return done(err);
          })
        }).catch(err => {
          return done(err);
        })
      })

      it('for GET/:id', done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/recycleBinTTL/exports/${restoredConnectionId}`,
          method: 'GET',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          try {
            res.statusCode.should.equal(404)
            should.exist(body)
            const errorsObj = JSON.parse(body)
            errorsObj.should.deepEqual({ errors: [$E.get('ROUTES_SHARED_MODEL_NOT_FOUND', { modelName: Export.modelName })] })
            done()
          } catch (e) {
            done(e)
          }
        })
      })

      it('for POST/:id', done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/recycleBinTTL/imports/${restoredConnectionId}`,
          method: 'POST',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          try {
            res.statusCode.should.equal(404)
            should.exist(body)
            const errorsObj = JSON.parse(body)
            errorsObj.should.deepEqual({ errors: [$E.get('ROUTES_RECYCLEBIN_DOC_NOT_FOUND', { modelName: Import.modelName })] })
            done()
          } catch (e) {
            done(e)
          }
        })
      })

      it('for DELETE/:id (purge)', done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/recycleBinTTL/flows/${restoredConnectionId}`,
          method: 'DELETE',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          try {
            res.statusCode.should.equal(404)
            const errorsObj = JSON.parse(body)
            errorsObj.should.deepEqual({ errors: [$E.get('ROUTES_RECYCLEBIN_DOC_NOT_FOUND', { modelName: Flow.modelName })] })
            done()
          } catch (e) {
            done(e)
          }
        })
      })

      it('for DELETE/:id (recycle)', done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/flows/${restoredConnectionId}`,
          method: 'DELETE',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          try {
            res.statusCode.should.equal(404)
            const errorsObj = JSON.parse(body)
            errorsObj.should.deepEqual({ errors: [$E.get('ROUTES_RECYCLEBIN_ALREADY_REMOVED', { modelName: Flow.modelName })] })
            done()
          } catch (e) {
            done(e)
          }
        })
      })

      it('for POST/:id (already restored)', done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/recycleBinTTL/connections/${restoredConnectionId}`,
          method: 'POST',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          try {
            res.statusCode.should.equal(404)
            should.exist(body)
            const errorsObj = JSON.parse(body)
            errorsObj.should.deepEqual({ errors: [$E.get('ROUTES_RECYCLEBIN_DOC_NOT_FOUND', { modelName: Connection.modelName })] })
            done()
          } catch (e) {
            done(e)
          }
        })
      })

      it('for DELETE/:id (already removed)', done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/connections/${deletedConnectionId}`,
          method: 'DELETE',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          try {
            res.statusCode.should.equal(404)
            const errorsObj = JSON.parse(body)
            errorsObj.should.deepEqual({ errors: [$E.get('ROUTES_RECYCLEBIN_ALREADY_REMOVED', { modelName: Connection.modelName })] })
            done()
          } catch (e) {
            done(e)
          }
        })
      })
    })

    describe('return 422', () => {
      let connectionToDelete
      let connectionToRestore
      let exportToDelete
      let exportToRestore
      let asyncHelperToDelete
      let asyncHelperToRestore

      beforeAll(done => {
        co(function * () {
          const connectionDocCore = {
            _userId: test.user._id,
            type: 'http',
            http: {
              mediaType: 'xml',
              auth: { type: 'custom' },
              baseURI: 'http://localhost',
              headers: [
                { name: 'content-type', value: 'application/xml' },
                { name: 'Authorization', value: 'hello world' }
              ]
            },
            name: 'dummy test connection 1'
          }
          const exportDocCore = {
            _userId: test.user._id,
            // _connectionId will be plugged in here
            asynchronous: true,
            name: 'async-helper-standalone-exp',
            transform: {
              version: '1',
              rules: [[{ extract: '/@id', generate: 'ItemId' }]]
            },
            http: {
              relativeURI: 'products/async/status/{{data.myId}}',
              method: 'POST',
              response: {
                resourcePath: '/createResponse/submission'
              }
            }
          }
          const asyncHelperDocCore = {
            _userId: test.user._id,
            name: 'integration 1 helper',
            http: {
              submit: {
                sameAsStatus: false,
                resourcePath: '/createResponse/submission',
                transform: {
                  version: '1',
                  rules: [[{ extract: '/@id', generate: 'ItemId' }]]
                }
              },
              status: {
                // _exportId will be plugged in here
                statusPath: '/path/to/status'
              }
            }
          }
          let promises = []
          connectionToDelete = new Connection(connectionDocCore)
          promises.push(connectionToDelete.save())
          connectionToRestore = new Connection(connectionDocCore)
          promises.push(connectionToRestore.save())

          yield promises
          promises = []

          exportToDelete = ExportFactory.createExport(exportDocCore)
          exportToDelete._connectionId = connectionToDelete._id
          promises.push(exportToDelete.save())
          exportToRestore = ExportFactory.createExport(exportDocCore)
          exportToRestore._connectionId = connectionToRestore._id
          promises.push(exportToRestore.save())

          yield promises
          promises = []

          asyncHelperToDelete = new AsyncHelper(asyncHelperDocCore)
          asyncHelperToDelete.http.status._exportId = exportToDelete._id
          promises.push(asyncHelperToDelete.save())
          asyncHelperToRestore = new AsyncHelper(asyncHelperDocCore)
          asyncHelperToRestore.http.status._exportId = exportToRestore._id
          promises.push(asyncHelperToRestore.save())

          yield promises
        }).then(() => {
          asyncHelperToRestore.deletedAt = DELETED_AT_DATE

          asyncHelperToRestore.save().then(savedAH => {
            exportToRestore.deletedAt = DELETED_AT_DATE

            exportToRestore.save().then(savedExp => {
              connectionToRestore.deletedAt = DELETED_AT_DATE

              connectionToRestore.save().then(savedC => {
                done(err)
              }).catch(err => {
                callback();
              })
            }).catch(err => {
              return done(err);
            })
          }).catch(err => {
            return done(err);
          })
        }).catch(done)
      })

      it('when deleting a document that has undeleted dependencies', done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/connections/${connectionToDelete._id.toString()}`,
          method: 'DELETE',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          try {
            res.statusCode.should.equal(422)
            should.exist(body)
            const errorsObj = JSON.parse(body)
            errorsObj.should.deepEqual({
              errors: [
                $E.get('ROUTES_RECYCLEBIN_DEPENDENCIES_NOT_DELETED', {
                  dependencyModelName: 'asynchelper',
                  dependencyDocId: asyncHelperToDelete._id.toString(),
                  toDeleteModelName: 'connection',
                  toDeleteDocId: connectionToDelete._id.toString()
                }),
                $E.get('ROUTES_RECYCLEBIN_DEPENDENCIES_NOT_DELETED', {
                  dependencyModelName: 'export',
                  dependencyDocId: exportToDelete._id.toString(),
                  toDeleteModelName: 'connection',
                  toDeleteDocId: connectionToDelete._id.toString()
                })
              ]
            })
            done()
          } catch (e) {
            done(e)
          }
        })
      })

      it('when restoring a document that has unrestored descendants', done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/recycleBinTTL/asynchelpers/${asyncHelperToRestore._id.toString()}`,
          method: 'POST',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          try {
            res.statusCode.should.equal(422)
            should.exist(body)
            const errorsObj = JSON.parse(body)
            errorsObj.should.deepEqual({
              errors: [
                $E.get('ROUTES_RECYCLEBIN_DESCENDANTS_NOT_RESTORED', {
                  descendantModelName: 'export',
                  descendantDocId: exportToRestore._id.toString(),
                  toRestoreModelName: 'asynchelper',
                  toRestoreDocId: asyncHelperToRestore._id.toString()
                }),
                $E.get('ROUTES_RECYCLEBIN_DESCENDANTS_NOT_RESTORED', {
                  descendantModelName: 'connection',
                  descendantDocId: connectionToRestore._id.toString(),
                  toRestoreModelName: 'asynchelper',
                  toRestoreDocId: asyncHelperToRestore._id.toString()
                })
              ]
            })
            done()
          } catch (e) {
            done(e)
          }
        })
      })
    })
  })

  describe('route tests', () => {
    let connectionToDelete
    let connectionToRestore
    let connectionToGet
    let connectionToPurge
    let deletedIntegration1
    let deletedIntegration2
    let deletedIntegration3

    beforeAll(done => {
      co(function * () {
        let promises = []

        connectionToDelete = new Connection(Connection.generateDoc(test.user, {
          _userId: test.user._id,
          type: 'rest',
          rest: {
            mediaType: 'json',
            authType: 'custom',
            baseURI: 'http://localhost'
          },
          name: 'Connection to Delete 1'
        }))
        promises.push(connectionToDelete.save())

        connectionToRestore = new Connection(Connection.generateDoc(test.user, {
          _userId: test.user._id,
          type: 'rest',
          rest: {
            mediaType: 'json',
            authType: 'custom',
            baseURI: 'http://localhost'
          },
          name: 'Connection to Restore 2'
        }))
        promises.push(connectionToRestore.save())

        connectionToGet = new Connection(Connection.generateDoc(test.user, {
          _userId: test.user._id,
          type: 'rest',
          rest: {
            mediaType: 'json',
            authType: 'custom',
            baseURI: 'http://localhost'
          },
          name: 'Connection to Get 3'
        }))
        promises.push(connectionToGet.save())

        connectionToPurge = new Connection(Connection.generateDoc(test.user, {
          _userId: test.user._id,
          type: 'rest',
          rest: {
            mediaType: 'json',
            authType: 'custom',
            baseURI: 'http://localhost'
          },
          name: 'Connection to Purge 4'
        }))
        promises.push(connectionToPurge.save())

        deletedIntegration1 = new Integration({
          _userId: test.user._id,
          name: 'Integration1 to Get 1'
        })
        promises.push(deletedIntegration1.save())

        deletedIntegration2 = new Integration({
          _userId: test.user._id,
          name: 'Integration2 to Get 2'
        })
        promises.push(deletedIntegration2.save())

        deletedIntegration3 = new Integration({
          _userId: test.user._id,
          name: 'Integration3 to Get 3'
        })
        promises.push(deletedIntegration3.save())

        yield promises
        promises = []

        const docsToUpdate = [
          connectionToRestore,
          connectionToGet,
          connectionToPurge,
          deletedIntegration1,
          deletedIntegration2,
          deletedIntegration3
        ]
        for (const updateDoc of docsToUpdate) {
          updateDoc.deletedAt = DELETED_AT_DATE
          promises.push(updateDoc.save())
        }
        yield promises
      }).then(done).catch(done)
    })

    it('should get a document', done => {
      const options = {
        uri: `http://localhost:${PORT}/v1/recycleBinTTL/connections/${connectionToGet._id.toString()}`,
        method: 'GET',
        auth: { bearer: test.user.jwt },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        res.statusCode.should.equal(200)
        should.exist(body)
        const responseDoc = JSON.parse(body)
        responseDoc._id.should.equal(connectionToGet._id.toString())
        done()
      })
    })

    it('should get an array of documents', done => {
      const options = {
        uri: `http://localhost:${PORT}/v1/recycleBinTTL/integrations`,
        method: 'GET',
        auth: { bearer: test.user.jwt },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        res.statusCode.should.equal(200)
        should.exist(body)
        const deletedIntegrations = JSON.parse(body)
        deletedIntegrations.length.should.equal(3)
        let integrationsChecked = 0
        for (const integration of deletedIntegrations) {
          if (integration._id === deletedIntegration1._id.toString()) integrationsChecked += 1
          if (integration._id === deletedIntegration2._id.toString()) integrationsChecked += 2
          if (integration._id === deletedIntegration3._id.toString()) integrationsChecked += 4
        }
        integrationsChecked.should.equal(7)
        done()
      })
    })

    it('should get an array of documents for all existing models', done => {
      const resultOfIndividualQuery = {}
      const modelCollection = ['integrations', 'flows', 'connections', 'exports', 'imports', 'stacks', 'asynchelpers', 'filedefinitions', 'scripts', 'agents']
      async.each(modelCollection, function (modelPlural, cb) {
        const options = {
          uri: `http://localhost:${PORT}/v1/recycleBinTTL/${modelPlural}`,
          method: 'GET',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }
        request(options, (err, res, body) => {
          if (err) return cb(err)

          if (res.statusCode === 200) {
            should.exist(body)
            resultOfIndividualQuery[getRecycleBinSchemaFromModelPlural(modelPlural).modelName] = JSON.parse(body).length
          }
          return cb()
        })
      }, function (err) {
        if (err) return done(err)

        const options = {
          uri: `http://localhost:${PORT}/v1/recycleBinTTL`,
          method: 'GET',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }
        request(options, (err, res, body) => {
          if (err) return done(err)

          res.statusCode.should.equal(200)
          should.exist(body)
          const deletedModels = JSON.parse(body)
          const isSorted = deletedModels.slice(1).every((item, i) => deletedModels[i].doc.lastModified >= item.doc.lastModified)
          isSorted.should.equal(true)

          const resultOfAll = deletedModels.reduce(function (allDeletedModels, deletedModel) {
            if (deletedModel.model in allDeletedModels) {
              allDeletedModels[deletedModel.model]++
            } else {
              allDeletedModels[deletedModel.model] = 1
            }
            return allDeletedModels
          }, {})
          const resultOfIndividualQuerySorted = []
          for (const e in resultOfIndividualQuery) {
            resultOfIndividualQuerySorted.push([e, resultOfIndividualQuery[e]])
          }
          resultOfIndividualQuerySorted.sort(function (a, b) {
            return a[0].localeCompare(b[0])
          })

          const resultOfAllSorted = []
          for (const e in resultOfAll) {
            resultOfAllSorted.push([e, resultOfAll[e]])
          }
          resultOfAllSorted.sort(function (a, b) {
            return a[0].localeCompare(b[0])
          })

          resultOfAllSorted.should.deepEqual(resultOfIndividualQuerySorted)
          done()
        })
      })
    })

    it('should delete a document', done => {
      const options = {
        uri: `http://localhost:${PORT}/v1/connections/${connectionToDelete._id.toString()}`,
        method: 'DELETE',
        auth: { bearer: test.user.jwt },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        res.statusCode.should.equal(204)
        body.should.equal('')
        const opts = {
          uri: `http://localhost:${PORT}/v1/connections/${connectionToDelete._id.toString()}`,
          method: 'GET',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(opts, (err, res, body) => {
          if (err) return done(err)
          res.statusCode.should.equal(404)
          const opts2 = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/connections/${connectionToDelete._id.toString()}`,
            method: 'GET',
            auth: { bearer: test.user.jwt },
            headers: { 'content-type': 'application/json' }
          }

          request(opts2, (err, res, body) => {
            if (err) return done(err)
            res.statusCode.should.equal(200)
            should.exist(body)
            const responseDoc = JSON.parse(body)
            responseDoc._id.should.equal(connectionToDelete._id.toString())
            done()
          })
        })
      })
    })

    it('should restore a document', done => {
      const options = {
        uri: `http://localhost:${PORT}/v1/recycleBinTTL/connections/${connectionToRestore._id.toString()}`,
        method: 'POST',
        auth: { bearer: test.user.jwt },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        res.statusCode.should.equal(204)
        body.should.equal('')
        const opts = {
          uri: `http://localhost:${PORT}/v1/recycleBinTTL/connections/${connectionToRestore._id.toString()}`,
          method: 'GET',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(opts, (err, res, body) => {
          if (err) return done(err)
          res.statusCode.should.equal(404)
          done()
        })
      })
    })

    it('should purge a document', done => {
      const options = {
        uri: `http://localhost:${PORT}/v1/recycleBinTTL/connections/${connectionToPurge._id.toString()}`,
        method: 'DELETE',
        auth: { bearer: test.user.jwt },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        res.statusCode.should.equal(204)
        body.should.equal('')
        const opts = {
          uri: `http://localhost:${PORT}/v1/recycleBinTTL/connections/${connectionToPurge._id.toString()}`,
          method: 'GET',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(opts, (err, res, body) => {
          if (err) return done(err)
          res.statusCode.should.equal(404)
          done()
        })
      })
    })

    describe('for deleting/restoring connector components', () => {
      const Connector = integratorAdaptor.Connector
      const User = integratorAdaptor.User
      const AdaptorTestDBUtil = integratorAdaptor.testUtil.dbUtil

      let oneDotZeroIA, twoDotZeroIA
      let testConnectorUserToken, testConnector, userDoc, testConnectorUserJWT
      let oneDotZeroConnectionToDeleteWithoutExternalId, oneDotZeroConnectionToDeleteWithExternalId
      let twoDotZeroConnectionToDeleteWithoutSourceId, twoDotZeroConnectionToDeleteWithSourceId
      let oneDotZeroConnectionToRestoreWithoutExternalId, oneDotZeroConnectionToRestoreWithExternalId
      let twoDotZeroConnectionToRestoreWithoutSourceId, twoDotZeroConnectionToRestoreWithSourceId
      let referencedOneDotZeroConnection, referencedTwoDotZeroConnection
      let _exportId, ottDoc1, ottDoc2, _flowId, ottDoc1JWT, ottDoc2JWT

      beforeAll(done => {
        const testConnectorUser = new User({
          email: 'test_recyclebin_connector_user@a.com',
          name: 'test recycle bin connector user',
          developer: true,
          verified: true
        })

        AdaptorTestDBUtil.registerAndGenerateAccessToken(testConnectorUser, commonUtil.generatePassword(), true, async (err, user, token) => {
          if (err) return done(err)
          if (!token || !token.token) return done(new Error('!token || !token.token'))
          testConnectorUserToken = token.token
          userDoc = user
          testConnectorUserJWT = jsonwebtoken.sign({
            iss: 'authentication.celigo.io',
            user: {
              _id: user._id,
              email: user.email,
              createdAt: user.createdAt
            },
            _accessTokenId: token._id,
            _tokenType: 'bearer',
            iat: Date.now()
          }, nconf.get('PRIVATE_KEY'), { algorithm: 'RS256', expiresIn: '1h' })

          const key = token._id.toString()
          await redisClient.set(key, JSON.stringify(token), { EX: 3600 })
          const connectionDocCore = Connection.generateDoc(test.user2, {
            type: 'rest',
            rest: {
              mediaType: 'json',
              authType: 'custom',
              baseURI: 'http://localhost'
            },
            name: 'Connector Member Connections'
          })

          const sourceConnection = new Connection(connectionDocCore)
          sourceConnection._userId = test.user2._id
          sourceConnection.save().then(connDoc => {
            co(function * () {
              let promises = []
              testConnector = new Connector({
                _userId: test.user2._id,
                name: `testRecycleBinConnector_${Date.now()}`
              })
              promises.push(testConnector.save())

              yield promises
              promises = []
              oneDotZeroIA = new Integration({
                _userId: userDoc._id,
                _connectorId: testConnector._id,
                name: 'test Integration 1.0',
                settings: {
                  key1: 'value1'
                },
                install: [
                  {
                    name: 'Install Step1',
                    type: 'hidden',
                    function: 'verifyFunction'
                  }
                ]
              })
              promises.push(oneDotZeroIA.save())

              twoDotZeroIA = new Integration({
                _userId: userDoc._id,
                _connectorId: testConnector._id,
                name: 'test Integration 2.0',
                settings: {
                  key1: 'value1'
                },
                installSteps: [
                  {
                    name: 'Install Step1',
                    type: 'hidden',
                    function: 'verifyFunction'
                  }
                ]
              })
              promises.push(twoDotZeroIA.save())

              yield promises
              promises = []

              oneDotZeroConnectionToDeleteWithoutExternalId = new Connection(connectionDocCore)
              oneDotZeroConnectionToDeleteWithoutExternalId._userId = userDoc._id
              oneDotZeroConnectionToDeleteWithoutExternalId._connectorId = testConnector._id
              oneDotZeroConnectionToDeleteWithoutExternalId._integrationId = oneDotZeroIA._id
              promises.push(oneDotZeroConnectionToDeleteWithoutExternalId.save())

              twoDotZeroConnectionToDeleteWithoutSourceId = new Connection(connectionDocCore)
              twoDotZeroConnectionToDeleteWithoutSourceId._userId = userDoc._id
              twoDotZeroConnectionToDeleteWithoutSourceId._connectorId = testConnector._id
              twoDotZeroConnectionToDeleteWithoutSourceId._integrationId = twoDotZeroIA._id
              promises.push(twoDotZeroConnectionToDeleteWithoutSourceId.save())

              referencedTwoDotZeroConnection = new Connection(connectionDocCore)
              referencedTwoDotZeroConnection._userId = userDoc._id
              referencedTwoDotZeroConnection._connectorId = testConnector._id
              referencedTwoDotZeroConnection._integrationId = twoDotZeroIA._id
              promises.push(referencedTwoDotZeroConnection.save())

              referencedOneDotZeroConnection = new Connection(connectionDocCore)
              referencedOneDotZeroConnection._userId = userDoc._id
              referencedOneDotZeroConnection._connectorId = testConnector._id
              referencedOneDotZeroConnection._integrationId = oneDotZeroIA._id
              promises.push(referencedOneDotZeroConnection.save())

              oneDotZeroConnectionToDeleteWithExternalId = new Connection(connectionDocCore)
              oneDotZeroConnectionToDeleteWithExternalId._userId = userDoc._id
              oneDotZeroConnectionToDeleteWithExternalId.externalId = connDoc._id
              oneDotZeroConnectionToDeleteWithExternalId._connectorId = testConnector._id
              oneDotZeroConnectionToDeleteWithExternalId._integrationId = oneDotZeroIA._id
              promises.push(oneDotZeroConnectionToDeleteWithExternalId.save())

              twoDotZeroConnectionToDeleteWithSourceId = new Connection(connectionDocCore)
              twoDotZeroConnectionToDeleteWithSourceId._userId = userDoc._id
              twoDotZeroConnectionToDeleteWithSourceId._sourceId = connDoc._id
              twoDotZeroConnectionToDeleteWithSourceId._connectorId = testConnector._id
              twoDotZeroConnectionToDeleteWithSourceId._integrationId = twoDotZeroIA._id
              promises.push(twoDotZeroConnectionToDeleteWithSourceId.save())

              oneDotZeroConnectionToRestoreWithoutExternalId = new Connection(connectionDocCore)
              oneDotZeroConnectionToRestoreWithoutExternalId._userId = userDoc._id
              oneDotZeroConnectionToRestoreWithoutExternalId._connectorId = testConnector._id
              oneDotZeroConnectionToRestoreWithoutExternalId._integrationId = oneDotZeroIA._id
              oneDotZeroConnectionToRestoreWithoutExternalId.deletedAt = DELETED_AT_DATE
              promises.push(oneDotZeroConnectionToRestoreWithoutExternalId.save())

              twoDotZeroConnectionToRestoreWithoutSourceId = new Connection(connectionDocCore)
              twoDotZeroConnectionToRestoreWithoutSourceId._userId = userDoc._id
              twoDotZeroConnectionToRestoreWithoutSourceId._connectorId = testConnector._id
              twoDotZeroConnectionToRestoreWithoutSourceId._integrationId = twoDotZeroIA._id
              twoDotZeroConnectionToRestoreWithoutSourceId.deletedAt = DELETED_AT_DATE
              promises.push(twoDotZeroConnectionToRestoreWithoutSourceId.save())

              oneDotZeroConnectionToRestoreWithExternalId = new Connection(connectionDocCore)
              oneDotZeroConnectionToRestoreWithExternalId._userId = userDoc._id
              oneDotZeroConnectionToRestoreWithExternalId.externalId = connDoc._id
              oneDotZeroConnectionToRestoreWithExternalId._connectorId = testConnector._id
              oneDotZeroConnectionToRestoreWithExternalId._integrationId = oneDotZeroIA._id
              oneDotZeroConnectionToRestoreWithExternalId.deletedAt = DELETED_AT_DATE
              promises.push(oneDotZeroConnectionToRestoreWithExternalId.save())

              twoDotZeroConnectionToRestoreWithSourceId = new Connection(connectionDocCore)
              twoDotZeroConnectionToRestoreWithSourceId._userId = userDoc._id
              twoDotZeroConnectionToRestoreWithSourceId._sourceId = connDoc._id
              twoDotZeroConnectionToRestoreWithSourceId._connectorId = testConnector._id
              twoDotZeroConnectionToRestoreWithSourceId._integrationId = twoDotZeroIA._id
              twoDotZeroConnectionToRestoreWithSourceId.deletedAt = DELETED_AT_DATE
              promises.push(twoDotZeroConnectionToRestoreWithSourceId.save())
              yield promises
            }).then(() => {
              const expDoc = {
                _userId: userDoc._id,
                _connectorId: testConnector._id,
                _integrationId: twoDotZeroIA._id,
                _connectionId: referencedTwoDotZeroConnection._id,
                rest: {
                  relativeURI: 'http://test.celigo.com',
                  method: 'GET'
                }
              }
              ExportFactory.createExport(expDoc).save().then(exp1 => {
                _exportId = exp1._id
                const flow = new Flow({
                  _userId: userDoc._id,
                  name: 'Test Flow 1',
                  _integrationId: twoDotZeroIA._id,
                  _exportId,
                  _connectorId: testConnector._id
                })
                flow.save().then(flowDoc => {
                  _flowId = flowDoc._id
                  expDoc._integrationId = oneDotZeroIA._id
                  expDoc._connectionId = referencedOneDotZeroConnection._id
                  ExportFactory.createExport(expDoc).save().then(result => {
                    const ottOpts = {
                      _userId: userDoc._id,
                      _connectorId: testConnector._id,
                      _integrationId: oneDotZeroIA._id
                    }
                    let ott = new OneTimeToken(ottOpts)
                    ott.save().then(doc => {
                      ottDoc1 = doc
                      ottOpts._integrationId = twoDotZeroIA._id
                      ottOpts.container = 'integration'
                      ottOpts.type = 'setup'
                      ottOpts.source = 'connector'

                      ottDoc1JWT = jsonwebtoken.sign({
                        iss: 'authentication.celigo.io',
                        _accessTokenId: ottDoc1._id,
                        _tokenType: 'ott',
                        iat: Date.now()
                      }, nconf.get('PRIVATE_KEY'), { algorithm: 'RS256', expiresIn: '1h' })

                      ott = new OneTimeToken(ottOpts)
                      ott.save().then(doc => {
                        ottDoc2 = doc
                        ottDoc2JWT = jsonwebtoken.sign({
                          iss: 'authentication.celigo.io',
                          _accessTokenId: ottDoc2._id,
                          _tokenType: 'ott',
                          iat: Date.now()
                        }, nconf.get('PRIVATE_KEY'), { algorithm: 'RS256', expiresIn: '1h' })
                        done()
                      }).catch(err => {
                        return done(err);
                      })
                    }).catch(err => {
                      return done(err);
                    })
                  }).catch(err => {
                    return done(err);
                  })
                }).catch(err => {
                  return done(err);
                })
              }).catch(err => {
                return done(err);
              })
            }).catch(done)
          }).catch(err => {
            return done(err);
          })
        })
      })

      it(
        'should not be able to delete IA1.0 connection which have externalId populated',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/connections/${oneDotZeroConnectionToDeleteWithExternalId._id.toString()}`,
            method: 'DELETE',
            auth: { bearer: testConnectorUserJWT },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(403)
              should.exist(body)
              const errorsObj = JSON.parse(body)
              errorsObj.should.deepEqual({ errors: [$E.get('MODELS_DELETE_CONNECTOR')] })
              done()
            } catch (er) {
              done(er)
            }
          })
        }
      )

      it(
        'should be able to delete IA1.0 connection which have externalId populated using ott',
        (done) => {
          const options = {
            uri: `http://localhost:${PORT}/v1/connections/${oneDotZeroConnectionToDeleteWithExternalId._id.toString()}`,
            method: 'DELETE',
            auth: { bearer: ottDoc1JWT },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            try {
              if (err) return done(err)
              res.statusCode.should.equal(204)
              done()
            } catch (er) {
              done(er)
            }
          })
        }
      )

      it(
        'should be able to delete IA1.0 connection which does not have externalId populated',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/connections/${oneDotZeroConnectionToDeleteWithoutExternalId._id.toString()}`,
            method: 'DELETE',
            auth: { bearer: testConnectorUserJWT },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            res.statusCode.should.equal(204)
            done()
          })
        }
      )

      it(
        'should be able to delete IA2.0 connection which does not have _sourceId populated',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/connections/${twoDotZeroConnectionToDeleteWithoutSourceId._id.toString()}`,
            method: 'DELETE',
            auth: { bearer: testConnectorUserJWT },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            res.statusCode.should.equal(204)
            done()
          })
        }
      )

      it(
        'should not be able to delete IA2.0 connection which have _sourceId populated',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/connections/${twoDotZeroConnectionToDeleteWithSourceId._id.toString()}`,
            method: 'DELETE',
            auth: { bearer: testConnectorUserJWT },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(403)
              should.exist(body)
              const errorsObj = JSON.parse(body)
              errorsObj.should.deepEqual({ errors: [$E.get('MODELS_DELETE_CONNECTOR')] })
              done()
            } catch (er) {
              done(er)
            }
          })
        }
      )

      it(
        'should be able to delete IA2.0 connection which have _sourceId populated using ott',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/connections/${twoDotZeroConnectionToDeleteWithSourceId._id.toString()}`,
            method: 'DELETE',
            auth: { bearer: ottDoc2JWT },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(204)
              done()
            } catch (er) {
              done(er)
            }
          })
        }
      )

      it('should not be able to delete export which is part of an IA', done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/exports/${_exportId.toString()}`,
          method: 'DELETE',
          auth: { bearer: testConnectorUserJWT },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          try {
            res.statusCode.should.equal(403)
            should.exist(body)
            const errorsObj = JSON.parse(body)
            errorsObj.should.deepEqual({ errors: [$E.get('MODELS_DELETE_CONNECTOR')] })
            done()
          } catch (er) {
            done(er)
          }
        })
      })

      it(
        'should not be able to delete IA2.0 connection which have dependency',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/connections/${referencedTwoDotZeroConnection._id.toString()}`,
            method: 'DELETE',
            auth: { bearer: testConnectorUserJWT },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(422)
              should.exist(body)
              const errorsObj = JSON.parse(body)
              errorsObj.errors[0].code.should.equal($E.get('ROUTES_RECYCLEBIN_DEPENDENCIES_NOT_DELETED').code)
              done()
            } catch (er) {
              done(er)
            }
          })
        }
      )

      it(
        'should be able to delete flow which is part of an IA using the correct ott only',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/flows/${_flowId.toString()}`,
            method: 'DELETE',
            auth: { bearer: ottDoc1JWT },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(404)
              should.exist(body)
              const errorsObj = JSON.parse(body)
              errorsObj.errors[0].code.should.equal($E.get('ROUTES_RECYCLEBIN_ALREADY_REMOVED', { modelName: 'Flow' }).code)
              options.auth.bearer = ottDoc2JWT
              request(options, (err, res, body) => {
                if (err) return done(err)
                try {
                  res.statusCode.should.equal(204)
                  done()
                } catch (er) {
                  done(er)
                }
              })
            } catch (er) {
              done(er)
            }
          })
        }
      )

      it(
        'should not be able to delete IA1.0 connection which have dependency',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/connections/${referencedOneDotZeroConnection._id.toString()}`,
            method: 'DELETE',
            auth: { bearer: testConnectorUserJWT },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(422)
              should.exist(body)
              const errorsObj = JSON.parse(body)
              errorsObj.errors[0].code.should.equal($E.get('ROUTES_RECYCLEBIN_DEPENDENCIES_NOT_DELETED').code)
              done()
            } catch (er) {
              done(er)
            }
          })
        }
      )

      it(
        'should not be able to restore IA1.0 connection which has externalId populated',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/connections/${oneDotZeroConnectionToRestoreWithExternalId._id.toString()}`,
            method: 'POST',
            auth: { bearer: testConnectorUserJWT },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(403)
              should.exist(body)
              const errorsObj = JSON.parse(body)
              errorsObj.should.deepEqual({ errors: [$E.get('MODELS_RESTORE_CONNECTOR')] })
              done()
            } catch (er) {
              done(er)
            }
          })
        }
      )

      it(
        'should be able to restore IA1.0 connection which does not have externalId populated',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/connections/${oneDotZeroConnectionToRestoreWithoutExternalId._id.toString()}`,
            method: 'POST',
            auth: { bearer: testConnectorUserJWT },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(204)
              done()
            } catch (er) {
              done(er)
            }
          })
        }
      )

      it(
        'should be able to restore IA2.0 connection which does not have _sourceId populated',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/connections/${twoDotZeroConnectionToRestoreWithoutSourceId._id.toString()}`,
            method: 'POST',
            auth: { bearer: testConnectorUserJWT },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(204)
              done()
            } catch (er) {
              done(er)
            }
          })
        }
      )

      it(
        'should not be able to restore IA2.0 connection which has _sourceId populated',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/connections/${twoDotZeroConnectionToRestoreWithSourceId._id.toString()}`,
            method: 'POST',
            auth: { bearer: testConnectorUserJWT },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            try {
              res.statusCode.should.equal(403)
              should.exist(body)
              const errorsObj = JSON.parse(body)
              errorsObj.should.deepEqual({ errors: [$E.get('MODELS_RESTORE_CONNECTOR')] })
              done()
            } catch (er) {
              done(er)
            }
          })
        }
      )
    })
  })

  describe('delete dependency check', () => {
    let testWrapperStackId
    let testWrapperConnId
    let testWrapperImportId

    beforeAll(done => {
      const stackToSave = new Stack({
        _userId: test.user._id,
        name: 'integration-1-wrapper-test',
        type: 'server',
        server: {
          hostURI: 'http://localhost:',
          systemToken: 'MODEL_DEP_TOKEN'
        }
      })

      stackToSave.save().then(savedDoc => {
        testWrapperStackId = savedDoc._id
        const connToSave = new Connection({
          _userId: test.user._id,
          name: 'dummy integration 1 connection to wrapper stack',
          type: 'wrapper',
          wrapper: {
            unencrypted: { k: 'v' },
            encrypted: 'abc',
            _stackId: testWrapperStackId,
            pingFunction: 'thePing'
          }
        })

        connToSave.save().then(savedDoc => {
          testWrapperConnId = savedDoc._id.toString()
          const importToSave = ImportFactory.createImport({
            _userId: test.user._id,
            _connectionId: testWrapperConnId,
            name: 'dummy test wrapper import 1',
            wrapper: {
              function: 'addMyData'
            }
          })

          importToSave.save().then(savedDoc => {
            testWrapperImportId = savedDoc._id.toString()
            done()
          }).catch(err => {
            return done(err);
          })
        }).catch(err => {
          return done(err);
        })
      }).catch(err => {
        return done(err);
      })
    })

    it(
      'should allow deleting a document whose dependencies were also deleted',
      done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/imports/${testWrapperImportId}`,
          method: 'DELETE',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          res.statusCode.should.equal(204)
          body.should.equal('')
          options.uri = `http://localhost:${PORT}/v1/connections/${testWrapperConnId}`

          request(options, (err, res, body) => {
            if (err) return done(err)
            res.statusCode.should.equal(204)
            body.should.equal('')
            options.uri = `http://localhost:${PORT}/v1/stacks/${testWrapperStackId}`

            request(options, (err, res, body) => {
              if (err) return done(err)
              res.statusCode.should.equal(204)
              body.should.equal('')

              findOneDocWithoutDeletedAt(Stack, testWrapperStackId, (err, doc) => {
                if (err) return done(err)
                should.exist(doc.deletedAt)

                findOneDocWithoutDeletedAt(Connection, testWrapperConnId, (err, doc) => {
                  if (err) return done(err)
                  should.exist(doc.deletedAt)

                  findOneDocWithoutDeletedAt(Import, testWrapperImportId, (err, doc) => {
                    if (err) return done(err)
                    should.exist(doc.deletedAt)
                    done()
                  })
                })
              })
            })
          })
        })
      }
    )

    // This doesn't happen in normal case, added to check error condition
    it(
      'Should throw error while deleting an export whose connection is missing.',
      done => {
        const conn = commonUtil.generateNetSuiteConnection()
        let opts = {
          uri: 'http://localhost:' + PORT + '/v1/connections',
          json: conn,
          method: 'POST',
          auth: { bearer: test.user.jwt }
        }

        request(opts, (e, r, b) => {
          if (e) return done(e)
          const connectionId = b._id.toString()

          const exportDocCore = {
            name: 'Test export',
            asynchronous: true,
            _connectionId: connectionId,
            type: 'distributed',
            distributed: { bearerToken: '****' },
            netsuite: {
              type: 'restlet',
              restlet: {
                recordType: 'customer',
                searchId: 'dummy'
              }
            }
          }

          opts = {
            uri: `http://localhost:${PORT}/v1/exports`,
            json: exportDocCore,
            method: 'POST',
            auth: { bearer: test.user.jwt },
            headers: { 'content-type': 'application/json' }
          }

          request(opts, (err, res, body) => {
            if (err) return done(err)
            const exportId = body._id.toString()

            Connection.deleteOne({ _id: connectionId }).then(result => {
              opts = {
                uri: `http://localhost:${PORT}/v1/exports/${exportId}`,
                method: 'DELETE',
                auth: { bearer: test.user.jwt },
                headers: { 'content-type': 'application/json' }
              }

              request(opts, (err, res, body) => {
                if (err) return done(err)
                res.statusCode.should.equal(404)
                should.exist(body)
                const errorsObj = JSON.parse(body)
                errorsObj.should.deepEqual({ errors: [$E.get('ROUTES_DOC_NOT_FOUND', { doc: Connection.modelName })] })
                return done()
              })
            }).catch(err => {
              return done(err);
            })
          })
        })
      }
    )
  })

  describe('delete with integration dependency', () => {
    let sharedIntegrationConn
    let sharedIntegrationExport
    let sharedIntegrationImport
    let sharedIntegrationFlow1
    let sharedIntegrationFlow2
    let sharedIntegration
    let sharedConnector
    let connectorLicense
    let sharedConnectorSourceIntegration

    beforeEach(done => {
      co(function * () {
        let promises = []
        sharedIntegrationConn = new Connection(Connection.generateDoc(test.user, {
          _userId: test.user._id,
          type: 'rest',
          rest: {
            mediaType: 'json',
            authType: 'custom',
            baseURI: 'http://localhost'
          },
          name: 'Shared Integration Test Connection 1'
        }))
        promises.push(sharedIntegrationConn.save())

        sharedIntegration = new Integration({
          _userId: test.user._id,
          name: 'Shared Integration'
        })
        promises.push(sharedIntegration.save())

        sharedConnectorSourceIntegration = new Integration({
          _userId: test.user._id,
          name: 'Shared Source Integration'
        })
        promises.push(sharedConnectorSourceIntegration.save())

        yield promises
        promises = []

        sharedIntegrationExport = ExportFactory.createExport({
          _userId: test.user._id,
          _connectionId: sharedIntegrationConn._id,
          name: 'Shared Integration Test Export',
          rest: {
            relativeURI: '/here/there',
            method: 'GET'
          }
        })
        promises.push(sharedIntegrationExport.save())

        sharedIntegrationImport = ImportFactory.createImport({
          _userId: test.user._id,
          _connectionId: sharedIntegrationConn._id,
          name: 'Shared Integration Test Import',
          rest: {
            relativeURI: ['relativeURI1', 'relativeURI2'],
            method: ['PUT', 'POST'],
            body: ['bodyTemplate1', 'bodyTemplate2']
          }
        })
        promises.push(sharedIntegrationImport.save())

        yield promises
        promises = []

        sharedIntegrationFlow1 = new Flow({
          _userId: test.user._id,
          name: 'Shared Integration Test Flow 1',
          _integrationId: sharedIntegration._id,
          _exportId: sharedIntegrationExport._id,
          _importId: sharedIntegrationImport._id
        })
        promises.push(sharedIntegrationFlow1.save())

        sharedConnector = new Connector({
          _userId: test.user._id,
          name: 'Connector with Editions ' + (Date.now()),
          framework: 'twoDotZero',
          _integrationId: sharedConnectorSourceIntegration._id,
          twoDotZero: {
            _integrationId: sharedConnectorSourceIntegration._id,
            editions: [{
              displayName: '0',
              resources: { _connectionIds: [sharedIntegrationConn._id] },
              childResources: { _importIds: [sharedIntegrationImport._id] }
            }]
          }
        })
        promises.push(sharedConnector.save())

        yield promises
        promises = []

        connectorLicense = new License({
          _userId: test.user._id,
          type: 'integrationApp',
          expires: Date.now() + 36E5,
          _connectorId: sharedConnector._id,
          _editionId: sharedConnector.twoDotZero.editions[0]._id
        })

        promises.push(connectorLicense.save())
        yield promises
      }).then(() => {
        sharedIntegrationFlow2 = new Flow({
          _userId: test.user._id,
          name: 'Shared Integration Test Flow 2',
          _integrationId: sharedIntegration._id,
          _exportId: sharedIntegrationExport._id,
          _importId: sharedIntegrationImport._id,
          _runNextFlowIds: [sharedIntegrationFlow1._id]
        })

        sharedIntegrationFlow2.save().then(doc => {
          sharedIntegrationFlow2 = doc
          sharedIntegrationFlow2.deletedAt = DELETED_AT_DATE

          sharedIntegrationFlow2.save().then(doc => {
            sharedIntegrationFlow2 = doc
            done()
          }).catch(err => {
            return done(err);
          })
        }).catch(err => {
          return done(err);
        })
      }).catch(done)
    })

    it(
      'should delete Flow 1, whose only "dependency" is an active Integration',
      done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/flows/${sharedIntegrationFlow1._id.toString()}`,
          method: 'DELETE',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          res.statusCode.should.equal(204)
          body.should.equal('')
          done()
        })
      }
    )

    it(
      'should not delete the Integration whose only active dependency is Flow 1',
      done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/integrations/${sharedIntegration._id.toString()}`,
          method: 'DELETE',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          res.statusCode.should.equal(422)
          should.exist(body)
          const errorsObj = JSON.parse(body)
          errorsObj.should.deepEqual({
            errors: [
              $E.get('ROUTES_RECYCLEBIN_DEPENDENCIES_NOT_DELETED', {
                dependencyModelName: 'flow',
                dependencyDocId: sharedIntegrationFlow1._id.toString(),
                toDeleteModelName: 'integration',
                toDeleteDocId: sharedIntegration._id.toString()
              })
            ]
          })
          done()
        })
      }
    )

    it(
      'should delete Flow 1, and then successfully delete the Integration',
      done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/flows/${sharedIntegrationFlow1._id.toString()}`,
          method: 'DELETE',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          res.statusCode.should.equal(204)
          body.should.equal('')
          options.uri = `http://localhost:${PORT}/v1/integrations/${sharedIntegration._id.toString()}`

          request(options, (err, res, body) => {
            if (err) return done(err)
            res.statusCode.should.equal(204)
            body.should.equal('')
            done()
          })
        })
      }
    )

    it(
      'should not delete the export referenced by connector, should be able to find connector model dependencies',
      done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/imports/${sharedIntegrationImport._id.toString()}`,
          method: 'DELETE',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          res.statusCode.should.equal(422)
          should.exist(body)
          const errorsObj = JSON.parse(body)
          errorsObj.should.deepEqual({
            errors: [
              $E.get('ROUTES_RECYCLEBIN_DEPENDENCIES_NOT_DELETED', {
                dependencyModelName: 'flow',
                dependencyDocId: sharedIntegrationFlow1._id.toString(),
                toDeleteModelName: 'import',
                toDeleteDocId: sharedIntegrationImport._id.toString()
              }),
              $E.get('ROUTES_RECYCLEBIN_DEPENDENCIES_NOT_DELETED', {
                dependencyModelName: 'connector',
                dependencyDocId: sharedConnector._id.toString(),
                toDeleteModelName: 'import',
                toDeleteDocId: sharedIntegrationImport._id.toString()
              })
            ]
          })
          done()
        })
      }
    )

    it('should not delete the connnector with dependent license', done => {
      const options = {
        uri: `http://localhost:${PORT}/v1/connectors/${sharedConnector._id.toString()}`,
        method: 'DELETE',
        auth: { bearer: test.user.jwt },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        res.statusCode.should.equal(422)
        should.exist(body)
        const errorsObj = JSON.parse(body)
        const expErrorObj = $E.getError('MODEL_DELETE_NOT_ALLOWED', { param1: 'License', param2: connectorLicense._id.toString() })
        errorsObj.should.deepEqual({
          errors: [{
            code: expErrorObj.code,
            message: expErrorObj.message
          }]
        })
        done()
      })
    })

    it(
      'should not delete the source Integration, and throw error for connector dependency',
      done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/integrations/${sharedConnectorSourceIntegration._id.toString()}`,
          method: 'DELETE',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          res.statusCode.should.equal(422)
          should.exist(body)
          const errorsObj = JSON.parse(body)
          errorsObj.should.deepEqual({
            errors: [
              $E.get('ROUTES_RECYCLEBIN_DEPENDENCIES_NOT_DELETED', {
                dependencyModelName: 'connector',
                dependencyDocId: sharedConnector._id.toString(),
                toDeleteModelName: 'integration',
                toDeleteDocId: sharedConnectorSourceIntegration._id.toString()
              })
            ]
          })
          done()
        })
      }
    )
  })

  describe('cascade restore', () => {
    // skip this test for now
    describe('for standalone flow', () => {
      let cascadeRestoreStandaloneConn
      let cascadeRestoreStandaloneFileDefConn
      let cascadeRestoreStandaloneAsyncHelperConn
      let cascadeRestoreStandaloneAsyncHelper
      let cascadeRestoreStandaloneAsyncHelperExport
      let cascadeRestoreStandaloneScript
      let cascadeRestoreStandaloneFileDefinition
      let cascadeRestoreStandaloneExport
      let cascadeRestoreStandaloneImport
      let cascadeRestoreStandaloneFlow
      let cascadeRestoreStandaloneScriptS3Key

      beforeEach(done => {
        scriptUtil.create(test.user._id, SCRIPT_CODE, { name: 'cascadeRestoreScript.js', description: 'Cascade Restore Integration 1 Script' }, (err, doc) => {
          if (err) return done(err)
          should.exist(doc)
          doc.hashValue.should.equal(scriptUtil.sha1(SCRIPT_CODE))
          cascadeRestoreStandaloneScript = doc
          cascadeRestoreStandaloneScriptS3Key = scriptUtil.genS3Key(test.user._id, cascadeRestoreStandaloneScript._id)

          co(function * () {
            let promises = []
            cascadeRestoreStandaloneConn = new Connection({
              _userId: test.user._id,
              type: 'http',
              http: {
                mediaType: 'xml',
                auth: { type: 'custom' },
                baseURI: 'http://localhost',
                headers: [
                  { name: 'content-type', value: 'application/xml' },
                  { name: 'Authorization', value: 'hello dolly' }
                ]
              },
              name: 'Cascade Restore Test Connection 1'
            })
            promises.push(cascadeRestoreStandaloneConn.save())

            cascadeRestoreStandaloneFileDefConn = new Connection({
              _userId: test.user._id,
              type: 'ftp',
              name: 'dummy test file def conn 0',
              ftp: {
                type: 'ftp',
                hostURI: '192.168.1.1',
                password: 'abcd',
                username: 'dave'
              }
            })
            promises.push(cascadeRestoreStandaloneFileDefConn.save())

            cascadeRestoreStandaloneAsyncHelperConn = new Connection({
              _userId: test.user._id,
              type: 'http',
              http: {
                mediaType: 'xml',
                auth: { type: 'custom' },
                baseURI: 'http://localhost',
                headers: [
                  { name: 'content-type', value: 'application/xml' },
                  { name: 'Authorization', value: 'hello world' }
                ]
              },
              name: 'dummy test connection 1'
            })
            promises.push(cascadeRestoreStandaloneAsyncHelperConn.save())

            yield promises
            promises = []

            cascadeRestoreStandaloneAsyncHelperExport = ExportFactory.createExport({
              _userId: test.user._id,
              _connectionId: cascadeRestoreStandaloneAsyncHelperConn._id,
              asynchronous: true,
              name: 'async-helper-cascade-restore-exp',
              transform: {
                version: '1',
                rules: [[{ extract: '/@id', generate: 'ItemId' }]]
              },
              http: {
                relativeURI: 'products/async/status/{{data.myId}}',
                method: 'POST',
                response: {
                  resourcePath: '/createResponse/submission'
                }
              }
            })
            promises.push(cascadeRestoreStandaloneAsyncHelperExport.save())

            yield promises
            promises = []

            cascadeRestoreStandaloneAsyncHelper = new AsyncHelper({
              _userId: test.user._id,
              name: 'integration 1 cascade restore helper',
              http: {
                submit: {
                  sameAsStatus: false,
                  resourcePath: '/createResponse/submission',
                  transform: {
                    version: '1',
                    rules: [[{ extract: '/@id', generate: 'ItemId' }]]
                  }
                },
                status: {
                  _exportId: cascadeRestoreStandaloneAsyncHelperExport._id,
                  statusPath: '/path/to/status'
                }
              }
            })
            promises.push(cascadeRestoreStandaloneAsyncHelper.save())

            cascadeRestoreStandaloneFileDefinition = new FileDefinition({
              _userId: test.user._id,
              name: 'Integration FileDefinition',
              version: '1',
              externalId: 'cascade_restore_file_def_integration_one',
              strict: true,
              format: 'fixed',
              skipEmptyEndColDelimiter: true,
              fixed: {
                rowSuffix: '}',
                rowDelimiter: '\t',
                paddingChar: '.'
              },
              rules: [{ name: 'd', elements: [{ name: 'g', value: 'i', length: 1 }] }]
            })
            promises.push(cascadeRestoreStandaloneFileDefinition.save())

            yield promises
            promises = []

            cascadeRestoreStandaloneExport = ExportFactory.createExport({
              _userId: test.user._id,
              _connectionId: cascadeRestoreStandaloneFileDefConn._id,
              name: 'Cascade Restore Test Export 1',
              file: {
                encoding: 'win1252',
                type: 'filedefinition',
                fileDefinition: {
                  resourcePath: '/up/and/down',
                  _fileDefinitionId: cascadeRestoreStandaloneFileDefinition._id
                }
              },
              ftp: {
                directoryPath: '/test/download/path',
                fileNameStartsWith: 'start-',
                fileNameEndsWith: '-end'
              }
            })
            promises.push(cascadeRestoreStandaloneExport.save())

            cascadeRestoreStandaloneImport = ImportFactory.createImport({
              _userId: test.user._id,
              _connectionId: cascadeRestoreStandaloneConn._id,
              name: 'Cascade Restore Test Import 1',
              http: {
                _asyncHelperId: cascadeRestoreStandaloneAsyncHelper._id,
                relativeURI: ['/documents/async'],
                method: ['PUT'],
                body: [
                  '<modelDep>' +
                  '{{#each data}}' +
                  '  <doc>' +
                  '    <name>{{name}}</name>' +
                  '    <id>{{id}}</id>' +
                  '  </doc>' +
                  '{{/each}}' +
                  '</modelDep>'
                ]
              },
              hooks: {
                postSubmit: {
                  function: 'getName',
                  _scriptId: cascadeRestoreStandaloneScript._id
                }
              }
            })
            promises.push(cascadeRestoreStandaloneImport.save())

            yield promises
            promises = []

            cascadeRestoreStandaloneFlow = new Flow({
              _userId: test.user._id,
              name: 'Cascade Restore Test Flow 1',
              _exportId: cascadeRestoreStandaloneExport._id,
              _importId: cascadeRestoreStandaloneImport._id
            })
            promises.push(cascadeRestoreStandaloneFlow.save())

            yield promises
          }).then(() => {
            async.eachSeries(
              [
                cascadeRestoreStandaloneFlow,
                cascadeRestoreStandaloneImport,
                cascadeRestoreStandaloneExport,
                cascadeRestoreStandaloneAsyncHelper,
                cascadeRestoreStandaloneAsyncHelperExport,
                cascadeRestoreStandaloneConn,
                cascadeRestoreStandaloneFileDefConn,
                cascadeRestoreStandaloneAsyncHelperConn,
                cascadeRestoreStandaloneFileDefinition,
                cascadeRestoreStandaloneScript
              ], (doc, cb) => {
                doc.deletedAt = DELETED_AT_DATE

                doc.save().then(savedDoc => {
                  if (!savedDoc.deletedAt) return cb(new Error('Failed to update deletedAt'))
                  cb()
                }).catch(err => {
                  return cb(err);
                })
              }, err => {
                if (err) return done(err)

                SCRIPTS_S3U.getObjectMetadata(cascadeRestoreStandaloneScriptS3Key, (err, data) => {
                  if (err) {
                    if (err.message === 's3Key not found' && err.code === 'NotFound' &&
                      err.source === errorSource && err.statusCode === 404) {
                      return done()
                    } else {
                      return done(err)
                    }
                  }
                  scriptUtil.recycleS3Object(test.user._id, cascadeRestoreStandaloneScript._id, done)
                })
              }
            )
          }).catch(done)
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

            Export.find({ _id: { $in: [cascadeRestoreStandaloneExport._id, cascadeRestoreStandaloneAsyncHelperExport._id] }, deletedAt: { $exists: false } }, { deletedAt: 1 }).lean().exec().then(docs => {
              docs.length.should.equal(2)

              findOneDocWithoutDeletedAt(Import, cascadeRestoreStandaloneImport._id, (err, doc) => {
                if (err) return done(err)
                should.not.exist(doc.deletedAt)

                Connection.find({ _id: { $in: [cascadeRestoreStandaloneConn._id, cascadeRestoreStandaloneFileDefConn._id, cascadeRestoreStandaloneAsyncHelperConn._id] }, deletedAt: { $exists: false } }, { deletedAt: 1 }).lean().exec().then(docs => {
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
                }).catch(err => {
                  return done(err);
                })
              })
            }).catch(err => {
              return done(err);
            })
          })
        })
      })

      it('should restore an Import and all of its descendants', done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/recycleBinTTL/imports/${cascadeRestoreStandaloneImport._id.toString()}/doCascadeRestore`,
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
            should.exist(doc.deletedAt)
            const exportQuery = { _id: { $in: [cascadeRestoreStandaloneExport._id, cascadeRestoreStandaloneAsyncHelperExport] } }
            adaptorModelUtil.skipDeletedAtPluginForRecycleBin(exportQuery, 'export')

            Export.find(exportQuery, { deletedAt: 1 }).lean().exec().then(docs => {
              docs.length.should.equal(2)
              for (const doc of docs) {
                if (doc._id.toString() === cascadeRestoreStandaloneAsyncHelperExport._id.toString()) {
                  should.not.exist(doc.deletedAt)
                } else {
                  should.exist(doc.deletedAt)
                }
              }

              findOneDocWithoutDeletedAt(Import, cascadeRestoreStandaloneImport._id, (err, doc) => {
                if (err) return done(err)
                should.not.exist(doc.deletedAt)
                const connQuery = { _id: { $in: [cascadeRestoreStandaloneConn._id, cascadeRestoreStandaloneFileDefConn, cascadeRestoreStandaloneAsyncHelperConn] } }
                adaptorModelUtil.skipDeletedAtPluginForRecycleBin(connQuery, 'connection')

                Connection.find(connQuery, { deletedAt: 1 }).lean().exec().then(docs => {
                  docs.length.should.equal(3)
                  for (const doc of docs) {
                    if (doc._id.toString() === cascadeRestoreStandaloneFileDefConn._id.toString()) {
                      should.exist(doc.deletedAt)
                    } else {
                      should.not.exist(doc.deletedAt)
                    }
                  }

                  findOneDocWithoutDeletedAt(AsyncHelper, cascadeRestoreStandaloneAsyncHelper._id, (err, doc) => {
                    if (err) return done(err)
                    should.not.exist(doc.deletedAt)

                    findOneDocWithoutDeletedAt(Script, cascadeRestoreStandaloneScript._id, (err, doc) => {
                      if (err) return done(err)
                      should.not.exist(doc.deletedAt)

                      findOneDocWithoutDeletedAt(FileDefinition, cascadeRestoreStandaloneFileDefinition._id, (err, doc) => {
                        if (err) return done(err)
                        should.exist(doc.deletedAt)
                        done()
                      })
                    })
                  })
                }).catch(err => {
                  return done(err);
                })
              })
            }).catch(err => {
              return done(err);
            })
          })
        })
      })

      it(
        'should restore an Export with a FileDefinition and all of its descendants',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/exports/${cascadeRestoreStandaloneExport._id.toString()}/doCascadeRestore`,
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
              should.exist(doc.deletedAt)
              const exportQuery = { _id: { $in: [cascadeRestoreStandaloneExport._id, cascadeRestoreStandaloneAsyncHelperExport] } }
              adaptorModelUtil.skipDeletedAtPluginForRecycleBin(exportQuery, 'export')

              Export.find(exportQuery, { deletedAt: 1 }).lean().exec().then(docs => {
                docs.length.should.equal(2)
                for (const doc of docs) {
                  if (doc._id.toString() === cascadeRestoreStandaloneExport._id.toString()) {
                    should.not.exist(doc.deletedAt)
                  } else {
                    should.exist(doc.deletedAt)
                  }
                }

                findOneDocWithoutDeletedAt(Import, cascadeRestoreStandaloneImport._id, (err, doc) => {
                  if (err) return done(err)
                  should.exist(doc.deletedAt)
                  const connQuery = { _id: { $in: [cascadeRestoreStandaloneConn._id, cascadeRestoreStandaloneFileDefConn, cascadeRestoreStandaloneAsyncHelperConn] } }
                  adaptorModelUtil.skipDeletedAtPluginForRecycleBin(connQuery, 'connection')

                  Connection.find(connQuery, { deletedAt: 1 }).lean().exec().then(docs => {
                    docs.length.should.equal(3)
                    for (const doc of docs) {
                      if (doc._id.toString() === cascadeRestoreStandaloneFileDefConn._id.toString()) {
                        should.not.exist(doc.deletedAt)
                      } else {
                        should.exist(doc.deletedAt)
                      }
                    }

                    findOneDocWithoutDeletedAt(AsyncHelper, cascadeRestoreStandaloneAsyncHelper._id, (err, doc) => {
                      if (err) return done(err)
                      should.exist(doc.deletedAt)

                      findOneDocWithoutDeletedAt(Script, cascadeRestoreStandaloneScript._id, (err, doc) => {
                        if (err) return done(err)
                        should.exist(doc.deletedAt)

                        findOneDocWithoutDeletedAt(FileDefinition, cascadeRestoreStandaloneFileDefinition._id, (err, doc) => {
                          if (err) return done(err)
                          should.not.exist(doc.deletedAt)
                          done()
                        })
                      })
                    })
                  }).catch(err => {
                    return done(err);
                  })
                })
              }).catch(err => {
                return done(err);
              })
            })
          })
        }
      )

      it('should restore an AsyncHelper and all of its descendants', done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/recycleBinTTL/asynchelpers/${cascadeRestoreStandaloneAsyncHelper._id.toString()}/doCascadeRestore`,
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
            should.exist(doc.deletedAt)
            const exportQuery = { _id: { $in: [cascadeRestoreStandaloneExport._id, cascadeRestoreStandaloneAsyncHelperExport] } }
            adaptorModelUtil.skipDeletedAtPluginForRecycleBin(exportQuery, 'export')

            Export.find(exportQuery, { deletedAt: 1 }).lean().exec().then(docs => {
              docs.length.should.equal(2)
              for (const doc of docs) {
                if (doc._id.toString() === cascadeRestoreStandaloneAsyncHelperExport._id.toString()) {
                  should.not.exist(doc.deletedAt)
                } else {
                  should.exist(doc.deletedAt)
                }
              }

              findOneDocWithoutDeletedAt(Import, cascadeRestoreStandaloneImport._id, (err, doc) => {
                if (err) return done(err)
                should.exist(doc.deletedAt)
                const connQuery = { _id: { $in: [cascadeRestoreStandaloneConn._id, cascadeRestoreStandaloneFileDefConn, cascadeRestoreStandaloneAsyncHelperConn] } }
                adaptorModelUtil.skipDeletedAtPluginForRecycleBin(connQuery, 'connection')

                Connection.find(connQuery, { deletedAt: 1 }).lean().exec().then(docs => {
                  docs.length.should.equal(3)
                  for (const doc of docs) {
                    if (doc._id.toString() === cascadeRestoreStandaloneAsyncHelperConn._id.toString()) {
                      should.not.exist(doc.deletedAt)
                    } else {
                      should.exist(doc.deletedAt)
                    }
                  }

                  findOneDocWithoutDeletedAt(AsyncHelper, cascadeRestoreStandaloneAsyncHelper._id, (err, doc) => {
                    if (err) return done(err)
                    should.not.exist(doc.deletedAt)

                    findOneDocWithoutDeletedAt(Script, cascadeRestoreStandaloneScript._id, (err, doc) => {
                      if (err) return done(err)
                      should.exist(doc.deletedAt)

                      findOneDocWithoutDeletedAt(FileDefinition, cascadeRestoreStandaloneFileDefinition._id, (err, doc) => {
                        if (err) return done(err)
                        should.exist(doc.deletedAt)
                        done()
                      })
                    })
                  })
                }).catch(err => {
                  return done(err);
                })
              })
            }).catch(err => {
              return done(err);
            })
          })
        })
      })

      it(
        'should restore an Async Helper Export and all of its descendants',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/exports/${cascadeRestoreStandaloneAsyncHelperExport._id.toString()}/doCascadeRestore`,
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
              should.exist(doc.deletedAt)
              const exportQuery = { _id: { $in: [cascadeRestoreStandaloneExport._id, cascadeRestoreStandaloneAsyncHelperExport] } }
              adaptorModelUtil.skipDeletedAtPluginForRecycleBin(exportQuery, 'export')

              Export.find(exportQuery, { deletedAt: 1 }).lean().exec().then(docs => {
                docs.length.should.equal(2)
                for (const doc of docs) {
                  if (doc._id.toString() === cascadeRestoreStandaloneAsyncHelperExport._id.toString()) {
                    should.not.exist(doc.deletedAt)
                  } else {
                    should.exist(doc.deletedAt)
                  }
                }

                findOneDocWithoutDeletedAt(Import, cascadeRestoreStandaloneImport._id, (err, doc) => {
                  if (err) return done(err)
                  should.exist(doc.deletedAt)
                  const connQuery = { _id: { $in: [cascadeRestoreStandaloneConn._id, cascadeRestoreStandaloneFileDefConn, cascadeRestoreStandaloneAsyncHelperConn] } }
                  adaptorModelUtil.skipDeletedAtPluginForRecycleBin(connQuery, 'connection')

                  Connection.find(connQuery, { deletedAt: 1 }).lean().exec().then(docs => {
                    docs.length.should.equal(3)
                    for (const doc of docs) {
                      if (doc._id.toString() === cascadeRestoreStandaloneAsyncHelperConn._id.toString()) {
                        should.not.exist(doc.deletedAt)
                      } else {
                        should.exist(doc.deletedAt)
                      }
                    }

                    findOneDocWithoutDeletedAt(AsyncHelper, cascadeRestoreStandaloneAsyncHelper._id, (err, doc) => {
                      if (err) return done(err)
                      should.exist(doc.deletedAt)

                      findOneDocWithoutDeletedAt(Script, cascadeRestoreStandaloneScript._id, (err, doc) => {
                        if (err) return done(err)
                        should.exist(doc.deletedAt)

                        findOneDocWithoutDeletedAt(FileDefinition, cascadeRestoreStandaloneFileDefinition._id, (err, doc) => {
                          if (err) return done(err)
                          should.exist(doc.deletedAt)
                          done()
                        })
                      })
                    })
                  }).catch(err => {
                    return done(err);
                  })
                })
              }).catch(err => {
                return done(err);
              })
            })
          })
        }
      )

      it('should restore a Connection and all of its descendants', done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/recycleBinTTL/connections/${cascadeRestoreStandaloneConn._id.toString()}/doCascadeRestore`,
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
            should.exist(doc.deletedAt)
            const exportQuery = { _id: { $in: [cascadeRestoreStandaloneExport._id, cascadeRestoreStandaloneAsyncHelperExport] } }
            adaptorModelUtil.skipDeletedAtPluginForRecycleBin(exportQuery, 'export')

            Export.find(exportQuery, { deletedAt: 1 }).lean().exec().then(docs => {
              docs.length.should.equal(2)
              for (const doc of docs) {
                should.exist(doc.deletedAt)
              }

              findOneDocWithoutDeletedAt(Import, cascadeRestoreStandaloneImport._id, (err, doc) => {
                if (err) return done(err)
                should.exist(doc.deletedAt)
                const connQuery = { _id: { $in: [cascadeRestoreStandaloneConn._id, cascadeRestoreStandaloneFileDefConn, cascadeRestoreStandaloneAsyncHelperConn] } }
                adaptorModelUtil.skipDeletedAtPluginForRecycleBin(connQuery, 'connection')

                Connection.find(connQuery, { deletedAt: 1 }).lean().exec().then(docs => {
                  docs.length.should.equal(3)
                  for (const doc of docs) {
                    if (doc._id.toString() === cascadeRestoreStandaloneConn._id.toString()) {
                      should.not.exist(doc.deletedAt)
                    } else {
                      should.exist(doc.deletedAt)
                    }
                  }

                  findOneDocWithoutDeletedAt(AsyncHelper, cascadeRestoreStandaloneAsyncHelper._id, (err, doc) => {
                    if (err) return done(err)
                    should.exist(doc.deletedAt)

                    findOneDocWithoutDeletedAt(Script, cascadeRestoreStandaloneScript._id, (err, doc) => {
                      if (err) return done(err)
                      should.exist(doc.deletedAt)

                      findOneDocWithoutDeletedAt(Script, cascadeRestoreStandaloneScript._id, (err, doc) => {
                        if (err) return done(err)
                        should.exist(doc.deletedAt)
                        done()
                      })
                    })
                  })
                }).catch(err => {
                  return done(err);
                })
              })
            }).catch(err => {
              return done(err);
            })
          })
        })
      })

      it(
        'should restore an Async Helper Connection and all of its descendants',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/connections/${cascadeRestoreStandaloneAsyncHelperConn._id.toString()}/doCascadeRestore`,
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
              should.exist(doc.deletedAt)
              const exportQuery = { _id: { $in: [cascadeRestoreStandaloneExport._id, cascadeRestoreStandaloneAsyncHelperExport] } }
              adaptorModelUtil.skipDeletedAtPluginForRecycleBin(exportQuery, 'export')

              Export.find(exportQuery, { deletedAt: 1 }).lean().exec().then(docs => {
                docs.length.should.equal(2)
                for (const doc of docs) {
                  should.exist(doc.deletedAt)
                }

                findOneDocWithoutDeletedAt(Import, cascadeRestoreStandaloneImport._id, (err, doc) => {
                  if (err) return done(err)
                  should.exist(doc.deletedAt)
                  const connQuery = { _id: { $in: [cascadeRestoreStandaloneConn._id, cascadeRestoreStandaloneFileDefConn, cascadeRestoreStandaloneAsyncHelperConn] } }
                  adaptorModelUtil.skipDeletedAtPluginForRecycleBin(connQuery, 'connection')

                  Connection.find(connQuery, { deletedAt: 1 }).lean().exec().then(docs => {
                    docs.length.should.equal(3)
                    for (const doc of docs) {
                      if (doc._id.toString() === cascadeRestoreStandaloneAsyncHelperConn._id.toString()) {
                        should.not.exist(doc.deletedAt)
                      } else {
                        should.exist(doc.deletedAt)
                      }
                    }

                    findOneDocWithoutDeletedAt(AsyncHelper, cascadeRestoreStandaloneAsyncHelper._id, (err, doc) => {
                      if (err) return done(err)
                      should.exist(doc.deletedAt)

                      findOneDocWithoutDeletedAt(Script, cascadeRestoreStandaloneScript._id, (err, doc) => {
                        if (err) return done(err)
                        should.exist(doc.deletedAt)

                        findOneDocWithoutDeletedAt(FileDefinition, cascadeRestoreStandaloneFileDefinition._id, (err, doc) => {
                          if (err) return done(err)
                          should.exist(doc.deletedAt)
                          done()
                        })
                      })
                    })
                  }).catch(err => {
                    return done(err);
                  })
                })
              }).catch(err => {
                return done(err);
              })
            })
          })
        }
      )

      it('should restore a Script and nothing else', done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/recycleBinTTL/scripts/${cascadeRestoreStandaloneScript._id.toString()}/doCascadeRestore`,
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
            should.exist(doc.deletedAt)
            const exportQuery = { _id: { $in: [cascadeRestoreStandaloneExport._id, cascadeRestoreStandaloneAsyncHelperExport] } }
            adaptorModelUtil.skipDeletedAtPluginForRecycleBin(exportQuery, 'export')

            Export.find(exportQuery, { deletedAt: 1 }).lean().exec().then(docs => {
              docs.length.should.equal(2)
              for (const doc of docs) {
                should.exist(doc.deletedAt)
              }

              findOneDocWithoutDeletedAt(Import, cascadeRestoreStandaloneImport._id, (err, doc) => {
                if (err) return done(err)
                should.exist(doc.deletedAt)
                const connQuery = { _id: { $in: [cascadeRestoreStandaloneConn._id, cascadeRestoreStandaloneFileDefConn, cascadeRestoreStandaloneAsyncHelperConn] } }
                adaptorModelUtil.skipDeletedAtPluginForRecycleBin(connQuery, 'connection')

                Connection.find(connQuery, { deletedAt: 1 }).lean().exec().then(docs => {
                  docs.length.should.equal(3)
                  for (const doc of docs) {
                    should.exist(doc.deletedAt)
                  }

                  findOneDocWithoutDeletedAt(AsyncHelper, cascadeRestoreStandaloneAsyncHelper._id, (err, doc) => {
                    if (err) return done(err)
                    should.exist(doc.deletedAt)

                    findOneDocWithoutDeletedAt(Script, cascadeRestoreStandaloneScript._id, (err, doc) => {
                      if (err) return done(err)
                      should.not.exist(doc.deletedAt)

                      findOneDocWithoutDeletedAt(FileDefinition, cascadeRestoreStandaloneFileDefinition._id, (err, doc) => {
                        if (err) return done(err)
                        should.exist(doc.deletedAt)
                        done()
                      })
                    })
                  })
                }).catch(err => {
                  return done(err);
                })
              })
            }).catch(err => {
              return done(err);
            })
          })
        })
      })

      it('should restore a FileDefinition and nothing else', done => {
        const options = {
          uri: `http://localhost:${PORT}/v1/recycleBinTTL/filedefinitions/${cascadeRestoreStandaloneFileDefinition._id.toString()}/doCascadeRestore`,
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
            should.exist(doc.deletedAt)
            const exportQuery = { _id: { $in: [cascadeRestoreStandaloneExport._id, cascadeRestoreStandaloneAsyncHelperExport] } }
            adaptorModelUtil.skipDeletedAtPluginForRecycleBin(exportQuery, 'export')

            Export.find(exportQuery, { deletedAt: 1 }).lean().exec().then(docs => {
              docs.length.should.equal(2)
              for (const doc of docs) {
                should.exist(doc.deletedAt)
              }

              findOneDocWithoutDeletedAt(Import, cascadeRestoreStandaloneImport._id, (err, doc) => {
                if (err) return done(err)
                should.exist(doc.deletedAt)
                const connQuery = { _id: { $in: [cascadeRestoreStandaloneConn._id, cascadeRestoreStandaloneFileDefConn, cascadeRestoreStandaloneAsyncHelperConn] } }
                adaptorModelUtil.skipDeletedAtPluginForRecycleBin(connQuery, 'connection')

                Connection.find(connQuery, { deletedAt: 1 }).lean().exec().then(docs => {
                  docs.length.should.equal(3)
                  for (const doc of docs) {
                    should.exist(doc.deletedAt)
                  }

                  findOneDocWithoutDeletedAt(AsyncHelper, cascadeRestoreStandaloneAsyncHelper._id, (err, doc) => {
                    if (err) return done(err)
                    should.exist(doc.deletedAt)

                    findOneDocWithoutDeletedAt(Script, cascadeRestoreStandaloneScript._id, (err, doc) => {
                      if (err) return done(err)
                      should.exist(doc.deletedAt)

                      findOneDocWithoutDeletedAt(FileDefinition, cascadeRestoreStandaloneFileDefinition._id, (err, doc) => {
                        if (err) return done(err)
                        should.not.exist(doc.deletedAt)
                        done()
                      })
                    })
                  })
                }).catch(err => {
                  return done(err);
                })
              })
            }).catch(err => {
              return done(err);
            })
          })
        })
      })
    })

    describe('for multiple flows in one integration', () => {
      let cascadeRestoreIntegration1Conn
      let cascadeRestoreIntegration1Export
      let cascadeRestoreIntegration1Import
      let cascadeRestoreIntegration1Flow
      let cascadeRestoreIntegration1
      let cascadeRestoreIntegration2Conn
      let cascadeRestoreIntegration2Export
      let cascadeRestoreIntegration2Import
      let cascadeRestoreIntegration2Flow
      let cascadeRestoreIntegration3Flow

      beforeEach(done => {
        co(function * () {
          let promises = []
          cascadeRestoreIntegration1 = new Integration({
            _userId: test.user._id,
            name: 'Cascade Restore Test Integration1',
            flowGroupings: [{
              name: 'fg1',
              settings: { a: 'b1' }
            }]
          })
          promises.push(cascadeRestoreIntegration1.save())

          cascadeRestoreIntegration1Conn = new Connection(Connection.generateDoc(test.user, {
            _userId: test.user._id,
            type: 'rest',
            rest: {
              mediaType: 'json',
              authType: 'custom',
              baseURI: 'http://example.com'
            },
            name: 'Cascade Restore Test Connection 1'
          }))
          promises.push(cascadeRestoreIntegration1Conn.save())

          cascadeRestoreIntegration2Conn = new Connection(Connection.generateDoc(test.user, {
            _userId: test.user._id,
            type: 'rest',
            rest: {
              mediaType: 'json',
              authType: 'custom',
              baseURI: 'http://example.com'
            },
            name: 'Cascade Restore Test Connection 2'
          }))
          promises.push(cascadeRestoreIntegration2Conn.save())

          yield promises
          promises = []

          cascadeRestoreIntegration1Export = ExportFactory.createExport({
            _userId: test.user._id,
            _connectionId: cascadeRestoreIntegration1Conn._id,
            name: 'Cascade Restore Test Export 1',
            rest: {
              relativeURI: '/here/there',
              method: 'GET'
            }
          })
          promises.push(cascadeRestoreIntegration1Export.save())

          cascadeRestoreIntegration2Export = ExportFactory.createExport({
            _userId: test.user._id,
            _connectionId: cascadeRestoreIntegration2Conn._id,
            name: 'Cascade Restore Test Export 2',
            rest: {
              relativeURI: '/here/there',
              method: 'GET'
            }
          })
          promises.push(cascadeRestoreIntegration2Export.save())

          cascadeRestoreIntegration1Import = ImportFactory.createImport({
            _userId: test.user._id,
            _connectionId: cascadeRestoreIntegration1Conn._id,
            name: 'Cascade Restore Test Import 1',
            rest: {
              relativeURI: ['relativeURI1', 'relativeURI2'],
              method: ['PUT', 'POST'],
              body: ['bodyTemplate1', 'bodyTemplate2']
            }
          })
          promises.push(cascadeRestoreIntegration1Import.save())

          cascadeRestoreIntegration2Import = ImportFactory.createImport({
            _userId: test.user._id,
            _connectionId: cascadeRestoreIntegration2Conn._id,
            name: 'Cascade Restore Test Import 2',
            rest: {
              relativeURI: ['relativeURI1', 'relativeURI2'],
              method: ['PUT', 'POST'],
              body: ['bodyTemplate1', 'bodyTemplate2']
            }
          })
          promises.push(cascadeRestoreIntegration2Import.save())

          yield promises
          promises = []

          cascadeRestoreIntegration1Flow = new Flow({
            _userId: test.user._id,
            name: 'Cascade Restore Test Flow 1',
            _integrationId: cascadeRestoreIntegration1._id,
            _exportId: cascadeRestoreIntegration1Export._id,
            _importId: cascadeRestoreIntegration1Import._id
          })
          promises.push(cascadeRestoreIntegration1Flow.save())

          cascadeRestoreIntegration2Flow = new Flow({
            _userId: test.user._id,
            name: 'Cascade Restore Test Flow 2',
            _integrationId: cascadeRestoreIntegration1._id,
            _exportId: cascadeRestoreIntegration2Export._id,
            _importId: cascadeRestoreIntegration2Import._id
          })
          promises.push(cascadeRestoreIntegration2Flow.save())

          cascadeRestoreIntegration3Flow = new Flow({
            _userId: test.user._id,
            name: 'Cascade Restore Test Flow 2',
            _integrationId: cascadeRestoreIntegration1._id,
            _exportId: cascadeRestoreIntegration2Export._id,
            _importId: cascadeRestoreIntegration2Import._id,
            _flowGroupingId: cascadeRestoreIntegration1.flowGroupings[0]._id
          })
          promises.push(cascadeRestoreIntegration3Flow.save())

          yield promises
        }).then(() => {
          async.eachSeries(
            [
              cascadeRestoreIntegration1Flow,
              cascadeRestoreIntegration2Flow,
              cascadeRestoreIntegration3Flow,
              cascadeRestoreIntegration1,
              cascadeRestoreIntegration1Import,
              cascadeRestoreIntegration2Import,
              cascadeRestoreIntegration1Export,
              cascadeRestoreIntegration2Export,
              cascadeRestoreIntegration1Conn,
              cascadeRestoreIntegration2Conn
            ], (doc, cb) => {
              doc.deletedAt = DELETED_AT_DATE

              doc.save().then(savedDoc => {
                if (!savedDoc.deletedAt) return cb(new Error('Failed to update deletedAt'))
                cb()
              }).catch(err => {
                return cb(err);
              })
            },
            done
          )
        }).catch(done)
      })

      it(
        'should restore an Integration and all of its flows and their descendants',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/integrations/${cascadeRestoreIntegration1._id.toString()}/doCascadeRestore`,
            method: 'POST',
            auth: { bearer: test.user.jwt },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            res.statusCode.should.equal(204)
            body.should.equal('')

            findOneDocWithoutDeletedAt(Integration, cascadeRestoreIntegration1._id, (err, doc) => {
              if (err) return done(err)
              should.not.exist(doc.deletedAt)

              findOneDocWithoutDeletedAt(Connection, cascadeRestoreIntegration1Conn._id, (err, doc) => {
                if (err) return done(err)
                should.not.exist(doc.deletedAt)

                findOneDocWithoutDeletedAt(Connection, cascadeRestoreIntegration2Conn._id, (err, doc) => {
                  if (err) return done(err)
                  should.not.exist(doc.deletedAt)

                  findOneDocWithoutDeletedAt(Export, cascadeRestoreIntegration1Export._id, (err, doc) => {
                    if (err) return done(err)
                    should.not.exist(doc.deletedAt)

                    findOneDocWithoutDeletedAt(Export, cascadeRestoreIntegration2Export._id, (err, doc) => {
                      if (err) return done(err)
                      should.not.exist(doc.deletedAt)

                      findOneDocWithoutDeletedAt(Import, cascadeRestoreIntegration1Import._id, (err, doc) => {
                        if (err) return done(err)
                        should.not.exist(doc.deletedAt)

                        findOneDocWithoutDeletedAt(Import, cascadeRestoreIntegration2Import._id, (err, doc) => {
                          if (err) return done(err)
                          should.not.exist(doc.deletedAt)

                          findOneDocWithoutDeletedAt(Flow, cascadeRestoreIntegration1Flow._id, (err, doc) => {
                            if (err) return done(err)
                            should.not.exist(doc.deletedAt)

                            findOneDocWithoutDeletedAt(Flow, cascadeRestoreIntegration2Flow._id, (err, doc) => {
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
          })
        }
      )

      it(
        'should restore a Flow, its descendants, and its Integration without touching the other flow',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/flows/${cascadeRestoreIntegration2Flow._id.toString()}/doCascadeRestore`,
            method: 'POST',
            auth: { bearer: test.user.jwt },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            res.statusCode.should.equal(204)
            body.should.equal('')

            findOneDocWithoutDeletedAt(Integration, cascadeRestoreIntegration1._id, (err, doc) => {
              if (err) return done(err)
              should.not.exist(doc.deletedAt)

              findOneDocWithoutDeletedAt(Connection, cascadeRestoreIntegration1Conn._id, (err, doc) => {
                if (err) return done(err)
                should.exist(doc.deletedAt)

                findOneDocWithoutDeletedAt(Connection, cascadeRestoreIntegration2Conn._id, (err, doc) => {
                  if (err) return done(err)
                  should.not.exist(doc.deletedAt)

                  findOneDocWithoutDeletedAt(Export, cascadeRestoreIntegration1Export._id, (err, doc) => {
                    if (err) return done(err)
                    should.exist(doc.deletedAt)

                    findOneDocWithoutDeletedAt(Export, cascadeRestoreIntegration2Export._id, (err, doc) => {
                      if (err) return done(err)
                      should.not.exist(doc.deletedAt)

                      findOneDocWithoutDeletedAt(Import, cascadeRestoreIntegration1Import._id, (err, doc) => {
                        if (err) return done(err)
                        should.exist(doc.deletedAt)

                        findOneDocWithoutDeletedAt(Import, cascadeRestoreIntegration2Import._id, (err, doc) => {
                          if (err) return done(err)
                          should.not.exist(doc.deletedAt)

                          findOneDocWithoutDeletedAt(Flow, cascadeRestoreIntegration1Flow._id, (err, doc) => {
                            if (err) return done(err)
                            should.exist(doc.deletedAt)

                            findOneDocWithoutDeletedAt(Flow, cascadeRestoreIntegration2Flow._id, (err, doc) => {
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
          })
        }
      )

      it(
        'should restore a Flow which belongs to flowGrouping, its descendants, and its Integration without touching the other flow',
        done => {
          const options = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/flows/${cascadeRestoreIntegration3Flow._id.toString()}/doCascadeRestore`,
            method: 'POST',
            auth: { bearer: test.user.jwt },
            headers: { 'content-type': 'application/json' }
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            res.statusCode.should.equal(204)
            body.should.equal('')

            findOneDocWithoutDeletedAt(Integration, cascadeRestoreIntegration1._id, (err, doc) => {
              if (err) return done(err)
              should.not.exist(doc.deletedAt)

              findOneDocWithoutDeletedAt(Connection, cascadeRestoreIntegration1Conn._id, (err, doc) => {
                if (err) return done(err)
                should.exist(doc.deletedAt)

                findOneDocWithoutDeletedAt(Connection, cascadeRestoreIntegration2Conn._id, (err, doc) => {
                  if (err) return done(err)
                  should.not.exist(doc.deletedAt)

                  findOneDocWithoutDeletedAt(Export, cascadeRestoreIntegration1Export._id, (err, doc) => {
                    if (err) return done(err)
                    should.exist(doc.deletedAt)

                    findOneDocWithoutDeletedAt(Export, cascadeRestoreIntegration2Export._id, (err, doc) => {
                      if (err) return done(err)
                      should.not.exist(doc.deletedAt)

                      findOneDocWithoutDeletedAt(Import, cascadeRestoreIntegration1Import._id, (err, doc) => {
                        if (err) return done(err)
                        should.exist(doc.deletedAt)

                        findOneDocWithoutDeletedAt(Import, cascadeRestoreIntegration2Import._id, (err, doc) => {
                          if (err) return done(err)
                          should.not.exist(doc.deletedAt)

                          findOneDocWithoutDeletedAt(Flow, cascadeRestoreIntegration1Flow._id, (err, doc) => {
                            if (err) return done(err)
                            should.exist(doc.deletedAt)

                            findOneDocWithoutDeletedAt(Flow, cascadeRestoreIntegration2Flow._id, (err, doc) => {
                              if (err) return done(err)
                              should.exist(doc.deletedAt)

                              findOneDocWithoutDeletedAt(Flow, cascadeRestoreIntegration3Flow._id, (err, doc) => {
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
            })
          })
        }
      )
    })
  })

  describe('delete account contents', () => {
    const AdaptorTestDBUtil = integratorAdaptor.testUtil.dbUtil

    let testUser = new User({
      email: Date.now() + 'deleteAccountUser@b.com',
      name: 'deleteAccount user',
      developer: true,
      verified: true
    })

    let conn
    let fileDefConn
    let asyncHelperConn
    let asyncHelper
    let asyncHelperExport
    let standaloneScript
    let standaloneFileDefinition
    let standaloneExport
    let standaloneImport
    let standaloneFlow
    let standaloneScriptS3Key
    let testUserJWT

    beforeAll(done => {
      AdaptorTestDBUtil.registerAndGenerateAccessToken(testUser, commonUtil.generatePassword(), true, async (err, userDoc, token) => {
        if (err) return done(err)
        if (!token || !token.token) return done(new Error('!token || !token.token'))
        const testUserToken = token.token
        const userDoc1 = userDoc
        testUser = userDoc1
        testUserJWT = jsonwebtoken.sign({
          iss: 'authentication.celigo.io',
          user: {
            _id: userDoc1._id,
            email: userDoc1.email,
            createdAt: userDoc1.createdAt
          },
          _accessTokenId: token._id,
          _tokenType: 'bearer',
          iat: Date.now()
        }, nconf.get('PRIVATE_KEY'), { algorithm: 'RS256', expiresIn: '1h' })

        const key = token._id.toString()
        await redisClient.set(key, JSON.stringify(token), { EX: 3600 })

        scriptUtil.create(userDoc._id, SCRIPT_CODE, { name: 'cascadeRestoreScript.js', description: 'Cascade Restore Integration 1 Script' }, (err, doc) => {
          if (err) return done(err)
          should.exist(doc)
          doc.hashValue.should.equal(scriptUtil.sha1(SCRIPT_CODE))
          standaloneScript = doc
          standaloneScriptS3Key = scriptUtil.genS3Key(userDoc._id, standaloneScript._id)

          co(function * () {
            let promises = []
            conn = new Connection({
              _userId: userDoc._id,
              type: 'http',
              http: {
                mediaType: 'xml',
                auth: { type: 'custom' },
                baseURI: 'http://localhost',
                headers: [
                  { name: 'content-type', value: 'application/xml' },
                  { name: 'Authorization', value: 'hello dolly' }
                ]
              },
              name: 'Cascade Restore Test Connection 1'
            })
            promises.push(conn.save())

            fileDefConn = new Connection({
              _userId: userDoc._id,
              type: 'ftp',
              name: 'dummy test file def conn 0',
              ftp: {
                type: 'ftp',
                hostURI: '192.168.1.1',
                password: 'abcd',
                username: 'dave'
              }
            })
            promises.push(fileDefConn.save())

            asyncHelperConn = new Connection({
              _userId: userDoc._id,
              type: 'http',
              http: {
                mediaType: 'xml',
                auth: { type: 'custom' },
                baseURI: 'http://localhost',
                headers: [
                  { name: 'content-type', value: 'application/xml' },
                  { name: 'Authorization', value: 'hello world' }
                ]
              },
              name: 'dummy test connection 1'
            })
            promises.push(asyncHelperConn.save())

            yield promises
            promises = []

            asyncHelperExport = ExportFactory.createExport({
              _userId: userDoc._id,
              _connectionId: asyncHelperConn._id,
              asynchronous: true,
              name: 'async-helper-cascade-restore-exp',
              transform: {
                version: '1',
                rules: [[{ extract: '/@id', generate: 'ItemId' }]]
              },
              http: {
                relativeURI: 'products/async/status/{{data.myId}}',
                method: 'POST',
                response: {
                  resourcePath: '/createResponse/submission'
                }
              }
            })
            promises.push(asyncHelperExport.save())

            yield promises
            promises = []

            asyncHelper = new AsyncHelper({
              _userId: userDoc._id,
              name: 'integration 1 cascade restore helper',
              http: {
                submit: {
                  sameAsStatus: false,
                  resourcePath: '/createResponse/submission',
                  transform: {
                    version: '1',
                    rules: [[{ extract: '/@id', generate: 'ItemId' }]]
                  }
                },
                status: {
                  _exportId: asyncHelperExport._id,
                  statusPath: '/path/to/status'
                }
              }
            })
            promises.push(asyncHelper.save())

            standaloneFileDefinition = new FileDefinition({
              _userId: userDoc._id,
              name: 'Integration FileDefinition',
              version: '1',
              externalId: 'cascade_restore_file_def_integration_one',
              strict: true,
              format: 'fixed',
              skipEmptyEndColDelimiter: true,
              fixed: {
                rowSuffix: '}',
                rowDelimiter: '\t',
                paddingChar: '.'
              },
              rules: [{ name: 'd', elements: [{ name: 'g', value: 'i', length: 1 }] }]
            })
            promises.push(standaloneFileDefinition.save())

            yield promises
            promises = []

            standaloneExport = ExportFactory.createExport({
              _userId: userDoc._id,
              _connectionId: fileDefConn._id,
              name: 'Cascade Restore Test Export 1',
              file: {
                encoding: 'win1252',
                type: 'filedefinition',
                fileDefinition: {
                  resourcePath: '/up/and/down',
                  _fileDefinitionId: standaloneFileDefinition._id
                }
              },
              ftp: {
                directoryPath: '/test/download/path',
                fileNameStartsWith: 'start-',
                fileNameEndsWith: '-end'
              }
            })
            promises.push(standaloneExport.save())

            standaloneImport = ImportFactory.createImport({
              _userId: userDoc._id,
              _connectionId: conn._id,
              name: 'Cascade Restore Test Import 1',
              http: {
                _asyncHelperId: asyncHelper._id,
                relativeURI: ['/documents/async'],
                method: ['PUT'],
                body: [
                  '<modelDep>' +
                  '{{#each data}}' +
                  '  <doc>' +
                  '    <name>{{name}}</name>' +
                  '    <id>{{id}}</id>' +
                  '  </doc>' +
                  '{{/each}}' +
                  '</modelDep>'
                ]
              },
              hooks: {
                postSubmit: {
                  function: 'getName',
                  _scriptId: standaloneScript._id
                }
              }
            })
            promises.push(standaloneImport.save())

            yield promises
            promises = []

            standaloneFlow = new Flow({
              _userId: userDoc._id,
              name: 'Cascade Restore Test Flow 1',
              _exportId: standaloneExport._id,
              _importId: standaloneImport._id
            })
            promises.push(standaloneFlow.save())
           
            yield promises
            promises = []
            let sourceConnection3 =  new Connection(Connection.generateDoc(userDoc, {
              type: 'http',
           
              http: {
                mediaType: 'json',
                baseURI: 'https://some.service.com',
                concurrencyLevel: 22
              }
            }))
            promises.push(sourceConnection3.save())

            yield promises
            promises = []

            var integration2 =  new Integration({ _userId: userDoc._id, name: 'TestIntegrationSyncs-2' + Date.now(), syncs: true })
            promises.push(integration2.save())

            yield promises
            promises = []
            var syncDoc = {
              _userId: userDoc._id,
       
              name: 'TestSync1',
              source: {
               
              }
            }
            syncDoc.name = 'TestSync2'
            syncDoc.source._connectionId = sourceConnection3._id
            syncDoc._integrationId = integration2._id
            let testSync2 = new Sync(syncDoc)
            promises.push(testSync2.save())

            yield promises
            promises = []
            var dataSet = new Dataset({
              _userId: userDoc._id,
              "name": "testDataSet2",
              _syncId: testSync2._id,
              "enable": true,
              "externalId": "testExternalId2",
              _integrationId: integration2._id
            })

            promises.push(dataSet.save())

            yield promises
            promises = []
            var dataSet2 = new Dataset({
              _userId: userDoc._id,
              "name": "no_delete_testDataSet3",
              _syncId: testSync2._id,
              "enable": true,
              "externalId": "testExternalId2",
              _integrationId: integration2._id
            })
            promises.push(dataSet2.save())
            yield promises
            promises = []
            const iclient = new IClient({
              provider: 'salesforce',
              _userId: userDoc._id,
              oauth2: {
                clientId: '123',
                clientSecret: '456'
              }
            })
            promises.push(iclient.save())
            yield promises
            promises = []
            const notification = new Notification({
              _userId: userDoc._id,
              type: 'job_errors',
              nameOrCompany: 'Celigo',
              email: userDoc.email,
              message: 'is inviting you to join their account.'
            })
            promises.push(notification.save())
            yield promises
            promises = []
            promises.push(new Tag(Tag.generateDoc(userDoc._id, { tag: 'test1' })).save())
            yield promises
            promises = []
            promises.push((new EventReport(EventReport.generateDoc(userDoc, {
              type: 'flow_events',
              _flowIds: [standaloneFlow._id],
              startTime: Date.now() - 60 * 60 * 1000
            }))).save())
            yield promises
            promises = []
            promises.push(new AShare({
              _userId: userDoc._id, _sharedWithUserId: test.userAccountManage._id, accessLevel: 'manage', accepted: true, dismissed: false,
              disabled: false,
            }).save())

            yield promises
            promises = []
            let job = new Job({
              _userId: userDoc._id,
              type: 'flow',
              _flowId: standaloneFlow._id,
              status: 'running',
              createdAt: new Date() - 1000000
            })
            promises.push(job.save())
            yield promises

          }).then(() => {
            done()
          }).catch((err) => {
            done(err)
          }
          )
        })
      })
    })

    it('should delete all account docs (unsafe)', async () => {
      const options = {
        uri: `http://localhost:${PORT}/v1/recycleBinTTL/userAccountContents/deleteUnsafe`,
        method: 'DELETE',
        auth: { bearer: testUserJWT },
        body: JSON.stringify({ "ignoreModels": [ "agents", "ashares", "flows"], "ignorePrefix": "no_delete_" }),
        headers: { 'content-type': 'application/json' }
      }
      const expectedResponse = {"message":"User contents scheduled for deletion","totalDeletedCount":34,"deletedCounts":{"flows":1,"exports":2,"imports":1,"asynchelpers":1,"filedefinitions":1,"scripts":1,"connections":4,"integrations":1,"Audit":16,"Dataset":1,"Sync":1,"IClient":1,"Job": 1,"Notification":1,"EventReport":1,"Tag":1},"deletionTimeStamp":1731481788556}
      const resp = await requestPromise(options)
      expect(resp.statusCode).toEqual(200)
      const data = JSON.parse(resp.body)
      expect(data.totalDeletedCount).toBeGreaterThanOrEqual(10)
      expect(data.deletedCounts.flows).toBeGreaterThanOrEqual(1)
      expect(data.deletedCounts.ashares).toEqual(undefined)
      expect(data.deletedCounts).toEqual(expectedResponse.deletedCounts);
    }, 4000)
  })

  describe('agent recycling', () => {
    let agentToDelete
    let agentToRestore
    let connectionToRestore
    let agentToGet

    beforeAll(done => {
      co(function * () {
        let promises = []

        agentToGet = new Agent({
          name: 'agentModelDep1',
          _userId: test.user._id,
          accessToken: 'dummyStandalone_recycleBin_accessToken21b'
        })
        promises.push(agentToGet.save())
        agentToRestore = new Agent({
          name: 'agentModelDep2',
          _userId: test.user._id,
          accessToken: 'dummyStandalone_recycleBin_accessToken21b1'
        })
        promises.push(agentToRestore.save())
        agentToDelete = new Agent({
          name: 'agentModelDep3',
          _userId: test.user._id,
          accessToken: 'dummyStandalone_recycleBin_accessToken21b2'
        })
        promises.push(agentToDelete.save())
        yield promises
        promises = []
        connectionToRestore = new Connection({
          _userId: test.user._id,
          type: 'http',
          _agentId: agentToGet._id,
          http: {
            mediaType: 'xml',
            auth: { type: 'custom' },
            baseURI: 'http://localhost',
            headers: [
              { name: 'content-type', value: 'application/xml' },
              { name: 'Authorization', value: 'hello dolly' }
            ]
          },
          name: 'Cascade Restore Test Connection 1'
        })
        promises.push(connectionToRestore.save())

        yield promises
        promises = []

        const docsToUpdate = [
          agentToDelete,
          agentToRestore,
          connectionToRestore,
          agentToGet
        ]
        for (const updateDoc of docsToUpdate) {
          updateDoc.deletedAt = DELETED_AT_DATE
          promises.push(updateDoc.save())
        }
        yield promises
      }).then(done).catch(done)
    })

    it('for GET/', done => {
      const options = {
        uri: `http://localhost:${PORT}/v1/recycleBinTTL/agents`,
        method: 'GET',
        auth: { bearer: test.user.jwt },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        res.statusCode.should.equal(200)
        should.exist(body)
        body = JSON.parse(body)
        body[0]._id.should.equal(agentToGet._id.toString())
        done()
      })
    })

    it('for GET/:id', done => {
      const options = {
        uri: `http://localhost:${PORT}/v1/recycleBinTTL/agents/` + agentToGet._id.toString(),
        method: 'GET',
        auth: { bearer: test.user.jwt },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        res.statusCode.should.equal(200)
        should.exist(body)
        body = JSON.parse(body)
        body._id.should.equal(agentToGet._id.toString())
        done()
      })
    })

    it('for POST/:id', done => {
      let options = {
        uri: `http://localhost:${PORT}/v1/recycleBinTTL/agents/` + agentToRestore._id.toString(),
        method: 'POST',
        auth: { bearer: test.user.jwt },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        res.statusCode.should.equal(204)
        options = {
          uri: `http://localhost:${PORT}/v1/agents/` + agentToRestore._id.toString(),
          method: 'GET',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          should.not.exist(body.deletedAt)
          done()
        })
      })
    })

    it('for POST/:id/doCascadeRestore', done => {
      let options = {
        uri: `http://localhost:${PORT}/v1/recycleBinTTL/connections/` + connectionToRestore._id.toString() + '/doCascadeRestore',
        method: 'POST',
        auth: { bearer: test.user.jwt },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        res.statusCode.should.equal(204)
        options = {
          uri: `http://localhost:${PORT}/v1/agents/` + agentToGet._id.toString(),
          method: 'GET',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          should.not.exist(body.deletedAt)
          done()
        })
      })
    })

    it('for DELETE/:id', done => {
      let options = {
        uri: `http://localhost:${PORT}/v1/recycleBinTTL/agents/` + agentToDelete._id.toString(),
        method: 'DELETE',
        auth: { bearer: test.user.jwt },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        res.statusCode.should.equal(204)
        options = {
          uri: `http://localhost:${PORT}/v1/agents/` + agentToDelete._id.toString(),
          method: 'GET',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          res.statusCode.should.equal(404)
          done()
        })
      })
    })
  })
  // skip script related tests for now
  describe('script recycling', () => {
    let endToEndScript
    let scriptS3Key

    beforeAll(done => {
      const hash = scriptUtil.sha1(SCRIPT_CODE)

      scriptUtil.create(test.user._id, SCRIPT_CODE, { name: 'cascadeRestoreScript.js', description: 'Cascade Restore Integration 1 Script' }, (err, doc) => {
        if (err) return done(err)
        should.exist(doc)
        doc.hashValue.should.equal(hash)
        endToEndScript = doc
        scriptS3Key = scriptUtil.genS3Key(test.user._id, endToEndScript._id)
        done()
      })
    })

    it('should recycle and restore a Script, and move its S3 object', done => {
      const options = {
        uri: `http://localhost:${PORT}/v1/scripts/${endToEndScript._id.toString()}`,
        method: 'DELETE',
        auth: { bearer: test.user.jwt },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        res.statusCode.should.equal(204)
        body.should.equal('')

        RECYCLED_SCRIPTS_S3U.getFile(scriptS3Key, (err, file) => {
          if (err) return done(err)
          should.exist(file)
          should.exist(file.Body)
          SCRIPT_CODE.should.equal(file.Body.toString())

          SCRIPTS_S3U.getFile(scriptS3Key, (err, file) => {
            should.exist(err)
            err.code.should.equal('NoSuchKey')
            err.message.should.startWith('The specified key does not exist')
            should.not.exist(file)
            options.uri = `http://localhost:${PORT}/v1/recycleBinTTL/scripts/${endToEndScript._id.toString()}`
            options.method = 'POST'

            request(options, (err, res, body) => {
              if (err) return done(err)
              res.statusCode.should.equal(204)
              body.should.equal('')

              SCRIPTS_S3U.getFile(scriptS3Key, (err, file) => {
                if (err) return done(err)
                should.exist(file)
                should.exist(file.Body)
                SCRIPT_CODE.should.equal(file.Body.toString())

                RECYCLED_SCRIPTS_S3U.getFile(scriptS3Key, (err, file) => {
                  should.exist(err)
                  err.code.should.equal('NoSuchKey')
                  err.message.should.startWith('The specified key does not exist')
                  should.not.exist(file)
                  done()
                })
              })
            })
          })
        })
      })
    })
  })

  describe('distributed adaptors', () => {
    let bearerAuth
    let _connectionId
    let distributedConnection
    let exp
    let imp

    beforeAll(done => {
      const rName = 'r' + new Date().getTime()
      const conn = commonUtil.generateNetSuiteConnection()
      let opts = {
        uri: 'http://localhost:' + PORT + '/v1/connections',
        json: conn,
        method: 'POST',
        auth: { bearer: test.user.jwt }
      }

      request(opts, (e, r, b) => {
        if (e) return done(e)
        if (!b._id) return done(new Error('!conn._id'))
        _connectionId = b._id
        opts = {
          uri: `http://localhost:${PORT}/v1/connections/${_connectionId}/ping`,
          json: true,
          method: 'GET',
          auth: { bearer: test.user.jwt }
        }

        request(opts, (e, r, b) => {
          // if (e) return done(e)
          // r.statusCode.should.equal(200)

          Connection.findOne({ _id: _connectionId }).then(conn => {
            distributedConnection = conn

            exp = {
              name: `distributed_recyclebin_exp_${rName}`,
              asynchronous: true,
              _connectionId,
              type: 'distributed',
              distributed: { bearerToken: rName },
              netsuite: {
                type: 'restlet',
                restlet: {
                  recordType: 'customer',
                  searchId: 'dummy'
                }
              }
            }
            imp = {
              name: `distributed_recyclebin_imp_${rName}`,
              distributed: true,
              _connectionId,
              netsuite: {
                operation: 'add',
                recordType: 'Contact'
              }
            }
            bearerAuth = { bearer: test.user.jwt }
            done()
          }).catch(err => {
            return done(err);
          })
        })
      })
    })

    it(
      'should validate that distributed imports are deleted and restored',
      done => {
        let opts = {
          uri: 'http://localhost:' + PORT + '/v1/imports',
          json: imp,
          method: 'POST',
          auth: { bearer: test.user.jwt }
        }

        request(opts, (e, r, b) => {
          if (e) return done(e)
          r.statusCode.should.equal(201)
          const _importId = b._id
          const distributedImp = {
            recordType: 'salesorder',
            operation: 'update',
            internalIdLookup: {
              expression: ['test', 'is', '{xyz}']
            },
            lookups: [{
              name: 'g3Lookup',
              recordType: 'customer',
              allowFailures: true,
              default: '123',
              searchField: 'sf3',
              resultField: 'rf3',
              operator: 'is',
              useDefaultOnMultipleMatches: true
            }, {
              name: 'g4Lookup',
              map: {
                e1: 'g1',
                e2: 'g2'
              }
            }, {
              name: 'l1_gl3Lookup',
              recordType: 'salesorder',
              allowFailures: false,
              searchField: 'sf4',
              resultField: 'rf4',
              operator: 'o4'
            }, {
              name: 'l1_gl4Lookup',
              allowFailures: true,
              map: {
                e1: 'g1',
                e2: 'g2',
                e3: 'g2'
              }
            }, {
              name: 'l2_gl24Lookup',
              recordType: 'salesorder',
              expression: ['test', 'is', 'xyz']
            }],
            mapping: {
              fields: [{
                generate: 'g1',
                hardCodedValue: 'h1'
              }, {
                generate: 'g10',
                hardCodedValue: 'h10',
                internalId: true
              }, {
                generate: 'g2',
                extract: 'e2',
                immutable: true
              }, {
                generate: 'g3',
                extract: 'e3',
                lookupName: 'g3Lookup'
              }, {
                generate: 'g4',
                extract: 'e4',
                lookupName: 'g4Lookup'
              }],
              lists: [{
                generate: 'l1',
                fields: [{
                  generate: 'gl1',
                  hardCodedValue: 'hl1'
                }, {
                  generate: 'gl2',
                  extract: 'el2',
                  internalId: true,
                  immutable: true,
                  isKey: true
                }, {
                  generate: 'gl3',
                  extract: 'el3',
                  lookupName: 'l1_gl3Lookup',
                  isKey: true
                }, {
                  generate: 'gl4',
                  extract: 'el4',
                  lookupName: 'l1_gl4Lookup'
                }]
              }, {
                generate: 'l2',
                fields: [{
                  generate: 'gl2',
                  hardCodedValue: 'hl2',
                  internalId: true
                }, {
                  generate: 'gl22',
                  extract: 'el22'
                }, {
                  generate: 'gl24',
                  extract: 'el24',
                  lookupName: 'l2_gl24Lookup'
                }, {
                  generate: 'gl25',
                  extract: "{{$.one}}-{{$.['Two Three']}}"
                }]
              }]
            }
          }
          opts = {
            uri: `http://localhost:${PORT}/v1/imports/${_importId}/distributed`,
            json: distributedImp,
            method: 'PUT',
            auth: { bearer: test.user.jwt }
          }

          request(opts, (e, r, b) => {
            if (e) return done(e)
            r.statusCode.should.equal(200)
            b._id.should.equal('' + _importId)
            b._userId.should.equal('' + test.user._id)
            b.recordType.should.equal('salesorder')
            b.operation.should.equal('update')
            b.internalIdLookup.should.deepEqual(distributedImp.internalIdLookup)
            opts = {
              uri: `http://localhost:${PORT}/v1/imports/${_importId}`,
              method: 'DELETE',
              auth: bearerAuth
            }
            // Delete from Bin
            request(opts, (e, r, b) => {
              if (e) return done(e)
              r.statusCode.should.equal(204)

              nsUtil.getDAImport(test.user, _importId, (err, r, b) => {
                if (err) return done(err)
                r.statusCode.should.equal(404)
                r.errors.length.should.be.above(0)
                opts.method = 'POST'
                opts = {
                  uri: `http://localhost:${PORT}/v1/recycleBinTTL/imports/${_importId}`,
                  method: 'POST',
                  auth: bearerAuth
                }
                // Restore from Bin
                request(opts, (e, r, b) => {
                  if (err) return done(err)
                  r.statusCode.should.equal(204)

                  test.user.audit = { _byUserId: '5301043caa20740200000001', source: 'api' }
                  nsUtil.getDAImport(test.user, _importId, (err, r, b) => {
                    if (err) return done(err)
                    b._id.should.equal('' + _importId)
                    b._userId.should.equal('' + test.user._id)
                    b.recordType.should.equal('salesorder')
                    b.operation.should.equal('update')
                    b.internalIdLookup.should.deepEqual(distributedImp.internalIdLookup)
                    done()
                  })
                })
              })
            })
          })
        })
      }, 120000
    )

    it(
      'should validate that distributed exports are deleted and restored',
      done => {
        const SORT_FUNCTION = function (a, b) { return a > b ? 1 : -1 }
        let opts = {
          uri: 'http://localhost:' + PORT + '/v1/exports',
          json: exp,
          method: 'POST',
          auth: bearerAuth
        }

        request(opts, (e, r, b) => {
          if (e) return done(e)
          r.statusCode.should.equal(201)
          const _exportId = b._id
          const distributedExp = {
            recordType: 'customer',
            executionContext: ['csvimport', 'userinterface'],
            qualifier: ['testing', '=', 'xyz']
          }
          opts = {
            uri: `http://localhost:${PORT}/v1/exports/${_exportId}/distributed`,
            json: distributedExp,
            method: 'PUT',
            auth: bearerAuth
          }

          request(opts, (e, r, b) => {
            if (e) return done(e)
            r.statusCode.should.equal(200)
            b._id.should.equal('' + _exportId)
            b._userId.should.equal('' + test.user._id)
            b.executionContext.sort(SORT_FUNCTION)
            b.executionContext[0].should.equal('csvimport')
            b.executionContext[1].should.equal('userinterface')
            b.qualifier.should.deepEqual(distributedExp.qualifier)
            b.recordType.should.equal('customer')
            opts = {
              uri: `http://localhost:${PORT}/v1/exports/${_exportId}`,
              method: 'DELETE',
              auth: bearerAuth
            }
            // Delete from Bin
            request(opts, (e, r, b) => {
              if (e) return done(e)
              r.statusCode.should.equal(204)

              nsUtil.getDAExport(test.user, _exportId, (err, r, b) => {
                if (err) return done(err)
                r.statusCode.should.equal(404)
                r.errors.length.should.be.above(0)
                opts = {
                  uri: `http://localhost:${PORT}/v1/recycleBinTTL/exports/${_exportId}`,
                  method: 'POST',
                  auth: bearerAuth
                }
                // Restore from Bin
                request(opts, (e, r, b) => {
                  if (err) return done(err)
                  r.statusCode.should.equal(204)

                  nsUtil.getDAExport(test.user, _exportId, (err, r, b) => {
                    if (err) return done(err)
                    b._id.should.equal('' + _exportId)
                    b._userId.should.equal('' + test.user._id)
                    b.executionContext.sort(SORT_FUNCTION)
                    b.executionContext[0].should.equal('csvimport')
                    b.executionContext[1].should.equal('userinterface')
                    b.qualifier.should.deepEqual(distributedExp.qualifier)
                    b.recordType.should.equal('customer')
                    done()
                  })
                })
              })
            })
          })
        })
      }, 120000
    )

    it(
      'should delete and restore distributed imports even if the distributed adaptor is not installed',
      done => {
        let opts = {
          uri: 'http://localhost:' + PORT + '/v1/imports',
          json: imp,
          method: 'POST',
          auth: bearerAuth
        }

        request(opts, (e, r, b) => {
          if (e) return done(e)
          r.statusCode.should.equal(201)
          const _importId = b._id
          opts = {
            uri: `http://localhost:${PORT}/v1/imports/${_importId}`,
            method: 'DELETE',
            auth: bearerAuth
          }
          // Delete from Bin
          request(opts, (e, r, b) => {
            if (e) return done(e)
            r.statusCode.should.equal(204)

            nsUtil.getDAImport(test.user, _importId, (err, r, b) => {
              if (err) return done(err)
              r.statusCode.should.equal(404)
              r.errors.length.should.be.above(0)
              opts = {
                uri: `http://localhost:${PORT}/v1/recycleBinTTL/imports/${_importId}`,
                method: 'POST',
                auth: bearerAuth
              }
              // Restore from Bin
              request(opts, (e, r, b) => {
                if (err) return done(err)
                r.statusCode.should.equal(204)

                nsUtil.getDAImport(test.user, _importId, (err, r, b) => {
                  if (err) return done(err)
                  r.statusCode.should.equal(400)
                  r.errors.length.should.be.above(0)
                  done()
                })
              })
            })
          })
        })
      }, 120000
    )

    it(
      'should delete and restore distributed exports even if the distributed adaptor is not installed',
      done => {
        let opts = {
          uri: 'http://localhost:' + PORT + '/v1/exports',
          json: exp,
          method: 'POST',
          auth: bearerAuth
        }

        request(opts, (e, r, b) => {
          if (e) return done(e)
          r.statusCode.should.equal(201)
          const _exportId = b._id
          opts = {
            uri: `http://localhost:${PORT}/v1/exports/${_exportId}`,
            method: 'DELETE',
            auth: bearerAuth
          }
          // Delete from Bin
          request(opts, (e, r, b) => {
            if (e) return done(e)
            r.statusCode.should.equal(204)

            nsUtil.getDAExport(test.user, _exportId, (err, r, b) => {
              if (err) return done(err)
              r.statusCode.should.equal(404)
              r.errors.length.should.be.above(0)
              opts = {
                method: 'POST',
                uri: `http://localhost:${PORT}/v1/recycleBinTTL/exports/${_exportId}`,
                auth: bearerAuth
              }
              // Restore from Bin
              request(opts, (e, r, b) => {
                if (err) return done(err)
                r.statusCode.should.equal(204)

                nsUtil.getDAExport(test.user, _exportId, (err, r, b) => {
                  if (err) return done(err)
                  r.statusCode.should.equal(404)
                  r.errors.length.should.be.above(0)
                  done()
                })
              })
            })
          })
        })
      }, 120000
    )
  })

  describe('Delete flows', () => {
    let eventReport

    afterAll(done => {
      EventReport.remove({}, done)
    })

    it(
      'should not delete a flow document when there is an associated eventreport in queued or running state.',
      done => {
        dbUtil.createModelInstance('Flow', { _userId: test.user._id }, done, function (id, flowDoc) {
          const startTime = new Date(Date.now() - (1 * 24 * 60 * 60 * 1000))
          const endTime = new Date(Date.now())
          new EventReport({
            _userId: test.user._id,
            type: 'flow_events',
            _requestedByUserId: test.user._id,
            startTime,
            endTime,
            status: 'queued',
            _flowIds: [flowDoc._id]
          }).save().then(doc => {
            eventReport = doc
            const options = {
              uri: `http://localhost:${PORT}/v1/flows/${flowDoc._id.toString()}`,
              method: 'DELETE',
              auth: { bearer: test.user.jwt },
              headers: { 'content-type': 'application/json' }
            }

            request(options, (err, res, body) => {
              if (err) return done(err)

              res.statusCode.should.equal(422)
              const error = JSON.parse(body)
              error.errors[0].code.should.be.equal('delete_not_allowed')
              error.errors[0].message.should.be.equal(`Please cancel the eventreport (${eventReport._id}) or wait for it to complete before deleting the flow.`)

              EventReport.findOneAndUpdate({ _userId: test.user._id, _flowIds: [flowDoc._id], _id: doc._id }, { startedAt: Date.now(), status: 'running' }, (err, doc) => {
                should.not.exist(err)

                request(options, (err, res, body) => {
                  if (err) return done(err)

                  res.statusCode.should.equal(422)
                  const error = JSON.parse(body)
                  error.errors[0].code.should.be.equal('delete_not_allowed')
                  error.errors[0].message.should.be.equal(`Please cancel the eventreport (${eventReport._id}) or wait for it to complete before deleting the flow.`)

                  EventReport.findOneAndUpdate({ _userId: test.user._id, _id: doc._id, _flowIds: [flowDoc._id] }, { endedAt: Date.now(), status: 'completed' }, (err) => {
                    if (err) return done(err)

                    request(options, (err, res, body) => {
                      if (err) return done(err)

                      res.statusCode.should.equal(204)
                      body.should.equal('')
                      done()
                    })
                  })
                })
              })
            })
          }).catch(err => {
            return done(err);
          })
        })
      }
    )

    it(
      'should not delete a flow document when there is an associated eventreport in queued or running state. Scenario is when there are multiple flows associated with an eventreport.',
      done => {
        let flowDoc1, flowDoc2, eventReport1, eventReport2
        dbUtil.createModelInstance('Flow', { _userId: test.user._id }, done, function (id, flowDoc) {
          flowDoc1 = flowDoc
          dbUtil.createModelInstance('Flow', { _userId: test.user._id }, done, function (id, flowDoc) {
            flowDoc2 = flowDoc
            const startTime = new Date(Date.now() - (1 * 24 * 60 * 60 * 1000))
            const endTime = new Date(Date.now())
            new EventReport({
              _userId: test.user._id,
              type: 'flow_events',
              _requestedByUserId: test.user._id,
              startTime,
              endTime,
              status: 'queued',
              _flowIds: [flowDoc1._id, flowDoc2._id]
            }).save().then(doc => {
              eventReport1 = doc

              new EventReport({
                _userId: test.user._id,
                type: 'flow_events',
                _requestedByUserId: test.user._id,
                startTime,
                endTime,
                status: 'queued',
                _flowIds: [flowDoc2._id]
              }).save().then(doc => {
                eventReport2 = doc
                const options = {
                  uri: `http://localhost:${PORT}/v1/flows/${flowDoc2._id.toString()}`,
                  method: 'DELETE',
                  auth: { bearer: test.user.jwt },
                  headers: { 'content-type': 'application/json' }
                }

                request(options, (err, res, body) => {
                  if (err) return done(err)

                  res.statusCode.should.equal(422)
                  const error = JSON.parse(body)
                  error.errors[0].code.should.be.equal('delete_not_allowed')
                  error.errors[0].message.should.be.equal(`Please cancel the eventreport (${eventReport1._id}) or wait for it to complete before deleting the flow.`)

                  EventReport.findOneAndUpdate({ _userId: test.user._id, _id: eventReport1._id, _flowIds: [flowDoc1._id, flowDoc2._id] }, { startedAt: Date.now(), status: 'running' }, (err, doc) => {
                    should.not.exist(err)

                    request(options, (err, res, body) => {
                      if (err) return done(err)

                      res.statusCode.should.equal(422)
                      const error = JSON.parse(body)
                      error.errors[0].code.should.be.equal('delete_not_allowed')
                      error.errors[0].message.should.be.equal(`Please cancel the eventreport (${eventReport1._id}) or wait for it to complete before deleting the flow.`)

                      EventReport.findOneAndUpdate({ _userId: test.user._id, _id: eventReport1._id, _flowIds: [flowDoc1._id, flowDoc2._id] }, { endedAt: Date.now(), status: 'completed' }, (err) => {
                        if (err) return done(err)

                        // should not allow to delete the flow, as we have another eventReport for flow2 in queued status
                        request(options, (err, res, body) => {
                          if (err) return done(err)

                          res.statusCode.should.equal(422)
                          const error = JSON.parse(body)
                          error.errors[0].code.should.be.equal('delete_not_allowed')
                          error.errors[0].message.should.be.equal(`Please cancel the eventreport (${eventReport2._id}) or wait for it to complete before deleting the flow.`)

                          options.uri = `http://localhost:${PORT}/v1/flows/${flowDoc1._id.toString()}`
                          request(options, (err, res, body) => {
                            if (err) return done(err)
                            res.statusCode.should.equal(204)
                            body.should.equal('')

                            EventReport.findOneAndUpdate({ _userId: test.user._id, _id: eventReport2._id, _flowIds: [flowDoc2._id] }, { endedAt: Date.now(), status: 'running' }, (err) => {
                              if (err) return done(err)

                              options.uri = `http://localhost:${PORT}/v1/flows/${flowDoc2._id.toString()}`
                              request(options, (err, res, body) => {
                                if (err) return done(err)

                                res.statusCode.should.equal(422)
                                const error = JSON.parse(body)
                                error.errors[0].code.should.be.equal('delete_not_allowed')
                                error.errors[0].message.should.be.equal(`Please cancel the eventreport (${eventReport2._id}) or wait for it to complete before deleting the flow.`)

                                EventReport.findOneAndUpdate({ _userId: test.user._id, _id: eventReport2._id, _flowIds: [flowDoc2._id] }, { endedAt: Date.now(), status: 'completed' }, (err) => {
                                  if (err) return done(err)

                                  request(options, (err, res, body) => {
                                    if (err) return done(err)
                                    res.statusCode.should.equal(204)
                                    body.should.equal('')
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
                })
              }).catch(err => {
                return done(err);
              })
            }).catch(err => {
              return done(err);
            })
          })
        })
      }
    )
  })

  describe('script delete', () => {
    let baseUrl
    let integrationId = ''
    let scriptId = ''
    let flowGroupId = ''
    let creatAt = null
    beforeAll((done) => {
      baseUrl = 'http://localhost:' + PORT + '/v1/'
      let opts = {
        uri: baseUrl + 'integrations',
        method: 'POST',
        auth: {
          bearer: test.user.jwt
        },
        json: {
          name: 'testIntergrationX',
          description: 'test integration',
          sandbox: false
        }
      }

      request(opts, (e, r, b) => {
        if (e) return done(e)
        expect(r.statusCode).toBe(201)
        integrationId = r.body._id
        creatAt = Date.now()
        opts = {
          uri: baseUrl + 'integrations/' + integrationId,
          method: 'PUT',
          auth: {
            bearer: test.user.jwt
          },
          json: {
            _id: integrationId,
            name: 'testIntergrationX',
            description: 'test integration',
            sandbox: false,
            lastModified: creatAt,
            install: [],
            _registeredConnectionIds: [],
            installSteps: [],
            uninstallSteps: [],
            flowGroupings: [{
              name: 'testFlowGroupX'
            }],
            createdAt: creatAt
          }
        }

        request(opts, (e, r, b) => {
          if (e) return done(e)
          expect(r.statusCode).toBe(200)
          flowGroupId = r.body.flowGroupings[0]._id
          opts = {
            uri: baseUrl + 'scripts',
            method: 'POST',
            auth: {
              bearer: test.user.jwt
            },
            json: {
              content: "/*\n* handleRequest function stub:\n*\n* The name of the function can be changed to anything you like.\n*\n* The function will be passed one 'options' argument that has the following fields:\n*   'method' - http request method (uppercase string).\n*   'headers' - http request headers (object).  \n*   'queryString' - http request query string (object).\n*   'body' - parsed http request body (object, or undefined if unable to parse).\n*   'rawBody' - raw http request body (string).\n*\n* The function needs to return a response object that has the following fields:\n*   ‘statusCode’ - http response status code (number).\n*   'headers' - http response headers overrides (object, optional).\n*   'body' - http response body (string or object).\n* Throwing an exception will signal an error.\n*/ \nfunction handleRequest (options) {\n  return {\n    statusCode: 200,\n    headers: { },\n    body: options.body\n  }\n}",
              insertFunction: 'handleRequest',
              name: 'testScriptX'
            }
          }

          request(opts, (e, r, b) => {
            if (e) return done(e)
            expect(r.statusCode).toBe(201)
            scriptId = r.body._id

            opts = {
              uri: baseUrl + 'integrations/' + integrationId,
              method: 'PUT',
              auth: {
                bearer: test.user.jwt
              },
              json: {
                _id: integrationId,
                name: 'testIntergrationX',
                description: 'test integration',
                sandbox: false,
                lastModified: Date.now(),
                install: [],
                _registeredConnectionIds: [],
                installSteps: [],
                uninstallSteps: [],
                flowGroupings: [{
                  name: 'testFlowGroupX',
                  _id: flowGroupId,
                  settingsForm: {
                    form: {
                      fieldMap: {},
                      layout: {
                        fields: []
                      }
                    },
                    init: {
                      function: 'handleRequest',
                      _scriptId: scriptId
                    }
                  }
                }],
                createdAt: creatAt
              }
            }

            request(opts, (e, r, b) => {
              if (e) return done(e)
              expect(r.statusCode).toBe(200)
              done()
            })
          })
        })
      })
    })

    it(
      'A user should not be able to delete the script which has integration as dependency',
      done => {
        const opts = {
          uri: baseUrl + 'scripts/' + scriptId,
          method: 'DELETE',
          auth: {
            bearer: test.user.jwt
          },
          json: true
        }
        request(opts, (e, r, b) => {
          if (e) return done(e)
          expect(r.statusCode).toBe(422)
          done()
        })
      }
    )
  })

  describe('Delete ediProfiles', () => {
    let unUsedEdiProfileId, usedEdiProfileId, ediProfileDoc1
    beforeAll(done => {
      dbUtil1.createIntegrationWithEdiProfiles(test.user, function (err, integrationDoc, fileDefinitionDoc, ediProfileDoc, importDoc1, exportDoc1, connectionDoc) {
        if (err) return done(err)
        usedEdiProfileId = ediProfileDoc._id

        ediProfileDoc1 = {
          name: 'EDIProfileDeletionTest 1 ' + Date.now(),
          description: 'test description',
          fileType: 'edix12',
          // interchange fields
          isa01: '00',
          isa02: '',
          isa03: '01',
          isa04: '',
          tpIdQualifier: '01',
          tpInterchangeId: '12345',
          myIdQualifier: '01',
          myInterchangeId: '12345',
          isa11: 'U',
          isa12: '00401',
          isa14: '0',
          isa15: 'P',
          isa16: '>',
          // group fields
          tpGroupId: '12345',
          myGroupId: '12345',
          gs07: 'X',
          gs08: '004010'
        }
        new EDIProfile(EDIProfile.generateDoc(test.user, ediProfileDoc1)).save().then(doc => {
          unUsedEdiProfileId = doc._id
          done()
        }).catch(err => {
          return done(err);
        })
      })
    })

    afterAll(done => {
      EDIProfile.deleteMany({}).lean().exec().then(doc => {
        done()
      }).catch(err => {
        done(err);
      })
    })

    it('should not allow to delete ediprofile for invalid bearer token', function (done) {
      const invalidAccessToken = test.user2.jwt
      const options = {
        uri: `http://localhost:${PORT}/v1/ediprofiles/${unUsedEdiProfileId.toString()}`,
        method: 'DELETE',
        auth: { bearer: 'xyz' },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        expect(res.statusCode).toEqual(401)
        done()
      })
    })

    it('should list the dependencies on ediprofile which is associated with any export/import', function (done) {
      const options = {
        uri: `http://localhost:${PORT}/v1/ediprofiles/${usedEdiProfileId.toString()}/dependencies`,
        method: 'GET',
        auth: { bearer: test.user.jwt },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        expect(res.statusCode).toEqual(200)
        expect(body).toBeDefined()
        const responseDoc = JSON.parse(body)
        expect(responseDoc.exports.length).toEqual(1)
        expect(responseDoc.flows.length).toEqual(1)
        expect(responseDoc.imports.length).toEqual(1)
        expect(responseDoc.integrations.length).toEqual(1)
        done()
      })
    })

    it('should be able to delete ediprofile which is not associated with any export/import', function (done) {
      const options = {
        uri: `http://localhost:${PORT}/v1/ediprofiles/${unUsedEdiProfileId.toString()}`,
        method: 'DELETE',
        auth: { bearer: test.user.jwt },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        expect(res.statusCode).toEqual(204)
        done()
      })
    })

    it('should be able to delete ediprofile which is not associated with any export/import in SANDBOX', function (done) {
      ediProfileDoc1.sandbox = true
      new EDIProfile(EDIProfile.generateDoc(test.user, ediProfileDoc1)).save().then(ediDoc => {
        const options = {
          uri: `http://localhost:${PORT}/v1/ediprofiles/${ediDoc._id.toString()}`,
          method: 'DELETE',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          expect(res.statusCode).toEqual(204)
          done()
        })
      }).catch(err => {
        return done(err);
      })
    })

    it('should not allow to delete ediprofile which is already deleted', function (done) {
      ediProfileDoc1.name = 'new EDI Profile TEST'
      new EDIProfile(EDIProfile.generateDoc(test.user, ediProfileDoc1)).save().then(ediDoc => {
        const options = {
          uri: `http://localhost:${PORT}/v1/ediprofiles/${ediDoc._id.toString()}`,
          method: 'DELETE',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          expect(res.statusCode).toEqual(204)

          const expected = {
            errors:
              [
                {
                  code: 'invalid_ref',
                  message: 'You are trying to access a EDIProfile that is already in the Recycle Bin. Please restore it from the Recycle Bin and try your request again.'
                }
              ]
          }

          request(options, (err, res, body) => {
            if (err) return done(err)
            expect(res.statusCode).toEqual(404)
            const responseBody = JSON.parse(body)
            expect(responseBody).toEqual(expected)
            done()
          })
        })
      }).catch(err => {
        return done(err);
      })
    })

    it('should not be able to delete ediprofile which is associated with any export/import', function (done) {
      const options = {
        uri: `http://localhost:${PORT}/v1/ediprofiles/${usedEdiProfileId.toString()}`,
        method: 'DELETE',
        auth: { bearer: test.user.jwt },
        headers: { 'content-type': 'application/json' }
      }

      request(options, (err, res, body) => {
        if (err) return done(err)
        expect(res.statusCode).toEqual(422)
        expect(body).toBeDefined()
        const responseDoc = JSON.parse(body)
        expect(responseDoc.errors[0].code).toEqual('dependencies_not_deleted')
        expect(responseDoc.errors[1].code).toEqual('dependencies_not_deleted')
        expect(responseDoc.errors[2].code).toEqual('dependencies_not_deleted')
        done()
      })
    })

    it('should be able to delete ediprofile which is not associated with any export/import and then restore it', function (done) {
      ediProfileDoc1.name = 'new EDI Profile TEST 2'
      new EDIProfile(EDIProfile.generateDoc(test.user, ediProfileDoc1)).save().then(doc => {
        const options = {
          uri: `http://localhost:${PORT}/v1/ediprofiles/${doc._id.toString()}`,
          method: 'DELETE',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          expect(res.statusCode).toEqual(204)

          const options2 = {
            uri: `http://localhost:${PORT}/v1/recycleBinTTL/ediprofiles/${doc._id.toString()}/doCascadeRestore`,
            method: 'POST',
            auth: { bearer: test.user.jwt },
            headers: { 'content-type': 'application/json' }
          }

          request(options2, (err, res, body) => {
            if (err) return done(err)
            expect(res.statusCode).toEqual(204)
            done()
          })
        })
      }).catch(err => {
        return done(err);
      })
    })

    describe('should restore ediprofile which is associated with any export/import that is being restored', function (done) {
      let ediDocId, FdDocId, conDocId, expDocId
      beforeAll(function (done) {
        ediProfileDoc1.name = 'new EDI Profile TEST restore'
        new EDIProfile(EDIProfile.generateDoc(test.user, ediProfileDoc1)).save().then(ediDoc => {
          ediDocId = ediDoc._id

          const filedefinitionDoc = {
            version: '1',
            name: 'flowDefinition1',
            format: 'delimited',
            delimited: {
              rowSuffix: '~',
              rowDelimiter: '\n',
              colDelimiter: ','
            },
            rules: [
              {
                maxOccurrence: 10,
                name: 'r1',
                elements: [
                  { name: 'e1', value: 'hardcoded' },
                  { name: 'e2', value: '{{name}}' },
                  { name: 'e3', value: '{{age}}' }
                ]
              }
            ]
          }
          new FileDefinition(FileDefinition.generateDoc(test.user, filedefinitionDoc)).save().then(FdDoc => {
            FdDocId = FdDoc._id

            dbUtil1.createFtpConnection(test.user, (err, conDoc) => {
              if (err) return done(err)

              const exportDoc = {
                _connectionId: conDoc._id,
                _ediProfileId: ediDoc._id,
                file: {
                  skipAggregation: true,
                  type: 'filedefinition',
                  fileDefinition: {
                    resourcePath: 'Address',
                    _fileDefinitionId: FdDoc._id
                  }
                },
                ftp: {
                  directoryPath: '/qq/zz'
                }
              }
              new Export(Export.generateDoc(test.user, exportDoc)).save().then(expDoc => {
                expDocId = expDoc._id
                done()
              }).catch(err => {
                return done(err);
              })
            })
          }).catch(err => {
            return done(err);
          })
        }).catch(err => {
          return done(err);
        })
      })

      it('should restore ediprofiles after export is restored', function (done) {
        const options = {
          uri: `http://localhost:${PORT}/v1/exports/${expDocId.toString()}`,
          method: 'DELETE',
          auth: { bearer: test.user.jwt },
          headers: { 'content-type': 'application/json' }
        }

        request(options, (err, res, body) => {
          if (err) return done(err)
          res.statusCode.should.equal(204)

          const options2 = {
            uri: `http://localhost:${PORT}/v1/ediprofiles/${ediDocId.toString()}`,
            method: 'DELETE',
            auth: { bearer: test.user.jwt },
            headers: { 'content-type': 'application/json' }
          }

          request(options2, (err, res, body) => {
            if (err) return done(err)
            expect(res.statusCode).toEqual(204)

            const options3 = {
              uri: `http://localhost:${PORT}/v1/recycleBinTTL/exports/${expDocId.toString()}/doCascadeRestore`,
              method: 'POST',
              auth: { bearer: test.user.jwt },
              headers: { 'content-type': 'application/json' }
            }

            request(options3, (err, res, body) => {
              if (err) return done(err)
              expect(res.statusCode).toEqual(204)

              const options4 = {
                uri: `http://localhost:${PORT}/v1/ediprofiles/${ediDocId.toString()}`,
                method: 'GET',
                auth: { bearer: test.user.jwt },
                headers: { 'content-type': 'application/json' }
              }

              request(options4, (err, res, body) => {
                if (err) return done(err)
                expect(res.statusCode).toEqual(200)
                done()
              })
            })
          })
        })
      })
    })
  })
})
