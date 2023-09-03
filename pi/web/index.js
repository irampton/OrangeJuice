const socket = io();

let ledScripts,ledStripConfig, matrixScripts;

socket.on('connect', function () {
    socket.emit('getLEDScripts', (data) => {
        ledScripts = data;
        drawSettings();
    });
    socket.emit('getStripConfig', (data) => {
        ledStripConfig = data;
        drawStrips();
    });
    socket.emit('getMatrixScripts', (data) => {
        matrixScripts = data;
        drawMatrixStrips();
    });
});

function drawSettings() {
    let html = "<option value=\"\" selected></option>";
    ledScripts.patterns.list.forEach(v => {
        html += `<option value="${v}">${ledScripts.patterns[v].name}</option>`;
    })
    document.getElementById('pattern').innerHTML = html;

    html = "<option value=\"\" selected></option>";
    ledScripts.effects.list.forEach(v => {
        html += `<option value="${v}">${ledScripts.effects[v].name}</option>`;
    })
    document.getElementById('effect').innerHTML = html;
}

function drawStrips(){
    let html = "";
    ledStripConfig.forEach((value, index) => {
        html += `<input id="strip-${index}" value="${index}" name="newStrips" type="checkbox" class="w3-check"> <label for="strip-${index}">${value.name}</label>  `;
    });
    document.getElementById('stripsCheckboxes').innerHTML = html;
}

function changePattern() {
    let html = '';
    const pattern = ledScripts.patterns[document.getElementById('pattern').value];
    if (pattern) {
        for (let i in pattern.options) {
            const option = pattern.options[i];
            html += `${option.name}: <input id="pattern-${option.id}" type="${option.type}" value="${option.default}" class="w3-input">`;
        }
    }
    document.getElementById(`patternOptions`).innerHTML = html;
}

function drawMatrixStrips(){
    let html = "";
    matrixScripts.list.forEach((value, index) => {
        html += `<option value="${matrixScripts[value].id}">${matrixScripts[value].name}</option>  `;
    });
    document.getElementById('matrixSelect').innerHTML = html;
}

function changeEffect() {
    let html = '';
    const effect = ledScripts.effects[document.getElementById('effect').value];
    if (effect) {
        for (let i in effect.options) {
            const option = effect.options[i];
            html += `${option.name}: <input id="effect-${option.id}" type="${option.type}" value="${option.default}" class="w3-input">`;
        }
    }
    document.getElementById(`effectOptions`).innerHTML = html;
}

function display() {
    let config = {
        "trigger": "website",
        "pattern": document.getElementById("pattern").value,
        "patternOptions": {},
        "effect": document.getElementById("effect").value,
        "effectOptions": {},
        "strips": []
    }

    ledScripts.patterns[config.pattern].options.forEach((value) => {
        config.patternOptions[value.id] = document.getElementById(`pattern-${value.id}`).value;
        if (value.type === "color") {
            config.patternOptions[value.id] = config.patternOptions[value.id].replace("#", "")
        }
    });
    if (config.effect) {
        ledScripts.effects[config.effect].options.forEach((value) => {
            config.effectOptions[value.id] = document.getElementById(`effect-${value.id}`).value;
            if (value.type === "color") {
                config.patternOptions[value.id] = config.patternOptions[value.id].replace("#", "")
            }
        });
    }

    ledStripConfig.forEach((value, index) => {
        if (document.getElementById(`strip-${index}`).checked) {
            config.strips.push(index);
        }
    });

    if (!config.pattern || config.strips.length < 1) {
        alert("you are missing something");
        return;
    }
    socket.emit('setLEDs', config);
}

function setMatrix(){
    socket.emit('setMatrix', {'id': document.getElementById("matrixSelect").value});
}