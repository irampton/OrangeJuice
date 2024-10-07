module.exports = {
    id: "off",
    name: "Off",
    options: [],
    generate: numLEDs  => {
        return new Array(numLEDs).fill("000000");
    }
};