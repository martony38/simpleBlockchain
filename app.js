
const simpleChain = require('./simpleChain');
const blockChain = new simpleChain.blockchain();

const mempoolDB = require('./mempool');
const mempool = new mempoolDB();

const express = require('express');
const app = express();

// Needed to parse body of POST requests
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const checkContentType = function (req, res, next) {
  // Check that POST requests use json
  if (req.get('Content-Type') !== 'application/json') {
    res.status(415).send({ Error: 'Unsupported media-type' });
  } else {
    next();
  }
};

const hasAddressField = function(req, res, next) {
  // Check the request body contains an 'address' field/property
  if (!req.body.address) {
    res.status(400).send({ Error: 'Payload should be an object with an address property. (Ex: { "address" : "this will work" })' });
  } else {
    next();
  }
};

const addressIsValid = function(req, res, next) {
  // Check wallet address
  if (!/^[13][a-zA-Z0-9][^OIl]{26,33}/.test(req.body.address)) {
    return res.status(400).send({ Error: 'The address does not appear to be a valid wallet address.' });
  } else {
    next();
  }
};

app.post(['/block', '/requestValidation', '/message-signature/validate'], [checkContentType, hasAddressField, addressIsValid])

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
      block.body.star.storyDecoded = Buffer.from(block.body.star.story, 'hex').toString('ascii')
      res.json(block);
    } else {
      res.status(404).json({ Error: 'Block not found' });
    }
  });
});

app.get('/stars/address::address', (req, res) => {
  blockChain.getBlockByAddress(req.params.address)
    .then(blocks => {
      if (blocks && blocks.length > 0) {
        res.json(blocks.map(block => {
            block.body.star.storyDecoded = Buffer.from(block.body.star.story, 'hex').toString('ascii')
            return block
          })
        );
      } else {
        res.status(404).json({ Error: 'No block found' })
      }
    })
})

app.get('/stars/hash::hash', (req, res) => {
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
  const starProperties = new Set(['ra', 'dec', 'story', 'mag', 'const']);
  let badProperty = false
  Object.keys(req.body.star).forEach(key => {
    if (!starProperties.has(key)) {
      badProperty = true
    }
  })
  if (badProperty) {
    res.status(400).send({ Error: 'Star object in payload can only contains the following properties: ra, dec, story, mag, const.' });
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
  const hexStory = Buffer.from(req.body.star.story, 'ascii').toString('hex')
  req.body.star.story = hexStory
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
      res.json(request);
    })
});

app.post('/message-signature/validate', (req, res, next) => {
  // Check the request body contains 'signature' fields
  if (!req.body.signature) {
    res.status(400).send({ Error: 'Payload should be an object with a signature property. (Ex: { "address" : "this will work", "signature" : "valid signature" })' });
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
        res.json({ registerStar: true, status: request });
      }
    } else {
      res.status(404).json({ Error: 'Star registration request not found or expired' });
    }
  })
});

module.exports = app;
