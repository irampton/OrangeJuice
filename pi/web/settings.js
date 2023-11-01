const socket = io();

let ledStripConfig, systemConfig, ledScripts;
socket.on( 'connect', function () {
    socket.emit( 'getStripConfig', ( data ) => {
        ledStripConfig = data;
        drawStrips();
    } );
    socket.emit( 'getSettings', ( data ) => {
        console.log(data);
        systemConfig = data;
        //hide any features that are not turned on
        if ( !systemConfig.features.matrixDisplay ) {
            document.getElementById( "matrix-section" ).classList.add( "noShow" );
            document.getElementById( "matrix-sidenav" ).classList.add( "noShow" );
        }
        drawFeatures();
    } );
    socket.emit( 'getLEDScripts', ( data ) => {
        ledScripts = data;
        drawScripts();
    } );
} );

function drawFeatures(){
    const featureNames ={
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
    let list = Object.keys(systemConfig.features).map(k => {
        return {
            id: k,
            name: featureNames[k] ?? k,
            default: systemConfig.features[k],
            type: "checkbox"
        }
    })
    list.forEach( v => {
        html += `<div class="column is-half-tablet is-one-third-widescreen is-one-quarter-fullhd">${generateInput(v, 'features', 'bigger')}</div>`;
    } );
    document.getElementById( 'features' ).innerHTML = html;
}

function drawStrips(){
    const typeClass= {
        "strip": "is-link",
        "matrix": "is-info",
        "ring": "is-warning",
        "strand": "is-danger"
    }
    let html = ``;
    ledStripConfig.forEach( (strip, index) => {
        html += `<div class="column is-half-tablet is-one-third-widescreen is-one-quarter-fullhd">
                    <div class="card">
                     <header class="card-header">
                        <p class="card-header-title">
                          ${strip.name}
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
                            Type: <span class="ml-1 tag is-medium ${typeClass[strip.type] ?? "is-light"}">${strip.type}</span>
                       </div>
                      </div>
                      <footer class="card-footer">
                        <a href="#" class="card-footer-item">Edit</a>
                        <a href="#" class="card-footer-item">Modifiers</a>
                        <a href="#" class="card-footer-item">Delete</a>
                      </footer>
                    </div>
                </div>`;
    } );
    document.getElementById( 'stripList' ).innerHTML = html;
}

function drawScripts(){
    let html = ``;
    Object.keys(ledScripts).forEach( key => {
        html += `<div class="column is-half-desktop is-one-quarter-fullhd">
                    <div class="card">
                     <header class="card-header">
                        <p class="card-header-title">
                          ${properCase(key)}
                        </p>
                        <div class="card-header-icon">
                          ${ledScripts[key].list.length}
                        </div>
                      </header>
                      <div class="card-content">`;
        ledScripts[key].list.forEach(s => {
            html += `       <div class="level">
                                <div class="level-left">
                                    <div class="level-item">${ledScripts[key][s].name}</div>
                                </div>
                                <div class="level-right">
                                    <div class="level-item">
                                        <span class="tag is-info mr-4">${ ledScripts[key][s]?.options.length}</span>
                                        <span class="tag is-link mx-1">${ ledScripts[key][s]?.options.filter(o => o.type === "number").length}</span>
                                        <span class="tag is-warning mx-1">${ ledScripts[key][s]?.options.filter(o => o.type === "color").length}</span>
                                        <span class="tag is-danger mx-1">${ ledScripts[key][s]?.options.filter(o => o.type === "checkbox").length}</span>
                                    </div>
                                </div>
                            </div>`;
        });
        html += `     </div>
                    </div>
                </div>`;
    } );
    document.getElementById( 'scriptsList' ).innerHTML = html;
}

function jumpTo(header){
    document.getElementById(`${header}-section`).scrollIntoView();
}