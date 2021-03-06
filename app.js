
const simpleChain = require('./simpleChain');
const blockChain = new simpleChain.blockchain();
blockChain.init();

const mempoolDB = require('./mempool');
const mempool = new mempoolDB();
mempool.init();

const express = require('express');
const app = express();

// Needed to parse body of POST requests
const bodyParser = require('body-parser');
app.use(bodyParser.json());

function formatResponse(request) {
  // Format returned request to meet specs
  const result = JSON.parse(JSON.stringify(request));
  result.requestTimeStamp = request.requestTimeStamp.toString().slice(0, -3);
  result.validationWindow = Math.round(request.validationWindow);
  if (request.messageSignature === null) {
    delete result.messageSignature;
  }
  return result;
}

const checkContentType = (req, res, next) => {
  // Check that POST requests use json
  if (req.get('Content-Type') !== 'application/json') {
    res.status(415).send({ Error: 'Unsupported media-type' });
  } else {
    next();
  }
};

const hasAddressField = (req, res, next) => {
  // Check the request body contains an 'address' field/property
  if (!req.body.address) {
    res.status(400).send({ Error: 'Payload should be an object with an address property.' });
  } else {
    next();
  }
};

const addressIsValid = (req, res, next) => {
  // Check wallet address
  if (!/^[13][a-zA-Z0-9][^OIl]{26,33}/.test(req.method === 'POST' ? req.body.address : req.params.address)) {
    return res.status(400).send({ Error: 'The address does not appear to be a valid wallet address.' });
  } else {
    next();
  }
};

app.post(
  ['/block', '/requestValidation', '/message-signature/validate'],
  checkContentType,
  hasAddressField,
  addressIsValid
);

app.get('/block/:height', (req, res, next) => {
  // Check the url param height is a number
  if (isNaN(Number(req.params.height))) {
    res.status(400).send({ Error: 'Url should end with block number. (Ex: GET http://server:port/block/4)' });
  } else {
    next();
  }
}, (req, res) => {
  blockChain.getBlock(req.params.height)
    .then(block => {
      if (block) {
        // Genesis block do not contain any star property
        if (block.body.hasOwnProperty('star')) {
          block.body.star.storyDecoded = Buffer.from(block.body.star.story, 'hex').toString('ascii');
        }

        res.json(block);
      } else {
        res.status(404).json({ Error: 'Block not found' });
      }
    });
});

app.get('/stars/address::address', addressIsValid, (req, res) => {
  blockChain.getBlockByAddress(req.params.address)
    .then(blocks => {
      if (blocks && blocks.length > 0) {
        res.json(blocks.map(block => {
            block.body.star.storyDecoded = Buffer.from(block.body.star.story, 'hex').toString('ascii');
            return block;
          })
        );
      } else {
        res.status(404).json({ Error: 'No block found' });
      }
    })
})

app.get('/stars/hash::hash', (req, res, next) => {
  // Check that a SHA256 hash is included in the url
  if (!/^[a-fA-F0-9]{64}$/.test(req.params.hash)) {
    res.status(400).send({ Error: 'Hash is not a SHA256 hash' });
  } else {
    // Convert hash param to lowercase
    req.params.hash = Buffer.from(req.params.hash, 'hex').toString('hex')

    next();
  }
},(req, res) => {
  blockChain.getBlockByHash(req.params.hash)
    .then(block => {
      if (block) {
        block.body.star.storyDecoded = Buffer.from(block.body.star.story, 'hex').toString('ascii')
        res.json(block);
      } else {
        res.status(404).json({ Error: 'Block not found' })
      }
    })
})

app.post('/block', (req, res, next) => {
  // Check the request body contains a star field/property
  if (!req.body.star) {
    res.status(400).send({ Error: 'Payload should be an object with a star property.' });
  } else {
    next();
  }
}, (req, res, next) => {
  // Check the star object in the request body only contain the allowed fields/properties
  const starProperties = new Set(['ra', 'dec', 'story', 'mag', 'const']);
  let badProperty = false
  let missingProperty = false

  Object.keys(req.body.star).forEach(key => {
    if (!starProperties.has(key)) {
      badProperty = true
    }
  })

  if (!req.body.star.hasOwnProperty('ra') || !req.body.star.hasOwnProperty('dec') || !req.body.star.hasOwnProperty('story')) {
    missingProperty = true
  }

  if (badProperty) {
    res.status(400).send({ Error: 'Star object in payload can only contain the following properties: ra, dec, story, mag, const.' });
  } else if (missingProperty) {
    res.status(400).send({ Error: 'Star object in payload must contain the following properties: ra, dec, story.' });
  } else {
    next();
  }
}, (req, res, next) => {
  // Add a story property if missing
  if (!req.body.star.story) {
    req.body.star.story = ''
  }

  // Check if story is encoded in ascii
  if (!/^[\x00-\x7F]*$/.test(req.body.star.story)) {
    res.status(400).send({ Error: 'star.story should only include ascii characters.' });
  } else {
    next();
  }
}, (req, res, next) => {
  // Convert star story to HEX
  const hexStory = Buffer.from(req.body.star.story, 'ascii').toString('hex');
  req.body.star.story = hexStory;

  // Check story size
  if (Buffer.byteLength(hexStory, 'hex') > 500) {
    res.status(400).send({ Error: 'star.story exceeds 500 bytes.' });
  } else {
    next();
  }
}, (req, res) => {
  mempool.getStarRegistrationRequest(req.body.address)
  .then(request => {
    if (request === null || request.messageSignature !== 'valid') {
      res.status(401).json({ Error: 'Message signature invalid or missing or expired' });
    } else {
      // Remove star registration request from mempool to prevent user from registering more than 1 star
      mempool.deleteStarRegistrationRequest(request.address);

      blockChain.addBlock(new simpleChain.block(req.body))
        .then(block => {
          if (block) {
            res.json(block);
          } else {
            res.status(500).json({ Error: 'Could not add block' });
          }
        });
    }
  })
});

app.post('/requestValidation', (req, res) => {
  mempool.addStarRegistrationRequest(req.body.address)
    .then(request => {
      res.json(formatResponse(request));
    })
});

app.post('/message-signature/validate', (req, res, next) => {
  // Check the request body contains 'signature' fields
  if (!req.body.signature) {
    res.status(400).send({ Error: 'Payload should be an object with a signature property.' });
  } else {
    next();
  }
}, (req, res) => {
  mempool.validateSignature(req.body.address, req.body.signature)
  .then(request => {
    if (request !== null) {
      if (request.messageSignature !== 'valid') {
        res.status(401).json({ Error: 'Message signature invalid' });
      } else {
        res.json({ registerStar: true, status: formatResponse(request) });
      }
    } else {
      res.status(404).json({ Error: 'Star registration request not found or expired' });
    }
  })
});

module.exports = app;
