/**
* SHA256 with Crypto-js: https://github.com/brix/crypto-js
*/
const SHA256 = require('crypto-js/sha256');

const db = require('./database');

/**
* @description Represents a block
*/
class Block {
  /**
  * @constructor
  * @param {Object} body - The data contained in the block.
  * @param {string} hash - The hash of the block.
  * @param {number} height - The number of blocks between the genesis block and this one.
  * @param {number} time - The UTC timestamp.
  * @param {string} previousblockhash - The hash of the previous block.
  */
  constructor(data, hash='', height=0, time=0, previousBlockHash='') {
    this.hash = hash;
    this.height = height;
    this.body = data;
    this.time = time;
    this.previousBlockHash = previousBlockHash;
  }
}

/**
* @description Represents a blockchain
*/
class Blockchain {
  /**
  * Initialize blockchain.
  * @return {Object} The most recent block on the chain.
  */
  init() {
    return this.getBlockHeight()
      .then(height => {
        if (height === -1) {
          return this._createGenesisBlock();
        } else {
          return this.getBlock(height)
        }
      });
  }

  /**
  * Add the genesis block to the chain.
  * @param {Object} newBlock - The block to use as a genesis block.
  * @return {Object} The newly created genesis block.
  */
  _createGenesisBlock(newBlock) {
    const genesisBlock = newBlock || new Block("First block in the chain - Genesis block")

    // UTC timestamp
    genesisBlock.time = new Date().getTime().toString().slice(0, -3);

    genesisBlock.hash = SHA256(JSON.stringify(genesisBlock)).toString();
    return db.put(genesisBlock.height, JSON.stringify(genesisBlock))
      .catch(() => {
        console.log('Error while adding genesis block to db');
      }).then(() => {
        return genesisBlock
      })
  }

  /**
  * Add a new block to the chain.
  * @param {Object} newBlock - The block to add to the chain.
  * @return {Object} The newly added block.
  */
  addBlock(newBlock) {
    // UTC timestamp
    newBlock.time = new Date().getTime().toString().slice(0, -3);

    return this.getBlockHeight()
      .then(height => {
        newBlock.height = height + 1;
        return this.getBlock(height)
      }).then(previousBlock => {
        newBlock.previousBlockHash = previousBlock.hash;
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
      }).then(() => {
        db.put(newBlock.height, JSON.stringify(newBlock))
      }).catch(() => {
        console.log('Error while adding new block to db');
      }).then(() => {
        return newBlock
      })
  }

  /**
  * Get the block height of the chain.
  * @return {number} The block height.
  */
  getBlockHeight() {
    return new Promise((resolve, reject) => {
      let height = -1;

      db.createReadStream()
        .on('data', function () {
          height++;
        })
        .on('error', function (err) {
          reject(err)
        })
        .on('close', function () {
          resolve(height);
        })
    }).catch(err => {
      console.log(`Error while getting the block height: ${err}`)
    });;
  }

  /**
  * Get a block by height.
  * @param {number} blockHeight - The block number.
  * @return {Object} The block object.
  */
  getBlock(blockHeight) {
    return db.get(blockHeight)
      .then(result => {
        return JSON.parse(result);
      }).catch((err) => {
        console.log(`Error while getting block # ${blockHeight}: `, err);
      });
  }

  /**
  * Get a block by hash.
  * @param {string} hash - The block hash.
  * @return {Object} The block object.
  */
  getBlockByHash(hash) {
    return new Promise((resolve, reject) => {
      db.createValueStream()
        .on('data', function (data) {
          const block = JSON.parse(data);
          if (block.hash === hash) {
            resolve(block);
          }
        })
        .on('error', function (err) {
          reject(err)
        })
        .on('close', function () {
          resolve(null);
        })
    }).catch(err => {
      console.log(`Error ${err} while getting the block with hash ${hash}`)
    });;
  }

  /**
  * Get blocks by address.
  * @param {string} address - The wallet address.
  * @return {Array} The list of block objects.
  */
  getBlockByAddress(address) {
    return new Promise((resolve, reject) => {
      let blocks = [];

      db.createValueStream()
        .on('data', function (data) {
          const block = JSON.parse(data);
          if (block.body.address === address) {
            blocks.push(block)
          }
        })
        .on('error', function (err) {
          reject(err)
        })
        .on('close', function () {
          resolve(blocks);
        })
    }).catch(err => {
      console.log(`Error ${err} while getting the block with hash ${hash}`)
    });;
  }

  /**
  * Validate a block.
  * @param {number} blockHeight - The block number.
  * @return {boolean} The result of the validation.
  */
  validateBlock(blockHeight) {
    return this.getBlock(blockHeight)
      .then(block => {
        const blockHash = block.hash;

        // Remove block hash to test block integrity
        block.hash = '';

        // Generate block hash
        const validBlockHash = SHA256(JSON.stringify(block)).toString();

        if (blockHash === validBlockHash) {
          return true;
        } else {
          console.log(`Block # ${blockHeight} invalid hash: ${blockHash}<>${validBlockHash}`);
          return false;
        }
      }).catch(() => {
        console.log(`Error while validating block # ${blockHeight}`);
      });
  }

  /**
  * Validate the blockchain.
  * @return {boolean} The result of the validation.
  */
  validateChain() {
    let errorLog = [];

    return this.getBlockHeight()
      .then(blockHeight => {
        return Promise.all(
          // Array initializing via apply inspired from: http://2ality.com/2013/11/initializing-arrays.html
          Array.apply(null, Array(blockHeight)).map((x, i) => {
            // Validate and compare hashes for all blocks except the last one
            return Promise.all([
              this.validateBlock(i).then(result => {
                if (result === false) errorLog.push(i);
              }),
              this._compareBlocks(i, errorLog)
            ])
          })
        ).then(() => {
          // Validate last block
          return this.validateBlock(blockHeight).then(result => {
            if (result === false) errorLog.push(blockHeight);
          });
        }).then(() => {
          if (errorLog.length > 0) {
            console.log(`Blockchain not valid... Found ${errorLog.length} block error${errorLog.length !== 1 ? 's' : ''}: block${errorLog.length !== 1 ? 's' : ''} # ${errorLog}`);
            return false;
          } else {
            console.log('Blockchain is valid');
            return true;
          }
        }).catch(() => {
          console.log(`Error while validating the blockchain`);
        });
      });
  }

  /**
  * Compare blocks hash link.
  * @param {number} height - The height (number) of the 'previous' block.
  * @param {Array} errorLog - The array to save error entries to.
  * @return {boolean} The result of the validation.
  */
  _compareBlocks(height, errorLog) {
    return Promise.all([
      this.getBlock(height),
      this.getBlock(height + 1)
    ]).then(([block, nextBlock]) => {
      const blockHash = block.hash;
      const previousHash = nextBlock.previousBlockHash;
      if (blockHash !== previousHash) errorLog.push(height + 1);
    }).catch(() => {
      console.log(`Error while comparing hash link for blocks  # ${height} and ${height + 1}`);
    });
  }
}

module.exports = {
  blockchain: Blockchain,
  block: Block
};