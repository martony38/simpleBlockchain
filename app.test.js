const request = require('supertest');
const app = require('./app');
const db = require('./database');

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

beforeAll(() => {
  // Initialize test blockchain
  return db.batch()
    .put(0, JSON.stringify(goodBlock0))
    .put(1, JSON.stringify(goodBlock1))
    .put(2, JSON.stringify(goodBlock2))
    .put(3, JSON.stringify(goodBlock3))
    .put(4, JSON.stringify(goodBlock4))
    .put(5, JSON.stringify(goodBlock5))
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
    .del(6)
    .write()
    .then(() => db.close());
})

describe('GET request with url path http://localhost:8000/block/{BLOCK_HEIGHT}', () => {
  test('It should respond to the GET method', () => {
    return request(app).get("/block/1")
      .expect(200, goodBlock1)
      .expect('Content-Type', /json/);
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

describe('POST request with url path http://localhost:8000/block with body payload option.', () => {
  const goodPayload = { "body" : "block body contents" };
  const badPayLoad = { "badPayload": "a bad payload"}

  test('It should create a new block and respond with newly created block', () => {
    return request(app).post("/block").send(goodPayload)
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
        expect(response.body.body).toBe('block body contents');
        return response.body.height;
      })
      .then(height => db.get(height))
      .then(block => {
        expect(JSON.parse(block).body).toBe('block body contents');
      });
  });

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
});
