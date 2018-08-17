const simpleChain = require('./simpleChain');

const testChain = new simpleChain.blockchain();

const goodBlock0 = {
  hash:
   'a10f55e2799e22bf23d1c4d77e1d6fa226fd6023f9fc9a51e788b3c4f0d47008',
  height: 0,
  body: 'First block in the chain - Genesis block',
  time: '1534424317',
  previousBlockHash: ''
}

const goodBlock1 = {
  hash:
   '39b718f344ffe4e961c6196159ed6bd25358daba945c0680b44b40f1d3fbc0e9',
  height: 1,
  body: 'good block - block #1',
  time: '1534424317',
  previousBlockHash:
   'a10f55e2799e22bf23d1c4d77e1d6fa226fd6023f9fc9a51e788b3c4f0d47008'
}

const goodBlock2 = {
  hash:
   '96e9c79f07744d761aa0e45b228427f6198411d74779dbbe8dd867fa1e763512',
  height: 2,
  body: 'good block - block #2',
  time: '1534424317',
  previousBlockHash:
   '39b718f344ffe4e961c6196159ed6bd25358daba945c0680b44b40f1d3fbc0e9'
}

const goodBlock3 = {
  hash:
   'cdcbf1e5870e93d36b614216ab9b8cd8e8f16965be416d46eef76356bed9ac4a',
  height: 3,
  body: 'good block - block #3',
  time: '1534424317',
  previousBlockHash:
   '96e9c79f07744d761aa0e45b228427f6198411d74779dbbe8dd867fa1e763512'
}

const goodBlock4 = {
  hash:
   '989fe869ab307e8b4873a740baf93c9aa8d44c34cedbfdfb5dfce10440e6ee69',
  height: 4,
  body: 'good block - block #4',
  time: '1534424317',
  previousBlockHash:
   'cdcbf1e5870e93d36b614216ab9b8cd8e8f16965be416d46eef76356bed9ac4a'
}

const goodBlock5 = {
  hash:
   'de33df80ef49bdebe2e034deb8bc8040aabdb641fd43909fd687dff18a9ac81f',
  height: 5,
  body: 'good block - block #5',
  time: '1534424317',
  previousBlockHash:
   '989fe869ab307e8b4873a740baf93c9aa8d44c34cedbfdfb5dfce10440e6ee69'
}

const badBlock3 = {
  hash:
   'cdcbf1e5870e93d36b614216ab9b8cd8e8f16965be416d46eef76356bed9ac4a',
  height: 3,
  body: 'bad block - block #3',
  time: '1534424317',
  previousBlockHash:
   '96e9c79f07744d761aa0e45b228427f6198411d74779dbbe8dd867fa1e763512'
}

const badBlock5 = {
  hash:
   'de33df80ef49bdebe2e034deb8bc8040aabdb641fd43909fd687dff18a9ac81f',
  height: 5,
  body: 'bad block - block #5',
  time: '1534424317',
  previousBlockHash:
   '989fe869ab307e8b4873a740baf93c9aa8d44c34cedbfdfb5dfce10440e6ee69'
}

test.skip('AddBlock create genesis block if not created yet', () => {
  const testBlock = new simpleChain.block('test - addBlock create genesis block');

  return testChain.addBlock(testBlock)
    .then(() => {
      return simpleChain.db.get(0);
    })
    .then(block => {
      expect(block).toBe(JSON.stringify(testBlock));
    });
});

describe ('Tests requiring some initial setup', () => {

  beforeAll(() => {
    // Initialize test blockchain
    return simpleChain.db.batch()
      .put(0, JSON.stringify(goodBlock0))
      .put(1, JSON.stringify(goodBlock1))
      .put(2, JSON.stringify(goodBlock2))
      .put(3, JSON.stringify(goodBlock3))
      .put(4, JSON.stringify(goodBlock4))
      .put(5, JSON.stringify(goodBlock5))
      .write()
  })

  afterAll(() => {
    // Delete test blockchain
    return simpleChain.db.batch()
      .del(0)
      .del(1)
      .del(2)
      .del(3)
      .del(4)
      .del(5)
      .write()
  })

  describe ('Configure LevelDB to persist dataset', () => {
    test('SimpleChain.js includes the Node.js level library and configured to persist data within the project directory.', () => {
      expect(simpleChain.db).toBeDefined();

      return simpleChain.db.put(100, 5)
        .then(() => {
          return simpleChain.db.get(100);
        })
        .then(result => {
          expect(JSON.parse(result)).toBe(5);
          return simpleChain.db.del(100);
        });
    });
  });

  describe ('Modify simpleChain.js functions to persist data with LevelDB', () => {
    describe ('Genesis block persist as the first block in the blockchain using LevelDB', () => {

      beforeAll(() => {
        return simpleChain.db.del(0);
      })

      afterAll(() => {
        // Restore test blockchain
        return simpleChain.db.put(0, JSON.stringify(goodBlock0));
      })

      test('init add genesis block to LevelDB', () => {
        return testChain.init()
          .then(() => {
            return simpleChain.db.get(0)
          })
          .then(block => {
            expect(JSON.parse(block).body).toBe('First block in the chain - Genesis block');
          })
      });
    });

    describe('addBlock(newBlock) includes a method to store newBlock within LevelDB', () => {

      afterAll(() => {
        // Restore test blockchain
        return simpleChain.db.del(6);
      })

      test('addBlock save new block in LevelDB',() => {
        const testBlock = new simpleChain.block('test - addBlock save new block in LevelDB');

        return testChain.addBlock(testBlock)
          .then(block => {
            expect(block).toBeInstanceOf(simpleChain.block);
            expect(block.height).toBe(6);
            expect(block.body).toBe('test - addBlock save new block in LevelDB');
            return simpleChain.db.get(block.height);
          })
          .then(block => {
            expect(block).toBe(JSON.stringify(testBlock));
          });
      })
    });
  });

  describe('Modify getBlock() function', () => {
    describe('getBlock() function retrieves a block by block height within the LevelDB chain.', () => {
      test.skip('getBlock returns a block', () => {
        return testChain.getBlock(2)
          .then(block => {
            expect(block).toBeInstanceOf(simpleChain.block);
          });
      });

      test('getBlock returns the correct block', () => {
        return testChain.getBlock(2)
          .then(block => {
            expect(block).toEqual(goodBlock2);
          });
      })
    });
  });

  describe('Modify getBlockHeight() function', () => {
    test('getBlockHeight() function retrieves current block height within the LevelDB chain.', () => {
      return testChain.getBlockHeight()
        .then(height => {
          expect(height).toBe(5);
        });
    });
  });

  describe('Modify validate functions', () => {
    describe('validateBlock() function to validate a block stored within levelDB',() => {
      test('validateBlock() validates a good block', () => {
        return testChain.validateBlock(3)
          .then(result => {
            expect(result).toBe(true);
          });
      });

      test('validateBlock() do not validate a bad block', () => {
        return simpleChain.db.put(6, JSON.stringify(badBlock5))
          .then(() => {
            return testChain.validateBlock(6)
          })
          .then(result => {
            expect(result).toBe(false);

            // Restore test blockchain
            return simpleChain.db.del(6);
          });
      });
    })

    describe('validateChain() function to validate blockchain stored within levelDB', () =>{
      describe('blockchain is valid', () => {
        test('validateChain() returns true', () => {
          return testChain.validateChain()
            .then(result => {
              expect(result).toBe(true);
            });
        });
      });

      describe('blockchain is not valid', () => {
        test('validateChain() returns false if last block on blockchain is not valid', () => {
          return simpleChain.db.put(5, JSON.stringify(badBlock5))
            .then(() => {
              return testChain.validateChain()
            })
            .then(result => {
              expect(result).toBe(false);

              // Restore test blockchain
              return simpleChain.db.put(5, JSON.stringify(goodBlock5))
            });
        });

        test('validateChain() returns false if block in middle of blockchain is not valid', () => {
          return simpleChain.db.put(3, JSON.stringify(badBlock3))
            .then(() => {
              return testChain.validateChain()
            })
            .then(result => {
              expect(result).toBe(false);

              // Restore test blockchain
              return simpleChain.db.put(3, JSON.stringify(goodBlock3))
            });
        });
      });
    })
  });

});
