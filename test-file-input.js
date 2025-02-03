/* globals rootRequire */
'use strict'

const should = require('should')
const commonUtil = require('../../util/commonUtil.js')
const { makeRequest, createUserAndGetToken, configs } = require('../connector/lifecycleUtil')
const dbUtil = require('../../util/dbUtil')
const assert = require('assert')
const _ = require('lodash')
const nconf = require('nconf')
const fs = require('fs')
const BrowserRequest = require('../../util/browserRequest')
const {
  User,
  HttpConnector,
  HttpConnectorResource,
  HttpConnectorEndpoint,
  AShare,
  Integration,
  Connection,
  Export,
  ExportFactory,
  Import,
  ImportFactory
} = require('integrator-adaptor')

let ioBaseURI
let publishedConnectorsURI
let httpConnectorBaseURI
let httpConnectorResourceBaseURI
let httpConnectorEndpointBaseURI
let fetchMatchingConnectorsBaseURI

describe('Http Connector Framework Route tests', function () {
  const allHttpConnectorIds = []
  const allHttpConnectorResourceIds = []
  const allHttpConnectorEndpointIds = []

  /* before(function (done) {
    testUtil.waitUtil.waitForDBCleanUp(function (err) {
      if (err) return done(err)
      done()
    })
  }) */

  let httpConn0Uri
  let httpConn0UriVersion0
  let httpConn0UriVersion1
  let httpConn0UriVersion2
  let httpConn0UriResource0
  let httpConn0UriResource0Endpoint0
  let httpConn0UriResource0Endpoint1
  let httpConn0UriResource1
  let httpConn0UriResource1Endpoint0
  let httpConn0UriResource2
  let httpConn0UriResource2Endpoint0

  let httpConn1Uri
  let httpConn1UriApi0
  let httpConn1UriApi0Version0
  let httpConn1UriApi0Version1
  let httpConn1UriApi0Version2
  let httpConn1UriApi1Version0
  let httpConn1UriResource0
  let httpConn1UriResource0Endpoint0
  let httpConn1UriResource0Endpoint1
  let httpConn1UriResource1
  let httpConn1UriResource2
  let httpConn1UriResource3
  let httpConn1UriResource3Endpoint0

  let httpConn2Uri
  let httpConn2UriApi0
  let httpConn2UriApi0Version0
  let httpConn2UriApi0Version1
  let httpConn2UriApi0Version2

  let httpConn3Uri
  let httpConn3UriApi0
  let httpConn3UriApi0Version0
  let httpConn3UriApi0Version1
  let httpConn3UriApi0Version2
  let httpConn3UriResource0
  let httpConn3UriResource1
  let httpConn3UriResource01Endpoint0
  let httpConn3UriResource01Endpoint1

  let httpConn4Webhook
  let httpConn4WebhookApi0
  let httpConn4WebhookApi0Version0
  let httpConn4WebhookApi0Version1
  let httpConn4WebhookApi0Version2

  let httpConn5Webhook
  let httpConn5WebhookApi0
  let httpConn5WebhookApi0Version0
  let httpConn5WebhookApi0Version1
  let httpConn5WebhookApi0Version2

  let httpConn6Uri
  let httpConn7IClient
  let httpConn8IClient
  let httpConn8IClientApi0
  let httpConn8IClientApi0Version0
  let httpConn8IClientApi0Version1
  let httpConn8IClientApi0Version2
  let httpConn8UriResource0
  let httpConn8UriResource0Endpoint0

  let httpConn9Header
  let httpConn9HeaderApi0
  let httpConn9HeaderApi0Version0
  let httpConn9HeaderApi0Version1
  let httpConn9HeaderApi0Version2

  let httpConn10Uri
  let httpConn10UriVersion0
  let httpConn10UriVersion1
  let httpConn10UriVersion2

  let httpConn11AutoLinking
  let httpConn11AutoLinkingVersion0

  let httpConn12NotPublished
  let httpConn12NotPublishedVersion0

  beforeAll(async function () {
    const port = nconf.get('PORT')
    ioBaseURI = 'http://localhost:' + port + '/v1'
    publishedConnectorsURI = 'http://localhost.io:' + port + '/publishedHttpConnectors'

    httpConnectorBaseURI = ioBaseURI + '/httpconnectors'
    httpConnectorResourceBaseURI = ioBaseURI + '/httpconnectorresources'
    httpConnectorEndpointBaseURI = ioBaseURI + '/httpconnectorendpoints'
    fetchMatchingConnectorsBaseURI = ioBaseURI + '/fetchmatchingconnectors'

    // connNdx = 0 -- URI
    let httpConnJson =
    {
      _userId: test.user._id,
      name: 'test_connector0',
      published: true,
      baseURIs: ['http://www.somebaseuri.com'],
      versioning: {
        location: 'uri'
      },
      legacyId: 'shopify',
      versions: [
        {
          name: '/v3',
          published: true
        },
        {
          name: '/v2',
          baseURIs: ['http://www.somebaseuris.com/:_version'],
          published: true
        },
        {
          name: '/v1',
          published: false
        }
      ]
    }

    httpConn0Uri = await new HttpConnector(HttpConnector.generateDoc(test.user, httpConnJson)).save().catch(err => { return err })
    allHttpConnectorIds.push(httpConn0Uri._id.toString())

    httpConn0UriVersion0 = httpConn0Uri.versions[0]._id.toString()
    httpConn0UriVersion1 = httpConn0Uri.versions[1]._id.toString()
    httpConn0UriVersion2 = httpConn0Uri.versions[2]._id.toString()

    // resourceNdx = 0
    let httpConnResourceJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_resource0',
      _httpConnectorId: httpConn0Uri._id.toString(),
      _versionIds: [httpConn0UriVersion0],
      published: true
    }
    httpConn0UriResource0 = await new HttpConnectorResource(HttpConnectorResource.generateDoc(test.user, httpConnResourceJson)).save().catch(err => { return err })
    allHttpConnectorResourceIds.push(httpConn0UriResource0._id.toString())
    // endpointNdx = 0
    let httpConnEndpointJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_endpoint0',
      _httpConnectorResourceIds: [httpConn0UriResource0._id.toString()],
      method: 'POST',
      relativeURI: ':_version/test/{{testId}}/options.json',
      published: true,
      supportedBy: {
        type: 'import'
      },
      resourceFields: [
        {
          type: 'inclusion',
          fields: ['name'],
          _httpConnectorResourceId: httpConn0UriResource0._id.toString()
        }
      ]
    }

    httpConn0UriResource0Endpoint0 = await new HttpConnectorEndpoint(HttpConnectorEndpoint.generateDoc(test.user, httpConnEndpointJson)).save().catch(err => { return err })
    allHttpConnectorEndpointIds.push(httpConn0UriResource0Endpoint0._id.toString())
    // endpointNdx = 1
    httpConnEndpointJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_endpoint1',
      _httpConnectorResourceIds: [httpConn0UriResource0._id.toString()],
      method: 'GET',
      relativeURI: '/:_version/test',
      published: true,
      supportedBy: {
        type: 'export'
      }
    }
    httpConn0UriResource0Endpoint1 = await new HttpConnectorEndpoint(HttpConnectorEndpoint.generateDoc(test.user, httpConnEndpointJson)).save().catch(err => { return err })
    allHttpConnectorEndpointIds.push(httpConn0UriResource0Endpoint1._id.toString())

    // resourceNdx = 1
    httpConnResourceJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_resource1',
      _httpConnectorId: httpConn0Uri._id.toString(),
      _versionIds: [httpConn0UriVersion1],
      published: true
    }
    httpConn0UriResource1 = await new HttpConnectorResource(HttpConnectorResource.generateDoc(test.user, httpConnResourceJson)).save().catch(err => { return err })
    allHttpConnectorResourceIds.push(httpConn0UriResource1._id.toString())
    // endpointNdx = 0
    httpConnEndpointJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_endpoint0',
      _httpConnectorResourceIds: [httpConn0UriResource1._id.toString()],
      method: 'GET',
      relativeURI: '/test/{{testId}}',
      published: true,
      supportedBy: {
        type: 'export'
      }
    }
    httpConn0UriResource1Endpoint0 = await new HttpConnectorEndpoint(HttpConnectorEndpoint.generateDoc(test.user, httpConnEndpointJson)).save().catch(err => { return err })
    allHttpConnectorEndpointIds.push(httpConn0UriResource1Endpoint0._id.toString())
    // resourceNdx = 2
    httpConnResourceJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_resource1',
      _httpConnectorId: httpConn0Uri._id.toString(),
      _versionIds: [httpConn0UriVersion2],
      published: true
    }
    httpConn0UriResource2 = await new HttpConnectorResource(HttpConnectorResource.generateDoc(test.user, httpConnResourceJson)).save().catch(err => { return err })
    allHttpConnectorResourceIds.push(httpConn0UriResource2._id.toString())
    // endpointNdx = 0
    httpConnEndpointJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_endpoint3',
      _httpConnectorResourceIds: [httpConn0UriResource2._id.toString()],
      method: 'GET',
      relativeURI: '/test/{{testId}}',
      published: true,
      supportedBy: {
        type: 'export'
      }
    }
    httpConn0UriResource2Endpoint0 = await new HttpConnectorEndpoint(HttpConnectorEndpoint.generateDoc(test.user, httpConnEndpointJson)).save().catch(err => { return err })
    allHttpConnectorEndpointIds.push(httpConn0UriResource2Endpoint0._id.toString())
    // ----------------------------------------- //
    // connNdx = 1 -- URI
    httpConnJson =
    {
      _userId: test.user._id,
      name: 'test_connector1',
      published: true,
      apis: [
        {
          name: 'test_api',
          published: true,
          versioning: {
            location: 'uri'
          },
          baseURIs: ['http://www.foo1.com/:_version', 'http://www.foo2.com/:_version'],
          versions: [
            {
              name: 'v3',
              published: true
            },
            {
              name: 'v2',
              baseURIs: ['http://www.foo3.com'],
              published: true
            },
            {
              name: 'v1',
              published: false
            }
          ],
          supportedBy: {
            export: {
              preConfiguredFields: [
                {
                  path: "webhook.provider",
                  values: [
                    "custom"
                  ]
                }
              ]
            }
          },
          legacyId: 'walmart'
        },
        {
          name: 'test_api2',
          published: false,
          versioning: {
            location: 'uri'
          },
          baseURIs: ['http://www.foo4.com/:_version', 'http://www.foo5.com/:_version'],
          versions: [
            {
              name: 'v3',
              published: true
            },
            {
              name: 'v2',
              baseURIs: ['http://www.foo6.com'],
              published: true
            },
            {
              name: 'v1',
              published: false
            }
          ],
          supportedBy: {
            export: {
              preConfiguredFields: [
                {
                  path: "webhook.provider",
                  values: [
                    "custom"
                  ]
                }
              ]
            }
          },
          legacyId: 'walmartcanada'
        }
      ],
      helpURL: 'http://help-url-for-test_connector1'
    }

    httpConn1Uri = await new HttpConnector(HttpConnector.generateDoc(test.user, httpConnJson)).save().catch(err => { return err })
    allHttpConnectorIds.push(httpConn1Uri._id.toString())

    httpConn1UriApi0 = httpConn1Uri.apis[0]._id.toString()
    httpConn1UriApi0Version0 = httpConn1Uri.apis[0].versions[0]._id.toString()
    httpConn1UriApi0Version1 = httpConn1Uri.apis[0].versions[1]._id.toString()
    httpConn1UriApi0Version2 = httpConn1Uri.apis[0].versions[2]._id.toString()
    httpConn1UriApi1Version0 = httpConn1Uri.apis[1].versions[0]._id.toString()

    // resourceNdx = 0
    httpConnResourceJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_resource0',
      _httpConnectorId: httpConn1Uri._id.toString(),
      _versionIds: [httpConn1UriApi0Version0, httpConn1UriApi0Version1, httpConn1UriApi0Version2],
      published: true
    }
    httpConn1UriResource0 = await new HttpConnectorResource(HttpConnectorResource.generateDoc(test.user, httpConnResourceJson)).save().catch(err => { return err })
    allHttpConnectorResourceIds.push(httpConn1UriResource0._id.toString())

    // endpointNdx = 0 -- URI
    httpConnEndpointJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_endpoint0',
      _httpConnectorResourceIds: [httpConn1UriResource0._id.toString()],
      method: 'POST',
      relativeURI: '/test/testing',
      published: true,
      supportedBy: {
        type: 'import'
      }
    }
    httpConn1UriResource0Endpoint0 = await new HttpConnectorEndpoint(HttpConnectorEndpoint.generateDoc(test.user, httpConnEndpointJson)).save().catch(err => { return err })
    allHttpConnectorEndpointIds.push(httpConn1UriResource0Endpoint0._id.toString())

    // endpointNdx = 1 -- FALSE
    httpConnEndpointJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_endpoint8',
      _httpConnectorResourceIds: [httpConn1UriResource0._id.toString()],
      method: 'POST',
      relativeURI: '/test/testing',
      published: false,
      supportedBy: {
        type: 'import'
      }
    }
    httpConn1UriResource0Endpoint1 = await new HttpConnectorEndpoint(HttpConnectorEndpoint.generateDoc(test.user, httpConnEndpointJson)).save().catch(err => { return err })
    allHttpConnectorEndpointIds.push(httpConn1UriResource0Endpoint1._id.toString())

    // resourceNdx = 1 -- FALSE
    httpConnResourceJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_resource1',
      _httpConnectorId: httpConn1Uri._id.toString(),
      _versionIds: [httpConn1UriApi0Version0],
      published: false
    }
    httpConn1UriResource1 = await new HttpConnectorResource(HttpConnectorResource.generateDoc(test.user, httpConnResourceJson)).save().catch(err => { return err })
    allHttpConnectorResourceIds.push(httpConn1UriResource1._id.toString())

    // resourceNdx = 2 -- USES FALSE VERSION
    httpConnResourceJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_resource2',
      _httpConnectorId: httpConn1Uri._id.toString(),
      _versionIds: [httpConn1UriApi0Version2],
      published: true
    }
    httpConn1UriResource2 = await new HttpConnectorResource(HttpConnectorResource.generateDoc(test.user, httpConnResourceJson)).save().catch(err => { return err })
    allHttpConnectorResourceIds.push(httpConn1UriResource2._id.toString())

    // resourceNdx = 3
    httpConnResourceJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_resource3',
      _httpConnectorId: httpConn1Uri._id.toString(),
      _versionIds: [httpConn1UriApi1Version0],
      published: true
    }
    httpConn1UriResource3 = await new HttpConnectorResource(HttpConnectorResource.generateDoc(test.user, httpConnResourceJson)).save().catch(err => { return err })
    allHttpConnectorResourceIds.push(httpConn1UriResource3._id.toString())

    // endpointNdx = 0
    httpConnEndpointJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_endpoint0',
      _httpConnectorResourceIds: [httpConn1UriResource3._id.toString()],
      method: 'POST',
      relativeURI: '/test/testing',
      published: true,
      supportedBy: {
        type: 'import'
      },
      resourceFields: [
        {
          type: 'exclusion',
          fields: ['name'],
          _httpConnectorResourceId: httpConn1UriResource3._id.toString()
        }
      ]
    }
    httpConn1UriResource3Endpoint0 = await new HttpConnectorEndpoint(HttpConnectorEndpoint.generateDoc(test.user, httpConnEndpointJson)).save().catch(err => { return err })
    allHttpConnectorEndpointIds.push(httpConn1UriResource3Endpoint0._id.toString())

    // ----------------------------------------- //
    // connNdx = 2 -- URI
    httpConnJson =
    {
      _userId: test.user._id,
      name: 'test_connector2',
      published: false,
      apis: [
        {
          name: 'test_api',
          published: true,
          versioning: {
            location: 'uri'
          },
          baseURIs: ['http://www.foo1.com/:_version', 'http://www.foo2.com/:_version'],
          versions: [
            {
              name: 'v3',
              published: true
            },
            {
              name: 'v2',
              baseURIs: ['http://www.foo3.com'],
              published: true
            },
            {
              name: 'v1',
              published: false
            }
          ],
          supportedBy: {
            import: {
              preConfiguredFields: [
                {
                  path: "webhook.provider",
                  values: [
                    "custom"
                  ]
                }
              ]
            }
          }
        }
      ]
    }

    httpConn2Uri = await new HttpConnector(HttpConnector.generateDoc(test.user, httpConnJson)).save().catch(err => { return err })
    allHttpConnectorIds.push(httpConn2Uri._id.toString())
    httpConn2UriApi0 = httpConn2Uri.apis[0]._id.toString()
    httpConn2UriApi0Version0 = httpConn2Uri.apis[0].versions[0]._id.toString()
    httpConn2UriApi0Version1 = httpConn2Uri.apis[0].versions[1]._id.toString()
    httpConn2UriApi0Version2 = httpConn2Uri.apis[0].versions[2]._id.toString()

    // ----------------------------------------- //
    // connNdx = 3 -- URI
    httpConnJson =
    {
      _userId: test.user._id,
      name: 'test_connector3',
      published: true,
      apis: [
        {
          name: 'test_api',
          published: true,
          versioning: {
            location: 'uri'
          },
          baseURIs: ['http://www.foo1.com/:_version', 'http://www.foo2.com/:_version'],
          versions: [
            {
              name: 'v3',
              published: true
            },
            {
              name: 'v2',
              baseURIs: ['http://www.foo3.com'],
              published: true
            },
            {
              name: 'v1',
              published: false
            }
          ]
        }
      ],
      versioning: {
        location: 'header',
        headerName: 'version'
      },
      versions: [
        {
          name: 'v3',
          published: true
        }
      ],
      helpURL: 'http://help-url-for-test_connector1'
    }

    httpConn3Uri = await new HttpConnector(HttpConnector.generateDoc(test.user, httpConnJson)).save().catch(err => { return err })
    allHttpConnectorIds.push(httpConn3Uri._id.toString())
    httpConn3UriApi0 = httpConn3Uri.apis[0]._id.toString()
    httpConn3UriApi0Version0 = httpConn3Uri.apis[0].versions[0]._id.toString()
    httpConn3UriApi0Version1 = httpConn3Uri.apis[0].versions[1]._id.toString()
    httpConn3UriApi0Version2 = httpConn3Uri.apis[0].versions[2]._id.toString()

    // resourceNdx = 0
    httpConnResourceJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_resource0',
      _httpConnectorId: httpConn3Uri._id.toString(),
      _versionIds: [httpConn3UriApi0Version0, httpConn3UriApi0Version1, httpConn3UriApi0Version2],
      published: true
    }
    httpConn3UriResource0 = await new HttpConnectorResource(HttpConnectorResource.generateDoc(test.user, httpConnResourceJson)).save().catch(err => { return err })
    allHttpConnectorResourceIds.push(httpConn3UriResource0._id.toString())

    // resourceNdx = 1 -- FALSE
    httpConnResourceJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_resource1',
      _httpConnectorId: httpConn3Uri._id.toString(),
      _versionIds: [httpConn3UriApi0Version0],
      published: true
    }
    httpConn3UriResource1 = await new HttpConnectorResource(HttpConnectorResource.generateDoc(test.user, httpConnResourceJson)).save().catch(err => { return err })
    allHttpConnectorResourceIds.push(httpConn3UriResource1._id.toString())

    // endpointNdx = 0 -- URI
    httpConnEndpointJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_endpoint0',
      _httpConnectorResourceIds: [httpConn3UriResource0._id.toString(), httpConn3UriResource1._id.toString()],
      method: 'POST',
      relativeURI: '/test/testing',
      published: true,
      supportedBy: {
        type: 'import'
      }
    }
    httpConn3UriResource01Endpoint0 = await new HttpConnectorEndpoint(HttpConnectorEndpoint.generateDoc(test.user, httpConnEndpointJson)).save().catch(err => { return err })
    allHttpConnectorEndpointIds.push(httpConn3UriResource01Endpoint0._id.toString())

    // endpointNdx = 1 -- FALSE
    httpConnEndpointJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_endpoint1',
      _httpConnectorResourceIds: [httpConn3UriResource0._id.toString(), httpConn3UriResource1._id.toString()],
      method: 'POST',
      relativeURI: '/test/testing',
      published: true,
      supportedBy: {
        type: 'import'
      }
    }
    httpConn3UriResource01Endpoint1 = await new HttpConnectorEndpoint(HttpConnectorEndpoint.generateDoc(test.user, httpConnEndpointJson)).save().catch(err => { return err })
    allHttpConnectorEndpointIds.push(httpConn3UriResource01Endpoint1._id.toString())
    // ----------------------------------------- //
    // connNdx = 4 -- WEBHOOK
    httpConnJson =
    {
      _userId: test.user._id,
      name: 'test_connector4',
      published: false,
      apis: [
        {
          name: 'test_api',
          published: true,
          versioning: {
            location: 'uri'
          },
          baseURIs: ['http://www.foo1.com/:_version', 'http://www.foo2.com/:_version'],
          versions: [
            {
              name: 'v3',
              published: true
            },
            {
              name: 'v2',
              baseURIs: ['http://www.foo3.com'],
              published: true
            },
            {
              name: 'v1',
              published: false
            }
          ],
          supportedBy: {
            export: {
              preConfiguredFields: [
                {
                  path: "xyz.zyx",
                  values: [
                    "custom"
                  ]
                }
              ]
            }
          }
        }
      ],
      helpURL: 'http://help-url-for-test_connector1',
      supportedBy: {
        export: {
          preConfiguredFields: [
            {
              path: 'webhook.provider',
              values: [
                'custom'
              ]
            },
            {
              path: 'webhook.verify',
              values: [
                'hmac'
              ]
            },
            {
              path: 'webhook.algorithm',
              values: [
                'sha256'
              ]
            },
            {
              path: 'webhook.encoding',
              values: [
                'base64'
              ]
            }
          ]
        }
      }
    }

    httpConn4Webhook = await new HttpConnector(HttpConnector.generateDoc(test.user, httpConnJson)).save().catch(err => { return err })
    allHttpConnectorIds.push(httpConn4Webhook._id.toString())
    httpConn4WebhookApi0 = httpConn4Webhook.apis[0]._id.toString()
    httpConn4WebhookApi0Version0 = httpConn4Webhook.apis[0].versions[0]._id.toString()
    httpConn4WebhookApi0Version1 = httpConn4Webhook.apis[0].versions[1]._id.toString()
    httpConn4WebhookApi0Version2 = httpConn4Webhook.apis[0].versions[2]._id.toString()
    // ----------------------------------------- //
    // connNdx = 5 -- WEBHOOK
    httpConnJson =
    {
      _userId: test.user._id,
      name: 'test_connector5',
      published: false,
      apis: [
        {
          name: 'test_api',
          published: true,
          versioning: {
            location: 'uri'
          },
          baseURIs: ['http://www.foo1.com/:_version', 'http://www.foo2.com/:_version'],
          versions: [
            {
              name: 'v3',
              published: true
            },
            {
              name: 'v2',
              baseURIs: ['http://www.foo3.com'],
              published: true
            },
            {
              name: 'v1',
              published: false
            }
          ]
        }
      ],
      helpURL: 'http://help-url-for-test_connector1',
      supportedBy: {
        export: {
          fieldsUserMustSet: [
            {
              path: 'webhooks.key_crypt'
            }
          ]
        }
      }
    }

    httpConn5Webhook = await new HttpConnector(HttpConnector.generateDoc(test.user, httpConnJson)).save().catch(err => { return err })
    allHttpConnectorIds.push(httpConn5Webhook._id.toString())
    httpConn5WebhookApi0 = httpConn5Webhook.apis[0]._id.toString()
    httpConn5WebhookApi0Version0 = httpConn5Webhook.apis[0].versions[0]._id.toString()
    httpConn5WebhookApi0Version1 = httpConn5Webhook.apis[0].versions[1]._id.toString()
    httpConn5WebhookApi0Version2 = httpConn5Webhook.apis[0].versions[2]._id.toString()
    // connNdx = 6 -- URI
    httpConnJson =
    {
      _userId: test.user2._id,
      name: 'test_connector6',
      published: false,
      baseURIs: ['http://www.baseuri.com'],
      versioning: {
        location: 'uri'
      },
      legacyId: 'shopify',
      versions: [
        {
          name: '/v3',
          published: true
        },
        {
          name: '/v2',
          baseURIs: ['http://www.baseuris.com/:_version'],
          published: true
        },
        {
          name: '/v1',
          published: false
        }
      ]
    }

    httpConn6Uri = await new HttpConnector(HttpConnector.generateDoc(test.user2, httpConnJson)).save().catch(err => { return err })
    allHttpConnectorIds.push(httpConn6Uri._id.toString())
    // ----------------------------------------- //
    // connNdx = 7 -- iclient
    httpConnJson =
    {
      _userId: test.user._id,
      name: 'test_iclient',
      baseURIs: ['https://basic1.com'],
      helpURL: 'https://docs.celigo.com/test',
      legacyId: 'shopify',
      versions: [{ name: 'Kardashians' }],
      supportedBy: {
        iClient: {
          preConfiguredFields: [
            {
              path: 'dummyiClientPreConfiguredFields1',
              values: ['a', 'b', 'c']
            }
          ],
          fieldsUserMustSet: [
            {
              path: 'dummyiClientFieldUserMustSet',
              helpURL: 'https://www.dummy.com',
              labelOverride: 'override6'
            }
          ]
        }
      }
    }

    httpConn7IClient = await new HttpConnector(HttpConnector.generateDoc(test.user, httpConnJson)).save().catch(err => { return err })
    allHttpConnectorIds.push(httpConn7IClient._id.toString())
    // ----------------------------------------- //
    // connNdx = 8 -- IClient & Multi part
    httpConnJson =
    {
      _userId: test.user._id,
      name: 'test_iclient2',
      published: false,
      helpURL: 'https://docs.celigo.com/test',
      legacyId: 'shopify',
      apis: [
        {
          name: 'dummyApi',
          published: false,
          baseURIs: ['https://basic.com'],
          versions: [{ name: 'Kardashians' }],
          supportedBy: {
            iClient: {
              preConfiguredFields: [
                {
                  path: 'dummyExportPreConfiguredFields1',
                  values: ['a', 'b', 'c']
                }
              ],
              fieldsUserMustSet: [
                {
                  path: 'dummyExportFieldsUserMustSet1',
                  helpURL: 'https://www.dummy.com',
                  labelOverride: 'override6'
                }
              ]
            },
            export: {
              preConfiguredFields: [
                {
                  path: "webhook.provider",
                  values: [
                    "custom"
                  ]
                }
              ]
            }
          }
        },
        {
          name: 'dummyApi2',
          published: true,
          versioning: {
            location: 'uri'
          },
          baseURIs: ['http://www.foo1.com/:_version', 'http://www.foo2.com/:_version'],
          versions: [
            {
              name: 'v3',
              published: true
            },
            {
              name: 'v2',
              baseURIs: ['http://www.foo3.com'],
              published: true
            },
            {
              name: 'v1',
              published: false
            }
          ]
        }
      ]
    }

    httpConn8IClient = await new HttpConnector(HttpConnector.generateDoc(test.user, httpConnJson)).save().catch(err => { return err })
    allHttpConnectorIds.push(httpConn8IClient._id.toString())
    httpConn8IClientApi0 = httpConn8IClient.apis[1]._id.toString()
    httpConn8IClientApi0Version0 = httpConn8IClient.apis[1].versions[0]._id.toString()
    httpConn8IClientApi0Version1 = httpConn8IClient.apis[1].versions[1]._id.toString()
    httpConn8IClientApi0Version2 = httpConn8IClient.apis[1].versions[2]._id.toString()

    // connNdx = 8 resourceNdx = 0
    httpConnResourceJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_resource0',
      _httpConnectorId: httpConn8IClient._id.toString(),
      published: true
    }
    httpConn8UriResource0 = await new HttpConnectorResource(HttpConnectorResource.generateDoc(test.user, httpConnResourceJson)).save().catch(err => { return err })
    allHttpConnectorResourceIds.push(httpConn8UriResource0._id.toString())

    // connNdx = 8 resourceNdx = 0 endpointNdx = 0
    httpConnEndpointJson =
    {
      _userId: test.user._id,
      name: 'test_http_connector_endpoint0',
      _httpConnectorResourceIds: [httpConn8UriResource0._id.toString()],
      method: 'POST',
      relativeURI: '/test/testing',
      published: true,
      isBlob: true,
      supportedBy: {
        type: 'import'
      }
    }
    httpConn8UriResource0Endpoint0 = await new HttpConnectorEndpoint(HttpConnectorEndpoint.generateDoc(test.user, httpConnEndpointJson)).save().catch(err => { return err })
    allHttpConnectorEndpointIds.push(httpConn8UriResource0Endpoint0._id.toString())
  })

  afterAll(function (done) {
    HttpConnector.deleteMany({ _id: { $in: allHttpConnectorIds } }, function (err) {
      if (err) return done(err)
      HttpConnectorResource.deleteMany({ _id: { $in: allHttpConnectorResourceIds } }, function (err) {
        if (err) return done(err)
        HttpConnectorEndpoint.deleteMany({ _id: { $in: allHttpConnectorEndpointIds } }, function (err) {
          if (err) return done(err)
          done()
        })
      })
    })
  })

  describe('\'/httpconnectors\' route', function () {
    it('should output /httpconnectors correctly', function (done) {
      const options =
      {
        uri: httpConnectorBaseURI,
        bearerToken: test.user.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)
        body.length.should.equal(8)
        const connectors = [httpConn0Uri, httpConn1Uri, httpConn2Uri, httpConn3Uri, httpConn4Webhook, httpConn5Webhook, httpConn7IClient, httpConn8IClient]
        for (const httpConnectorNdx in body) {
          body[httpConnectorNdx]._id.should.equal(connectors[httpConnectorNdx]._id.toString())
          body[httpConnectorNdx].should.containDeep({
            _id: connectors[httpConnectorNdx]._id.toString(),
            name: connectors[httpConnectorNdx].name,
            _userId: connectors[httpConnectorNdx]._userId.toString(),
            helpURL: connectors[httpConnectorNdx].helpURL,
            legacyId: connectors[httpConnectorNdx].legacyId
          })
          if (httpConnectorNdx === '1') {
            body[httpConnectorNdx].legacyIds.should.containDeep(['walmart', 'walmartcanada'])
            body[httpConnectorNdx].apis.should.containDeep([{ name: 'test_api', versions: [{ name: 'v3' }, { name: 'v2' }] }, { name: 'test_api2', versions: [{ name: 'v3' }, { name: 'v2' }] }])
          } else if (body[httpConnectorNdx].legacyId) {
            body[httpConnectorNdx].legacyIds.should.containDeep([connectors[httpConnectorNdx].legacyId])
          } else {
            should.not.exist(body[httpConnectorNdx].legacyIds)
          }
          if (httpConnectorNdx === '4' || httpConnectorNdx === '5') {
            body[httpConnectorNdx].supportsWebhook.should.equal(true)
          }
          if (httpConnectorNdx === '6' || httpConnectorNdx === '7') {
            body[httpConnectorNdx].supportsIClient.should.equal(true)
          } else {
            body[httpConnectorNdx].supportsIClient.should.equal(false)
          }
          if (httpConnectorNdx === '7') {
            body[httpConnectorNdx].hasBlobEndpoints.should.equal(true)
          } else {
            body[httpConnectorNdx].hasBlobEndpoints.should.equal(false)
          }
        }
        done()
      })
    })

    it('should output /httpconnectors correctly with api and version information', function (done) {
      const options =
      {
        uri: httpConnectorBaseURI,
        bearerToken: test.user.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)
        body.length.should.equal(8)

        // connector 0
        body[0].versions.should.containDeep([{ name: '/v3' }, { name: '/v2' }])
        body[0].should.not.have.property('apis')

        // connector 1
        body[1].apis.should.containDeep([{ name: 'test_api', supportsWebhook: true, versions: [{ name: 'v3' }, { name: 'v2' }] }, { name: 'test_api2', supportsWebhook: true, versions: [{ name: 'v3' }, { name: 'v2' }] }])
        body[1].should.not.have.property('versions')

        // connector 2
        body[2].apis.should.containDeep([{ name: 'test_api', versions: [{ name: 'v3' }, { name: 'v2' }] }])
        body[2].apis[0].should.not.have.property('supportsWebhook')
        body[2].should.not.have.property('versions')

        // connector 3
        body[3].apis.should.containDeep([{ name: 'test_api', versions: [{ name: 'v3' }, { name: 'v2' }] }])
        body[3].apis[0].should.not.have.property('supportsWebhook')
        body[3].versions.should.containDeep([{ name: 'v3' }])

        // connector 4
        body[4].apis.should.containDeep([{ name: 'test_api', versions: [{ name: 'v3' }, { name: 'v2' }] }])
        body[4].apis[0].should.not.have.property('supportsWebhook')
        body[4].should.not.have.property('versions')
        body[4].supportsWebhook.should.equal(true)

        // connector 6
        body[6].versions.should.containDeep([{ name: 'Kardashians' }])
        body[6].should.not.have.property('apis')
        done()
      })
    })

    it('should output /httpconnectors?publishedOnly=true correctly', function (done) {
      const options =
      {
        uri: `${httpConnectorBaseURI}?publishedOnly=true`,
        bearerToken: test.user.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)

        body.length.should.equal(3)
        const connectors = []
        connectors.push(httpConn0Uri._id.toString())
        connectors.push(httpConn1Uri._id.toString())
        connectors.push(httpConn3Uri._id.toString())
        for (const httpConnectorNdx in body) {
          body[httpConnectorNdx]._id.should.equal(connectors[httpConnectorNdx])
        }
        done()
      })
    })

    it('should not send unpublished apis to user2', function (done) {
      const options =
      {
        uri: httpConnectorBaseURI,
        bearerToken: test.user2.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)
        body.length.should.equal(4)
        for (const httpConnectorNdx in body) {
          if (body[httpConnectorNdx].name === 'test_connector1') {
            body[httpConnectorNdx].legacyIds.should.containDeep(['walmart'])
            body[httpConnectorNdx].apis.should.containDeep([{ name: 'test_api' }])
          }
        }
        done()
      })
    })
  })
  describe('\'/httpconnectors\' route for allowedToPublishHttpConnectors=false account', function () {
    it('should output /httpconnectors correctly', function (done) {
      const options =
      {
        uri: httpConnectorBaseURI,
        bearerToken: test.user2.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)
        body.length.should.equal(4)
        const connectors = [httpConn0Uri, httpConn1Uri, httpConn3Uri, httpConn6Uri]
        for (const httpConnectorNdx in body) {
          body[httpConnectorNdx]._id.should.equal(connectors[httpConnectorNdx]._id.toString())
          body[httpConnectorNdx].should.containDeep({
            _id: connectors[httpConnectorNdx]._id.toString(),
            name: connectors[httpConnectorNdx].name,
            _userId: connectors[httpConnectorNdx]._userId.toString(),
            helpURL: connectors[httpConnectorNdx].helpURL,
            legacyId: connectors[httpConnectorNdx].legacyId
          })
        }
        done()
      })
    })

    it('should output /httpconnectors correctly with api and version information', function (done) {
      const options =
      {
        uri: httpConnectorBaseURI,
        bearerToken: test.user2.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)
        body.length.should.equal(4)

        // connector 0
        body[0].versions.should.containDeep([{ name: '/v3' }, { name: '/v2' }])
        body[0].should.not.have.property('apis')

        // connector 1
        body[1].apis.should.containDeep([{ name: 'test_api', supportsWebhook: true, versions: [{ name: 'v3' }, { name: 'v2' }] }])
        body[1].should.not.have.property('versions')

        // connector 2
        body[2].apis.should.containDeep([{ name: 'test_api', versions: [{ name: 'v3' }, { name: 'v2' }] }])
        body[2].apis[0].should.not.have.property('supportsWebhook')
        body[2].versions.should.containDeep([{ name: 'v3' }])

        // connector 3
        body[3].should.not.have.property('apis')
        body[3].versions.should.containDeep([{ name: '/v3' }, { name: '/v2' }, { name: '/v1' }])
        done()
      })
    })

    it('should output /httpconnectors?publishedOnly=true correctly', function (done) {
      const options =
      {
        uri: `${httpConnectorBaseURI}?publishedOnly=true`,
        bearerToken: test.user2.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)

        body.length.should.equal(3)
        const connectors = []
        connectors.push(httpConn0Uri._id.toString())
        connectors.push(httpConn1Uri._id.toString())
        connectors.push(httpConn3Uri._id.toString())
        for (const httpConnectorNdx in body) {
          body[httpConnectorNdx]._id.should.equal(connectors[httpConnectorNdx])
        }
        done()
      })
    })

    it('should output /httpconnectors correctly with api and version information with publishedOnly true', function (done) {
      const options =
      {
        uri: `${httpConnectorBaseURI}?publishedOnly=true`,
        bearerToken: test.user2.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)
        body.length.should.equal(3)

        // connector 0
        body[0].versions.should.containDeep([{ name: '/v3' }, { name: '/v2' }])
        body[0].should.not.have.property('apis')

        // connector 1
        body[1].apis.length.should.equal(1)
        body[1].apis.should.containDeep([{ name: 'test_api', supportsWebhook: true, versions: [{ name: 'v3' }, { name: 'v2' }] }])
        body[1].should.not.have.property('versions')

        // connector 2
        body[2].apis.should.containDeep([{ name: 'test_api', versions: [{ name: 'v3' }, { name: 'v2' }] }])
        body[2].apis[0].should.not.have.property('supportsWebhook')
        body[2].versions.should.containDeep([{ name: 'v3' }])
        done()
      })
    })
  })

  describe('\'/publishedHttpConnectors\' route', function () {

    it('should return all published http connectors', async function () {
      const options = {
        url: publishedConnectorsURI,
        method: 'GET'
      }

      let agent = new BrowserRequest()
      agent.request(options).then(function (res) {
        res.statusCode.should.equal(200)

        const body = JSON.parse(res.getBody().toString())
        body[0].should.containDeep({ connector_id: httpConn0Uri._id.toString(), connector_name: "test_connector0", connector_kblink: '' })
        body[0].should.have.property('release_date')
        body[1].should.containDeep({ connector_id: httpConn1Uri._id.toString(), connector_name: "test_connector1", connector_kblink: "http://help-url-for-test_connector1" })
        body[2].should.containDeep({ connector_id: httpConn3Uri._id.toString(), connector_name: "test_connector3", connector_kblink: "http://help-url-for-test_connector1" })
      })
    })

    it('should throw rate limit error for second request', function () {
      const options = {
        url: publishedConnectorsURI,
        method: 'GET'
      }

      let agent = new BrowserRequest()
      agent.request(options)
        .fail(function (err) {
          err.statusCode.should.eql(429)
        })
    })
  })

  describe('\'/httpconnectors/:_httpConnectorId\' route', function () {
    it('should output /httpconnectors/:_httpConnectorId correctly', function (done) {
      const options = {
        uri: `http://localhost:${nconf.get('PORT')}/v1/httpconnectors/${httpConn0Uri._id.toString()}`,
        bearerToken: test.user.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)
        validateHttpConnector(body, HttpConnector.generateResponse(httpConn0Uri))
        should.not.exist(body.httpConnectorResources)
        should.not.exist(body.httpConnectorEndpoints)
        done()
      })
    })

    it('should output /httpconnectors/:_httpConnectorId correctly for test.user2', function (done) {
      const options = {
        uri: `http://localhost:${nconf.get('PORT')}/v1/httpconnectors/${httpConn0Uri._id.toString()}`,
        bearerToken: test.user2.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)
        body._id.should.equal(httpConn0Uri._id.toString())
        should.not.exist(body.httpConnectorResources)
        should.not.exist(body.httpConnectorEndpoints)
        done()
      })
    })

    it('should output /httpconnectors/:_httpConnectorId correctly for other user with multiple apis', function (done) {
      const httpConnJson =
      {
        _userId: test.user._id,
        name: 'test_connector9',
        published: true,
        apis: [
          {
            name: 'test_api1',
            published: true,
            versioning: {
              location: 'uri'
            },
            baseURIs: ['http://www.foo9.com/:_version', 'http://www.foo5.com/:_version'],
            versions: [
              {
                name: 'v1',
                published: true
              },
              {
                name: 'v2',
                baseURIs: ['http://www.foo7.com'],
                published: true
              },
              {
                name: 'v3',
                published: false
              }
            ]
          },
          {
            name: 'test_api2',
            published: true,
            versioning: {
              location: 'uri'
            },
            baseURIs: ['http://www.foo1.com/:_version', 'http://www.fo4.com/:_version'],
            versions: [
              {
                name: 'v1',
                baseURIs: ['http://www.foo8.com'],
                published: true
              }
            ]
          }
        ],
        helpURL: 'http://help-url-for-test_connector1'
      }

      new HttpConnector(HttpConnector.generateDoc(test.user, httpConnJson)).save((err, httpConnectorDoc) => {
        if (err) return done(err)

        const options = {
          uri: `http://localhost:${nconf.get('PORT')}/v1/httpconnectors/${httpConnectorDoc._id.toString()}`,
          bearerToken: test.user2.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(200)
          body._id.should.equal(httpConnectorDoc._id.toString())
          body.apis.length.should.equal(2)
          body.apis[0].versions.length.should.equal(2)
          body.apis[1].versions.length.should.equal(1)
          const requestOptions = {
            uri: `http://localhost:${nconf.get('PORT')}/v1/httpconnectors/${httpConnectorDoc._id.toString()}`,
            bearerToken: test.user.jwt
          }
          commonUtil.deleteRequest(requestOptions, function (err, res, body) {
            if (err) return done(err)
            if (res.statusCode !== 204) return done('status code should be 204')
            return done()
          })
        })
      })
    })

    it('should output /httpconnectors/:_httpConnectorId correctly for httpconnector created by allowedToPublishHttpConnectors=false account', function (done) {
      const options = {
        uri: `http://localhost:${nconf.get('PORT')}/v1/httpconnectors/${httpConn6Uri._id.toString()}`,
        bearerToken: test.user2.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)
        validateHttpConnector(body, HttpConnector.generateResponse(httpConn6Uri))
        should.not.exist(body.httpConnectorResources)
        should.not.exist(body.httpConnectorEndpoints)
        done()
      })
    })

    describe('should output /httpconnectors/:_httpConnectorId?returnEverything=true correctly', function () {
      it('versions configuration', function (done) {
        const options =
        {
          uri: `${httpConnectorBaseURI}/${httpConn0Uri._id.toString()}/?returnEverything=true`,
          bearerToken: test.user.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(200)

          validateHttpConnector(body, HttpConnector.generateResponse(httpConn0Uri))
          body.httpConnectorResources.length.should.equal(3)
          const resources = []
          resources.push(httpConn0UriResource0)
          resources.push(httpConn0UriResource1)
          resources.push(httpConn0UriResource2)
          for (const httpConnectorResourceNdx in resources) {
            validateHttpConnectorResource(body.httpConnectorResources[httpConnectorResourceNdx], HttpConnectorResource.generateResponse(resources[httpConnectorResourceNdx]))
          }
          body.httpConnectorEndpoints.length.should.equal(4)
          const endpoints = []
          endpoints.push(httpConn0UriResource0Endpoint0)
          endpoints.push(httpConn0UriResource0Endpoint1)
          endpoints.push(httpConn0UriResource1Endpoint0)
          endpoints.push(httpConn0UriResource2Endpoint0)
          for (const httpConnectorEndpointNdx in endpoints) {
            validateHttpConnectorEndpoint(body.httpConnectorEndpoints[httpConnectorEndpointNdx], HttpConnectorEndpoint.generateResponse(endpoints[httpConnectorEndpointNdx]))
          }
          done()
        })
      })

      it('apis configuration', function (done) {
        const options =
        {
          uri: `${httpConnectorBaseURI}/${httpConn1Uri._id.toString()}/?returnEverything=true`,
          bearerToken: test.user.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(200)

          validateHttpConnector(body, HttpConnector.generateResponse(httpConn1Uri))
          body.httpConnectorResources.length.should.equal(4)
          const resources = []
          resources.push(httpConn1UriResource0)
          resources.push(httpConn1UriResource1)
          resources.push(httpConn1UriResource2)
          resources.push(httpConn1UriResource3)
          for (const httpConnectorResourceNdx in resources) {
            validateHttpConnectorResource(body.httpConnectorResources[httpConnectorResourceNdx], HttpConnectorResource.generateResponse(resources[httpConnectorResourceNdx]))
          }
          body.httpConnectorEndpoints.length.should.equal(3)
          const endpoints = []
          endpoints.push(httpConn1UriResource0Endpoint0)
          endpoints.push(httpConn1UriResource0Endpoint1)
          endpoints.push(httpConn1UriResource3Endpoint0)
          for (const httpConnectorEndpointNdx in endpoints) {
            validateHttpConnectorEndpoint(body.httpConnectorEndpoints[httpConnectorEndpointNdx], HttpConnectorEndpoint.generateResponse(endpoints[httpConnectorEndpointNdx]))
          }
          done()
        })
      })

      it('Endpoints that point to multiple resources', function (done) {
        const options =
        {
          uri: `${httpConnectorBaseURI}/${httpConn3Uri._id.toString()}/?returnEverything=true`,
          bearerToken: test.user.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(200)

          validateHttpConnector(body, HttpConnector.generateResponse(httpConn3Uri))
          body.httpConnectorResources.length.should.equal(2)
          const resources = []
          resources.push(httpConn3UriResource0)
          resources.push(httpConn3UriResource1)
          for (const httpConnectorResourceNdx in resources) {
            validateHttpConnectorResource(body.httpConnectorResources[httpConnectorResourceNdx], HttpConnectorResource.generateResponse(resources[httpConnectorResourceNdx]))
          }
          body.httpConnectorEndpoints.length.should.equal(2)
          const endpoints = []
          endpoints.push(httpConn3UriResource01Endpoint0)
          endpoints.push(httpConn3UriResource01Endpoint1)
          for (const httpConnectorEndpointNdx in endpoints) {
            validateHttpConnectorEndpoint(body.httpConnectorEndpoints[httpConnectorEndpointNdx], HttpConnectorEndpoint.generateResponse(endpoints[httpConnectorEndpointNdx]))
          }
          done()
        })
      })
    })

    describe('should output /httpconnectors/:_httpConnectorId?returnEverything=true&version=:_versionId correctly', function () {
      it('versions configuration', function (done) {
        const options =
        {
          uri: `${httpConnectorBaseURI}/${httpConn0Uri._id.toString()}/?returnEverything=true&version=${httpConn0UriVersion0}`,
          bearerToken: test.user.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(200)

          const httpConnector = JSON.parse(JSON.stringify(httpConn0Uri))
          httpConnector.versions = httpConnector.versions.slice(0, 1)
          validateHttpConnector(body, HttpConnector.generateResponse(httpConnector))
          body.httpConnectorResources.length.should.equal(1)
          const resources = []
          resources.push(httpConn0UriResource0)
          for (const httpConnectorResourceNdx in resources) {
            validateHttpConnectorResource(body.httpConnectorResources[httpConnectorResourceNdx], HttpConnectorResource.generateResponse(resources[httpConnectorResourceNdx]))
          }
          body.httpConnectorEndpoints.length.should.equal(2)
          const endpoints = []
          endpoints.push(httpConn0UriResource0Endpoint0)
          endpoints.push(httpConn0UriResource0Endpoint1)
          for (const httpConnectorEndpointNdx in endpoints) {
            validateHttpConnectorEndpoint(body.httpConnectorEndpoints[httpConnectorEndpointNdx], HttpConnectorEndpoint.generateResponse(endpoints[httpConnectorEndpointNdx]))
          }
          done()
        })
      })

      it('apis configuration', function (done) {
        const options =
        {
          uri: `${httpConnectorBaseURI}/${httpConn1Uri._id.toString()}/?returnEverything=true&version=${httpConn1UriApi0Version0}`,
          bearerToken: test.user.jwt
        }
        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(200)

          const httpConnector = JSON.parse(JSON.stringify(httpConn1Uri))
          httpConnector.apis = httpConnector.apis.slice(0, 1)
          httpConnector.apis[0].versions = httpConnector.apis[0].versions.slice(0, 1)
          validateHttpConnector(body, HttpConnector.generateResponse(httpConnector))
          body.httpConnectorResources.length.should.equal(2)
          const resources = []
          resources.push(httpConn1UriResource0)
          resources.push(httpConn1UriResource1)
          for (const httpConnectorResourceNdx in resources) {
            validateHttpConnectorResource(body.httpConnectorResources[httpConnectorResourceNdx], HttpConnectorResource.generateResponse(resources[httpConnectorResourceNdx]))
          }
          body.httpConnectorEndpoints.length.should.equal(2)
          const endpoints = []
          endpoints.push(httpConn1UriResource0Endpoint0)
          endpoints.push(httpConn1UriResource0Endpoint1)
          for (const httpConnectorEndpointNdx in endpoints) {
            validateHttpConnectorEndpoint(body.httpConnectorEndpoints[httpConnectorEndpointNdx], HttpConnectorEndpoint.generateResponse(endpoints[httpConnectorEndpointNdx]))
          }
          done()
        })
      })
    })

    describe('should output /httpconnectors/:_httpConnectorId?returnEverything=true&api=:_apiId correctly', function () {
      it('apis configuration', function (done) {
        const options =
        {
          uri: `${httpConnectorBaseURI}/${httpConn1Uri._id.toString()}/?returnEverything=true&api=${httpConn1UriApi0}`,
          bearerToken: test.user.jwt
        }
        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(200)

          const httpConnector = JSON.parse(JSON.stringify(httpConn1Uri))
          httpConnector.apis = httpConnector.apis.slice(0, 1)
          validateHttpConnector(body, HttpConnector.generateResponse(httpConnector))
          body.httpConnectorResources.length.should.equal(3)
          const resources = []
          resources.push(httpConn1UriResource0)
          resources.push(httpConn1UriResource1)
          resources.push(httpConn1UriResource2)
          for (const httpConnectorResourceNdx in resources) {
            validateHttpConnectorResource(body.httpConnectorResources[httpConnectorResourceNdx], HttpConnectorResource.generateResponse(resources[httpConnectorResourceNdx]))
          }
          body.httpConnectorEndpoints.length.should.equal(2)
          const endpoints = []
          endpoints.push(httpConn1UriResource0Endpoint0)
          endpoints.push(httpConn1UriResource0Endpoint1)
          for (const httpConnectorEndpointNdx in endpoints) {
            validateHttpConnectorEndpoint(body.httpConnectorEndpoints[httpConnectorEndpointNdx], HttpConnectorEndpoint.generateResponse(endpoints[httpConnectorEndpointNdx]))
          }
          done()
        })
      })
    })

    describe('should output /httpconnectors/:_httpConnectorId?publishedOnly=true correctly', function () {
      it('should return not found when querying false connector', function (done) {
        const options =
        {
          uri: `${httpConnectorBaseURI}/${httpConn2Uri._id.toString()}?publishedOnly=true`,
          bearerToken: test.user.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(404)
          done()
        })
      })

      it('should return not found when querying connector created by allowedToPublishHttpConnectors=false', function (done) {
        const options =
        {
          uri: `${httpConnectorBaseURI}/${httpConn6Uri._id.toString()}?publishedOnly=true`,
          bearerToken: test.user2.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(404)
          done()
        })
      })

      it('should return correctly when using versions configuration', function (done) {
        const options =
        {
          uri: `${httpConnectorBaseURI}/${httpConn0Uri._id.toString()}?publishedOnly=true`,
          bearerToken: test.user.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(200)

          const httpConnector = JSON.parse(JSON.stringify(httpConn0Uri))
          httpConnector.versions = httpConnector.versions.slice(0, 2)
          validateHttpConnector(body, HttpConnector.generateResponse(httpConnector))
          should.not.exist(body.httpConnectorResources)
          should.not.exist(body.httpConnectorEndpoints)
          done()
        })
      })

      it('should return correctly when using api configuration', function (done) {
        const options =
        {
          uri: `${httpConnectorBaseURI}/${httpConn1Uri._id.toString()}?publishedOnly=true`,
          bearerToken: test.user.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(200)

          const httpConnector = JSON.parse(JSON.stringify(httpConn1Uri))
          httpConnector.apis = httpConnector.apis.slice(0, 1)
          httpConnector.apis[0].versions = httpConnector.apis[0].versions.slice(0, 2)
          validateHttpConnector(body, HttpConnector.generateResponse(httpConnector))
          should.not.exist(body.httpConnectorResources)
          should.not.exist(body.httpConnectorEndpoints)
          done()
        })
      })
    })

    describe('should output /httpconnectors/:_httpConnectorId?returnEverything=true&publishedOnly=true correctly', function () {
      it('should return not found when querying false connector', function (done) {
        const options =
        {
          uri: `${httpConnectorBaseURI}/${httpConn2Uri._id.toString()}/?returnEverything=true&publishedOnly=true`,
          bearerToken: test.user.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(404)
          done()
        })
      })

      it('should return not found when querying connector created by allowedToPublishHttpConnectors=false', function (done) {
        const options =
        {
          uri: `${httpConnectorBaseURI}/${httpConn6Uri._id.toString()}/?returnEverything=true&publishedOnly=true`,
          bearerToken: test.user2.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(404)
          done()
        })
      })

      it('should return correctly when using versions configuration', function (done) {
        const options =
        {
          uri: `${httpConnectorBaseURI}/${httpConn0Uri._id.toString()}/?returnEverything=true&publishedOnly=true`,
          bearerToken: test.user.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(200)

          const httpConnector = JSON.parse(JSON.stringify(httpConn0Uri))
          httpConnector.versions = httpConnector.versions.slice(0, 2)
          validateHttpConnector(body, HttpConnector.generateResponse(httpConnector))
          body.httpConnectorResources.length.should.equal(2)
          const resources = []
          resources.push(httpConn0UriResource0)
          resources.push(httpConn0UriResource1)
          for (const httpConnectorResourceNdx in resources) {
            validateHttpConnectorResource(body.httpConnectorResources[httpConnectorResourceNdx], HttpConnectorResource.generateResponse(resources[httpConnectorResourceNdx]))
          }
          body.httpConnectorEndpoints.length.should.equal(3)
          const endpoints = []
          endpoints.push(httpConn0UriResource0Endpoint0)
          endpoints.push(httpConn0UriResource0Endpoint1)
          endpoints.push(httpConn0UriResource1Endpoint0)
          for (const httpConnectorEndpointNdx in endpoints) {
            validateHttpConnectorEndpoint(body.httpConnectorEndpoints[httpConnectorEndpointNdx], HttpConnectorEndpoint.generateResponse(endpoints[httpConnectorEndpointNdx]))
          }
          done()
        })
      })

      it('should return correctly when using apis configuration', function (done) {
        const options =
        {
          uri: `${httpConnectorBaseURI}/${httpConn1Uri._id.toString()}/?returnEverything=true&publishedOnly=true`,
          bearerToken: test.user.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(200)

          const httpConnector = JSON.parse(JSON.stringify(httpConn1Uri))
          httpConnector.apis = httpConnector.apis.slice(0, 1)
          httpConnector.apis[0].versions = httpConnector.apis[0].versions.slice(0, 2)
          validateHttpConnector(body, HttpConnector.generateResponse(httpConnector))
          body.httpConnectorResources.length.should.equal(1)
          const resources = []
          resources.push(httpConn1UriResource0)
          for (const httpConnectorResourceNdx in resources) {
            validateHttpConnectorResource(body.httpConnectorResources[httpConnectorResourceNdx], HttpConnectorResource.generateResponse(resources[httpConnectorResourceNdx]))
          }
          body.httpConnectorEndpoints.length.should.equal(1)
          const endpoints = []
          endpoints.push(httpConn1UriResource0Endpoint0)
          for (const httpConnectorEndpointNdx in endpoints) {
            validateHttpConnectorEndpoint(body.httpConnectorEndpoints[httpConnectorEndpointNdx], HttpConnectorEndpoint.generateResponse(endpoints[httpConnectorEndpointNdx]))
          }
          done()
        })
      })
    })
  })

  describe('\'/httpconnectors/:_httpConnectorId/httpconnectorresources\' route', function () {
    it('should output /httpconnectors/:_httpConnectorId/httpconnectorresources correctly', function (done) {
      const options =
      {
        uri: `${httpConnectorBaseURI}/${httpConn0Uri._id.toString()}/httpconnectorresources`,
        bearerToken: test.user.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)

        body.length.should.equal(3)
        const resources = []
        resources.push(httpConn0UriResource0._id.toString())
        resources.push(httpConn0UriResource1._id.toString())
        resources.push(httpConn0UriResource2._id.toString())
        for (const httpConnectorResourceNdx in body) {
          body[httpConnectorResourceNdx]._id.should.equal(resources[httpConnectorResourceNdx])
        }
        done()
      })
    })

    it('should output /httpconnectors/:_httpConnectorId/httpconnectorresources?publishedOnly=true correctly', function (done) {
      const options =
      {
        uri: `${httpConnectorBaseURI}/${httpConn0Uri._id.toString()}/httpconnectorresources?publishedOnly=true`,
        bearerToken: test.user.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)

        body.length.should.equal(2)
        const resources = []
        resources.push(httpConn0UriResource0._id.toString())
        resources.push(httpConn0UriResource1._id.toString())
        for (const httpConnectorResourceNdx in body) {
          body[httpConnectorResourceNdx]._id.should.equal(resources[httpConnectorResourceNdx])
        }
        done()
      })
    })

    it('should output /httpconnectors/:_httpConnectorId/httpconnectorresources?versions=:_versionId correctly', function (done) {
      const options =
      {
        uri: `${httpConnectorBaseURI}/${httpConn0Uri._id.toString()}/httpconnectorresources?version=${httpConn0UriVersion0}`,
        bearerToken: test.user.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)

        body.length.should.equal(1)
        const resources = []
        resources.push(httpConn0UriResource0._id.toString())
        for (const httpConnectorResourceNdx in body) {
          body[httpConnectorResourceNdx]._id.should.equal(resources[httpConnectorResourceNdx])
        }
        done()
      })
    })
  })

  describe('\'/httpconnectors/:_httpConnectorId/:_httpConnectorResourceId\' route', function () {
    it('should output /httpconnectors/:_httpConnectorId/:_httpConnectorResourceId correctly', function (done) {
      const options =
      {
        uri: `${httpConnectorBaseURI}/${httpConn0Uri._id.toString()}/${httpConn0UriResource0._id.toString()}`,
        bearerToken: test.user.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)
        validateHttpConnectorResource(body, HttpConnectorResource.generateResponse(httpConn0UriResource0))
        done()
      })
    })

    it('should output /httpconnectors/:_httpConnectorId/:_httpConnectorResourceId?publishedOnly=true', function (done) {
      const options =
      {
        uri: `${httpConnectorBaseURI}/${httpConn0Uri._id.toString()}/${httpConn0UriResource2._id.toString()}?publishedOnly=true`,
        bearerToken: test.user.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(404)
        done()
      })
    })
  })

  describe('\'/httpconnectors/:_httpConnectorId/:_httpConnectorResourceId/httpconnectorendpoints\' route', function () {
    it('should output /httpconnectors/:_httpConnectorId/:_httpConnectorResourceId/httpconnectorendpoints correctly', function (done) {
      const options =
      {
        uri: `${httpConnectorBaseURI}/${httpConn0Uri._id.toString()}/${httpConn0UriResource0._id.toString()}/httpconnectorendpoints`,
        bearerToken: test.user.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)

        body.length.should.equal(2)
        const endpoints = []
        endpoints.push(httpConn0UriResource0Endpoint0)
        endpoints.push(httpConn0UriResource0Endpoint1)
        for (const httpConnectorEndpointNdx in body) {
          body[httpConnectorEndpointNdx]._id.should.equal(endpoints[httpConnectorEndpointNdx]._id.toString())
        }
        done()
      })
    })

    it('should output /httpconnectors/:_httpConnectorId/:_httpConnectorResourceId/httpconnectorendpoints?supportedByType=import correctly', function (done) {
      const options =
      {
        uri: `${httpConnectorBaseURI}/${httpConn0Uri._id.toString()}/${httpConn0UriResource0._id.toString()}/httpconnectorendpoints?supportedByType=import`,
        bearerToken: test.user.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)

        body.length.should.equal(1)
        body[0]._id.should.equal(httpConn0UriResource0Endpoint0._id.toString())
        done()
      })
    })

    it('should output /httpconnectors/:_httpConnectorId/:_httpConnectorResourceId/httpconnectorendpoints?supportedByType=export correctly', function (done) {
      const options =
      {
        uri: `${httpConnectorBaseURI}/${httpConn0Uri._id.toString()}/${httpConn0UriResource0._id.toString()}/httpconnectorendpoints?supportedByType=export`,
        bearerToken: test.user.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)

        body.length.should.equal(1)
        const endpoints = []
        endpoints.push(httpConn0UriResource0Endpoint1._id.toString())
        for (const httpConnectorEndpointNdx in body) {
          body[httpConnectorEndpointNdx]._id.should.equal(endpoints[httpConnectorEndpointNdx])
        }
        done()
      })
    })

    it('should output /httpconnectors/:_httpConnectorId/:_httpConnectorResourceId/httpconnectorendpoints?publishedOnly=true correctly', function (done) {
      const options =
      {
        uri: `${httpConnectorBaseURI}/${httpConn1Uri._id.toString()}/${httpConn1UriResource0._id.toString()}/httpconnectorendpoints?publishedOnly=true`,
        bearerToken: test.user.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(200)

        body.length.should.equal(1)
        const endpoints = []
        endpoints.push(httpConn1UriResource0Endpoint0._id.toString())
        for (const httpConnectorEndpointNdx in body) {
          body[httpConnectorEndpointNdx]._id.should.equal(endpoints[httpConnectorEndpointNdx])
        }
        done()
      })
    })
  })

  describe('\'/httpconnectors/:_httpConnectorId/:_httpConnectorResourceId/:_httpConnectorEndpointId\' route', function () {
    it('should output /httpconnectors/:_httpConnectorId/:_httpConnectorResourceId/:_httpConnectorEndpointId correctly when published true', function (done) {
      const options =
      {
        uri: `${httpConnectorBaseURI}/${httpConn0Uri._id.toString()}/${httpConn0UriResource0._id.toString()}/${httpConn0UriResource0Endpoint0._id.toString()}`,
        bearerToken: test.user.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)

        res.statusCode.should.equal(200)
        validateHttpConnectorEndpoint(body, HttpConnectorEndpoint.generateResponse(httpConn0UriResource0Endpoint0))
        done()
      })
    })

    it('should output /httpconnectors/:_httpConnectorId/:_httpConnectorResourceId?publishedOnly=true', function (done) {
      const options =
      {
        uri: `${httpConnectorBaseURI}/${httpConn0Uri._id.toString()}/${httpConn1UriResource3._id.toString()}/${httpConn1UriResource3Endpoint0._id.toString()}?publishedOnly=true`,
        bearerToken: test.user.jwt
      }

      commonUtil.getRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(404)
        done()
      })
    })
  })

  describe('/httpconnectors route CRUD operations test-suite', function () {
    let baseApiUri = 'http://localhost:' + nconf.get('PORT') + '/v1'
    let testHttpConnectorIdForCrud
    let testHttpConnectorIdWithGraphQLForCrud
    let connJSON = {
      name: 'testHttpConnectorIdForCrud',
      published: false,
      baseURIs: ['http://www.somebaseuri.com'],
      versioning: {
        location: 'uri'
      },
      legacyId: 'shopify',
      helpURL: 'https://some-help-url',
      versions: [
        {
          name: '/v3',
          published: true
        }
      ]
    }
    let graphQLConnJSON = {
      name: 'testHttpConnectorIdWithGraphQLForCrud',
      published: false,
      baseURIs: ['http://www.somebaseuri.com'],
      versioning: {
        location: 'uri'
      },
      legacyId: 'shopify',
      helpURL: 'https://some-help-url',
      versions: [
        {
          name: '/v3',
          published: true
        }
      ],
      isGraphQL: true
    }
    let testHttpConnectorResourceIdForCrud
    let httpConnResourceJson

    let testHttpConnectorEndpointIdForCrud
    let httpConnEndpointJson

    // create
    beforeAll(function (done) {
      baseApiUri = 'http://localhost:' + nconf.get('PORT') + '/v1'
      function makeRequest (options, callback) {
        commonUtil.postRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(201, JSON.stringify(body || res))
          body.should.containDeep(options.json)
          callback(body)
        })
      }

      function createConnector (callback) {
        const options = {
          uri: httpConnectorBaseURI,
          bearerToken: test.user2.jwt,
          json: connJSON
        }
        makeRequest(options, (body) => {
          testHttpConnectorIdForCrud = body._id
          connJSON = body
          delete connJSON.lastModified
          callback()
        })
      }

      function createConnectorWithGraphQL (callback) {
        const options = {
          uri: httpConnectorBaseURI,
          bearerToken: test.user2.jwt,
          json: graphQLConnJSON
        }
        makeRequest(options, (body) => {
          testHttpConnectorIdWithGraphQLForCrud = body._id
          graphQLConnJSON = body
          delete graphQLConnJSON.lastModified
          callback()
        })
      }

      function createConnectorResource (callback) {
        httpConnResourceJson = {
          name: 'testHttpConnectorResourceIdForCrud',
          _httpConnectorId: testHttpConnectorIdForCrud,
          _versionIds: [connJSON.versions[0]._id],
          published: true
        }
        const options = {
          uri: `${baseApiUri}/httpconnectorresources`,
          bearerToken: test.user2.jwt,
          json: httpConnResourceJson
        }

        makeRequest(options, (body) => {
          testHttpConnectorResourceIdForCrud = body._id
          httpConnResourceJson = body
          delete httpConnResourceJson.lastModified
          callback()
        })
      }

      function createConnectorEndpoint (callback) {
        httpConnEndpointJson = {
          name: 'testHttpConnectorEndpointIdForCrud',
          _httpConnectorResourceIds: [testHttpConnectorResourceIdForCrud],
          method: 'POST',
          relativeURI: ':_version/test/{{testId}}/options.json',
          published: true,
          supportedBy: {
            type: 'import'
          }
        }
        const options = {
          uri: `${baseApiUri}/httpconnectorendpoints`,
          bearerToken: test.user2.jwt,
          json: httpConnEndpointJson
        }

        makeRequest(options, function (body) {
          testHttpConnectorEndpointIdForCrud = body._id
          httpConnEndpointJson = body
          delete httpConnEndpointJson.lastModified
          callback()
        })
      }

      createConnector(() => {
        createConnectorResource(() => {
          createConnectorEndpoint(() => {
            createConnectorWithGraphQL(done)
          })
        })
      })
    }, 180000)

    describe('read', function () {
      it('should NOT read unpublished connector with GET /httpconnectors/:_id by another user', function (done) {
        const options = {
          uri: `${httpConnectorBaseURI}/${testHttpConnectorIdForCrud}`,
          bearerToken: test.user.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(404)
          done()
        })
      })

      it('should read connector with GET /httpconnectors/:_id correctly by owner user 2', function (done) {
        const options = {
          uri: `${httpConnectorBaseURI}/${testHttpConnectorIdForCrud}`,
          bearerToken: test.user2.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(200)
          body.should.containDeep(connJSON)
          done()
        })
      })

      it('should read connector with GET /httpconnectors/:_id and GET /httpconnectors correctly by owner user 2 with isGraphQL flag', function (done) {
        const options = {
          uri: `${httpConnectorBaseURI}/${testHttpConnectorIdWithGraphQLForCrud}`,
          bearerToken: test.user2.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(200)
          body.should.containDeep(graphQLConnJSON)
          const getAllOptions =
          {
            uri: httpConnectorBaseURI,
            bearerToken: test.user2.jwt
          }
          commonUtil.getRequest(getAllOptions, function (error, res, getBody) {
            should.not.exist(error)
            res.statusCode.should.equal(200)
            getBody.length.should.be.greaterThan(0)
            const graphQLConnectors = getBody.filter(function (connector) {
              return connector._id === testHttpConnectorIdWithGraphQLForCrud
            })
            graphQLConnectors[0].isGraphQL.should.be.true
            done()
          })
        })
      })

      it('should NOT read resource for unpublished connector with GET /httpconnectors/:_httpConnectorId/:_id by another user', function (done) {
        const options = {
          uri: `${httpConnectorBaseURI}/${testHttpConnectorIdForCrud}/${testHttpConnectorResourceIdForCrud}`,
          bearerToken: test.user.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(404)
          done()
        })
      })

      it('should read resource with GET GET /httpconnectors/:_httpConnectorId/:_id correctly by owneruser 2', function (done) {
        const options = {
          uri: `${httpConnectorBaseURI}/${testHttpConnectorIdForCrud}/${testHttpConnectorResourceIdForCrud}`,
          bearerToken: test.user2.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(200, JSON.stringify(body || res))
          body.should.containDeep(httpConnResourceJson)
          done()
        })
      })

      it('should NOT read unpublished endpoint with GET /httpconnectors/:_httpConnectorId/:_httpConnectorResourceId/:_id by another user', function (done) {
        const options = {
          uri: `${httpConnectorBaseURI}/${testHttpConnectorIdForCrud}/${testHttpConnectorResourceIdForCrud}/${testHttpConnectorEndpointIdForCrud}`,
          bearerToken: test.user.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(404)
          done()
        })
      })

      it('should read connector endpoint with  GET /httpconnectors/:_httpConnectorId/:_httpConnectorResourceId/:_id correctly by owner user 2', function (done) {
        const options = {
          uri: `${httpConnectorBaseURI}/${testHttpConnectorIdForCrud}/${testHttpConnectorResourceIdForCrud}/${testHttpConnectorEndpointIdForCrud}`,
          bearerToken: test.user2.jwt
        }

        commonUtil.getRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(200)
          body.should.containDeep(httpConnEndpointJson)
          done()
        })
      })

      describe('update', function () {
        it('should update connector with PUT /httpconnectors/:_id correctly by owner user 2', function (done) {
          const options = {
            uri: `${httpConnectorBaseURI}/${testHttpConnectorIdForCrud}`,
            bearerToken: test.user2.jwt,
            json: connJSON
          }

          delete connJSON.legaycId
          connJSON.helpURL += '/some-relative-path'
          connJSON.name += ' (updated)'

          commonUtil.putRequest(options, function (error, res, body) {
            should.not.exist(error)
            res.statusCode.should.equal(200)
            body.should.containDeep(connJSON)
            connJSON = body
            delete connJSON.lastModified
            done()
          })
        })

        it('should update connector with PUT /httpconnectors/:_id correctly by owner user 2 with isGraphQL flag', function (done) {
          const options = {
            uri: `${httpConnectorBaseURI}/${testHttpConnectorIdWithGraphQLForCrud}`,
            bearerToken: test.user2.jwt,
            json: graphQLConnJSON
          }

          delete graphQLConnJSON.isGraphQL
          graphQLConnJSON.helpURL += '/some-relative-path'
          graphQLConnJSON.name += ' (updated)'

          commonUtil.putRequest(options, function (error, res, body) {
            should.not.exist(error)
            res.statusCode.should.equal(200)
            graphQLConnJSON.isGraphQL = false
            body.should.containDeep(graphQLConnJSON)
            done()
          })
        })

        it('should NOT update connector with PUT /httpconnectors/:_id correctly by another user', function (done) {
          const options = {
            uri: `${httpConnectorBaseURI}/${testHttpConnectorIdForCrud}`,
            bearerToken: test.user.jwt,
            json: _.cloneDeep(connJSON)
          }

          options.json.name += ' (should not be changed)'
          commonUtil.putRequest(options, function (error, res, body) {
            should.not.exist(error)
            res.statusCode.should.equal(403, JSON.stringify(body || res))
            done()
          })
        })

        it('should update connector resource with PUT /httpconnectorresources/:_id correctly by owner user 2', function (done) {
          const options = {
            uri: `${baseApiUri}/httpconnectorresources/${testHttpConnectorResourceIdForCrud}`,
            bearerToken: test.user2.jwt,
            json: httpConnResourceJson
          }

          httpConnResourceJson.name += ' (updated)'

          commonUtil.putRequest(options, function (error, res, body) {
            should.not.exist(error)
            res.statusCode.should.equal(200)
            body.should.containDeep(httpConnResourceJson)
            httpConnResourceJson = body
            delete httpConnResourceJson.lastModified
            done()
          })
        })

        it('should NOT update connector resource with PUT /httpconnectorresources/:_id by another user', function (done) {
          const options = {
            uri: `${baseApiUri}/httpconnectorresources/${testHttpConnectorResourceIdForCrud}`,
            bearerToken: test.user.jwt,
            json: _.cloneDeep(httpConnResourceJson)
          }

          options.json.name += ' (should not be changed)'
          commonUtil.putRequest(options, function (error, res, body) {
            should.not.exist(error)
            should([403, 422]).matchAny(res.statusCode, JSON.stringify(body || res))
            done()
          })
        })

        it('should update connector endpoint with PUT /httpconnectorendpoints/:_id correctly by owner user 2', function (done) {
          const options = {
            uri: `${baseApiUri}/httpconnectorendpoints/${testHttpConnectorEndpointIdForCrud}`,
            bearerToken: test.user2.jwt,
            json: httpConnEndpointJson
          }

          httpConnEndpointJson.name += ' (updated)'
          httpConnEndpointJson.relativeURI += '?some_param=1'

          commonUtil.putRequest(options, function (error, res, body) {
            should.not.exist(error)
            res.statusCode.should.equal(200)
            body.should.containDeep(httpConnEndpointJson)
            httpConnEndpointJson = body
            delete httpConnEndpointJson.lastModified
            done()
          })
        })

        it('should NOT update connector endpoint with PUT /httpconnectorendpoints/:_id by another user', function (done) {
          const options = {
            uri: `${baseApiUri}/httpconnectorendpoints/${testHttpConnectorEndpointIdForCrud}`,
            bearerToken: test.user.jwt,
            json: _.cloneDeep(httpConnEndpointJson)
          }

          options.json.name += ' (should not be changed)'
          commonUtil.putRequest(options, function (error, res, body) {
            should.not.exist(error)
            should([403, 422]).matchAny(res.statusCode, JSON.stringify(body || res))
            done()
          })
        })

        describe('delete', function () {
          it('should delete connector endpoint with DELETE /:_id correctly by owner user 2', function (done) {
            const options = {
              uri: `${baseApiUri}/httpconnectorendpoints/${testHttpConnectorEndpointIdForCrud}`,
              bearerToken: test.user2.jwt
            }

            commonUtil.deleteRequest(options, function (error, res, body) {
              should.not.exist(error)
              res.statusCode.should.equal(204)
              should(body).be.not.ok()
              done()
            })
          })
          it('should delete connector resource with DELETE /:_id correctly by owner user 2', function (done) {
            const options = {
              uri: `${baseApiUri}/httpconnectorresources/${testHttpConnectorResourceIdForCrud}`,
              bearerToken: test.user2.jwt
            }

            commonUtil.deleteRequest(options, function (error, res, body) {
              should.not.exist(error)
              res.statusCode.should.equal(204)
              should(body).be.not.ok()
              done()
            })
          })
          it('should delete connector with DELETE /httpconnectors/:_id correctly by user 2', function (done) {
            const options = {
              uri: `${httpConnectorBaseURI}/${testHttpConnectorIdForCrud}`,
              bearerToken: test.user2.jwt
            }

            commonUtil.deleteRequest(options, function (error, res, body) {
              should.not.exist(error)
              res.statusCode.should.equal(204)
              should(body).be.not.ok()
              done()
            })
          })
        })
      })
    })
  })
  describe('httpconnector metadata deletion with selective dependency', function (done) {
    let baseApiUri
    let testHttpConnectorId
    let connJSON = {
      name: 'testHttpConnectorId',
      published: true,
      baseURIs: ['http://www.deletebaseuri.com'],
      versioning: {
        location: 'uri'
      },
      legacyId: 'shopify',
      helpURL: 'https://some-help-url',
      versions: [
        {
          name: '/v3',
          published: true
        }
      ]
    }
    let testHttpConnectorResourceId
    let httpConnResourceJson

    let testHttpConnectorEndpointId
    let httpConnEndpointJson
    function makeRequest (options, callback) {
      commonUtil.postRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(201, JSON.stringify(body || res))
        body.should.containDeep(options.json)
        callback(body)
      })
    }
    beforeAll(function (done) {
      baseApiUri = 'http://localhost:' + nconf.get('PORT') + '/v1'
      function createConnector (callback) {
        const options = {
          uri: httpConnectorBaseURI,
          bearerToken: test.user.jwt,
          json: connJSON
        }
        makeRequest(options, (body) => {
          testHttpConnectorId = body._id
          connJSON = body
          delete connJSON.lastModified
          callback()
        })
      }

      function createConnectorResource (callback) {
        httpConnResourceJson = {
          name: 'testHttpConnectorResourceId',
          _httpConnectorId: testHttpConnectorId,
          _versionIds: [connJSON.versions[0]._id],
          published: true
        }
        const options = {
          uri: `${baseApiUri}/httpconnectorresources`,
          bearerToken: test.user.jwt,
          json: httpConnResourceJson
        }

        makeRequest(options, (body) => {
          testHttpConnectorResourceId = body._id
          httpConnResourceJson = body
          delete httpConnResourceJson.lastModified
          callback()
        })
      }

      function createConnectorEndpoint (callback) {
        httpConnEndpointJson = {
          name: 'testHttpConnectorEndpointId',
          _httpConnectorResourceIds: [testHttpConnectorResourceId],
          method: 'POST',
          relativeURI: '/:_version/test/{{testId}}/options.json',
          published: true,
          supportedBy: {
            type: 'import'
          }
        }
        const options = {
          uri: `${baseApiUri}/httpconnectorendpoints`,
          bearerToken: test.user.jwt,
          json: httpConnEndpointJson
        }

        makeRequest(options, function (body) {
          testHttpConnectorEndpointId = body._id
          httpConnEndpointJson = body
          delete httpConnEndpointJson.lastModified
          callback()
        })
      }

      createConnector(() => {
        createConnectorResource(() => {
          createConnectorEndpoint(done)
        })
      })
    })

    it('should throw error for httpconnector deletion having httpresource as dependency', function (done) {
      const options = {
        uri: `${httpConnectorBaseURI}/${testHttpConnectorId}`,
        bearerToken: test.user.jwt
      }

      commonUtil.deleteRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(422)
        body.should.containDeep({
          errors: [
            {
              code: 'delete_not_allowed',
              message: 'this document is referenced by HttpConnectorResource : ' + testHttpConnectorResourceId
            }
          ]
        })
        done()
      })
    })
    it('should throw error for httpconnector resource deletion having httpconnector endpoint as dependency', function (done) {
      const options = {
        uri: `${baseApiUri}/httpconnectorresources/${testHttpConnectorResourceId}`,
        bearerToken: test.user.jwt
      }

      commonUtil.deleteRequest(options, function (error, res, body) {
        should.not.exist(error)
        res.statusCode.should.equal(422)
        body.should.containDeep({
          errors: [
            {
              code: 'delete_not_allowed',
              message: 'this document is referenced by HttpConnectorEndpoint : ' + testHttpConnectorEndpointId
            }
          ]
        })
        done()
      })
    })
    it('should delete httpconnector endpoint having bubbles as dependency', function (done) {
      const connectionOpts = configs.connections.http
      connectionOpts.http.baseURI = connJSON.baseURIs[0]
      new Connection(Connection.generateDoc(test.user, connectionOpts)).save(function (err, connDoc) {
        should.not.exist(err)
        const httpExportOpts = configs.exports.http
        httpExportOpts._connectionId = connDoc._id
        httpExportOpts.http = {
          successMediaType: 'json',
          relativeURI: '/v3/test/{{testId}}/options.json',
          method: 'POST'
        }
        httpExportOpts.http._httpConnectorEndpointId = testHttpConnectorEndpointId
        ExportFactory.createExport(Export.generateDoc(test.user, httpExportOpts)).save(async function () {
          const httpImportOpts = configs.imports.http
          httpImportOpts._connectionId = connDoc._id
          httpImportOpts.http = {
            successMediaType: 'json',
            relativeURI: '/v3/test/{{testId}}/options.json',
            method: 'POST'
          }
          httpImportOpts.http._httpConnectorEndpointId = testHttpConnectorEndpointId
          httpImportOpts.http._httpConnectorEndpointIds = [testHttpConnectorEndpointId]
          const httpImp = await ImportFactory.createImport(Import.generateDoc(test.user, httpImportOpts)).save().catch(err => { return err })
          should.not.exist(httpImp.http._httpConnectorEndpointId)
          const options = {
            uri: `${baseApiUri}/httpconnectorendpoints/${testHttpConnectorEndpointId}`,
            bearerToken: test.user.jwt
          }
          await commonUtil.deleteRequest(options, function (error, res, body) {
            should.not.exist(error)
            res.statusCode.should.equal(204)
            should(body).be.not.ok()
            done()
          })
        })
      })
    })
    it('should delete httpconnector resource having bubbles as dependency', function (done) {
      const connectionOpts = configs.connections.http
      connectionOpts.http.baseURI = connJSON.baseURIs[0]
      new Connection(Connection.generateDoc(test.user, connectionOpts)).save(function (err, connDoc) {
        should.not.exist(err)
        const httpExportOpts = configs.exports.http
        httpExportOpts._connectionId = connDoc._id
        httpExportOpts.http = {
          successMediaType: 'json',
          relativeURI: '/v3/test/{{testId}}/options.json',
          method: 'POST'
        }
        httpExportOpts.http._httpConnectorEndpointId = testHttpConnectorEndpointId
        ExportFactory.createExport(Export.generateDoc(test.user, httpExportOpts)).save(function () {
          const httpImportOpts = configs.imports.http
          httpImportOpts._connectionId = connDoc._id
          httpImportOpts.http = {
            successMediaType: 'json',
            relativeURI: '/v3/test/{{testId}}/options.json',
            method: 'POST'
          }
          httpImportOpts.http._httpConnectorEndpointIds = [testHttpConnectorEndpointId.toString()]
          ImportFactory.createImport(Import.generateDoc(test.user, httpImportOpts)).save(function () {
            const options = {
              uri: `${baseApiUri}/httpconnectorresources/${testHttpConnectorResourceId}`,
              bearerToken: test.user.jwt
            }

            commonUtil.deleteRequest(options, function (error, res, body) {
              should.not.exist(error)
              res.statusCode.should.equal(204)
              should(body).be.not.ok()
              done()
            })
          })
        })
      })
    })
    it('should delete httpconnector having connection as dependency', function (done) {
      const connectionOpts = configs.connections.http
      connectionOpts.http.baseURI = connJSON.baseURIs[0]
      new Connection(Connection.generateDoc(test.user, connectionOpts)).save(function () {
        const options = {
          uri: `${httpConnectorBaseURI}/${testHttpConnectorId}`,
          bearerToken: test.user.jwt
        }
        commonUtil.deleteRequest(options, function (error, res, body) {
          should.not.exist(error)
          res.statusCode.should.equal(204)
          should(body).be.not.ok()
          done()
        })
      })
    })
    it('should delete httpconnector having export as dependency', function (done) {
      let newConnJSON = {
        name: 'testHttpConnectorId',
        published: false,
        baseURIs: ['http://www.somebaseuri.com'],
        versioning: {
          location: 'uri'
        },
        legacyId: 'shopify',
        helpURL: 'https://some-help-url',
        versions: [
          {
            name: '/v3',
            published: true
          }
        ]
      }

      const options = {
        uri: httpConnectorBaseURI,
        bearerToken: test.user.jwt,
        json: newConnJSON
      }
      makeRequest(options, (body) => {
        const newTestHttpConnectorId = body._id
        newConnJSON = body
        delete newConnJSON.lastModified
        const exportOpts = configs.exports

        exportOpts.webhook = {
          provider: 'custom',
          _httpConnectorId: newTestHttpConnectorId
        }
        ExportFactory.createExport(Export.generateDoc(test.user, exportOpts)).save(function () {
          const options = {
            uri: `${httpConnectorBaseURI}/${newTestHttpConnectorId}`,
            bearerToken: test.user.jwt
          }
          commonUtil.deleteRequest(options, function (error, res, body) {
            should.not.exist(error)
            res.statusCode.should.equal(204)
            should(body).be.not.ok()
            done()
          })
        })
      })
    })
  });
  ['administrator', 'manage', 'monitor', 'tileLevelManage', 'tileLevelMonitor'].forEach((accessLevel, index) => {
    describe(`HCFW Models - CRUD for ${accessLevel}`, function () {
      let sharedUserAccessToken, ashareId, _sharedWithUserId, _integrationId, tileAccessLevel
      let httpConnectorIdForCRUD
      let httpConnectorVersionIdForCRUD
      let httpConnectorResourceIdForCRUD
      let httpConnectorEndpointIdForCRUD
      let sharedUserAccessJWTToken
      if (accessLevel === 'tileLevelManage' || accessLevel === 'tileLevelMonitor') {
        tileAccessLevel = accessLevel.slice(9).toLowerCase()
      }
      beforeAll(async function () {
        if (tileAccessLevel) {
          const integration = await new Integration({
            name: 'The King In The North',
            _userId: test.user._id
          }).save()
          _integrationId = integration._id.toString()
        }

        const resp = await dbUtil.createUserAndGetToken()
        sharedUserAccessJWTToken = resp.jwt
        const ashare = await new AShare({
          _userId: test.user._id,
          _sharedWithUserId: resp.user._id,
          accepted: true,
          [tileAccessLevel ? 'integrationAccessLevel' : 'accessLevel']: tileAccessLevel ? [{ accessLevel: tileAccessLevel, _integrationId }] : accessLevel
        }).save()
        ashareId = ashare._id.toString()
      })
      describe('READ', function () {
        it(`should allow ${accessLevel} user to GET all httpconnectors`, async function () {
          const reqOpts = {
            uri: `${httpConnectorBaseURI}`,
            json: {},
            method: 'GET',
            token: sharedUserAccessJWTToken,
            headers: { 'content-type': 'application/json', 'Integrator-AShareId': ashareId }
          }
          const [res, body] = await makeRequest(reqOpts)
          res.statusCode.should.equal(200)
          res.statusCode.should.equal(200)
          body.length.should.equal(8)
          const connectors = [httpConn0Uri, httpConn1Uri, httpConn2Uri, httpConn3Uri, httpConn4Webhook, httpConn5Webhook, httpConn7IClient, httpConn8IClient]
          for (const httpConnectorNdx in body) {
            body[httpConnectorNdx]._id.should.equal(connectors[httpConnectorNdx]._id.toString())
            body[httpConnectorNdx].should.containDeep({
              _id: connectors[httpConnectorNdx]._id.toString(),
              name: connectors[httpConnectorNdx].name,
              _userId: connectors[httpConnectorNdx]._userId.toString(),
              helpURL: connectors[httpConnectorNdx].helpURL,
              legacyId: connectors[httpConnectorNdx].legacyId
            })

            if (httpConnectorNdx === '4' || httpConnectorNdx === '5') {
              body[httpConnectorNdx].supportsWebhook.should.equal(true)
            }
            if (httpConnectorNdx === '6' || httpConnectorNdx === '7') {
              body[httpConnectorNdx].supportsIClient.should.equal(true)
            } else {
              body[httpConnectorNdx].supportsIClient.should.equal(false)
            }
          }
        })

        it(`should allow ${accessLevel} user to GET /httpconnectors?publishedOnly=true`, async function () {
          const reqOpts = {
            uri: `${httpConnectorBaseURI}?publishedOnly=true`,
            json: {},
            method: 'GET',
            token: sharedUserAccessJWTToken,
            headers: { 'content-type': 'application/json', 'Integrator-AShareId': ashareId }
          }
          const [res, body] = await makeRequest(reqOpts)
          res.statusCode.should.equal(200)
          res.statusCode.should.equal(200)
          body.length.should.equal(3)
          const connectors = []
          connectors.push(httpConn0Uri._id.toString())
          connectors.push(httpConn1Uri._id.toString())
          connectors.push(httpConn3Uri._id.toString())
          for (const httpConnectorNdx in body) {
            body[httpConnectorNdx]._id.should.equal(connectors[httpConnectorNdx])
          }
        })

        it(`should allow ${accessLevel} user to GET local http connector created by the owner`, async function () {
          const reqOpts = {
            uri: `${httpConnectorBaseURI}/${httpConn2Uri._id.toString()}`,
            json: {},
            method: 'GET',
            token: sharedUserAccessJWTToken,
            headers: { 'content-type': 'application/json', 'Integrator-AShareId': ashareId }
          }
          const [res, body] = await makeRequest(reqOpts)
          res.statusCode.should.equal(200)
          body._id.should.equal(httpConn2Uri._id.toString())
          body.should.containDeep({
            _id: httpConn2Uri._id.toString(),
            name: httpConn2Uri.name,
            helpURL: httpConn2Uri.helpURL,
            legacyId: httpConn2Uri.legacyId
          })
        })

        it(`should allow ${accessLevel} user to GET http connector metadata including resources and endpoints`, async function () {
          const options = {
            uri: `${httpConnectorBaseURI}/${httpConn0Uri._id.toString()}/?returnEverything=true`,
            bearerToken: test.user.jwt,
            json: {},
            method: 'GET',
            token: sharedUserAccessJWTToken,
            headers: { 'content-type': 'application/json', 'Integrator-AShareId': ashareId }
          }
          const [res, body] = await makeRequest(options)
          res.statusCode.should.equal(200)

          validateHttpConnector(body, HttpConnector.generateResponse(httpConn0Uri))
          body.httpConnectorResources.length.should.equal(3)
          const resources = []
          resources.push(httpConn0UriResource0)
          resources.push(httpConn0UriResource1)
          resources.push(httpConn0UriResource2)
          for (const httpConnectorResourceNdx in resources) {
            validateHttpConnectorResource(body.httpConnectorResources[httpConnectorResourceNdx], HttpConnectorResource.generateResponse(resources[httpConnectorResourceNdx]))
          }
          body.httpConnectorEndpoints.length.should.equal(4)
          const endpoints = []
          endpoints.push(httpConn0UriResource0Endpoint0)
          endpoints.push(httpConn0UriResource0Endpoint1)
          endpoints.push(httpConn0UriResource1Endpoint0)
          endpoints.push(httpConn0UriResource2Endpoint0)
          for (const httpConnectorEndpointNdx in endpoints) {
            validateHttpConnectorEndpoint(body.httpConnectorEndpoints[httpConnectorEndpointNdx], HttpConnectorEndpoint.generateResponse(endpoints[httpConnectorEndpointNdx]))
          }
        })
      })
      if (tileAccessLevel || (accessLevel === 'monitor')) { // unhappy paths
        it(`should restrict ${accessLevel} user to CREATE/UPDATE/DELETE HTTP Connectors`, async function () {
          // CREATE
          const reqOpts = {
            uri: `${httpConnectorBaseURI}`,
            json: {
              name: 'House Lannister',
              baseURIs: ['https://hear.me.roar'],
              versions: [{ name: 'v1' }],
              versioning: { location: 'uri' }
            },
            method: 'POST',
            token: sharedUserAccessJWTToken,
            headers: { 'content-type': 'application/json', 'Integrator-AShareId': ashareId }
          }
          const [createRes, createBody] = await makeRequest(reqOpts)
          createRes.statusCode.should.equal(403)
          createBody.should.containDeep({
            errors: [{
              code: 'access_restricted'
            }]
          })
          // UPDATE
          reqOpts.uri = reqOpts.uri + '/' + httpConn0Uri._id.toString()
          reqOpts.method = 'PUT'
          reqOpts.json = httpConn0Uri
          const [updateRes, updateBody] = await makeRequest(reqOpts)
          updateRes.statusCode.should.equal(403)
          updateBody.should.containDeep({
            errors: [{
              code: 'access_restricted'
            }]
          })

          // DELETE
          reqOpts.method = 'DELETE'
          const [deleteRes, deleteBody] = await makeRequest(reqOpts)
          deleteRes.statusCode.should.equal(403)
          deleteBody.should.containDeep({
            errors: [{
              code: 'access_restricted'
            }]
          })
        })
        return
      }
      describe('CREATE & UPDATE', function () {
        it(`should allow ${accessLevel} user to CREATE & UPDATE httpConnector`, async function () {
          // CREATE
          const reqOpts = {
            uri: `${httpConnectorBaseURI}`,
            json: {
              name: 'House Lannister',
              baseURIs: ['https://hear.me.roar'],
              versions: [{ name: 'v1' }],
              versioning: { location: 'uri' }
            },
            method: 'POST',
            token: sharedUserAccessJWTToken,
            headers: { 'content-type': 'application/json', 'Integrator-AShareId': ashareId }
          }
          const [createRes, createBody] = await makeRequest(reqOpts)
          createRes.statusCode.should.equal(201)
          createBody.should.containDeep({
            name: 'House Lannister',
            baseURIs: ['https://hear.me.roar']
          })
          httpConnectorIdForCRUD = createBody._id
          httpConnectorVersionIdForCRUD = createBody.versions[0]._id

          // UPDATE
          reqOpts.uri = reqOpts.uri + '/' + createBody._id
          reqOpts.method = 'PUT'
          reqOpts.json = createBody
          reqOpts.json.name = 'House Targaryen'
          reqOpts.json.baseURIs[0] = 'https://fire.and.blood'
          const [updateRes, updateBody] = await makeRequest(reqOpts)
          updateRes.statusCode.should.equal(200)
          updateBody.should.containDeep({
            name: reqOpts.json.name,
            baseURIs: reqOpts.json.baseURIs
          })
        })

        it(`should allow ${accessLevel} user to CREATE & UPDATE httpConnectorResource`, async function () {
          // CREATE
          const reqOpts = {
            uri: httpConnectorResourceBaseURI,
            json: {
              name: 'Oathkeeper',
              _httpConnectorId: httpConnectorIdForCRUD,
              _versionIds: [httpConnectorVersionIdForCRUD]
            },
            method: 'POST',
            token: sharedUserAccessJWTToken,
            headers: { 'content-type': 'application/json', 'Integrator-AShareId': ashareId }
          }
          const [createRes, createBody] = await makeRequest(reqOpts)
          createRes.statusCode.should.equal(201)
          createBody.should.containDeep({
            name: reqOpts.json.name,
            _versionIds: [httpConnectorVersionIdForCRUD],
            _httpConnectorId: httpConnectorIdForCRUD
          })
          httpConnectorResourceIdForCRUD = createBody._id

          // UPDATE
          reqOpts.uri = reqOpts.uri + '/' + createBody._id
          reqOpts.method = 'PUT'
          reqOpts.json = createBody
          reqOpts.json.name = 'Longclaw'
          const [updateRes, updateBody] = await makeRequest(reqOpts)
          updateRes.statusCode.should.equal(200)
          updateBody.should.containDeep({
            name: reqOpts.json.name
          })
        })

        it(`should allow ${accessLevel} user to CREATE & UPDATE httpConnectorEndpoint`, async function () {
          // CREATE
          const reqOpts = {
            uri: httpConnectorEndpointBaseURI,
            json: {
              _httpConnectorResourceIds: [httpConnectorResourceIdForCRUD],
              method: 'GET',
              name: 'A girl has no name',
              relativeURI: '/bravos',
              published: false,
              supportedBy: {
                type: 'export'
              }
            },
            method: 'POST',
            token: sharedUserAccessJWTToken,
            headers: { 'content-type': 'application/json', 'Integrator-AShareId': ashareId }
          }
          const [createRes, createBody] = await makeRequest(reqOpts)
          createRes.statusCode.should.equal(201)
          createBody.should.containDeep({
            name: reqOpts.json.name,
            _httpConnectorResourceIds: [httpConnectorResourceIdForCRUD],
            relativeURI: '/bravos'
          })
          httpConnectorEndpointIdForCRUD = createBody._id

          // UPDATE
          reqOpts.uri = reqOpts.uri + '/' + createBody._id
          reqOpts.method = 'PUT'
          reqOpts.json = createBody
          reqOpts.json.name = 'A girl is Arya Stark'
          const [updateRes, updateBody] = await makeRequest(reqOpts)
          updateRes.statusCode.should.equal(200)
          updateBody.should.containDeep({
            name: reqOpts.json.name
          })
        })
      })
      describe('DELETE', function () {
        it(`should allow ${accessLevel} to DELETE httpConnectorEndpoint`, async function () {
          const reqOpts = {
            json: {},
            method: 'DELETE',
            token: sharedUserAccessJWTToken,
            headers: { 'content-type': 'application/json', 'Integrator-AShareId': ashareId }
          }
          reqOpts.uri = httpConnectorEndpointBaseURI + '/' + httpConnectorEndpointIdForCRUD
          const [deleteRes, deleteBody] = await makeRequest(reqOpts)
          deleteRes.statusCode.should.equal(204)
          should.not.exist(deleteBody)
        })

        it(`should allow ${accessLevel} to DELETE httpConnectorResource`, async function () {
          const reqOpts = {
            json: {},
            method: 'DELETE',
            token: sharedUserAccessJWTToken,
            headers: { 'content-type': 'application/json', 'Integrator-AShareId': ashareId }
          }
          reqOpts.uri = httpConnectorResourceBaseURI + '/' + httpConnectorResourceIdForCRUD
          const [deleteRes, deleteBody] = await makeRequest(reqOpts)
          deleteRes.statusCode.should.equal(204)
          should.not.exist(deleteBody)
        })

        it(`should allow ${accessLevel} to DELETE httpConnector`, async function () {
          const reqOpts = {
            json: {},
            method: 'DELETE',
            token: sharedUserAccessJWTToken,
            headers: { 'content-type': 'application/json', 'Integrator-AShareId': ashareId }
          }
          reqOpts.uri = httpConnectorBaseURI + '/' + httpConnectorIdForCRUD
          const [deleteRes, deleteBody] = await makeRequest(reqOpts)
          deleteRes.statusCode.should.equal(204)
          should.not.exist(deleteBody)
        })
      })
    })
  })

  describe('\'/fetchMatchingConnectors\' route', function () {
    beforeAll(async function () {
      // ----------------------------------------- //
      // connNdx = 9 -- HEADER
      let httpConnJson =
      {
        _userId: test.user._id,
        name: 'test_connector9',
        published: true,
        legacyId: 'shopify',
        apis: [
          {
            name: 'test_api',
            published: true,
            versioning: {
              location: 'header',
              headerName: 'version'
            },
            baseURIs: ['http://www.header1.com', 'http://www.header2.com'],
            versions: [
              {
                name: 'v3',
                published: true
              },
              {
                name: 'v2',
                baseURIs: ['http://www.header3.com/dummy'],
                published: true
              },
              {
                name: 'v1',
                published: true
              }
            ]
          }
        ]
      }

      httpConn9Header = await new HttpConnector(HttpConnector.generateDoc(test.user, httpConnJson)).save().catch(err => { return err })
      allHttpConnectorIds.push(httpConn9Header._id.toString())

      httpConn9HeaderApi0 = httpConn9Header.apis[0]._id.toString()
      httpConn9HeaderApi0Version0 = httpConn9Header.apis[0].versions[0]._id.toString()
      httpConn9HeaderApi0Version1 = httpConn9Header.apis[0].versions[1]._id.toString()
      httpConn9HeaderApi0Version2 = httpConn9Header.apis[0].versions[2]._id.toString()
      // ----------------------------------------- //
      // connNdx = 10 -- URI
      httpConnJson =
      {
        _userId: test.user._id,
        name: 'test_connector10',
        published: true,
        baseURIs: ['https://{{{connection.settings.tempName}}}.testing.com/:_version'],
        legacyId: 'shopify',
        versioning: {
          location: 'uri'
        },
        versions: [
          {
            name: '/v3',
            published: true
          },
          {
            name: '/v2',
            published: true
          },
          {
            name: '/v1',
            published: true
          }
        ]
      }

      httpConn10Uri = await new HttpConnector(HttpConnector.generateDoc(test.user, httpConnJson)).save().catch(err => { return err })
      allHttpConnectorIds.push(httpConn10Uri._id.toString())

      httpConn10UriVersion0 = httpConn10Uri.versions[0]._id.toString()
      httpConn10UriVersion1 = httpConn10Uri.versions[1]._id.toString()
      httpConn10UriVersion2 = httpConn10Uri.versions[2]._id.toString()
      // ----------------------------------------- //
      // ndx = 11 disableAutoLinking = true
      httpConnJson = {
        _userId: test.user._id,
        name: 'test_connector11',
        published: true,
        baseURIs: ['http://www.somebaseuriautolinking.com/:_version'],
        disableAutoLinking: true,
        legacyId: 'shopify',
        versioning: {
          location: 'uri'
        },
        versions: [
          {
            name: 'v3',
            published: true
          },
          {
            name: 'v2',
            baseURIs: ['http://www.somebaseurisautolinking.com/:_version'],
            published: true
          },
          {
            name: 'v1',
            published: true
          }
        ]
      }

      httpConn11AutoLinking = await new HttpConnector(HttpConnector.generateDoc(test.user, httpConnJson)).save().catch(err => { return err })
      httpConn11AutoLinkingVersion0 = httpConn11AutoLinking.versions[0]._id.toString()
      allHttpConnectorIds.push(httpConn11AutoLinking._id.toString())
      // ----------------------------------------- //
      // ndx = 12 published = false
      httpConnJson = {
        _userId: test.user._id,
        name: 'test_connector12',
        published: false,
        baseURIs: ['http://www.somebaseurinotpublished.com/:_version'],
        legacyId: 'shopify',
        versioning: {
          location: 'uri'
        },
        versions: [
          {
            name: 'v3',
            published: false
          },
          {
            name: 'v2',
            baseURIs: ['http://www.somebaseurisnotpublished.com/:_version'],
            published: false
          },
          {
            name: 'v1',
            published: false
          }
        ]
      }

      httpConn12NotPublished = await new HttpConnector(HttpConnector.generateDoc(test.user, httpConnJson)).save().catch(err => { return err })
      httpConn12NotPublishedVersion0 = httpConn12NotPublished.versions[0]._id.toString()
      allHttpConnectorIds.push(httpConn12NotPublished._id.toString())
    })

    it('should return empty array if no baseURI is provided in query', function (done) {
      const reqOpts = {
        uri: fetchMatchingConnectorsBaseURI,
        bearerToken: test.user.jwt
      }
      commonUtil.getRequest(reqOpts, function (err, res, body) {
        should.not.exist(err)
        res.statusCode.should.equal(200)
        assert.deepStrictEqual(body, [])
        done()
      })
    })

    it('should return matching single connector for a given baseURI', function (done) {
      const reqOpts = {
        uri: `${fetchMatchingConnectorsBaseURI}?baseURI=http://www.somebaseuri.com`,
        bearerToken: test.user.jwt
      }
      commonUtil.getRequest(reqOpts, function (err, res, body) {
        should.not.exist(err)
        const expected = [{ httpConnectorId: httpConn0Uri._id.toString(), httpConnectorVersionId: [httpConn0UriVersion0, httpConn0UriVersion2] }]
        res.statusCode.should.equal(200)
        assert.deepStrictEqual(body, expected)
        done()
      })
    })

    it('should return matching multiple connectors for a given baseURI', function (done) {
      const reqOpts = {
        uri: `${fetchMatchingConnectorsBaseURI}?baseURI=http://www.foo1.com`,
        bearerToken: test.user.jwt
      }
      commonUtil.getRequest(reqOpts, function (err, res, body) {
        should.not.exist(err)
        res.statusCode.should.equal(200)
        const expected = [{ httpConnectorId: httpConn1Uri._id.toString(), httpConnectorApiId: httpConn1UriApi0, httpConnectorVersionId: [httpConn1UriApi0Version0, httpConn1UriApi0Version2] }, { httpConnectorId: httpConn2Uri._id.toString(), httpConnectorApiId: httpConn2UriApi0, httpConnectorVersionId: [httpConn2UriApi0Version0, httpConn2UriApi0Version2] }, { httpConnectorId: httpConn3Uri._id.toString(), httpConnectorApiId: httpConn3UriApi0, httpConnectorVersionId: [httpConn3UriApi0Version0, httpConn3UriApi0Version2] }, { httpConnectorId: httpConn4Webhook._id.toString(), httpConnectorApiId: httpConn4WebhookApi0, httpConnectorVersionId: [httpConn4WebhookApi0Version0, httpConn4WebhookApi0Version2] }, { httpConnectorId: httpConn5Webhook._id.toString(), httpConnectorApiId: httpConn5WebhookApi0, httpConnectorVersionId: [httpConn5WebhookApi0Version0, httpConn5WebhookApi0Version2] }, { httpConnectorId: httpConn8IClient._id.toString(), httpConnectorApiId: httpConn8IClientApi0, httpConnectorVersionId: [httpConn8IClientApi0Version0, httpConn8IClientApi0Version2] }]
        assert.deepStrictEqual(body, expected)
        done()
      })
    })

    it('should not return any connectors if it is not published', function (done) {
      const reqOpts = {
        uri: `${fetchMatchingConnectorsBaseURI}?baseURI=http://www.baseuri.com`,
        bearerToken: test.user.jwt
      }
      commonUtil.getRequest(reqOpts, function (err, res, body) {
        should.not.exist(err)
        res.statusCode.should.equal(200)
        assert.deepStrictEqual(body, [])
        done()
      })
    })

    it('should return matching connectors for a connector with API Id', function (done) {
      const reqOpts = {
        uri: `${fetchMatchingConnectorsBaseURI}?baseURI=http://www.header3.com/dummy`,
        bearerToken: test.user.jwt
      }
      commonUtil.getRequest(reqOpts, function (err, res, body) {
        should.not.exist(err)
        res.statusCode.should.equal(200)
        const expected = [{ httpConnectorId: httpConn9Header._id.toString(), httpConnectorApiId: httpConn9HeaderApi0, httpConnectorVersionId: [httpConn9HeaderApi0Version1] }]
        assert.deepStrictEqual(body, expected)
        done()
      })
    })

    it('should return matching connectors with multiple versions', function (done) {
      const reqOpts = {
        uri: `${fetchMatchingConnectorsBaseURI}?baseURI=http://www.header1.com`,
        bearerToken: test.user.jwt
      }
      commonUtil.getRequest(reqOpts, function (err, res, body) {
        should.not.exist(err)
        res.statusCode.should.equal(200)
        const expected = [{ httpConnectorId: httpConn9Header._id.toString(), httpConnectorApiId: httpConn9HeaderApi0, httpConnectorVersionId: [httpConn9HeaderApi0Version0, httpConn9HeaderApi0Version2] }]
        assert.deepStrictEqual(body, expected)
        done()
      })
    })

    it('should return matching connectors with handlebar in connector baseURI', function (done) {
      const reqOpts = {
        uri: `${fetchMatchingConnectorsBaseURI}?baseURI=http://tempName.testing.com/v1`,
        bearerToken: test.user.jwt
      }
      commonUtil.getRequest(reqOpts, function (err, res, body) {
        should.not.exist(err)
        res.statusCode.should.equal(200)
        const expected = [{ httpConnectorId: httpConn10Uri._id.toString(), httpConnectorVersionId: [httpConn10UriVersion2] }]
        assert.deepStrictEqual(body, expected)
        done()
      })
    })

    it('should return matching connectors with handlebar in connector baseURI with multiple versions', function (done) {
      const reqOpts = {
        uri: `${fetchMatchingConnectorsBaseURI}?baseURI=http://tempName.testing.com`,
        bearerToken: test.user.jwt
      }
      commonUtil.getRequest(reqOpts, function (err, res, body) {
        should.not.exist(err)
        res.statusCode.should.equal(200)
        const expected = [{ httpConnectorId: httpConn10Uri._id.toString(), httpConnectorVersionId: [httpConn10UriVersion0, httpConn10UriVersion1, httpConn10UriVersion2] }]
        assert.deepStrictEqual(body, expected)
        done()
      })
    })

    it('should return matching connectors with handlebar in connector baseURI and in request baseURI', function (done) {
      const reqOpts = {
        uri: `${fetchMatchingConnectorsBaseURI}?baseURI=http://{{{connection.settings.temp}}}.testing.com/v1`,
        bearerToken: test.user.jwt
      }
      commonUtil.getRequest(reqOpts, function (err, res, body) {
        should.not.exist(err)
        res.statusCode.should.equal(200)
        const expected = [{ httpConnectorId: httpConn10Uri._id.toString(), httpConnectorVersionId: [httpConn10UriVersion2] }]
        assert.deepStrictEqual(body, expected)
        done()
      })
    })

    it('should return array with matching connectors for connector with disableAutoLinking as true', function (done) {
      const reqOpts = {
        uri: `${fetchMatchingConnectorsBaseURI}?baseURI=http://www.somebaseuriautolinking.com/v3`,
        bearerToken: test.user.jwt
      }
      commonUtil.getRequest(reqOpts, function (err, res, body) {
        should.not.exist(err)
        res.statusCode.should.equal(200)
        const expected = [{ httpConnectorId: httpConn11AutoLinking._id.toString(), httpConnectorVersionId: [httpConn11AutoLinkingVersion0] }]
        assert.deepStrictEqual(body, expected)
        done()
      })
    })

    it('should return array with matching connectors for not published connector with same userId as connector', function (done) {
      const reqOpts = {
        uri: `${fetchMatchingConnectorsBaseURI}?baseURI=http://www.somebaseurinotpublished.com/v3`,
        bearerToken: test.user.jwt
      }
      commonUtil.getRequest(reqOpts, function (err, res, body) {
        should.not.exist(err)
        res.statusCode.should.equal(200)
        const expected = [{ httpConnectorId: httpConn12NotPublished._id.toString(), httpConnectorVersionId: [httpConn12NotPublishedVersion0] }]
        assert.deepStrictEqual(body, expected)
        done()
      })
    })
  })
})

function validateHttpConnector (body, expected) {
  body.name.should.equal(expected.name)
  if (body.baseURIs && body.baseURIs.length && body.apis && body.apis.length) {
    body.baseURIs.should.containDeep(expected.baseURIs)
  }
  if (expected.apis) body.apis.should.containDeep(JSON.parse(JSON.stringify(expected.apis)))
  if (expected.versions) body.versions.should.containDeep(JSON.parse(JSON.stringify(expected.versions)))
  if (expected.helpURL) body.helpURL.should.equal(expected.helpURL)
  if (expected.legacyId) body.legacyId.should.equal(expected.legacyId)
  if (expected.preBuiltExports) {
    for (const preBuiltExport of body.preBuiltExports) {
      preBuiltExport._exportId = preBuiltExport._exportId.toString()
    }
    body.preBuiltExports.should.containDeep(expected.preBuiltExports)
  }
  if (expected.preBuiltImports) {
    for (const preBuiltImport of body.preBuiltImports) {
      preBuiltImport._importId = preBuiltImport._importId.toString()
    }
    body.preBuiltImports.should.containDeep(expected.preBuiltImports)
  }
}

function validateHttpConnectorResource (body, expected) {
  body.name.should.equal(expected.name)
  if (expected._httpConnectorId) body._httpConnectorId.should.equal(expected._httpConnectorId.toString())
  if (expected._versionIds) assert.deepStrictEqual(body._versionIds, expected._versionIds.map(id => id.toString()))
  if (expected.resourceFields) assert.deepStrictEqual(body.resourceFields, expected.resourceFields)
  if (expected.supportedBy) assert.deepStrictEqual(body.supportedBy, expected.supportedBy)
}

function validateHttpConnectorEndpoint (body, expected) {
  body.name.should.equal(expected.name)
  body.method.should.equal(expected.method)
  body.relativeURI.should.equal(expected.relativeURI)
  if (expected.description) body.description.should.equal(expected.description)
  if (expected._httpConnectorResourceIds) assert.deepStrictEqual(body._httpConnectorResourceIds, expected._httpConnectorResourceIds.map(id => id.toString()))
  if (expected.queryParameters) assert.deepStrictEqual(body.queryParameters, expected.queryParameters)
  if (expected.pathParameters) assert.deepStrictEqual(body.pathParameters, expected.pathParameters)
  if (expected.supportedBy) assert.deepStrictEqual(body.supportedBy, expected.supportedBy)
  if (expected.resourceFields) {
    expected.resourceFields.forEach(function (resourceField) { resourceField._httpConnectorResourceId = resourceField._httpConnectorResourceId.toString() })
    assert.deepStrictEqual(body.resourceFields, expected.resourceFields)
  }
}
