/**
* Persist data with LevelDB: https://github.com/Level/level
*/
const level = require('level');
const db = level('./mempool');

module.exports = db