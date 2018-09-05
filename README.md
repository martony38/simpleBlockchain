# StarRegistry 3.0
This project is a Star Registry that allows users to claim ownership of their favorite stars in the night sky using a simple private blockchain with a RESTful web API built with the [Node.js](https://nodejs.org/en/) framework [Express.js](https://expressjs.com) and [levelDB](https://github.com/Level/level).
Users are able to notarize star ownership using their blockchain identity. They can then look up their star(s) by hash, block height, or wallet address.

This is part of the [Blockchain Developer Nanodegree](https://www.udacity.com/course/blockchain-developer-nanodegree--nd1309) program from Udacity.

## Table of Contents
* [Requirements](#requirements)
* [Installation](#installation)
* [API Endpoints](#api-endpoints)
  * [Fetch a Block](#fetch-a-block)
    * [By Height](#by-height)
    * [By Hash](#by-hash)
  * [Fetch Blocks by Address](#fetch-blocks-by-address)
  * [Add a Star Registration Request](#add-a-star-registration-request)
  * [Validate a Star Registration Request](#validate-a-star-registration-request)
  * [Add a New Block (Register a Star)](#add-a-new-block-(register-a-star))

## Requirements
[npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com/en/docs/install)

## Installation
Clone or download the repository on your computer.

* install all project dependencies with `npm install` or `yarn install`
* run the tests with `npm test` or `yarn test`
* start the server with `node start` or `yarn start`

## API Endpoints
The RESTFul web API provides methods for fetching blocks with information about the registered stars and registering new stars by adding blocks to the blockchain.
(The following is inspired from this [template](https://gist.github.com/iros/3426278))

----
### Fetch a Block
#### By Height

* **URL:** `block/:block_height`

* **Method:** `GET`

*  **URL Params**

   **Required**

   ```
   block_height=[integer]
   ```

* **Success Response**

  * **Code:** `200`
    ```json
    {
      "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
      "height": 1,
      "body": {
        "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
        "star": {
          "ra": "16h 29m 1.0s",
          "dec": "-26° 29' 24.9",
          "story":    "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
          "storyDecoded": "Found star using https://www.google.com/sky/"
        }
      },
      "time": "1532296234",
      "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
    }
    ```

* **Error Responses**

  * **Code:** `400 Bad Request`
    ```json
    { "Error" : "Url should end with block number. (Ex: GET http://server:port/block/4)" }
    ```

  * **Code:** `404 Not Found`
    ```json
    { "Error" : "Block not found" }
    ```

* **Sample Call**
  ```json
  curl -X "GET" "http://localhost:8000/block/10"
  ```

#### By Hash

* **URL:** `stars/hash::block_hash`

* **Method:** `GET`

*  **URL Params**

   **Required**

   ```
   block_hash=[string]
   ```

* **Success Response**

  * **Code:** `200`
    ```json
    {
      "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
      "height": 1,
      "body": {
        "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
        "star": {
          "ra": "16h 29m 1.0s",
          "dec": "-26° 29' 24.9",
          "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
          "storyDecoded": "Found star using https://www.google.com/sky/"
        }
      },
      "time": "1532296234",
      "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
    }
    ```

* **Error Responses**

  * **Code:** `400 Bad Request`
    ```json
    { "Error" : "Hash is not a SHA256 hash" }
    ```

  * **Code:** `404 Not Found`
    ```json
    { "Error" : "Block not found" }
    ```

* **Sample Call**
  ```json
  curl -X "GET" "http://localhost:8000/stars/hash:a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f"
  ```

----
### Fetch Blocks by Address

* **URL:** `stars/address::wallet_address`

* **Method:** `GET`

*  **URL Params**

   **Required**

   ```
   wallet_address=[string]
   ```

* **Success Response**

  * **Code:** `200`
    ```json
    [
      {
        "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
        "height": 1,
        "body": {
          "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
          "star": {
            "ra": "16h 29m 1.0s",
            "dec": "-26° 29' 24.9",
            "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
            "storyDecoded": "Found star using https://www.google.com/sky/"
          }
        },
        "time": "1532296234",
        "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
      },
      {
        "hash": "6ef99fc533b9725bf194c18bdf79065d64a971fa41b25f098ff4dff29ee531d0",
        "height": 2,
        "body": {
          "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
          "star": {
            "ra": "17h 22m 13.1s",
            "dec": "-27° 14' 8.2",
            "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
            "storyDecoded": "Found star using https://www.google.com/sky/"
          }
        },
        "time": "1532330848",
        "previousBlockHash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f"
      }
    ]
    ```

* **Error Response**

  * **Code:** `400 Bad Request`
    ```json
    { "Error" : "The address does not appear to be a valid wallet address." }
    ```

  * **Code:** `404 Not Found`
    ```json
    { "Error" : "No block found" }
    ```

* **Sample Call**
  ```json
  curl -X "GET" "http://localhost:8000/stars/address:142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
  ```

----
### Add a Star Registration Request

* **URL:** `requestValidation`

* **Method:** `POST`

* **JSON Params**

   **Required**

  ```
  address=[string]
  ```

* **Success Response**

  * **Code:** `200`
    ```json
    {
      "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
      "requestTimeStamp": "1532296090",
      "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
      "validationWindow": 300
    }
    ```

* **Error Responses**

  * **Code:** `400 Bad Request`
    ```json
    { "Error" : "Payload should be an object with an address property." }
    ```
    ```json
    { "Error" : "The address does not appear to be a valid wallet address." }
    ```

  * **Code:** `415 Unsupported Media Type`
    ```json
    { "Error" : "Unsupported media-type" }
    ```

* **Sample Call**
  ```json
  curl -X "POST" -H "Content-Type: application/json" -d '{
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
  }' "http://localhost:8000/requestValidation"
  ```

----
### Validate a Star Registration Request

* **URL:** `message-signature/validate`

* **Method:** `POST`

* **JSON Params**

   **Required**

    ```
     address=[string]
     signature=[string]
    ```

* **Success Response**

  * **Code:** `200`
    ```json
    {
      "registerStar": true,
      "status": {
        "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
        "requestTimeStamp": "1532296090",
        "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
        "validationWindow": 193,
        "messageSignature": "valid"
      }
    }
    ```

* **Error Responses**

  * **Code:** `400 Bad Request`
    ```json
    { "Error" : "Payload should be an object with an address property." }
    ```
    ```json
    { "Error" : "The address does not appear to be a valid wallet address." }
    ```
    ```json
    { "Error" : "Payload should be an object with a signature property." }
    ```

  * **Code:** `401 Unauthorized`
    ```json
    { "Error" : "Message signature invalid" }
    ```

  * **Code:** `404 Not Found`
    ```json
    { "Error" : "Star registration request not found or expired" }
    ```

  * **Code:** `415 Unsupported Media Type`
    ```json
    { "Error" : "Unsupported media-type" }
    ```

* **Sample Call**
  ```json
  curl -X "POST" -H "Content-Type: application/json" -d '{
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "signature": "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="
  }' "http://localhost:8000/message-signature/validate"
  ```

----
### Add a New Block (Register a Star)

* **URL:** `block`

* **Method:** `POST`

* **JSON Params**

   **Required**

    ```
    address=[string]
    star=[object]
      star.dec=[string]
      star.ra=[string]
      star.story=[string]
    ```

   **Optional**

    ```
    star.mag=[number]
    star.const=[string]
    ```

* **Success Response**

  * **Code:** `200`
    ```json
    {
      "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
      "height": 1,
      "body": {
        "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
        "star": {
          "ra": "16h 29m 1.0s",
          "dec": "-26° 29' 24.9",
          "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f"
        }
      },
      "time": "1532296234",
      "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
    }
    ```

* **Error Responses**

  * **Code:** `400 Bad Request`
    ```json
    { "Error" : "Payload should be an object with an address property." }
    ```
    ```json
    { "Error" : "The address does not appear to be a valid wallet address." }
    ```
    ```json
    { "Error" : "Payload should be an object with a star property." }
    ```
    ```json
    { "Error" : "Star object in payload can only contains the following properties: ra, dec, story, mag, const." }
    ```
    ```json
    { "Error" : "star.story should only include ascii characters." }
    ```
    ```json
    { "Error" : "star.story exceeds 500 bytes." }
    ```

  * **Code:** `401 Unauthorized`
    ```json
    { "Error" : "Message signature invalid or missing or expired" }
    ```

  * **Code:** `415 Unsupported Media Type`
    ```json
    { "Error" : "Unsupported media-type" }
    ```

  * **Code:** `500 Internal Server Error`
    ```json
    { "Error" : "Could not add block" }
    ```

* **Sample Call**
  ```json
  curl -X "POST" -H "Content-Type: application/json" -d '{
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "star": {
      "dec": "-26° 29' 24.9",
      "ra": "16h 29m 1.0s",
      "story": "Found star using https://www.google.com/sky/"
    }
  }' "http://localhost:8000/block"
  ```
