var i2c = require('i2c-bus');
var oled = require('oled-i2c-bus');

var opts = {
    width: 128,
    height: 32,
    address: 0x3C,
    bus: 1,
    driver:"SSD1306"
};

var i2cbus = i2c.openSync(opts.bus)
var oled = new oled(i2cbus, opts);