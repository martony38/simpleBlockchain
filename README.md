# SimpleBlockchain

Source code for my second project for the [Blockchain Developer Nanodegree](https://www.udacity.com/course/blockchain-developer-nanodegree--nd1309) program from Udacity.

This project is a simple private blockchain with a RESTful API built with the [Node.js](https://nodejs.org/en/) framework [Express.js](https://expressjs.com) and [levelDB](https://github.com/Level/level).

## Requirements
[npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com/en/docs/install)

## Installation
Clone or download the repository on your computer.

* install all project dependencies with `npm install` or `yarn install`
* run the tests with `npm test` or `yarn test`
* start the server with `node start` or `yarn start`

## API Endpoints
The RESTFul API provides methods for fetching a block and adding a new block to the blockchain.
(The following is inspired from this [template](https://gist.github.com/iros/3426278))

----
### Fetch a Block

* **URL** block/:block_height

* **Method:** `GET`

*  **URL Params**

   **Required:**

   `block_height=[integer]`

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
    `{ "body" : "block body contents", "time" : "1534714774",
      "height" : 1, "previousBlockHash" : "edc4174463b7be1c598415c1e4d2018f77acaff8fb4484360decc24631d473b5", "hash" : "d220d6b4bb87a4b2a70190f781a8cd1921ac092708fcbc4124fbb8ef419acb96" }`

* **Error Response:**

  * **Code:** 404 Not Found <br />
    **Content:**
    `{ "Error" : "Block not found" }`

  * **Code:** 400 Bad Request <br />
    **Content:**
    `{ "Error" : "Url should end with block number. (Ex: GET http://server:port/block/4)" }`

* **Sample Call:** `curl -X "GET" "http://localhost:8000/block/10"`

----
### Add a New Block

* **URL** block

* **Method:** `POST`

*  **Data Params**

   **Required:**

   `[JSON] with a body property`

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
    `{ "body" : "block body contents", "time" : "1534714774",
      "height" : 1, "previousBlockHash" : "edc4174463b7be1c598415c1e4d2018f77acaff8fb4484360decc24631d473b5", "hash" : "d220d6b4bb87a4b2a70190f781a8cd1921ac092708fcbc4124fbb8ef419acb96" }`

* **Error Response:**

  * **Code:** 500 Internal Server Error <br />
    **Content:**
    `{ "Error" : "Could not add block" }`

  * **Code:** 415 Unsupported Media Type <br />
    **Content:**
    `{ "Error" : "Unsupported media-type" }`

  * **Code:** 400 Bad Request <br />
    **Content:**
    `{ "Error" : "Payload should be an object with a body property. (Ex: { "body" : "this will work" })" }`

* **Sample Call:** `curl -X "POST" -H "Content-Type: application/json" -d '{"body":"block body contents"}' "http://localhost:8000/block"`
