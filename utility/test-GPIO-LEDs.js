const ws281x = require('@simontaga/rpi-ws281x-native');

const channel = ws281x(375, { stripType: 'ws2812' });

for (let i = 0; i < channel.count; i++) {
    channel.array[i] = 0xaaaaaa;
}

channel.array[0] = 0xff0000;
channel.array[1] = 0x00ff00;
channel.array[2] = 0x0000ff;
channel.array[3] = 0xffff00;
channel.array[4] = 0x00ffff;
channel.array[5] = 0xff00ff;

ws281x.render();