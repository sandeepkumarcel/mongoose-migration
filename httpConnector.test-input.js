'use strict'

const commonUtil = require('../../util/commonUtil.js')
const integratorAdaptor = require('integrator-adaptor')
const exp = require('constants')
const Connection = integratorAdaptor.Connection
const HttpConnector = integratorAdaptor.HttpConnector
const Import = integratorAdaptor.Import
const Export = integratorAdaptor.Export
const nconf = require('nconf')
const _ = require('lodash')
let resourceBase

describe('HttpConnector API tests', function () {
  let _exportId
  let _importId
  let httpConnId

  beforeAll(function (done) {
    resourceBase = 'http://localhost:'+ nconf.get('PORT') + '/v1/httpconnectors/'
    // testUtil.waitUtil.waitForDBCleanUp(function () {
    const connJson = {
      type: 'http',
      name: 'HTTP Unittest Connection',
      http: {
        mediaType: 'xml',
        auth: {
          type: 'basic',
          basic: {
            username: 'goodUser',
            password: 'goodPass'
          }
        },
        baseURI: 'https://localhost',
        headers: [
          { name: 'content-type', value: 'application/xml' }
        ]
      },
      settings: {
        name: 'connection',
        type: 'settings'
      }
    }

    new Connection(Connection.generateDoc(test.user, connJson)).save(function (err, connDoc) {
      expect(err).toBeNull()
      expect(connDoc._id).toBeDefined()
      httpConnId = connDoc._id

      const importJson = {
        _userId: test.user._id,
        _connectionId: httpConnId,
        name: 'dummy_test_import',
        http: {
          relativeURI: ['relativeURI1', 'relativeURI2'],
          method: ['PUT', 'POST'],
          requestMediaType: 'xml',
          body: ['bodyTemplate1', 'bodyTemplate2']
        },
        settings: {
          name: 'import',
          type: 'settings'
        }
      }
      const exportJson = {
        _userId: test.user._id,
        _connectionId: httpConnId,
        name: 'Export',
        http: {
          method: 'GET',
          relativeURI: 'rest/subschema/needed/for/rest/export',
          response: {
            resourcePath: 'test'
          }
        },
        settings: {
          name: 'export',
          type: 'settings'
        }
      }

      new Import(Import.generateDoc(test.user, importJson)).save(function (err, importDoc) {
        if (err) return done(err)

        _importId = importDoc._id.toString()

        new Export(Export.generateDoc(test.user, exportJson)).save(function (err, exportDoc) {
          if (err) return done(err)

          _exportId = exportDoc._id.toString()
          done()
        })
      })
    })
    // })
  })

  afterAll(function (done) {
    HttpConnector.deleteMany({ _userId: test.user._id }, function (err) {
      if (err) return done(err)
      done()
    })
  })

  describe('CRUD operations', function () {
    test('should create a full http connector using versions, get it by id, update it, then delete it', function (done) {
      const httpConn1 =
      {
        _userId: test.user._id,
        name: 'test_connector1',
        baseURIs: ['https://base1.com', 'https://base2.com'],
        versioning: {
          location: 'header',
          headerName: 'dummyHeader'
        },
        published: true,
        helpURL: 'https://docs.celigo.com/test',
        legacyId: 'shopify',
        versions: [
          {
            name: 'test_version1',
            published: true,
            supportedBy: {
              export: {
                conditions: [
                  {
                    _id: '6311cb869707a085cc081a92',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition1'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  },
                  {
                    _id: '6311cb869707a085cc081a93',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition2'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  }
                ],
                preConfiguredFields: [
                  {
                    path: 'dummyExportPreConfiguredFields1',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a92']
                  },
                  {
                    path: 'dummyExportPreConfiguredFields2',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a93']
                  }
                ],
                fieldsUserMustSet: [
                  {
                    path: 'dummyExportFieldsUserMustSet1',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a92'],
                    helpURL: 'https://www.dummy.com',
                    labelOverride: 'override2'
                  },
                  {
                    path: 'dummyExportFieldsUserMustSet2',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a93'],
                    helpURL: 'https://www.dummy.com'
                  }
                ]
              },
              import: {
                conditions: [
                  {
                    _id: '6311cb869707a085cc081a92',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition1'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  },
                  {
                    _id: '6311cb869707a085cc081a93',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition2'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  }
                ],
                preConfiguredFields: [
                  {
                    path: 'dummyImportPreConfiguredFields1',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a92']
                  },
                  {
                    path: 'dummyImportPreConfiguredFields2',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a93']
                  }
                ],
                fieldsUserMustSet: [
                  {
                    path: 'dummyImportFieldsUserMustSet1',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a92'],
                    helpURL: 'https://www.dummy.com',
                    labelOverride: 'override4'
                  },
                  {
                    path: 'dummyImportFieldsUserMustSet2',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a93'],
                    helpURL: 'https://www.dummy.com'
                  }
                ],
                pathParameterToIdentifyExisting: 'dummyPathParameterToIdentifyExisting'
              },
              connection: {
                conditions: [
                  {
                    _id: '6311cb869707a085cc081a92',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition1'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  },
                  {
                    _id: '6311cb869707a085cc081a93',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition2'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  }
                ],
                preConfiguredFields: [
                  {
                    path: 'dummyConnectionPreConfiguredFields1',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a92']
                  },
                  {
                    path: 'dummyConnectionPreConfiguredFields2',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a93']
                  }
                ],
                fieldsUserMustSet: [
                  {
                    path: 'dummyConnectionFieldsUserMustSet1',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a92'],
                    helpURL: 'https://www.dummy.com',
                    labelOverride: 'override6'
                  },
                  {
                    path: 'dummyConnectionFieldsUserMustSet2',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a93'],
                    helpURL: 'https://www.dummy.com'
                  }
                ]
              }
            }
          }
        ],
        preBuiltExports: [
          {
            _exportId,
            published: false
          }
        ],
        preBuiltImports: [
          {
            _importId,
            published: false
          }
        ],
        supportedBy: {
          export: {
            conditions: [
              {
                _id: '6311cb869707a085cc081a92',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition1'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              },
              {
                _id: '6311cb869707a085cc081a93',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition2'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              }
            ],
            preConfiguredFields: [
              {
                path: 'dummyExportPreConfiguredFields1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92']
              },
              {
                path: 'dummyExportPreConfiguredFields2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93']
              }
            ],
            fieldsUserMustSet: [
              {
                path: 'dummyExportFieldsUserMustSet1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92'],
                helpURL: 'https://www.dummy.com',
                labelOverride: 'override2'
              },
              {
                path: 'dummyExportFieldsUserMustSet2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93'],
                helpURL: 'https://www.dummy.com'
              }
            ]
          },
          import: {
            conditions: [
              {
                _id: '6311cb869707a085cc081a92',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition1'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              },
              {
                _id: '6311cb869707a085cc081a93',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition2'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              }
            ],
            preConfiguredFields: [
              {
                path: 'dummyExportPreConfiguredFields1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92']
              },
              {
                path: 'dummyExportPreConfiguredFields2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93']
              }
            ],
            fieldsUserMustSet: [
              {
                path: 'dummyExportFieldsUserMustSet1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92'],
                helpURL: 'https://www.dummy.com',
                labelOverride: 'override4'
              },
              {
                path: 'dummyExportFieldsUserMustSet2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93'],
                helpURL: 'https://www.dummy.com'
              }
            ],
            pathParameterToIdentifyExisting: 'dummyPathParameterToIdentifyExisting'
          },
          connection: {
            conditions: [
              {
                _id: '6311cb869707a085cc081a92',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition1'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              },
              {
                _id: '6311cb869707a085cc081a93',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition2'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              }
            ],
            preConfiguredFields: [
              {
                path: 'dummyExportPreConfiguredFields1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92']
              },
              {
                path: 'dummyExportPreConfiguredFields2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93']
              }
            ],
            fieldsUserMustSet: [
              {
                path: 'dummyExportFieldsUserMustSet1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92'],
                helpURL: 'https://www.dummy.com',
                labelOverride: 'override6'
              },
              {
                path: 'dummyExportFieldsUserMustSet2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93'],
                helpURL: 'https://www.dummy.com'
              }
            ]
          }
        }
      }

      const options =
        {
          uri: resourceBase,
          json: httpConn1,
          bearerToken: test.user.jwt
        }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        expect(res.statusCode).toBe(201)
        validateHttpConnector(body, httpConn1)
        const httpConnId = body._id
        const options =
          {
            uri: resourceBase + httpConnId,
            bearerToken: test.user.jwt
          }
        commonUtil.getRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          expect(res.statusCode).toBe(200)
          validateHttpConnector(body, httpConn1)
          httpConn1.versions.push(
            {
              name: 'test_version2',
              baseURIs: ['https://dummy3.com/', 'https://dummy4.com/'],
              published: false,
              supportedBy: {}
            })
          const options =
            {
              uri: resourceBase + httpConnId,
              json: httpConn1,
              bearerToken: test.user.jwt
            }
          commonUtil.putRequest(options, function (error, res, body) {
            expect(error).toBeNull()
            expect(res.statusCode).toBe(200)
            const options =
              {
                uri: resourceBase + httpConnId,
                bearerToken: test.user.jwt
              }
            commonUtil.getRequest(options, function (error, res, body) {
              expect(error).toBeNull()
              expect(res.statusCode).toBe(200)
              validateHttpConnector(body, httpConn1)
              const options =
                {
                  uri: resourceBase + httpConnId,
                  bearerToken: test.user.jwt
                }
              commonUtil.deleteRequest(options, function (error, res, body) {
                expect(error).toBeNull()
                expect(res.statusCode).toBe(204)
                const options =
                  {
                    uri: resourceBase + httpConnId,
                    bearerToken: test.user.jwt
                  }
                commonUtil.getRequest(options, function (error, res, body) {
                  expect(error).toBeNull()
                  expect(res.statusCode).toBe(404)
                  done()
                })
              })
            })
          })
        })
      })
    })

    test('should create a full http connector using apis, get it by id, update it, then delete it', function (done) {
      const httpConn1 =
      {
        _userId: test.user._id,
        name: 'test_connector1',
        published: false,
        helpURL: 'https://docs.celigo.com/test',
        legacyId: 'shopify',
        apis: [
          {
            name: 'dummyApi',
            published: false,
            baseURIs: ['https://dummy3.com//:_version'],
            isGraphQL: true,
            versioning: {
              location: 'uri'
            },
            versions: [
              {
                name: 'test_version1',
                published: false,
                supportedBy: {}
              }
            ],
            supportedBy: {
              export: {
                conditions: [
                  {
                    _id: '6311cb869707a085cc081a92',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition1'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  },
                  {
                    _id: '6311cb869707a085cc081a93',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition2'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  }
                ],
                preConfiguredFields: [
                  {
                    path: 'dummyExportPreConfiguredFields1',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a92']
                  },
                  {
                    path: 'dummyExportPreConfiguredFields2',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a93']
                  }
                ],
                fieldsUserMustSet: [
                  {
                    path: 'dummyExportFieldsUserMustSet1',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a92'],
                    helpURL: 'https://www.dummy.com',
                    labelOverride: 'override2'
                  },
                  {
                    path: 'dummyExportFieldsUserMustSet2',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a93'],
                    helpURL: 'https://www.dummy.com'
                  }
                ]
              },
              import: {
                conditions: [
                  {
                    _id: '6311cb869707a085cc081a92',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition1'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  },
                  {
                    _id: '6311cb869707a085cc081a93',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition2'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  }
                ],
                preConfiguredFields: [
                  {
                    path: 'dummyImportPreConfiguredFields1',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a92']
                  },
                  {
                    path: 'dummyImportPreConfiguredFields2',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a93']
                  }
                ],
                fieldsUserMustSet: [
                  {
                    path: 'dummyImportFieldsUserMustSet1',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a92'],
                    helpURL: 'https://www.dummy.com',
                    labelOverride: 'override4'
                  },
                  {
                    path: 'dummyImportFieldsUserMustSet2',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a93'],
                    helpURL: 'https://www.dummy.com'
                  }
                ],
                pathParameterToIdentifyExisting: 'dummyPathParameterToIdentifyExisting'
              },
              connection: {
                conditions: [
                  {
                    _id: '6311cb869707a085cc081a92',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition1'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  },
                  {
                    _id: '6311cb869707a085cc081a93',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition2'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  }
                ],
                preConfiguredFields: [
                  {
                    path: 'dummyConnectionPreConfiguredFields1',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a92']
                  },
                  {
                    path: 'dummyConnectionPreConfiguredFields2',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a93']
                  }
                ],
                fieldsUserMustSet: [
                  {
                    path: 'dummyConnectionFieldsUserMustSet1',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a92'],
                    helpURL: 'https://www.dummy.com',
                    labelOverride: 'override6'
                  },
                  {
                    path: 'dummyConnectionFieldsUserMustSet2',
                    values: ['a', 'b', 'c'],
                    _conditionIds: ['6311cb869707a085cc081a93'],
                    helpURL: 'https://www.dummy.com'
                  }
                ]
              }
            }
          }
        ],
        preBuiltExports: [
          {
            _exportId,
            published: false
          }
        ],
        preBuiltImports: [
          {
            _importId,
            published: false
          }
        ],
        supportedBy: {
          export: {
            conditions: [
              {
                _id: '6311cb869707a085cc081a92',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition1'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              },
              {
                _id: '6311cb869707a085cc081a93',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition2'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              }
            ],
            preConfiguredFields: [
              {
                path: 'dummyExportPreConfiguredFields1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92']
              },
              {
                path: 'dummyExportPreConfiguredFields2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93']
              }
            ],
            fieldsUserMustSet: [
              {
                path: 'dummyExportFieldsUserMustSet1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92'],
                helpURL: 'https://www.dummy.com',
                labelOverride: 'override2'
              },
              {
                path: 'dummyExportFieldsUserMustSet2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93'],
                helpURL: 'https://www.dummy.com'
              }
            ]
          },
          import: {
            conditions: [
              {
                _id: '6311cb869707a085cc081a92',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition1'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              },
              {
                _id: '6311cb869707a085cc081a93',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition2'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              }
            ],
            preConfiguredFields: [
              {
                path: 'dummyExportPreConfiguredFields1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92']
              },
              {
                path: 'dummyExportPreConfiguredFields2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93']
              }
            ],
            fieldsUserMustSet: [
              {
                path: 'dummyExportFieldsUserMustSet1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92'],
                helpURL: 'https://www.dummy.com',
                labelOverride: 'override4'
              },
              {
                path: 'dummyExportFieldsUserMustSet2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93'],
                helpURL: 'https://www.dummy.com'
              }
            ],
            pathParameterToIdentifyExisting: 'dummyPathParameterToIdentifyExisting'
          },
          connection: {
            conditions: [
              {
                _id: '6311cb869707a085cc081a92',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition1'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              },
              {
                _id: '6311cb869707a085cc081a93',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition2'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              }
            ],
            preConfiguredFields: [
              {
                path: 'dummyExportPreConfiguredFields1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92']
              },
              {
                path: 'dummyExportPreConfiguredFields2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93']
              }
            ],
            fieldsUserMustSet: [
              {
                path: 'dummyExportFieldsUserMustSet1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92'],
                helpURL: 'https://www.dummy.com',
                labelOverride: 'override6'
              },
              {
                path: 'dummyExportFieldsUserMustSet2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93'],
                helpURL: 'https://www.dummy.com'
              }
            ]
          }
        }
      }

      const options =
        {
          uri: resourceBase,
          json: httpConn1,
          bearerToken: test.user.jwt
        }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        expect(res.statusCode).toBe(201)
        expect(body.__numOfBlobEndpoints).toBeUndefined()
        validateHttpConnector(body, httpConn1)
        const httpConnId = body._id
        const options =
          {
            uri: resourceBase + httpConnId,
            bearerToken: test.user.jwt
          }
        commonUtil.getRequest(options, function (error, res, body) {

          expect(error).toBeNull()
          expect(res.statusCode).toBe(200)
          validateHttpConnector(body, httpConn1)
          // removing isGraphQL from the PUT request
          delete httpConn1.apis[0].isGraphQL
          httpConn1.apis[0].versions.push(
            {
              name: 'test_version2',
              baseURIs: ['https://dummy3.com/', 'https://dummy4.com/'],
              published: false,
              supportedBy: {}
            })
          httpConn1.apis[0].legacyId = 'walmart'
          httpConn1.legacyId = undefined
          const options =
            {
              uri: resourceBase + httpConnId,
              json: httpConn1,
              bearerToken: test.user.jwt
            }
          commonUtil.putRequest(options, function (error, res, body) {
            expect(error).toBeNull()
            expect(res.statusCode).toBe(200)
            const options =
              {
                uri: resourceBase + httpConnId,
                bearerToken: test.user.jwt
              }
            commonUtil.getRequest(options, function (error, res, body) {
              expect(error).toBeNull()
              expect(res.statusCode).toBe(200)
              // Since its a boolean field, so default value is false
              httpConn1.apis[0].isGraphQL = false
              validateHttpConnector(body, httpConn1)
              const options =
                {
                  uri: resourceBase + httpConnId,
                  bearerToken: test.user.jwt
                }
              commonUtil.deleteRequest(options, function (error, res, body) {
                expect(error).toBeNull()
                expect(res.statusCode).toBe(204)
                const options =
                  {
                    uri: resourceBase + httpConnId,
                    bearerToken: test.user.jwt
                  }
                commonUtil.getRequest(options, function (error, res, body) {
                  expect(error).toBeNull()
                  expect(res.statusCode).toBe(404)
                  done()
                })
              })
            })
          })
        })
      })
    })
  })

  describe('Validations', function () {
    // Will always output missing versions or api. Those validation tests will be done in the next describe section
    describe('should fail top level validations', function () {
      test('should output errors if missing top level fields', function (done) {
        const httpConn1 =
          {
            _userId: test.user._id
          }
        const options =
          {
            uri: resourceBase,
            json: httpConn1,
            bearerToken: test.user.jwt
          }
        commonUtil.postRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          expect(res.statusCode).toBe(422)
          expect(body.errors[0].code).toBe('missing_required_field')
          expect(body.errors[0].field).toBe('version_or_api')
          expect(body.errors[0].message).toBe('Versions or apis must be defined.')
          expect(body.errors[1].field).toBe('name')
          expect(body.errors[1].code).toBe('missing_required_field')

          done()
        })
      })

      test('should output query versioning error', function (done) {
        const httpConn1 =
          {
            name: 'testconnector',
            _userId: test.user._id,
            versioning: {
              queryParameterName: 'test'
            }
          }
        const options =
          {
            uri: resourceBase,
            json: httpConn1,
            bearerToken: test.user.jwt
          }
        commonUtil.postRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          expect(res.statusCode).toBe(422)
          expect(body.errors).toEqual([
            {
              field: 'versioning.location',
              code: 'missing_required_field',
              message: 'Expected field: location to be present.'
            },
            {
              code: 'missing_required_field',
              field: 'version_or_api',
              message: 'Versions or apis must be defined.'
            }
          ])
          done()
        })
      })

      test('should output incorrect header + headerName field versioning error', function (done) {
        const httpConn1 =
          {
            name: 'testconnector',
            _userId: test.user._id,
            versioning: {
              location: 'header',
              queryParameterName: 'test'
            }
          }
        const options =
          {
            uri: resourceBase,
            json: httpConn1,
            bearerToken: test.user.jwt
          }
        commonUtil.postRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          expect(res.statusCode).toBe(422)
          expect(body.errors).toEqual([
            {
              field: 'versioning.headerName',
              code: 'missing_required_field',
              message: 'Expected field: headerName to be present.'
            },
            {
              code: 'missing_required_field',
              field: 'version_or_api',
              message: 'Versions or apis must be defined.'
            }
          ])
          done()
        })
      })

      test('should output incorrect query + queryParameterName field versioning error', function (done) {
        const httpConn1 =
          {
            name: 'testconnector',
            _userId: test.user._id,
            versioning: {
              location: 'query_parameter',
              headerName: 'test'
            }
          }
        const options =
          {
            uri: resourceBase,
            json: httpConn1,
            bearerToken: test.user.jwt
          }
        commonUtil.postRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          expect(res.statusCode).toBe(422)
          expect(body.errors).toEqual([
            {
              field: 'versioning.queryParameterName',
              code: 'missing_required_field',
              message: 'Expected field: queryParameterName to be present.'
            },
            {
              code: 'missing_required_field',
              field: 'version_or_api',
              message: 'Versions or apis must be defined.'
            }
          ])
          done()
        })
      })

      test('should output errors for incorrect supportedBy fields', function (done) {
        const httpConn1 =
          {
            _userId: test.user._id,
            supportedBy: {
              export: {
                preConfiguredFields: [
                  { path: 'dummyPath1', values: ['dummyValue1'] },
                  { path: 'dummyPath2' },
                  { values: ['dummyValue2'] }
                ],
                fieldsUserMustSet: [
                  { path: 'dummyPath1', values: ['dummyValue1'] },
                  { path: 'dummyPath2' },
                  { values: ['dummyValue2'] }
                ]
              },
              import: {
                preConfiguredFields: [
                  { path: 'dummyPath1', values: ['dummyValue1'] },
                  { path: 'dummyPath2' },
                  { values: ['dummyValue2'] }
                ],
                fieldsUserMustSet: [
                  { path: 'dummyPath1', values: ['dummyValue1'] },
                  { path: 'dummyPath2' },
                  { values: ['dummyValue2'] }
                ]
              },
              connection: {
                preConfiguredFields: [
                  { path: 'dummyPath1', values: ['dummyValue1'] },
                  { path: 'dummyPath2' },
                  { values: ['dummyValue2'] }
                ],
                fieldsUserMustSet: [
                  { path: 'dummyPath1', values: ['dummyValue1'] },
                  { path: 'dummyPath2' },
                  { values: ['dummyValue2'] }
                ]
              }
            },
            versioning: {}
          }
        const options =
          {
            uri: resourceBase,
            json: httpConn1,
            bearerToken: test.user.jwt
          }
        commonUtil.postRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          expect(res.statusCode).toBe(422)
          expect(body.errors).toEqual([
            {
              code: 'missing_required_field',
              field: 'version_or_api',
              message: 'Versions or apis must be defined.'
            },
            {
              field: 'supportedBy.export.preConfiguredFields[1].values',
              code: 'missing_required_field',
              message: 'Expected field: values to be present.'
            },
            {
              field: 'supportedBy.export.preConfiguredFields[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'supportedBy.export.fieldsUserMustSet[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'supportedBy.import.preConfiguredFields[1].values',
              code: 'missing_required_field',
              message: 'Expected field: values to be present.'
            },
            {
              field: 'supportedBy.import.preConfiguredFields[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'supportedBy.import.fieldsUserMustSet[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'supportedBy.connection.preConfiguredFields[1].values',
              code: 'missing_required_field',
              message: 'Expected field: values to be present.'
            },
            {
              field: 'supportedBy.connection.preConfiguredFields[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'supportedBy.connection.fieldsUserMustSet[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'name',
              code: 'missing_required_field',
              message: 'Path `name` is required.'
            }
          ])
          done()
        })
      })
    })

    describe('should fail api level validations', function () {
      test('should output errors for empty apis array', function (done) {
        const httpConn1 =
          {
            _userId: test.user._id,
            name: 'dummy httpConnector',
            apis: [{}]
          }
        const options =
          {
            uri: resourceBase,
            json: httpConn1,
            bearerToken: test.user.jwt
          }
        commonUtil.postRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          expect(res.statusCode).toBe(422)
          expect(body.errors).toEqual([
            {
              field: 'apis[0].name',
              code: 'missing_required_field',
              message: 'Expected field: name to be present.'
            },
            {
              field: 'apis[0].baseURIs',
              code: 'missing_required_field',
              message: 'Expected field: baseURIs to be present.'
            },
            {
              field: 'apis[0].versions',
              code: 'missing_required_field',
              message: 'Expected field: versions to be present.'
            }
          ])
          done()
        })
      })

      test('should output errors for incorrect api supportedBy fields', function (done) {
        const httpConn1 =
          {
            _userId: test.user._id,
            name: 'dummy httpConnector',
            apis: [{
              name: 'dummyName',
              baseURIs: ['dummyBaseURI'],
              versions: [{
                name: 'v1',
                published: true
              }],
              supportedBy: {
                export: {
                  preConfiguredFields: [
                    { path: 'dummyPath1', values: ['dummyValue1'] },
                    { path: 'dummyPath2' },
                    { values: ['dummyValue2'] }
                  ],
                  fieldsUserMustSet: [
                    { path: 'dummyPath1', values: ['dummyValue1'] },
                    { path: 'dummyPath2' },
                    { values: ['dummyValue2'] }
                  ]
                },
                import: {
                  preConfiguredFields: [
                    { path: 'dummyPath1', values: ['dummyValue1'] },
                    { path: 'dummyPath2' },
                    { values: ['dummyValue2'] }
                  ],
                  fieldsUserMustSet: [
                    { path: 'dummyPath1', values: ['dummyValue1'] },
                    { path: 'dummyPath2' },
                    { values: ['dummyValue2'] }
                  ]
                },
                connection: {
                  preConfiguredFields: [
                    { path: 'dummyPath1', values: ['dummyValue1'] },
                    { path: 'dummyPath2' },
                    { values: ['dummyValue2'] }
                  ],
                  fieldsUserMustSet: [
                    { path: 'dummyPath1', values: ['dummyValue1'] },
                    { path: 'dummyPath2' },
                    { values: ['dummyValue2'] }
                  ]
                }
              }
            }]
          }
        const options =
          {
            uri: resourceBase,
            json: httpConn1,
            bearerToken: test.user.jwt
          }
        commonUtil.postRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          expect(res.statusCode).toBe(422)
          expect(body.errors).toEqual([
            {
              field: 'apis[0].supportedBy.export.preConfiguredFields[1].values',
              code: 'missing_required_field',
              message: 'Expected field: values to be present.'
            },
            {
              field: 'apis[0].supportedBy.export.preConfiguredFields[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'apis[0].supportedBy.export.fieldsUserMustSet[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'apis[0].supportedBy.import.preConfiguredFields[1].values',
              code: 'missing_required_field',
              message: 'Expected field: values to be present.'
            },
            {
              field: 'apis[0].supportedBy.import.preConfiguredFields[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'apis[0].supportedBy.import.fieldsUserMustSet[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'apis[0].supportedBy.connection.preConfiguredFields[1].values',
              code: 'missing_required_field',
              message: 'Expected field: values to be present.'
            },
            {
              field: 'apis[0].supportedBy.connection.preConfiguredFields[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'apis[0].supportedBy.connection.fieldsUserMustSet[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            }
          ])
          done()
        })
      })

      test('should output errors for incorrect and duplicate legacyids at api level', function (done) {
        const httpConn1 =
          {
            _userId: test.user._id,
            name: 'dummy httpConnector',
            apis: [{
              name: 'dummyName',
              baseURIs: ['dummyBaseURI'],
              legacyId: 'amazon',
              versions: [{
                name: 'v1',
                published: true
              }]
            }, {
              name: 'dummyName2',
              baseURIs: ['dummyBaseURI'],
              legacyId: 'walmart',
              versions: [{
                name: 'v1',
                published: true
              }]
            }, {
              name: 'dummyName3',
              baseURIs: ['dummyBaseURI'],
              legacyId: 'walmart',
              versions: [{
                name: 'v1',
                published: true
              }]
            }]
          }
        const options =
          {
            uri: resourceBase,
            json: httpConn1,
            bearerToken: test.user.jwt
          }
        commonUtil.postRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          expect(res.statusCode).toBe(422)
          expect(body.errors).toEqual([
            {
              field: 'apis[2].legacyId',
              code: 'legacyid_already_taken',
              message: 'An HTTP API with legacyId \'walmart\' is already present. Please use a different Legacy Id.'
            },
            {
              field: 'legacyId',
              code: 'enum',
              message: '`amazon` is not a valid enum value for path `legacyId`.'
            }
          ])
          done()
        })
      })
    })

    describe('should fail version level validations', function () {
      test('should output errors for empty versions', function (done) {
        const httpConn1 =
        {
          _userId: test.user._id,
          name: 'dummy httpConnector',
          versions: [{}]
        }
        const options =
          {
            uri: resourceBase,
            json: httpConn1,
            bearerToken: test.user.jwt
          }
        commonUtil.postRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          expect(res.statusCode).toBe(422)
          expect(body.errors).toEqual([
            {
              field: 'baseURIs',
              code: 'missing_required_field',
              message: 'Expected field: baseURIs to be present.'
            },
            {
              field: 'versions[0].name',
              code: 'missing_required_field',
              message: 'Expected field: name to be present.'
            }
          ])
          done()
        })
      })

      test('should output errors for invalid version supportedBy', function (done) {
        const httpConn1 =
        {
          _userId: test.user._id,
          name: 'dummy httpConnector',
          baseURIs: ['dummyTopLevelBaseUri'],
          versions: [
            {
              name: 'v1',
              published: true,
              supportedBy: {
                export: {
                  preConfiguredFields: [
                    { path: 'dummyPath1', values: ['dummyValue1'] },
                    { path: 'dummyPath2' },
                    { values: ['dummyValue2'] }
                  ],
                  fieldsUserMustSet: [
                    { path: 'dummyPath1', values: ['dummyValue1'] },
                    { path: 'dummyPath2' },
                    { values: ['dummyValue2'] }
                  ]
                },
                import: {
                  preConfiguredFields: [
                    { path: 'dummyPath1', values: ['dummyValue1'] },
                    { path: 'dummyPath2' },
                    { values: ['dummyValue2'] }
                  ],
                  fieldsUserMustSet: [
                    { path: 'dummyPath1', values: ['dummyValue1'] },
                    { path: 'dummyPath2' },
                    { values: ['dummyValue2'] }
                  ]
                },
                connection: {
                  preConfiguredFields: [
                    { path: 'dummyPath1', values: ['dummyValue1'] },
                    { path: 'dummyPath2' },
                    { values: ['dummyValue2'] }
                  ],
                  fieldsUserMustSet: [
                    { path: 'dummyPath1', values: ['dummyValue1'] },
                    { path: 'dummyPath2' },
                    { values: ['dummyValue2'] }
                  ]
                }
              }
            }
          ]
        }
        const options =
          {
            uri: resourceBase,
            json: httpConn1,
            bearerToken: test.user.jwt
          }
        commonUtil.postRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          expect(res.statusCode).toBe(422)
          expect(body.errors).toEqual([
            {
              field: 'versions[0].supportedBy.export.preConfiguredFields[1].values',
              code: 'missing_required_field',
              message: 'Expected field: values to be present.'
            },
            {
              field: 'versions[0].supportedBy.export.preConfiguredFields[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'versions[0].supportedBy.export.fieldsUserMustSet[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'versions[0].supportedBy.import.preConfiguredFields[1].values',
              code: 'missing_required_field',
              message: 'Expected field: values to be present.'
            },
            {
              field: 'versions[0].supportedBy.import.preConfiguredFields[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'versions[0].supportedBy.import.fieldsUserMustSet[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'versions[0].supportedBy.connection.preConfiguredFields[1].values',
              code: 'missing_required_field',
              message: 'Expected field: values to be present.'
            },
            {
              field: 'versions[0].supportedBy.connection.preConfiguredFields[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            },
            {
              field: 'versions[0].supportedBy.connection.fieldsUserMustSet[2].path',
              code: 'missing_required_field',
              message: 'Expected field: path to be present.'
            }
          ])
          done()
        })
      })
    })
  })

  describe('PUT v1/httpConnectors/:id', function () {
    let httpConn, httpConnWithApis
    beforeAll(function () {
      httpConn = {
        _userId: test.user._id,
        name: 'test_connector_update',
        baseURIs: ['https://base1.com', 'https://base2.com'],
        versioning: {
          location: 'header',
          headerName: 'dummyHeader'
        },
        published: true,
        helpURL: 'https://docs.celigo.com/test',
        legacyId: 'shopify',
        versions: [
          {
            name: 'test_version1',
            published: true,
            supportedBy: {
              export: {
                conditions: [
                  {
                    _id: '6311cb869707a085cc081a92',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition1'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  },
                  {
                    _id: '6311cb869707a085cc081a93',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition2'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  }
                ],
                preConfiguredFields: [
                  {
                    path: 'dummyExportPreConfiguredFields1',
                    values: ['a', 'b', 'c']
                  },
                  {
                    path: 'dummyExportPreConfiguredFields2',
                    values: ['a', 'b', 'c']
                  }
                ],
                fieldsUserMustSet: [
                  {
                    path: 'dummyExportFieldsUserMustSet1',
                    values: ['a', 'b', 'c'],
                    helpURL: 'https://www.dummy.com',
                    labelOverride: 'override2'
                  },
                  {
                    path: 'dummyExportFieldsUserMustSet2',
                    values: ['a', 'b', 'c'],
                    helpURL: 'https://www.dummy.com'
                  }
                ]
              },
              import: {
                conditions: [
                  {
                    _id: '6311cb869707a085cc081a92',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition1'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  },
                  {
                    _id: '6311cb869707a085cc081a93',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition2'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  }
                ],
                preConfiguredFields: [
                  {
                    path: 'dummyImportPreConfiguredFields1',
                    values: ['a', 'b', 'c']
                  },
                  {
                    path: 'dummyImportPreConfiguredFields2',
                    values: ['a', 'b', 'c']
                  }
                ],
                fieldsUserMustSet: [
                  {
                    path: 'dummyImportFieldsUserMustSet1',
                    values: ['a', 'b', 'c'],
                    helpURL: 'https://www.dummy.com',
                    labelOverride: 'override4'
                  },
                  {
                    path: 'dummyImportFieldsUserMustSet2',
                    values: ['a', 'b', 'c'],
                    helpURL: 'https://www.dummy.com'
                  }
                ],
                pathParameterToIdentifyExisting: 'dummyPathParameterToIdentifyExisting'
              },
              connection: {
                conditions: [
                  {
                    _id: '6311cb869707a085cc081a92',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition1'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  },
                  {
                    _id: '6311cb869707a085cc081a93',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition2'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  }
                ],
                preConfiguredFields: [
                  {
                    path: 'dummyConnectionPreConfiguredFields1',
                    values: ['a', 'b', 'c']
                  },
                  {
                    path: 'dummyConnectionPreConfiguredFields2',
                    values: ['a', 'b', 'c']
                  }
                ],
                fieldsUserMustSet: [
                  {
                    path: 'dummyConnectionFieldsUserMustSet1',
                    values: ['a', 'b', 'c'],
                    helpURL: 'https://www.dummy.com',
                    labelOverride: 'override6'
                  },
                  {
                    path: 'dummyConnectionFieldsUserMustSet2',
                    values: ['a', 'b', 'c'],
                    helpURL: 'https://www.dummy.com'
                  }
                ]
              }
            }
          }
        ],
        preBuiltExports: [
          {
            _exportId: _exportId,
            published: false
          }
        ],
        preBuiltImports: [
          {
            _importId: _importId,
            published: false
          }
        ],
        supportedBy: {
          export: {
            conditions: [
              {
                _id: '6311cb869707a085cc081a92',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition1'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              },
              {
                _id: '6311cb869707a085cc081a93',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition2'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              }
            ],
            preConfiguredFields: [
              {
                path: 'dummyExportPreConfiguredFields1',
                values: ['a', 'b', 'c']
              },
              {
                path: 'dummyExportPreConfiguredFields2',
                values: ['a', 'b', 'c']
              }
            ],
            fieldsUserMustSet: [
              {
                path: 'dummyExportFieldsUserMustSet1',
                values: ['a', 'b', 'c'],
                helpURL: 'https://www.dummy.com',
                labelOverride: 'override2'
              },
              {
                path: 'dummyExportFieldsUserMustSet2',
                values: ['a', 'b', 'c'],
                helpURL: 'https://www.dummy.com'
              }
            ]
          },
          import: {
            conditions: [
              {
                _id: '6311cb869707a085cc081a92',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition1'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              },
              {
                _id: '6311cb869707a085cc081a93',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition2'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              }
            ],
            preConfiguredFields: [
              {
                path: 'dummyExportPreConfiguredFields1',
                values: ['a', 'b', 'c']
              },
              {
                path: 'dummyExportPreConfiguredFields2',
                values: ['a', 'b', 'c']
              }
            ],
            fieldsUserMustSet: [
              {
                path: 'dummyExportFieldsUserMustSet1',
                values: ['a', 'b', 'c'],
                helpURL: 'https://www.dummy.com',
                labelOverride: 'override4'
              },
              {
                path: 'dummyExportFieldsUserMustSet2',
                values: ['a', 'b', 'c'],
                helpURL: 'https://www.dummy.com'
              }
            ],
            pathParameterToIdentifyExisting: 'dummyPathParameterToIdentifyExisting'
          },
          connection: {
            conditions: [
              {
                _id: '6311cb869707a085cc081a92',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition1'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              },
              {
                _id: '6311cb869707a085cc081a93',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition2'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              }
            ],
            preConfiguredFields: [
              {
                path: 'dummyExportPreConfiguredFields1',
                values: ['a', 'b', 'c']
              },
              {
                path: 'dummyExportPreConfiguredFields2',
                values: ['a', 'b', 'c']
              }
            ],
            fieldsUserMustSet: [
              {
                path: 'dummyExportFieldsUserMustSet1',
                values: ['a', 'b', 'c'],
                helpURL: 'https://www.dummy.com',
                labelOverride: 'override6'
              },
              {
                path: 'dummyExportFieldsUserMustSet2',
                values: ['a', 'b', 'c'],
                helpURL: 'https://www.dummy.com'
              }
            ]
          },
          iClient: {
            conditions: [
              {
                _id: '6311cb869707a085cc081123',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition1'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              },
              {
                _id: '6311cb869707a085cc081456',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition2'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              }
            ],
            preConfiguredFields: [
              {
                path: 'dummyExportPreConfiguredFields1',
                values: ['a', 'b', 'c']
              },
              {
                path: 'dummyExportPreConfiguredFields2',
                values: ['a', 'b', 'c']
              }
            ],
            fieldsUserMustSet: [
              {
                path: 'dummyExportFieldsUserMustSet1',
                values: ['a', 'b', 'c'],
                helpURL: 'https://www.dummy.com',
                labelOverride: 'override6'
              },
              {
                path: 'dummyExportFieldsUserMustSet2',
                values: ['a', 'b', 'c'],
                helpURL: 'https://www.dummy.com'
              }
            ]
          }
        }
      }
      httpConnWithApis = {
        _userId: test.user._id,
        name: 'test_connector_apis',
        published: false,
        helpURL: 'https://docs.celigo.com/test',
        legacyId: 'shopify',
        apis: [
          {
            name: 'dummyApi',
            published: false,
            baseURIs: ['https://dummy3.com//:_version'],
            isGraphQL: true,
            versioning: {
              location: 'uri'
            },
            versions: [
              {
                name: 'test_version1',
                published: false,
                supportedBy: {}
              }
            ],
            supportedBy: {
              export: {
                conditions: [
                  {
                    _id: '6311cb869707a085cc081a92',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition1'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  },
                  {
                    _id: '6311cb869707a085cc081a93',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition2'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  }
                ],
                preConfiguredFields: [
                  {
                    path: 'dummyExportPreConfiguredFields1',
                    values: ['a', 'b', 'c']
                  },
                  {
                    path: 'dummyExportPreConfiguredFields2',
                    values: ['a', 'b', 'c']
                  }
                ],
                fieldsUserMustSet: [
                  {
                    path: 'dummyExportFieldsUserMustSet1',
                    values: ['a', 'b', 'c'],
                    helpURL: 'https://www.dummy.com',
                    labelOverride: 'override2'
                  },
                  {
                    path: 'dummyExportFieldsUserMustSet2',
                    values: ['a', 'b', 'c'],
                    helpURL: 'https://www.dummy.com'
                  }
                ]
              },
              import: {
                conditions: [
                  {
                    _id: '6311cb869707a085cc081a92',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition1'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  },
                  {
                    _id: '6311cb869707a085cc081a93',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition2'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  }
                ],
                preConfiguredFields: [
                  {
                    path: 'dummyImportPreConfiguredFields1',
                    values: ['a', 'b', 'c']
                  },
                  {
                    path: 'dummyImportPreConfiguredFields2',
                    values: ['a', 'b', 'c']
                  }
                ],
                fieldsUserMustSet: [
                  {
                    path: 'dummyImportFieldsUserMustSet1',
                    values: ['a', 'b', 'c'],
                    helpURL: 'https://www.dummy.com',
                    labelOverride: 'override4'
                  },
                  {
                    path: 'dummyImportFieldsUserMustSet2',
                    values: ['a', 'b', 'c'],
                    helpURL: 'https://www.dummy.com'
                  }
                ],
                pathParameterToIdentifyExisting: 'dummyPathParameterToIdentifyExisting'
              },
              connection: {
                conditions: [
                  {
                    _id: '6311cb869707a085cc081a92',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition1'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  },
                  {
                    _id: '6311cb869707a085cc081a93',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition2'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  }
                ],
                preConfiguredFields: [
                  {
                    path: 'dummyConnectionPreConfiguredFields1',
                    values: ['a', 'b', 'c']
                  },
                  {
                    path: 'dummyConnectionPreConfiguredFields2',
                    values: ['a', 'b', 'c']
                  }
                ],
                fieldsUserMustSet: [
                  {
                    path: 'dummyConnectionFieldsUserMustSet1',
                    values: ['a', 'b', 'c'],
                    helpURL: 'https://www.dummy.com',
                    labelOverride: 'override6'
                  },
                  {
                    path: 'dummyConnectionFieldsUserMustSet2',
                    values: ['a', 'b', 'c'],
                    helpURL: 'https://www.dummy.com'
                  }
                ]
              },
              iClient: {
                conditions: [
                  {
                    _id: '6311cb869707a085cc081123',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition1'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  },
                  {
                    _id: '6311cb869707a085cc081456',
                    condition: {
                      expression: {
                        rules: [
                          'equals',
                          [
                            'string',
                            [
                              'extract',
                              'http',
                              'condition'
                            ]
                          ],
                          'condition2'
                        ],
                        version: '1'
                      },
                      type: 'expression'
                    }
                  }
                ],
                preConfiguredFields: [
                  {
                    path: 'dummyExportPreConfiguredFields1',
                    values: ['a', 'b', 'c']
                  },
                  {
                    path: 'dummyExportPreConfiguredFields2',
                    values: ['a', 'b', 'c']
                  }
                ],
                fieldsUserMustSet: [
                  {
                    path: 'dummyExportFieldsUserMustSet1',
                    values: ['a', 'b', 'c'],
                    helpURL: 'https://www.dummy.com',
                    labelOverride: 'override6'
                  },
                  {
                    path: 'dummyExportFieldsUserMustSet2',
                    values: ['a', 'b', 'c'],
                    helpURL: 'https://www.dummy.com'
                  }
                ]
              }
            }
          }
        ],
        preBuiltExports: [
          {
            _exportId: _exportId,
            published: false
          }
        ],
        preBuiltImports: [
          {
            _importId: _importId,
            published: false
          }
        ],
        supportedBy: {
          export: {
            conditions: [
              {
                _id: '6311cb869707a085cc081a92',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition1'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              },
              {
                _id: '6311cb869707a085cc081a93',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition2'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              }
            ],
            preConfiguredFields: [
              {
                path: 'dummyExportPreConfiguredFields1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92']
              },
              {
                path: 'dummyExportPreConfiguredFields2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93']
              }
            ],
            fieldsUserMustSet: [
              {
                path: 'dummyExportFieldsUserMustSet1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92'],
                helpURL: 'https://www.dummy.com',
                labelOverride: 'override2'
              },
              {
                path: 'dummyExportFieldsUserMustSet2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93'],
                helpURL: 'https://www.dummy.com'
              }
            ]
          },
          import: {
            conditions: [
              {
                _id: '6311cb869707a085cc081a92',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition1'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              },
              {
                _id: '6311cb869707a085cc081a93',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition2'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              }
            ],
            preConfiguredFields: [
              {
                path: 'dummyExportPreConfiguredFields1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92']
              },
              {
                path: 'dummyExportPreConfiguredFields2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93']
              }
            ],
            fieldsUserMustSet: [
              {
                path: 'dummyExportFieldsUserMustSet1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92'],
                helpURL: 'https://www.dummy.com',
                labelOverride: 'override4'
              },
              {
                path: 'dummyExportFieldsUserMustSet2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93'],
                helpURL: 'https://www.dummy.com'
              }
            ],
            pathParameterToIdentifyExisting: 'dummyPathParameterToIdentifyExisting'
          },
          connection: {
            conditions: [
              {
                _id: '6311cb869707a085cc081a92',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition1'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              },
              {
                _id: '6311cb869707a085cc081a93',
                condition: {
                  expression: {
                    rules: [
                      'equals',
                      [
                        'string',
                        [
                          'extract',
                          'http',
                          'condition'
                        ]
                      ],
                      'condition2'
                    ],
                    version: '1'
                  },
                  type: 'expression'
                }
              }
            ],
            preConfiguredFields: [
              {
                path: 'dummyExportPreConfiguredFields1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92']
              },
              {
                path: 'dummyExportPreConfiguredFields2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93']
              }
            ],
            fieldsUserMustSet: [
              {
                path: 'dummyExportFieldsUserMustSet1',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a92'],
                helpURL: 'https://www.dummy.com',
                labelOverride: 'override6'
              },
              {
                path: 'dummyExportFieldsUserMustSet2',
                values: ['a', 'b', 'c'],
                _conditionIds: ['6311cb869707a085cc081a93'],
                helpURL: 'https://www.dummy.com'
              }
            ]
          }
        }
      }
    })

    test('should be able to remove supportedBy.*.preConfiguredFields', function (done) {
      let httpConnector = _.cloneDeep(httpConn)

      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        httpConnector.supportedBy.export.preConfiguredFields = []
        httpConnector.supportedBy.import.preConfiguredFields = []
        httpConnector.supportedBy.connection.preConfiguredFields = []
        httpConnector.supportedBy.iClient.preConfiguredFields = []

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.supportedBy.export).not.toHaveProperty('preConfiguredFields')
          expect(body.supportedBy.import).not.toHaveProperty('preConfiguredFields')
          expect(body.supportedBy.connection).not.toHaveProperty('preConfiguredFields')
          expect(body.supportedBy.iClient).not.toHaveProperty('preConfiguredFields')
          done()
        })
      })
    })

    test('should be able to remove supportedBy.*.fieldsUserMustSet', function (done) {
      let httpConnector = _.cloneDeep(httpConn)
      httpConnector.name = 'test_connector_update_1'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        httpConnector.supportedBy.export.fieldsUserMustSet = []
        httpConnector.supportedBy.import.fieldsUserMustSet = []
        httpConnector.supportedBy.connection.fieldsUserMustSet = []
        httpConnector.supportedBy.iClient.fieldsUserMustSet = []

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.supportedBy.export).not.toHaveProperty('fieldsUserMustSet')
          expect(body.supportedBy.import).not.toHaveProperty('fieldsUserMustSet')
          expect(body.supportedBy.connection).not.toHaveProperty('fieldsUserMustSet')
          expect(body.supportedBy.iClient).not.toHaveProperty('fieldsUserMustSet')
          done()
        })
      })
    })

    test('should be able to remove supportedBy.*.conditions', function (done) {
      let httpConnector = _.cloneDeep(httpConn)
      httpConnector.name = 'test_connector_update_2'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.supportedBy.export.conditions
        delete httpConnector.supportedBy.import.conditions
        delete httpConnector.supportedBy.connection.conditions
        delete httpConnector.supportedBy.iClient.conditions

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.supportedBy.export).not.toHaveProperty('conditions')
          expect(body.supportedBy.import).not.toHaveProperty('conditions')
          expect(body.supportedBy.connection).not.toHaveProperty('conditions')
          expect(body.supportedBy.iClient).not.toHaveProperty('conditions')
          done()
        })
      })
    })

    test('should be able to remove supportedBy.import.pathParameterToIdentifyExisting', function (done) {
      let httpConnector = _.cloneDeep(httpConn)
      httpConnector.name = 'test_connector_update_3'

      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.supportedBy.import.pathParameterToIdentifyExisting

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.supportedBy.import).not.toHaveProperty('pathParameterToIdentifyExisting')
          done()
        })
      })
    })

    test('should be able to remove supportedBy.export/import', function (done) {
      let httpConnector = _.cloneDeep(httpConn)
      httpConnector.name = 'test_connector_update_4'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.supportedBy.export
        delete httpConnector.supportedBy.import

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.supportedBy).not.toHaveProperty('export')
          expect(body.supportedBy).not.toHaveProperty('import')
          done()
        })
      })
    })

    test('should be able to remove supportedBy.connection/iClient', function (done) {
      let httpConnector = _.cloneDeep(httpConn)
      httpConnector.name = 'test_connector_update_5'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.supportedBy.connection
        delete httpConnector.supportedBy.iClient

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.supportedBy).not.toHaveProperty('connection')
          expect(body.supportedBy).not.toHaveProperty('iClient')
          done()
        })
      })
    })

    test('should be able to remove supportedBy field', function (done) {
      let httpConnector = _.cloneDeep(httpConn)
      httpConnector.name = 'test_connector_update_6'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.supportedBy

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body).not.toHaveProperty('supportedBy')
          done()
        })
      })
    })

    test('should be able to remove preBuiltExports', function (done) {
      let httpConnector = _.cloneDeep(httpConn)
      httpConnector.name = 'test_connector_update_7'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.preBuiltExports

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body).not.toHaveProperty('preBuiltExports')
          done()
        })
      })
    })

    test('should be able to remove preBuiltImports', function (done) {
      let httpConnector = _.cloneDeep(httpConn)
      httpConnector.name = 'test_connector_update_8'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.preBuiltImports

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body).not.toHaveProperty('preBuiltImports')
          done()
        })
      })
    })

    test('should be able to remove versions[0].supportedBy.*.preConfiguredFields', function (done) {
      let httpConnector = _.cloneDeep(httpConn)
      httpConnector.name = 'test_connector_update_9'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        httpConnector.versions[0].supportedBy.export.preConfiguredFields = []
        httpConnector.versions[0].supportedBy.import.preConfiguredFields = []
        httpConnector.versions[0].supportedBy.connection.preConfiguredFields = []

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.versions[0].supportedBy.export).not.toHaveProperty('preConfiguredFields')
          expect(body.versions[0].supportedBy.import).not.toHaveProperty('preConfiguredFields')
          expect(body.versions[0].supportedBy.connection).not.toHaveProperty('preConfiguredFields')
          done()
        })
      })
    })

    test('should be able to remove versions[0].supportedBy.*.fieldsUserMustSet', function (done) {
      let httpConnector = _.cloneDeep(httpConn)
      httpConnector.name = 'test_connector_update_10'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        httpConnector.versions[0].supportedBy.export.fieldsUserMustSet = []
        httpConnector.versions[0].supportedBy.import.fieldsUserMustSet = []
        httpConnector.versions[0].supportedBy.connection.fieldsUserMustSet = []

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.versions[0].supportedBy.export).not.toHaveProperty('fieldsUserMustSet')
          expect(body.versions[0].supportedBy.import).not.toHaveProperty('fieldsUserMustSet')
          expect(body.versions[0].supportedBy.connection).not.toHaveProperty('fieldsUserMustSet')
          done()
        })
      })
    })

    test('should be able to remove versions[0].supportedBy.*.conditions', function (done) {
      let httpConnector = _.cloneDeep(httpConn)
      httpConnector.name = 'test_connector_update_12'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.versions[0].supportedBy.export.conditions
        delete httpConnector.versions[0].supportedBy.import.conditions
        delete httpConnector.versions[0].supportedBy.connection.conditions

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.versions[0].supportedBy.export).not.toHaveProperty('conditions')
          expect(body.versions[0].supportedBy.import).not.toHaveProperty('conditions')
          expect(body.versions[0].supportedBy.connection).not.toHaveProperty('conditions')
          done()
        })
      })
    })

    test('should be able to remove versions[0].supportedBy.import.pathParameterToIdentifyExisting', function (done) {
      let httpConnector = _.cloneDeep(httpConn)
      httpConnector.name = 'test_connector_update_13'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.versions[0].supportedBy.import.pathParameterToIdentifyExisting

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.versions[0].supportedBy.import).not.toHaveProperty('pathParameterToIdentifyExisting')
          done()
        })
      })
    })

    test('should be able to remove versions[0].supportedBy.export/import', function (done) {
      let httpConnector = _.cloneDeep(httpConn)
      httpConnector.name = 'test_connector_update_14'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.versions[0].supportedBy.export
        delete httpConnector.versions[0].supportedBy.import

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.versions[0].supportedBy).not.toHaveProperty('export')
          expect(body.versions[0].supportedBy).not.toHaveProperty('import')
          done()
        })
      })
    })

    test('should be able to remove versions[0].supportedBy.connection', function (done) {
      let httpConnector = _.cloneDeep(httpConn)
      httpConnector.name = 'test_connector_update_15'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.versions[0].supportedBy.connection

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.versions[0].supportedBy).not.toHaveProperty('connection')
          done()
        })
      })
    })

    test('should be able to remove versions[0].supportedBy field', function (done) {
      let httpConnector = _.cloneDeep(httpConn)
      httpConnector.name = 'test_connector_update_16'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.versions[0].supportedBy

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.versions[0].supportedBy).toEqual({})
          done()
        })
      })
    })

    test('should be able to remove apis[0].supportedBy.*.preConfiguredFields', function (done) {
      let httpConnector = _.cloneDeep(httpConnWithApis)
      httpConnector.name = 'test_connector_apis_1'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        httpConnector.apis[0].supportedBy.export.preConfiguredFields = []
        httpConnector.apis[0].supportedBy.import.preConfiguredFields = []
        httpConnector.apis[0].supportedBy.connection.preConfiguredFields = []
        httpConnector.apis[0].supportedBy.iClient.preConfiguredFields = []

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.apis[0].supportedBy.export).not.toHaveProperty('preConfiguredFields')
          expect(body.apis[0].supportedBy.import).not.toHaveProperty('preConfiguredFields')
          expect(body.apis[0].supportedBy.connection).not.toHaveProperty('preConfiguredFields')
          expect(body.apis[0].supportedBy.iClient).not.toHaveProperty('preConfiguredFields')
          done()
        })
      })
    })

    test('should be able to remove apis[0].supportedBy.*.fieldsUserMustSet', function (done) {
      let httpConnector = _.cloneDeep(httpConnWithApis)
      httpConnector.name = 'test_connector_apis_2'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        httpConnector.apis[0].supportedBy.export.fieldsUserMustSet = []
        httpConnector.apis[0].supportedBy.import.fieldsUserMustSet = []
        httpConnector.apis[0].supportedBy.connection.fieldsUserMustSet = []
        httpConnector.apis[0].supportedBy.iClient.fieldsUserMustSet = []

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.apis[0].supportedBy.export).not.toHaveProperty('fieldsUserMustSet')
          expect(body.apis[0].supportedBy.import).not.toHaveProperty('fieldsUserMustSet')
          expect(body.apis[0].supportedBy.connection).not.toHaveProperty('fieldsUserMustSet')
          expect(body.apis[0].supportedBy.iClient).not.toHaveProperty('fieldsUserMustSet')
          done()
        })
      })
    })

    test('should be able to remove apis[0].supportedBy.*.conditions', function (done) {
      let httpConnector = _.cloneDeep(httpConnWithApis)
      httpConnector.name = 'test_connector_apis_3'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.apis[0].supportedBy.export.conditions
        delete httpConnector.apis[0].supportedBy.import.conditions
        delete httpConnector.apis[0].supportedBy.connection.conditions
        delete httpConnector.apis[0].supportedBy.iClient.conditions

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.apis[0].supportedBy.export).not.toHaveProperty('conditions')
          expect(body.apis[0].supportedBy.import).not.toHaveProperty('conditions')
          expect(body.apis[0].supportedBy.connection).not.toHaveProperty('conditions')
          expect(body.apis[0].supportedBy.iClient).not.toHaveProperty('conditions')
          done()
        })
      })
    })

    test('should be able to remove apis[0].supportedBy.import.pathParameterToIdentifyExisting', function (done) {
      let httpConnector = _.cloneDeep(httpConnWithApis)
      httpConnector.name = 'test_connector_apis_4'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.apis[0].supportedBy.import.pathParameterToIdentifyExisting

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.apis[0].supportedBy.import).not.toHaveProperty('pathParameterToIdentifyExisting')
          done()
        })
      })
    })

    test('should be able to remove apis[0].supportedBy.export/import', function (done) {
      let httpConnector = _.cloneDeep(httpConnWithApis)
      httpConnector.name = 'test_connector_apis_5'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.apis[0].supportedBy.export
        delete httpConnector.apis[0].supportedBy.import

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.apis[0].supportedBy).not.toHaveProperty('export')
          expect(body.apis[0].supportedBy).not.toHaveProperty('import')
          done()
        })
      })
    })

    test('should be able to remove apis[0].supportedBy.connection/iClient', function (done) {
      let httpConnector = _.cloneDeep(httpConnWithApis)
      httpConnector.name = 'test_connector_apis_6'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        delete httpConnector.apis[0].supportedBy.connection
        delete httpConnector.apis[0].supportedBy.iClient

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.apis[0].supportedBy).not.toHaveProperty('connection')
          expect(body.apis[0].supportedBy).not.toHaveProperty('iClient')
          done()
        })
      })
    })

    test('should be able to remove apis[0].supportedBy field', function (done) {
      let httpConnector = _.cloneDeep(httpConnWithApis)
      httpConnector.name = 'test_connector_apis_7'
      const options = {
        uri: resourceBase,
        json: httpConnector,
        bearerToken: test.user.jwt
      }

      commonUtil.postRequest(options, function (error, res, body) {
        expect(error).toBeNull()
        res.statusCode.should.equal(201)
        const httpConnId = body._id

        httpConnector.apis[0].supportedBy = {}

        const options = {
          uri: resourceBase + httpConnId,
          json: httpConnector,
          bearerToken: test.user.jwt
        }

        commonUtil.putRequest(options, function (error, res, body) {
          expect(error).toBeNull()
          res.statusCode.should.equal(200)
          expect(body.apis[0]).not.toHaveProperty('supportedBy')
          done()
        })
      })
    })
  })
})

function validateHttpConnector (body, expected) {
  expect(body.name).toEqual(expected.name)
  expect(body.legacyId).toEqual(expected.legacyId)

  const setupSupportedBy = function (supportedBy) {
    if (supportedBy?.export?.conditions) {
      for (const condition of supportedBy.export.conditions) {
        delete condition.condition.version
        delete condition.condition.rules
      }
    }
    if (supportedBy?.import?.conditions) {
      for (const condition of supportedBy.import.conditions) {
        delete condition.condition.version
        delete condition.condition.rules
      }
    }
    if (supportedBy?.connection?.conditions) {
      for (const condition of supportedBy.connection.conditions) {
        delete condition.condition.version
        delete condition.condition.rules
      }
    }
  }

  for (const api of body.apis) {
    delete api._id
    setupSupportedBy(api.supportedBy)
    for (const version of api.versions) {
      setupSupportedBy(version.supportedBy)
      delete version._id
    }
  }

  for (const version of body.versions) {
    setupSupportedBy(version.supportedBy)
    delete version._id
    // versions.push(version)
  }
  setupSupportedBy(body.supportedBy)

  if (expected.apis) expect(body.apis).toEqual(expected.apis)
  if (expected.versions) expect(body.versions).toEqual(expected.versions)
  if (expected.preBuiltExports) expect(body.preBuiltExports).toEqual(expected.preBuiltExports)
  if (expected.preBuiltImports) expect(body.preBuiltImports).toEqual(expected.preBuiltImports)
  if (expected.supportedBy) expect(body.supportedBy).toEqual(expected.supportedBy)
}
