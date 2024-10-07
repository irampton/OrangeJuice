const socket = io();

let foundAppsList = [];
let configurations = [];
let effectList = [];
let patternList = [];
let stripConfig = [];
let table;

let configuredAppsList = [];

socket.on('connect', function () {
    //console.log('Connected');
    socket.emit('getConfigurations', (storedConfigurations, ledStripConfig, ledPatternList, ledEffectList, appList) => {
        configurations = storedConfigurations ?? [];
        stripConfig = ledStripConfig;
        patternList = ledPatternList;
        effectList = ledEffectList;
        foundAppsList = appList;
        table = new Tabulator("#configurationsTable", {
            height: "60%",
            data: convertTableData(configurations),
            layout: "fitColumns",
            resizableRows: true,
            columns: [
                {title: "Name", field: "name"},
                {title: "Trigger", field: "trigger"},
                {title: "Pattern", field: "pattern"},
                {title: "Pattern Options", field: "patternOptions"},
                {title: "Effect", field: "effect"},
                {title: "Strips", field: "stripNames"},
                {
                    title: "", field: "delete", formatter: "buttonCross", cellClick: (e, cell) => {
                        deleteConfiguration(cell.getRow().getData())
                    }, width: "1px"
                }
            ],
        });
        let html = "<option value='' selected></option>";
        appList.forEach((value) => {
            html += `<option id="${value}">${value}</option>`;
        });
        document.getElementById('newAppTriggerSelect').innerHTML = html;
        html = "<option value='' selected></option>";
        ledPatternList.forEach((value) => {
            html += `<option value="${value.id}">${value.name}</option>`;
        });
        document.getElementById('newPatternSelect').innerHTML = html;
        html = "<option value='' selected>None</option>";
        ledEffectList.forEach((value) => {
            html += `<option value="${value.id}">${value.name}</option>`;
        });
        document.getElementById('newEffectSelect').innerHTML = html;
        html = "";
        ledStripConfig.forEach((value, index) => {
            html += `<input id="strip-${index}" value="${index}" name="newStrips" type="checkbox"> <label for="strip-${index}">${value.name}</label>  `;
        });
        document.getElementById('newStripsList').innerHTML = html;
    });
});

function convertTableData(config) {
    let tableData = [];
    config.forEach((value) => {
        let row = {
            "name": value.triggerOption,
            "trigger": value.trigger,
            "pattern": "",
            "patternOptions": JSON.stringify(value.patternOptions),
            "effect": "",
            "stripNames": [],
            "id": value.id
        }
        if (value.pattern) {
            row.pattern = patternList.find((v) => {
                return v.id === value.pattern
            }).name;
        }
        if (value.effect) {
            row.effect = effectList.find((v) => {
                return v.id === value.effect
            }).name
        }
        if (value.strips) {
            value.strips.forEach((stripIndex) => {
                row.stripNames += `${stripConfig[stripIndex].name}, `;
            })
            row.stripNames = row.stripNames.replace(/, $/, "");
        }
        tableData.push(row);
    })

    return tableData;
}

function deleteConfiguration(row) {
    configurations.splice(configurations.findIndex((v) => {
        return v.id === row.id
    }), 1);
    table.replaceData(convertTableData(configurations));
    socket.emit('deleteConfiguration', row.id);
}

function newTriggerSelectChange() {
    document.getElementById('newTriggerOption-app').style.display = "none";

    let value = document.getElementById("newTriggerSelect").value;
    if (value === "app") {
        document.getElementById(`newTriggerOption-${value}`).style.display = "block";
    }
}

function newPatternSelectChange() {
    let html = '<br><br>';
    const pattern = patternList.find(element => element.id === document.getElementById('newPatternSelect').value);
    if (pattern) {
        for (let i in pattern.options) {
            const option = pattern.options[i];
            if (option.id !== 'numLEDs') {
                html += `${option.name}: <input id="newPattern-${option.id}" type="${option.type}" value="${option.default}">`;
            }
        }
    }
    document.getElementById(`newPatternOptions`).innerHTML = html;
}

function newEffectSelectChange() {
    let html = '<br><br>';
    const effect = effectList.find(element => element.id === document.getElementById('newEffectSelect').value);
    if (effect) {
        for (let i in effect.options) {
            const option = effect.options[i];
            html += `${option.name}: <input id="newEffect-${option.id}" type="${option.type}" value="${option.default}">`;
        }
    }
    document.getElementById(`newEffectOptions`).innerHTML = html;
}

function createConfiguration() {
    let config = {
        "trigger": document.getElementById("newTriggerSelect").value,
        "triggerOption": "",
        "pattern": document.getElementById("newPatternSelect").value,
        "patternOptions": {},
        "effect": document.getElementById("newEffectSelect").value,
        "effectOptions": {},
        "strips": [],
        "id": configurations.length
    }
    if (config.trigger === 'app') {
        config.triggerOption = document.getElementById("newAppTriggerSelect").value
    }
    stripConfig.forEach((value, index) => {
        if (document.getElementById(`strip-${index}`).checked) {
            config.strips.push(index);
        }
    });
    patternList.find((value) => {
        return value.id === config.pattern
    }).options.forEach((value) => {
        if (value.id !== 'numLEDs') {
            config.patternOptions[value.id] = document.getElementById(`newPattern-${value.id}`).value;
            if (value.type === "color") {
                config.patternOptions[value.id] = config.patternOptions[value.id].replace("#", "")
            }
        }
    });
    if (config.effect) {
        console.log(effectList);
        effectList.find((value) => {
            return value.id === config.effect
        }).options.forEach((value) => {
            config.effectOptions[value.id] = document.getElementById(`newEffect-${value.id}`).value;
        });
    }

    if (!config.trigger || !config.pattern || !config.trigger || config.strips.length === 0) {
        alert("you are missing something");
        return;
    }
    socket.emit('createConfiguration', config);
    configurations.push(config);
    table.replaceData(convertTableData(configurations));
    document.getElementById('newConfigurationModal').style.display = 'none';
}