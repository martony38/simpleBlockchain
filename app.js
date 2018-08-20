
const simpleChain = require('./simpleChain');
const blockChain = new simpleChain.blockchain();

const express = require('express');
const app = express();

// Needed to parse body of POST requests
const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.get('/block/:height', (req, res) => {
  // Check the url param height is a number
  if (isNaN(Number(req.params.height))) {
    return res.status(400).send({ Error: 'Url should end with block number. (Ex: GET http://server:port/block/4)' });
  }

  blockChain.getBlock(req.params.height)
    .then(block => {
      if (block) {
        res.json(block);
      } else {
        res.status(404).json({ Error: 'Block not found' });
      }
    });
})

app.post('/block', (req, res) => {
  // Check the request body is in json
  if (req.get('Content-Type') !== 'application/json') {
    return res.status(415).send({ Error: 'Unsupported media-type' });
  }

  // Check the request body contains a 'body' field/property
  if (!req.body.body) {
    return res.status(400).send({ Error: 'Payload should be an object with a body property. (Ex: { "body" : "this will work" })' });
  }

  blockChain.addBlock(req.body)
    .then(block => {
      if (block) {
        res.json(block);
      } else {
        res.status(500).json({ Error: 'Could not add block' });
      }
    });
})

module.exports = app
