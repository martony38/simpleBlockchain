const request = require('supertest');
const app = require('./app');
const db = require('./database');

const goodBlock0 = {
  hash: '36f25e45750f39a7e3a760ceee00bf98fe7366fe8df5d0c648ef63ab2375c596',
  height: 0,
  body: 'First block in the chain - Genesis block',
  time: '1536092098',
  previousBlockHash: ''
}

const goodBlock1 = {
  hash: 'a558b8b10fa8db50fe3e2f48154db7c2ebf4b027a88b766bdf4145e1cc332218',
  height: 1,
  body: {
    address: '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ',
    star: { mag: 1,
      ra: '16h 29m 1.0s',
      dec: '-26° 29\' 24.9',
      story: '466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f'
    }
  },
  time: '1536092098',
  previousBlockHash: '36f25e45750f39a7e3a760ceee00bf98fe7366fe8df5d0c648ef63ab2375c596'
}

const goodBlock2 = {
  hash: '12edf5e1d740fc138b573141b454083b70f56280e2fb6b0a91f5ac8440211f26',
  height: 2,
  body: {
    address: '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ',
    star: {
      mag: 2,
      ra: '16h 29m 1.0s',
      dec: '-26° 29\' 24.9',
      story: '466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f'
    }
  },
  time: '1536092098',
  previousBlockHash: 'a558b8b10fa8db50fe3e2f48154db7c2ebf4b027a88b766bdf4145e1cc332218'
}

const goodBlock3 = {
  hash: 'c877eb11aa0668d7a097f1e4d5d1d7da46bad16cf91f055df8deb596df9b215f',
  height: 3,
  body: {
    address: '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ',
    star: {
      mag: 3,
      ra: '16h 29m 1.0s',
      dec: '-26° 29\' 24.9',
      story: '466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f'
    }
  },
  time: '1536092098',
  previousBlockHash: '12edf5e1d740fc138b573141b454083b70f56280e2fb6b0a91f5ac8440211f26'
}

const goodBlock4 = {
  hash: 'a41161bf9c4132915e7b4424351d1a78b3d951515923df469a1c18a1460a774e',
  height: 4,
  body: {
    address: '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ',
    star: {
      mag: 4,
      ra: '16h 29m 1.0s',
      dec: '-26° 29\' 24.9',
      story: '466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f'
    }
  },
  time: '1536092098',
  previousBlockHash: 'c877eb11aa0668d7a097f1e4d5d1d7da46bad16cf91f055df8deb596df9b215f'
}

const badPayLoad = { badPayload: 'a bad payload' }

beforeAll(() => {
  // Initialize test blockchain
  return db.batch()
    .put(0, JSON.stringify(goodBlock0))
    .put(1, JSON.stringify(goodBlock1))
    .put(2, JSON.stringify(goodBlock2))
    .put(3, JSON.stringify(goodBlock3))
    .put(4, JSON.stringify(goodBlock4))
    .write();
})

afterAll(() => {
  // Delete test blockchain
  return db.batch()
    .del(0)
    .del(1)
    .del(2)
    .del(3)
    .del(4)
    .del(5)
    .write()
    .then(() => db.close());
})

describe('GET request with url path http://localhost:8000/block/{BLOCK_HEIGHT}', () => {
  test('It should respond to the GET method', () => {
    let expectedBlock = JSON.parse(JSON.stringify(goodBlock1))
    expectedBlock.body.star['storyDecoded'] = "Found star using https://www.google.com/sky/"

    return request(app).get("/block/1")
      .expect(200, expectedBlock)
      .expect('Content-Type', /json/)
  });

  test('It should respond an error if something different than a number id passed in the url to the GET method', () => {
    return request(app).get("/block/not_a_number")
      .expect(400)
      .expect('Content-Type', /json/);
  });

  test('It should respond an error if block not found', () => {
    return request(app).get("/block/20")
      .expect(404)
      .expect('Content-Type', /json/);
  });
})

describe('Get request to url path http://localhost:8000/stars/hash:[hash]', () => {
  test('It should respond an error if block not found', () => {
    return request(app).get("/stars/hash:96e9c79f07744d761aa0e45b228427f6198411d74779dbbe8dd867fa1e763512")
      .expect(404)
      .expect('Content-Type', /json/);
  });

  test('It should respond an error if hash param is not a valid SHA256 hash - string not hexadecimal', () => {
    return request(app).get("/stars/hash:S42ADCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ")
      .expect(400)
      .expect('Content-Type', /json/)
      .then(response => {
        expect(response.body).toEqual({ Error: 'Hash is not a SHA256 hash' });
      });
  })

  test('It should respond an error if hash param is not a valid SHA256 hash - not 256 bits', () => {
    return request(app).get("/stars/hash:12edf5e1d740fc138b573141b454083b70f56280e2fb6b0a91f5ac8440211f2")
      .expect(400)
      .expect('Content-Type', /json/)
      .then(response => {
        expect(response.body).toEqual({ Error: 'Hash is not a SHA256 hash' });
      });
  })

  test('It should return the correct block', () => {
    let expectedBlock = JSON.parse(JSON.stringify(goodBlock2))
    expectedBlock.body.star['storyDecoded'] = "Found star using https://www.google.com/sky/"

    return request(app).get("/stars/hash:12edf5e1d740fc138b573141b454083b70f56280e2fb6b0a91f5ac8440211f26")
      .expect(200, expectedBlock)
      .expect('Content-Type', /json/);
  });

  test('It should return the correct block even if uppercases are used in the hash', () => {
    let expectedBlock = JSON.parse(JSON.stringify(goodBlock2))
    expectedBlock.body.star['storyDecoded'] = "Found star using https://www.google.com/sky/"

    return request(app).get("/stars/hash:12EDF5e1d740fc138b573141b454083b70f56280e2fb6b0a91f5ac8440211f26")
      .expect(200, expectedBlock)
      .expect('Content-Type', /json/);
  });
})

describe('Get request to url path http://localhost:8000/stars/address:[address]', () => {
  test('It should respond an error if no block found', () => {
    return request(app).get("/stars/address:142ADCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ")
      .expect(404)
      .expect('Content-Type', /json/);
  });

  test('It should respond an error if address param is not a valid wallet address', () => {
    return request(app).get("/stars/address:S42ADCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ")
      .expect(400)
      .expect('Content-Type', /json/)
      .then(response => {
        expect(response.body).toEqual({ Error: 'The address does not appear to be a valid wallet address.' });
      });
  })

  test('It should return the correct blocks', () => {
    let expectedBlock1 = JSON.parse(JSON.stringify(goodBlock1))
    expectedBlock1.body.star['storyDecoded'] = "Found star using https://www.google.com/sky/"

    let expectedBlock2 = JSON.parse(JSON.stringify(goodBlock2))
    expectedBlock2.body.star['storyDecoded'] = "Found star using https://www.google.com/sky/"

    let expectedBlock3 = JSON.parse(JSON.stringify(goodBlock3))
    expectedBlock3.body.star['storyDecoded'] = "Found star using https://www.google.com/sky/"

    let expectedBlock4 = JSON.parse(JSON.stringify(goodBlock4))
    expectedBlock4.body.star['storyDecoded'] = "Found star using https://www.google.com/sky/"

    return request(app).get("/stars/address:142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ")
      .expect(200, [expectedBlock1, expectedBlock2, expectedBlock3, expectedBlock4])
      .expect('Content-Type', /json/);
  });
})

describe('POST request with url path http://localhost:8000/block with body payload option.', () => {
  const goodPayload = {
    address: "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    star: {
      dec: "-26° 29' 24.9",
      ra: "16h 29m 1.0s",
      story: "Found star using https://www.google.com/sky/",
      mag: '4.83',
      const: 'Cen'
    }
  }

  test('It should respond 400 if wrong payload', () => {
    return request(app).post("/block").send(badPayLoad)
      .expect(400)
      .expect('Content-Type', /json/);
  })

  test('It should respond 415 to requests made with non supported media-types (other than application/json)', () => {
    return request(app).post("/block").set('Content-Type', 'application/x-www-form-urlencoded').send('body=test')
      .expect(415)
      .expect('Content-Type', /json/);
  })

  test('It should respond 400 if wrong star payload', () => {
    let wrongStarPayLoad = JSON.parse(JSON.stringify(goodPayload))
    wrongStarPayLoad.star['badProperty'] = 'test'

    return request(app).post("/block").send(wrongStarPayLoad)
      .expect(400)
      .expect('Content-Type', /json/)
      .then(response => {
        expect(response.body).toEqual({ Error: 'Star object in payload can only contains the following properties: ra, dec, story, mag, const.' });
      });
  })

  test('It should not create a new block if signature has not been validated', () => {
    return request(app).post("/block").send(goodPayload)
      .expect(401)
      .expect('Content-Type', /json/)
      .then(response => {
        expect(response.body).toEqual({ Error: 'Message signature invalid or missing or expired' });
      });
  })

  test('Star story only supports ASCII text', () => {
    let badEncoding = JSON.parse(JSON.stringify(goodPayload))
    badEncoding.star.story = "this tést contains the non-ascii character é"

    return request(app).post("/block").send(badEncoding)
      .expect(400)
      .expect('Content-Type', /json/)
      .then(response => {
        expect(response.body).toEqual({ Error: 'star.story should only include ascii characters.' });
      });
  })

  test('Star story limited to 250 words (500 bytes)', () => {
    let storyTooLong = JSON.parse(JSON.stringify(goodPayload))
    storyTooLong.star.story = "this is a very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very long story"

    return request(app).post("/block").send(storyTooLong)
      .expect(400)
      .expect('Content-Type', /json/)
      .then(response => {
        expect(response.body).toEqual({ Error: 'star.story exceeds 500 bytes.' });
      });
  })

  describe('request signature has been validated', () => {
    const bitcoin = require('bitcoinjs-lib');
    const bitcoinMessage = require('bitcoinjs-message');

    // from https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/addresses.js#L40
    const keyPair = bitcoin.ECPair.fromWIF('Kxr9tQED9H44gCmp6HAdmemAzU3n84H3dGkuWTKvE23JgHMW8gct');
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
    const privateKey = keyPair.privateKey;

    beforeAll(() => {
      // validate signature
      return request(app).post("/requestValidation").send({ address })
        .then(response => {
          return bitcoinMessage.sign(response.body.message, privateKey, keyPair.compressed)
        })
        .then(signature => {
          return request(app).post("/message-signature/validate").send({ address, signature });
        })
    })

    test('It should create a new block and respond with newly created block, Star object and properties are stored within the body of the block, Star properties include the coordinates with encoded story.', () => {
      return request(app).post("/block").send({
        address,
        star: {
          dec: "-26° 29' 24.9",
          ra: "16h 29m 1.0s",
          story: "Found star using https://www.google.com/sky/"
        }
      }).expect(200)
        .expect('Content-Type', /json/)
        .then(response => {
          expect(response.body).toHaveProperty('hash');
          expect(response.body).toHaveProperty('height');
          expect(response.body).toHaveProperty('body');
          expect(response.body).toHaveProperty('time');
          expect(response.body).toHaveProperty('previousBlockHash');
          expect(response.body.body).toHaveProperty('address');
          expect(response.body.body).toHaveProperty('star');
          expect(response.body.body.star).toHaveProperty('ra');
          expect(response.body.body.star).toHaveProperty('dec');
          expect(response.body.body.star).toHaveProperty('story');
          expect(response.body.body).toEqual({
            address,
            star: {
              ra: "16h 29m 1.0s",
              dec: "-26° 29' 24.9",
              story: "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f"
            }
          });
          return response.body.height;
        })
        .then(height => db.get(height))
        .then(block => {
          expect(JSON.parse(block).body).toEqual({
            address,
            star: {
              ra: "16h 29m 1.0s",
              dec: "-26° 29' 24.9",
              story: "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f"
            }
          });
        });
    });
  })
});

describe('Blockchain ID validation routine', () => {
  describe('POST request to http://localhost:8000/requestValidation', () => {
    const goodPayload = { "address" : "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ" };

    test('It should respond 415 to requests made with non supported media-types (other than application/json)', () => {
      return request(app).post("/requestValidation").set('Content-Type', 'application/x-www-form-urlencoded').send(goodPayload)
        .expect(415)
        .expect('Content-Type', /json/);
    })

    test('It should respond 400 if wrong payload', () => {
      return request(app).post("/requestValidation").send(badPayLoad)
        .expect(400)
        .expect('Content-Type', /json/);
    })

    test('It should respond 400 if bad wallet address', () => {
      return request(app).post("/requestValidation").send({ address: '842BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ' })
        .expect(400)
        .expect('Content-Type', /json/)
        .then(response => {
          expect(response.body).toEqual({ Error: 'The address does not appear to be a valid wallet address.' });
        });
    })

    test('Response should contain message details, request timestamp, and time remaining for validation window.', () => {
      return request(app).post("/requestValidation").send(goodPayload)
        .expect(200)
        .expect('Content-Type', /json/)
        .then(response => {
          expect(response.body).toHaveProperty('address');
          expect(response.body).toHaveProperty('message');
          expect(response.body).toHaveProperty('requestTimeStamp');
          expect(response.body).toHaveProperty('validationWindow');
        });
    });

    test('User obtains a response in JSON format with a message to sign. Message format = [walletAddress]:[timeStamp]:starRegistry', () => {
      return request(app).post("/requestValidation").send(goodPayload)
        .then(response => {
          expect(response.body.message).toMatch(/142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:[0-9]{10}:starRegistry/);
        });
    })

    test('The request must be configured with a limited validation window of five minutes.', () => {
      return request(app).post("/requestValidation").send(goodPayload)
        .then(response => {
          expect(response.body.validationWindow).toBeLessThanOrEqual(300);
        });
    })

    test('When re-submitting within validation window, validation window should reduce until it expires.', () => {
      return request(app).post("/requestValidation").send(goodPayload)
        .then(response => {
          expect(response.body.validationWindow).toBeLessThanOrEqual(300);
        })
        .then(() => {
          return new Promise((res, rej) => {
            setTimeout(function() {
              res();
            }, 3000);
          })
        })
        .then(() => {
          return request(app).post("/requestValidation").send(goodPayload)
        })
        .then(response => {
          expect(response.body.validationWindow).toBeLessThanOrEqual(297);
        });
    })
  });

  describe('POST request to http://localhost:8000/message-signature/validate', () => {
    const wrongSignature = {
      "address" : "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
      "signature" : "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="
    };
    const badSignature = {
      "address" : "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
      "signature" : "H6ZrGrF0Y4rSSSSSS2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="
    }

    test('It should respond 400 if wrong payload', () => {
      return request(app).post("/message-signature/validate").send(badPayLoad)
        .expect(400)
        .expect('Content-Type', /json/);
    })

    test('If a wrong signature is provided, the user is not granted access to register a single star.', () => {
      return request(app).post("/message-signature/validate").send(wrongSignature)
        .expect(401)
        .expect('Content-Type', /json/)
        .then(response => {
          expect(response.body).toEqual({ Error: 'Message signature invalid' });
        });
    });

    test('If a badly formed signature is provided, the user is not granted access to register a single star.', () => {
      return request(app).post("/message-signature/validate").send(badSignature)
        .expect(401)
        .expect('Content-Type', /json/)
        .then(response => {
          expect(response.body).toEqual({ Error: 'Message signature invalid' });
        });
    })

    describe('Correct signature is sent', () => {
      const bitcoin = require('bitcoinjs-lib');
      const bitcoinMessage = require('bitcoinjs-message');

      // from https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/addresses.js#L40
      const keyPair = bitcoin.ECPair.fromWIF('Kxr9tQED9H44gCmp6HAdmemAzU3n84H3dGkuWTKvE23JgHMW8gct');
      const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
      const privateKey = keyPair.privateKey;
      let signature

      beforeAll(() => {
        // make a star registration request
        return request(app).post("/requestValidation").send({ address })
          .then(response => {
            signature =  bitcoinMessage.sign(response.body.message, privateKey, keyPair.compressed)
          })
      })

      test('It should respond 415 to requests made with non supported media-types (other than application/json)', () => {
        return request(app).post("/message-signature/validate").set('Content-Type', 'application/x-www-form-urlencoded').send({ address, signature })
          .expect(415)
          .expect('Content-Type', /json/);
      })

      test('Upon validation, the user is granted access to register a single star.', () => {
        return request(app).post("/message-signature/validate").send({ address, signature })
          .expect(200)
          .expect('Content-Type', /json/)
          .then(response => {
            expect(response.body.status.messageSignature).toBe('valid');
          });
      })
    })
  });
});
