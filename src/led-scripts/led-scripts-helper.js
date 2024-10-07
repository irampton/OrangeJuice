module.exports = {
    randomNum,
    randomInt,
    gcd
}

function randomInt( low, high ) {
    return Math.floor( Math.random() * (high - low) ) + low;
}

function randomNum( low, high ) {
    return (Math.floor( Math.random() * (high - low) * 10 ) / 10 + low);
}

//greatest common divisor
function gcd(a, b) {
    if (!b) {
        return a;
    }

    return gcd(b, a % b);
}