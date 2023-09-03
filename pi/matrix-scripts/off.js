module.exports = {
    'name': "Off",
    'id': "off",
    'timeout': null,
    'generate': (strip, setLEDs) => {
                let options = {
            "trigger": 'matrix',
            "pattern": 'off',
            "patternOptions": {},
            "effect": "",
            "strips": [strip]
        }
        setLEDs(options);
    }
}