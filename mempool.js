/**
* Persist data with LevelDB: https://github.com/Level/level
*/
const level = require('level');
const db = level('./mempool');

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
  * @param {number} validationWindow - The number of seconds before the star registration request expires.
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
* @description Represents the Mempool that holds the pending star registration requests
*/
class Mempool {
  /**
  * Initialize mempool.
  */
  init() {
    return this._clean();
  }

  /**
  * Remove expired star registration requests from mempool database.
  * @return {Object} A promise that resolves when all the expired requests have been deleted.
  */
  _clean() {
    return new Promise((resolve, reject) => {
      let oldRequests = [];

      db.createReadStream()
        .on('data', data => {
          const request = JSON.parse(data.value)
          this._updateValidationWindow(request)
          if (request.validationWindow < 0) {
            oldRequests.push(data.key)
          }
        })
        .on('error', function (err) {
          reject(err)
        })
        .on('close', function () {
          resolve(oldRequests);
        })
    }).catch(err => {
      console.log('Error while cleaning mempool: ', err)
    }).then(oldRequests => {
      return db.batch(oldRequests.map(key => ({ type: 'del', key })))
    })
  }

  /**
  * Add/update a star registration request to mempool database.
  * @param {string} address - The wallet address.
  * @return {Object} The star registration request.
  */
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

  /**
  * Validate a star registration request.
  * @param {string} address - The wallet address associated to the request.
  * @param {string} signature - The message signature corresponding to the request.
  * @return {Object} The validated (or invalidated) star registration request.
  */
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
            return db.put(address, JSON.stringify(request))
              .then(() => {
                this._updateValidationWindow(request)
                return request;
              })
          }
        }
        return request;
      })
  }

  /**
  * Update validation window of a star registration request.
  * @param {Object} request - The star registration request to update.
  */
  _updateValidationWindow(request) {
    const newValidationWindow = request.requestTimeStamp / 1000 + request.validationWindow - new Date().getTime() / 1000;
    request.validationWindow = newValidationWindow;
  }

  /**
  * Add a new star registration request to mempool database.
  * @param {string} address - The wallet address.
  * @return {Object} The star registration request.
  */
  _addNewStarRegistrationRequest(address) {
    const request = new StarRegistrationRequest(address, new Date().getTime())

    return db.put(request.address, JSON.stringify(request))
      .then(() => {
        setTimeout(function() {
          db.del(request.address);
        }, request.validationWindow * 1000);
        return request
      });
  }

  /**
  * Get a star registration request from mempool database.
  * @param {string} address - The wallet address.
  * @return {Object} The star registration request.
  */
  getStarRegistrationRequest(address) {
    return db.get(address)
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