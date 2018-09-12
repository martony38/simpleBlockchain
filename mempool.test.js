const mempool = require('./mempool');
const testMempool = new mempool();

const db = require('./mempoolDB');

beforeAll(() => {
  if (db.isClosed()) {
    return db.open();
  }
})

afterAll(() => {
  for (const key in testMempool.timeouts) {
    if (testMempool.timeouts.hasOwnProperty(key)) {
      const timeoutID = testMempool.timeouts[key];
      clearTimeout(timeoutID);
    }
  }

  // Close levelDB instance
  return db.close();
})

describe('init and get', () => {
  beforeAll(() => {
    // Initialize mempool
    return db.batch()
      .put('142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ', JSON.stringify({
        "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
        "requestTimeStamp": new Date().getTime(),
        "message": `142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:${new Date().getTime().toString().slice(0, -3)}:starRegistry`,
        "validationWindow": 300,
        "messageSignature": ""
      }))
      .put('132BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ', JSON.stringify({
        "address": "132BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
        "requestTimeStamp": "1532296090",
        "message": "132BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
        "validationWindow": -2,
        "messageSignature": ""
      }))
      .put('152BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ', JSON.stringify({
        "address": "152BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
        "requestTimeStamp": "1532296090",
        "message": "152BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
        "validationWindow": -26,
        "messageSignature": ""
      }))
      .put('143BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ', JSON.stringify({
        "address": "143BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
        "requestTimeStamp": "1532296090",
        "message": "143BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
        "validationWindow": -2,
        "messageSignature": ""
      }))
      .write();
  })

  test('init should remove old requests', () => {
    return testMempool.init()
      .then(() => {
        return new Promise((resolve, reject) => {
          let requests = [];

          db.createReadStream()
            .on('data', data => {
              requests.push(data.key);
            })
            .on('error', function (err) {
              reject(err);
            })
            .on('close', function () {
              resolve(requests);
            })
        })
      })
      .then(requests => {
        expect(requests).toContain('142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ');
        expect(requests.length).toBe(1);
      })
  });

  test('getStarRegistrationRequest should return the correct request', () => {
    return testMempool.getStarRegistrationRequest('142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ')
      .then(request => {
        expect(request.address).toBe('142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ');
      });
  });
})

describe('add star', () => {
  afterAll(() => {
    // Restore mempool
    return db.batch()
      .del('153BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ')
      .write();
  })

  test('addStarRegistrationRequest should add a new request and a timeout', () => {
    return testMempool.addStarRegistrationRequest('153BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ')
      .then(() => {
        return db.get('153BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ');
      })
      .then(result => {
        const request = JSON.parse(result);
        expect(request).toHaveProperty('address');
        expect(request).toHaveProperty('requestTimeStamp');
        expect(request).toHaveProperty('message');
        expect(request).toHaveProperty('validationWindow');
        expect(request).toHaveProperty('messageSignature');
        expect(testMempool.timeouts['153BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ']['_idleTimeout']).toBeGreaterThan(-1);
      });
  });
})

describe('delete request', () => {
  beforeAll(() => {
    return testMempool.addStarRegistrationRequest('153BDCfSGbXjWKaAnYXbMpZ6sbrSAo3DpZ')
  })

  test('deleteStarRegistrationRequest should remove the request from mempool and cancel timeout', () => {
    return testMempool.deleteStarRegistrationRequest('153BDCfSGbXjWKaAnYXbMpZ6sbrSAo3DpZ')
      .then(() => {
        return new Promise((resolve, reject) => {
          let requests = [];

          db.createReadStream()
            .on('data', data => {
              requests.push(data.key);
            })
            .on('error', function (err) {
              reject(err);
            })
            .on('close', function () {
              resolve(requests);
            })
        })
      })
      .then(requests => {
        expect(requests).toContain('142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ');
        expect(requests.length).toBe(1);
        expect(testMempool.timeouts['153BDCfSGbXjWKaAnYXbMpZ6sbrSAo3DpZ']['_idleNext']).toBeNull();
        expect(testMempool.timeouts['153BDCfSGbXjWKaAnYXbMpZ6sbrSAo3DpZ']['_idleTimeout']).toBe(-1);
      });
  });
})

