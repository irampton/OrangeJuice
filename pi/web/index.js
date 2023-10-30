const socket = io();

let ledScripts, ledStripConfig, matrixScripts, ledStripGroups, userPresets;
socket.on( 'connect', function () {
    socket.emit( 'getLEDScripts', ( data ) => {
        ledScripts = data;
        drawSettings();
    } );
    socket.emit( 'getStripConfig', ( data ) => {
        ledStripConfig = data;
        drawStrips();
        drawStripGroups();
    } );
    socket.emit( 'getMatrixScripts', ( data ) => {
        matrixScripts = data;
        drawMatrixStrips();
    } );
    drawPresets();
} );

function drawSettings() {
    let html = `<option value="off" selected>Select Pattern</option>`;
    ledScripts.patterns.list.forEach( v => {
        html += `<option value="${v}">${ledScripts.patterns[v].name}</option>`;
    } );
    document.getElementById( 'pattern' ).innerHTML = html;

    html = `<option value="" selected>No Effect</option>`;
    ledScripts.effects.list.forEach( v => {
        html += `<option value="${v}">${ledScripts.effects[v].name}</option>`;
    } );
    document.getElementById( 'effect' ).innerHTML = html;
}

function drawStrips() {
    let html = "";
    ledStripConfig.forEach( ( value, index ) => {
        html += `<input id="strip-${index}" value="${index}" name="newStrips" type="checkbox" class="stripBox bigger"><label class="button py-2 px-3 m-1" for="strip-${index}"> ${value.name}</label>`;
    } );
    document.getElementById( 'stripsCheckboxes' ).innerHTML = html;
    if(ledStripConfig.length === 1){
        document.getElementById('strip-0').checked = true;
        document.getElementById('stripGroups').classList.add("noShow");
        document.getElementById('stripGroupsHR').classList.add("noShow");
    }
}

function drawStripGroups() {
    socket.emit( 'getStripGroups', ( data ) => {
        ledStripGroups = [
            {
                name: "Select All",
                strips: ledStripConfig.map( ( v, index ) => index )
            },
            {
                name: "Select None",
                strips: []
            },
            ...data ?? [],
            {
                name: "+ Group"
            }
        ];
        let html = "";
        ledStripGroups.forEach( ( value, index ) => {
            html += `<button class="button py-2 px-3 m-1 is-link is-outlined" onclick="selectGroup(${index})" ondblclick="deleteStripGroup(${index})"> ${value.name}</button>`;
        } );
        document.getElementById( 'stripGroups' ).innerHTML = html;
    } );
}

function drawPresets() {
    socket.emit( 'getPresets', ( data ) => {
        userPresets = data
        let html = ``;
        userPresets.forEach( ( v, index ) => {
            html += `<option value="${index}">${v.name}</option>`;
        } );
        document.getElementById( 'presetSelect' ).innerHTML = html;
    } );
}

function selectGroup( index ) {
    if ( index === ledStripGroups.length - 1 ) {
        const name = prompt( "Name" );
        if ( name ) {
            socket.emit( 'editStripGroup', 'add', {
                name,
                strips: ledStripConfig.map( ( value, index ) => document.getElementById( `strip-${index}` ).checked ? index : null ).filter( v => v !== null )
            } );
            drawStripGroups();
        }
    } else {
        ledStripConfig.forEach( ( v, i ) => {
            document.getElementById( `strip-${i}` ).checked = ledStripGroups[index].strips.includes( i );
        } );
    }
}

function deleteStripGroup( index ) {
    if ( index > 1 ) {
        if ( confirm( "Are you sure you want to delete this group?" ) ) {
            socket.emit( 'editStripGroup', 'remove', index - 2 );
            drawStripGroups();
        }
    }
}

function changePattern() {
    let html = '';
    const pattern = ledScripts.patterns[document.getElementById( 'pattern' ).value];
    if ( pattern ) {
        for ( let i in pattern.options ) {
            html += generateInput( pattern.options[i], 'pattern' );
        }
    }
    document.getElementById( `patternOptions` ).innerHTML = html;
}

function drawMatrixStrips() {
    let html = "";
    matrixScripts.list.forEach( ( value, index ) => {
        html += `<option value="${matrixScripts[value].id}">${matrixScripts[value].name}</option>  `;
    } );
    document.getElementById( 'matrixSelect' ).innerHTML = html;
}

function changeEffect() {
    let html = '';
    const effect = ledScripts.effects[document.getElementById( 'effect' ).value];
    if ( effect ) {
        for ( let i in effect.options ) {
            html += generateInput( effect.options[i], 'effect' );
        }
    }
    document.getElementById( `effectOptions` ).innerHTML = html;
}

function display( preset ) {
    let config = preset ?? getConfig();
    if ( !config.pattern || config.strips.length < 1 ) {
        alert( "you are missing something" );
        return;
    }
    config.trigger = 'website';
    socket.emit( 'setLEDs', config );
}

function setMatrix() {
    socket.emit( 'setMatrix', { 'id': document.getElementById( "matrixSelect" ).value } );
}

function generateInput( option, superText ) {
    switch ( option.type ) {
        case "checkbox":
            return `<div class="block ml-2">
                        <label class="checkbox" for="${superText}-${option.id}">
                           <input id="${superText}-${option.id}" name="${superText}-${option.id}" type="checkbox" class="bigger" ${option.default ? "checked" : ""}>
                           ${option.name}
                        </label>
                    </div>`;
        case "color":
            return `<div class="field is-horizontal">
                        <label class="pt-3">${option.name}</label>
                        <input id="${superText}-${option.id}" type="${option.type}" value="${option.default}" class="bigger m-2 ml-3">
                    </div>`;
        default:
            return `<div class="field is-horizontal">
                        <label class="pt-2">${option.name}</label>
                        <div class="control">
                            <input id="${superText}-${option.id}" type="${option.type}" value="${option.default}" class="input ml-2">
                        </div>
                    </div>`;
    }
}

function getConfig() {
    let config = {
        "trigger": "",
        "pattern": document.getElementById( "pattern" ).value,
        "patternOptions": {},
        "effect": document.getElementById( "effect" ).value,
        "effectOptions": {},
        "strips": []
    }

    ledScripts.patterns[config.pattern].options.forEach( ( value ) => {
        config.patternOptions[value.id] = document.getElementById( `pattern-${value.id}` ).value;
        if ( value.type === "color" ) {
            config.patternOptions[value.id] = config.patternOptions[value.id].replace( "#", "" )
        }
        if ( value.type === "checkbox" ) {
            config.patternOptions[value.id] = document.getElementById( `pattern-${value.id}` ).checked;
        }
        if ( value.type === "number" ) {
            config.patternOptions[value.id] = Number( config.patternOptions[value.id] );
        }
    } );
    if ( config.effect ) {
        ledScripts.effects[config.effect].options.forEach( ( value ) => {
            config.effectOptions[value.id] = document.getElementById( `effect-${value.id}` ).value;
            if ( value.type === "color" ) {
                config.effectOptions[value.id] = config.effectOptions[value.id].replace( "#", "" )
            }
            if ( value.type === "checkbox" ) {
                config.effectOptions[value.id] = document.getElementById( `effect-${value.id}` ).checked;
            }
            if ( value.type === "number" ) {
                config.effectOptions[value.id] = Number( config.effectOptions[value.id] );
            }
        } );
    }

    ledStripConfig.forEach( ( value, index ) => {
        if ( document.getElementById( `strip-${index}` ).checked ) {
            config.strips.push( index );
        }
    } );

    return config;
}

function addPreset() {
    let config = getConfig();
    if ( !config.pattern || config.strips.length < 1 ) {
        alert( "you are missing something" );
        return;
    }
    config.trigger = 'userPreset';
    config.name = prompt( "name" );
    if ( config.name ) {
        socket.emit( 'editPresets', 'add', config );
        drawPresets();
    }
}

function updatePreset() {
    let config = getConfig();
    let index = document.getElementById( "presetSelect" ).value;
    let preset = userPresets?.[index];
    if ( preset ) {
        if ( !config.pattern || config.strips.length < 1 ) {
            alert( "you are missing something" );
            return;
        }
        preset = {
            ...config,
            name: preset.name,
            trigger: preset.trigger
        };
        if ( preset.name ) {
            socket.emit( 'editPresets', 'update', preset, index );
            drawPresets();
            document.getElementById( "presetSelect" ).value = index;
        }
    }
}

function setPreset() {
    let preset = userPresets?.[document.getElementById( "presetSelect" ).value];
    if ( preset ) {
        display( preset );
    }
}

function deletePreset() {
    let index = document.getElementById( "presetSelect" ).value;
    if ( index !== "" && index > -1 && index < userPresets.length ) {
        if ( confirm( `Are you sure you want to to delete "${userPresets[index].name}"?` ) ) {
            socket.emit( 'editPresets', 'remove', null, Number( index ) );
        }
    }
    drawPresets();
}

function loadPreset() {
    let preset = userPresets?.[document.getElementById( "presetSelect" ).value];
    if ( preset ) {
        document.getElementById( "pattern" ).value = preset.pattern;
        document.getElementById( "effect" ).value = preset.effect;
        changePattern();
        changeEffect();
        Object.keys( preset.patternOptions ).forEach( key => {
            switch ( ledScripts.patterns[preset.pattern].options.find( v => v.id === key ).type ) {
                case "color":
                    document.getElementById( `pattern-${key}` ).value = `#${preset.patternOptions[key]}`;
                    break;
                case "checkbox":
                    document.getElementById( `pattern-${key}` ).checked = preset.patternOptions[key];
                    break;
                default:
                    document.getElementById( `pattern-${key}` ).value = preset.patternOptions[key];
            }
        } );
        if ( preset.effect ) {
            Object.keys( preset.effectOptions ).forEach( key => {
                switch ( ledScripts.effects[preset.effect].options.find( v => v.id === key ).type ) {
                    case "color":
                        document.getElementById( `effect-${key}` ).value = `#${preset.effectOptions[key]}`;
                        break;
                    case "checkbox":
                        document.getElementById( `effect-${key}` ).checked = preset.effectOptions[key];
                        break;
                    default:
                        document.getElementById( `effect-${key}` ).value = preset.effectOptions[key];
                }
            } );
        }
        ledStripConfig.forEach( ( value, index ) => {
            document.getElementById( `strip-${index}` ).checked = preset.strips.includes( index );
        } );
    }
}