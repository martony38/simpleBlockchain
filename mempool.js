/**
* Persist data with LevelDB: https://github.com/Level/level
*/
const level = require('level');
const mempool = level('./mempool');

/**
* Use bitcoinjs-message to verify messages: https://github.com/bitcoinjs/bitcoinjs-message
*/
const bitcoinMessage = require('bitcoinjs-message');

/**
* @description Represents a star registration request
*/
class StarRegistrationRequest {
  /**
  * @constructor
  * @param {string} address - The wallet address associated with the request.
  * @param {number} requestTimeStamp - The UTC timestamp in milliseconds.
  * @param {number} validationWindow - The number of seconds before the request validation expires.
  */
  constructor(address, requestTimeStamp, validationWindow=300) {
    this.address = address;
    this.requestTimeStamp = requestTimeStamp;
    this.message = `${address}:${requestTimeStamp.toString().slice(0, -3)}:starRegistry`;
    this.validationWindow = validationWindow;
    this.messageSignature = null;
  }
}

/**
* @description Represents the Mempool
*/
class Mempool {
  constructor() {
    this._clean();
  }

  _clean() {
    mempool.createReadStream()
      .on('data', data => {
        const request = JSON.parse(data.value)
        this._updateValidationWindow(request)
        if (request.validationWindow < 0) {
          mempool.del(data.key)
        }
      })
      .on('error', function (err) {
        console.log('Error while cleaning mempool: ', err)
      });
  }

  addStarRegistrationRequest(address) {
    return this.getStarRegistrationRequest(address)
      .then(request => {
        if (request === null) {
          return this._addNewStarRegistrationRequest(address)
        } else {
          this._updateValidationWindow(request)
          return request
        }
      })
  }

  validateSignature(address, signature) {
    return this.getStarRegistrationRequest(address)
      .then(request => {
        if (request !== null) {
          try {
            request.messageSignature = bitcoinMessage.verify(request.message, request.address, signature) ? 'valid' : 'invalid';
          }
          catch (e) {
            console.log(e);
            request.messageSignature = 'invalid';
          }
          finally {
            return mempool.put(address, JSON.stringify(request))
              .then(() => {
                this._updateValidationWindow(request)
                return request;
              })
          }
        }
        return request;
      })
  }

  _updateValidationWindow(request) {
    const newValidationWindow = request.requestTimeStamp / 1000 + request.validationWindow - new Date().getTime() / 1000;
    request.validationWindow = newValidationWindow;
  }

  _addNewStarRegistrationRequest(address) {
    const request = new StarRegistrationRequest(address, new Date().getTime())

    return mempool.put(request.address, JSON.stringify(request))
      .then(() => {
        setTimeout(function() {
          mempool.del(request.address);
        }, request.validationWindow * 1000);
        return request
      });
  }

  getStarRegistrationRequest(address) {
    return mempool.get(address)
      .then(result => {
        return JSON.parse(result);
      })
      .catch(err => {
        if (err.notFound) {
          return null
        } else {
          console.log(`Error getting the request with address: ${address}`)
        }
      })
  }
}

module.exports = Mempool