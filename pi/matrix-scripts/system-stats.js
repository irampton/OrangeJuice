module.exports = {
    'name': "System Stats",
    'id': "systemStats",
    'timeout': 500,
    'needsSystemStats': true,
    'generate': (strip, setLEDs, systemStats) => {
        let displayString = "";
        let colorArr = [];
        if (systemStats.cpu) {
            let cpuString = createString(systemStats.cpu);
            let memString = createString(systemStats.mem);
            let gpuString = createString(systemStats.gpu);
            displayString = `${cpuString} ${memString} ${gpuString}`;

            for(let i = 0;i < cpuString.length;i++){
                colorArr.push("2D5AF9");
            }
            colorArr.push("000000");
            for(let i = 0;i < memString.length;i++){
                colorArr.push("7F4FE0");
            }
            colorArr.push("000000");
            for(let i = 0;i < gpuString.length;i++){
                colorArr.push("2FED55");
            }
            colorArr.push("000000");
        } else {
            displayString = "E";
            colorArr.push("FF0000");
        }
        let options = {
            "trigger": 'matrix',
            "pattern": 'matrix-display-stats',
            "patternOptions": {
                "temp": displayString,
                "color": colorArr
            },
            "effect": "",
            "strips": [strip]
        }
        setLEDs(options);
    }
}

function createString(stat) {
    let string = "";
    stat = String(stat);
    if(stat.match(/1/g)) {
        for (let i = 0; i < stat.match(/1/g).length; i++) {
            string += "  ";
        }
    }
    for (let i = 0; i < 3 - stat.length; i++) {
        if (i === 0) {
            string += "p";
        } else {
            string += "P";
        }
    }
    string += stat;
    return string;
}