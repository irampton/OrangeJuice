let leds = [];
let effect;

//setup LED array
function newRainbowLEDarr(size) {
    let arr = [];
    for (let i = 0; i < size; i++) {
        let c = hue(i / size * 360);
        arr.push({
            "r": parseInt(c.slice(0, 2), 16),
            "g": parseInt(c.slice(2, 4), 16),
            "b": parseInt(c.slice(4, 6), 16)
        });
    }
    return arr;
}
function newLEDarr(size, color) {
    let arr = [];
    for (let i = 0; i < size; i++) {
        arr.push({
            "r": color[0],
            "g": color[1],
            "b": color[2]
        });
    }
    return arr;
}
leds = newLEDarr(24, [255,0,255]);

function breath(times, rate, dim) {
    times++;
    if (times > rate * dim) {
        times = 0 - rate * dim;
    }
    let out = [];
    for (let i = 0; i < leds.length; i++) {
        out.push({
            "r": Math.floor(leds[i].r * ((rate - Math.abs(times)) / rate)),
            "g": Math.floor(leds[i].g * ((rate - Math.abs(times)) / rate)),
            "b": Math.floor(leds[i].b * ((rate - Math.abs(times)) / rate))
        })
    }
    io.emit('led', prepLEDs(out));
    effect = setTimeout(breath, 16, times, rate, dim);
}

breath(0, 750, .25);

function chase() {
    let leds2 = [];
    for (let i = 0; leds.length > i; i++) {
        leds2.push({
            "r": i === leds.length - 1 ? leds[0].r : leds[i + 1].r,
            "g": i === leds.length - 1 ? leds[0].g : leds[i + 1].g,
            "b": i === leds.length - 1 ? leds[0].b : leds[i + 1].b
        })
    }
    leds = leds2;
    io.emit('led', prepLEDs(leds));
    effect = setTimeout(chase, 500);
}

//chase();

function chaseR() {
    let leds2 = [];
    for (let i = 0; leds.length > i; i++) {
        leds2.push({
            "r": i === 0 ? leds[leds.length - 1].r : leds[i - 1].r,
            "g": i === 0 ? leds[leds.length - 1].g : leds[i - 1].g,
            "b": i === 0 ? leds[leds.length - 1].b : leds[i - 1].b
        })
    }
    leds = leds2;
    io.emit('led', prepLEDs(leds));
    effect = setTimeout(chaseR, 500);
}

//chaseR();

function clearEffect() {
    clearTimeout(effect);
    effect = undefined;
}