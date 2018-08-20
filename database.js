/**
* Persist data with LevelDB: https://github.com/Level/level
*/
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

module.exports = db