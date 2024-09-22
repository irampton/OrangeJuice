const socket = io();

let systemConfig, ledScripts, matrixScripts;
socket.on( 'connect', function () {
    socket.emit( 'getSettings', ( data ) => {
        systemConfig = data;
        //hide any features that are not turned on
        if ( !systemConfig.features.matrixDisplay ) {
            document.getElementById( "matrix-section" ).classList.add( "noShow" );
            document.getElementById( "matrix-sidenav" ).classList.add( "noShow" );
        }
        drawFeatures();
        drawStrips();
        drawHomekit();
        socket.emit( 'getLEDScripts', ( data ) => {
            ledScripts = data;
            drawScripts();
            drawModifiers();
            if ( systemConfig.features.matrixDisplay ) {
                socket.emit( 'getMatrixScripts', ( data ) => {
                    matrixScripts = data;
                    drawButtons();
                    drawMatrixDisplay()
                } );
            } else {
                drawButtons();
            }
        } );
    } );
} );

function drawFeatures() {
    const featureNames = {
        "homekit": "HomeKit",
        "weatherSensor": "Attached weather sensor",
        "weatherFetch": "Get weather from web",
        "gpioButtons": "Use GPIO buttons",
        "gpioButtonsOnWeb": "Use button configs as web APIs",
        "hostWebControl": "Host web control",
        "webAPIs": "Host web APIs",
        "ioStatsUpdate": "Listen for connected system stats",
        "matrixDisplay": "Matrix display attached"
    }
    let html = ``;
    let list = Object.keys( systemConfig.features ).filter( k => k !== "hostWebControl" ).map( k => {
        return {
            id: k,
            name: featureNames[k] ?? k,
            default: systemConfig.features[k],
            type: "checkbox"
        }
    } );
    list.forEach( v => {
        html += `<div class="column is-half-tablet is-one-third-widescreen is-one-quarter-fullhd">${generateInput( v, 'features', 'bigger' )}</div>`;
    } );
    document.getElementById( 'features' ).innerHTML = html;
}

const typeClass = {
    "strip": "is-link",
    "matrix": "is-info",
    "ring": "is-warning",
    "strand": "is-danger"
}

function drawStrips() {
    let html = ``;
    systemConfig.stripConfig.forEach( ( strip, index ) => {
        html += `<div class="column is-half-tablet is-one-third-widescreen is-one-quarter-fullhd">
                    <div class="card">
                     <header class="card-header">
                        <p class="card-header-title">
                          ${strip.name}
                          ${strip.modifier ? `<span class="tag is-info mt-1 ml-2 px-1">modified</span>` : ""}
                        </p>
                        <div class="card-header-icon">
                          ${index}
                        </div>
                      </header>
                      <div class="card-content">
                        <div class="content">
                            Length: ${strip.length} LEDs
                        </div>
                        <div class="content">
                            Type: <span class="ml-1 px-2 py-1 tag is-medium ${typeClass[strip.type] ?? "is-light"}">${strip.type}</span>
                       </div>
                      </div>
                      <footer class="card-footer">
                        <a class="card-footer-item" onclick="editScript(${index})">Edit</a>
                        <a class="card-footer-item" onclick="modifyScript(${index})">Modifiers</a>
                        <a class="card-footer-item" onclick="deleteStrip(${index})">Delete</a>
                      </footer>
                    </div>
                </div>`;
    } );
    document.getElementById( 'stripList' ).innerHTML = html;
}

function drawModifiers() {
    let html = `<option value="" selected>None</option>`;
    ledScripts.modifiers.list.forEach( v => {
        html += `<option value="${v}">${ledScripts.modifiers[v].name}</option>`;
    } );
    document.getElementById( 'modifierModalSelect' ).innerHTML = html;
}

function drawScripts() {
    let html = ``;
    Object.keys( ledScripts ).forEach( key => {
        html += `<div class="column is-half-desktop is-one-quarter-fullhd">
                    <div class="card">
                     <header class="card-header">
                        <p class="card-header-title">
                          ${properCase( key )}
                        </p>
                        <div class="card-header-icon">
                          ${ledScripts[key].list.length}
                        </div>
                      </header>
                      <div class="card-content">`;
        ledScripts[key].list.forEach( s => {
            html += `       <div class="level">
                                <div class="level-left">
                                    <div class="level-item">${ledScripts[key][s].name}</div>
                                </div>
                                <div class="level-right">
                                    <div class="level-item">
                                        <span class="tag is-info mr-4">${ledScripts[key][s]?.options.length}</span>
                                        <span class="tag is-primary mx-1">${ledScripts[key][s]?.options.filter( o => o.type === "select" ).length}</span>
                                        <span class="tag is-link mx-1">${ledScripts[key][s]?.options.filter( o => o.type === "checkbox" ).length}</span>
                                        <span class="tag is-warning mx-1">${ledScripts[key][s]?.options.filter( o => o.type === "color" || o.type === "colorArray" ).length}</span>
                                        <span class="tag is-danger mx-1">${ledScripts[key][s]?.options.filter( o => o.type === "number" ).length}</span>
                                    </div>
                                </div>
                            </div>`;
        } );
        html += `     </div>
                    </div>
                </div>`;
    } );
    document.getElementById( 'scriptsList' ).innerHTML = html;
}

function drawHomekit() {
    let html = ``;
    systemConfig.homekit.forEach( cfg => {
        html += `
             <h3 class="title is-6 ml-2">${cfg.name}</h3>
             <div class="block ml-3 mb-0">
                <p>Username: <span>${cfg.username}</span></p>
                <p>Pincode: <span class="ml-4">${cfg.pincode}</span></p>
            </div>
            <div class="mx-1 my-2 columns">
        `;
        cfg.services.forEach( ( service, index ) => {
            if ( service.strips ) {
                html += `<div class="column is-half-tablet is-one-third-widescreen is-one-quarter-fullhd">
                    <div class="card">
                     <header class="card-header">
                        <p class="card-header-title">
                          ${service.name}
                        </p>
                         <div class="card-header-icon">
                            <i class="fa-solid fa-gear is-disabled"></i>
                        </div>
                      </header>
                      <div class="card-content">
                        <div class="content is-flex is-flex-wrap-wrap">
                            ${service.strips.map( v => systemConfig.stripConfig[v] ).reduce( ( acc, v ) => acc + `<span class="tag ${typeClass[v.type]} is-medium px-2 py-1 m-1">${v.name}</span>`, "" )}
                        </div>
                        <div class="content">
                            ${generateInput( {
                    type: "checkbox",
                    id: "temperature",
                    name: "Temperature",
                    default: service.temperature
                }, `homekit-${service.subtype}` )}
                        </div>
                         <div class="content">
                            ${generateInput( {
                    type: "checkbox",
                    id: "hueAndSat",
                    name: "Hue and Saturation",
                    default: service.hueAndSat
                }, `homekit-${service.subtype}` )}
                       </div>
                      </div>
                    </div>
                </div>`;
            }
        } );
        html += "</div>";
    } )

    document.getElementById( 'homekitList' ).innerHTML = html;
}

function drawButtons() {
    let html = ``;
    systemConfig.buttonMap.forEach( ( config, index ) => {
        html += `<div class="column is-half-tablet is-one-third-widescreen is-one-quarter-fullhd">
                    <div class="card">
                     <header class="card-header">
                        <p class="card-header-title">
                          Button: ${index}
                        </p>
                         <div class="card-header-icon">
                            <i class="fa-solid fa-gear"></i>
                        </div>
                      </header>
                      <div class="card-content">`;
        if ( config.pattern ) {
            html += `    <div class="content">
                            Pattern: ${ledScripts?.patterns[config.pattern]?.name ?? config.pattern}
                         </div>
                         <div class="content">
                            Effect: ${(ledScripts?.effects[config.effect]?.name ?? config.effect) || "None"}
                         </div>`;
        }
        if ( config.matrix ) {
            config.strips = config.strips ?? [];
            if ( systemConfig?.matrixDisplay && !config.strips.includes( systemConfig.matrixDisplay.strip ) ) {
                config.strips.unshift( systemConfig?.matrixDisplay?.strip );
            }
            html += `    <div class="content">
                            Maxtrix: ${matrixScripts?.[config.matrix].name ?? config.matrix}
                         </div>`;
        }
        html += `        <div class="content is-flex is-flex-wrap-wrap">
                            ${config.strips.map( v => systemConfig.stripConfig[v] ).reduce( ( acc, v ) => acc + `<span class="tag ${typeClass[v.type]} is-medium px-2 py-1 m-1">${v.name}</span>`, "" )}
                        </div>
                      </div>
                    </div>
                </div>`;
    } );
    document.getElementById( 'buttonList' ).innerHTML = html;
}

function drawMatrixDisplay() {
    document.getElementById( "matrixStrip" ).innerText = systemConfig.stripConfig[systemConfig.displayMatrix.strip].name;
    document.getElementById( "matrixIndex" ).innerText = systemConfig.displayMatrix.strip;
    document.getElementById( "matrixDefault" ).innerText = matrixScripts[systemConfig.displayMatrix.default].name;

}

function reloadScripts() {
    socket.emit( 'reloadScripts', ( data ) => {
        ledScripts = data;
        drawScripts();
    } );
}

function jumpTo( header ) {
    document.getElementById( `${header}-section` ).scrollIntoView();
}

function editScript( index ) {
    let strip;
    if ( index != null ) {
        strip = systemConfig.stripConfig[index];
        document.getElementById( 'scriptModalTitle' ).innerHTML = `Edit #<span class="has-text-black-ter">${index}</span>`;
        document.getElementById( 'scriptModalName' ).value = strip.name;
        document.getElementById( 'scriptModalLength' ).value = strip.length;
        document.getElementById( 'scriptModalType' ).value = strip.type;
    } else {
        //create a new script
        document.getElementById( 'scriptModalTitle' ).innerHTML = `Add Strip`;
        document.getElementById( 'scriptModalName' ).value = "";
        document.getElementById( 'scriptModalLength' ).value = 16;
        document.getElementById( 'scriptModalType' ).value = "strip";
    }
    document.getElementById( 'scriptModalSave' ).onclick = () => {
        let name = document.getElementById( 'scriptModalName' ).value;
        let length = Number( document.getElementById( 'scriptModalLength' ).value );
        let type = document.getElementById( 'scriptModalType' ).value;
        if ( !name || !length || !type ) {
            alert( "You are missing something!" );
            return;
        }
        let previousStrip;
        if ( strip ) {
            previousStrip = systemConfig.stripConfig[index - 1];
        } else {
            previousStrip = systemConfig.stripConfig[systemConfig.stripConfig.length - 1];
            systemConfig.stripConfig.push( {} );
            strip = systemConfig.stripConfig[systemConfig.stripConfig.length - 1];
        }
        strip.name = name;
        strip.start = (previousStrip?.start + previousStrip?.length) || 0;
        strip.length = length;
        strip.type = type;
        saveKey( 'strips', systemConfig.stripConfig );
        drawStrips();
        closeModal( 'scriptModal' );
    };
    document.getElementById( 'scriptModal' ).classList.add( 'is-active' );
}

function deleteStrip( index ) {
    systemConfig.stripConfig.splice( index, 1 );
    saveKey( 'stripConfig', systemConfig.stripConfig );
    drawStrips();
}

function modifyScript( index ) {
    let strip;
    strip = systemConfig.stripConfig[index];
    document.getElementById( 'scriptModalTitle' ).innerHTML = `Modifiers - ${strip.name}`;
    document.getElementById( 'modifierModalSelect' ).value = strip.modifier || "";
    modifierModalSelect();
    if ( strip.modifier ) {
        let modifierObj = ledScripts.modifiers[strip.modifier];
        for ( let i in modifierObj.options ) {
            document.getElementById( `modifierModal-${modifierObj.options[i].id}` ).value = strip.modifierOptions[modifierObj.options[i].id];
        }
    }
    document.getElementById( 'modifierModalSave' ).onclick = () => {
        strip.modifier = document.getElementById( 'modifierModalSelect' ).value || undefined;

        let modiferOptions = {};
        if ( strip.modifier ) {
            let modifierObj = ledScripts.modifiers[strip.modifier];
            for ( let i in modifierObj.options ) {
                modiferOptions[modifierObj.options[i].id] = document.getElementById( `modifierModal-${modifierObj.options[i].id}` ).value;
                if ( modifierObj.options[i].type === "number" ) {
                    modiferOptions[modifierObj.options[i].id] = Number( modiferOptions[modifierObj.options[i].id] );
                }
            }
        }
        strip.modifierOptions = modiferOptions;

        saveKey( 'strips', systemConfig.stripConfig );
        drawStrips();
        closeModal( 'modifierModal' );
    };
    document.getElementById( 'modifierModal' ).classList.add( 'is-active' );
}

function modifierModalSelect() {
    let modifier = document.getElementById( 'modifierModalSelect' ).value || undefined;
    let settingsBody = document.getElementById( 'modifierModalSettings' );
    if ( modifier ) {
        let modifierObj = ledScripts.modifiers[modifier];
        let html = '';
        for ( let i in modifierObj.options ) {
            html += generateInput( modifierObj.options[i], 'modifierModal' );
        }
        settingsBody.innerHTML = html;
    } else {
        settingsBody.innerHTML = "";
    }
}

function closeModal( id ) {
    document.getElementById( id ).classList.remove( 'is-active' );
}

function saveKey( key, data ) {
    socket.emit( 'setSettings', key, data );
}