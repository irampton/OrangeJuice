module.exports = {
    randomNum,
    randomInt
}

function randomInt( low, high ) {
    return Math.floor( Math.random() * (high - low) ) + low;
}

function randomNum( low, high ) {
    return (Math.floor( Math.random() * (high - low) * 10 ) / 10 + low);
}