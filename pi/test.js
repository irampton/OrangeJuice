const nconf = require('nconf');
nconf.file({file: './config.json'});

const config = require('config');

nconf.set('strips', config.get('strips'));
nconf.save();