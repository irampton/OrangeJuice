const path = require( 'path' );

const config = require( './config-manager' );
let ledScripts = require( "./led-scripts/led-scripts.js" );
const matrixScripts = require( "./led-scripts/matrix-scripts.js" );
const processSubgroups = require( "./subgroups.js" );
const {
    blankStrip,
    clearStrip,
    disableVirtualStripSegments,
    markControllersUpdated,
    resetVirtualStrips,
    stripIndexTextKey,
    writeConfigToStrips
} = require( "./ledControl" );

//grab data from config
let features = config.get( "features" );
let controllersConfig = config.get( "controllers" ) || [];
const buttonMap = config.get( 'buttonConfigs' );
let disconnectConfigs = config.get( 'disconnectConfigs' );
const displayMatrix = config.get( "displayMatrix" );
let scriptGroups = config.get( 'scriptGroups' ) ?? [];
let userPresets = config.get( 'userPresets' ) ?? [];

const MAX_FPS = 48;

//general
let globalMatrixBrightness = 20;
let connectedSystemStats = { "cpu": "100" };
let weatherData = {
    "indoor": {},
    "outdoor": {}
};
let currentLEDs = [];
let controllers = [];
let controllerUpdates = [];
let drawOnInterval = false;
let drawTimeout = null;
let drawOnTimeout = false;
let homekitInstances = [];
let enableLiveView = false;
let liveViewTimeout = null;
let emitLiveViewUpdate = null;

// Helper Function
function setLiveViewEnabled() {
    enableLiveView = true;
    if ( liveViewTimeout ) {
        clearTimeout( liveViewTimeout );
    }
    liveViewTimeout = setTimeout( () => {
        enableLiveView = false;
    }, 10000 );
}

function setLiveViewEmitter( emitter ) {
    emitLiveViewUpdate = emitter;
}

// Setup LED internals
function rebuildControllers( controllersList, options = {} ) {
    const { exitOnFailure = false } = options;
    resetVirtualStrips();
    const hasExistingStrips = currentLEDs.some( controller => controller.length );
    if ( hasExistingStrips ) {
        turnAllLightsOff();
    }
    const nextControllersConfig = controllersList || controllersConfig || [];
    const nextCurrentLEDs = nextControllersConfig.map( ( controller, controllerIndex ) => {
        const strips = controller?.strips || [];
        return strips.map( ( strip, stripIndex ) => blankStrip( {
            "id": [ controllerIndex, stripIndex ],
            "name": strip.name,
            "length": strip.length,
            "controller": controllerIndex,
            "default": strip.default
        } ) );
    } );
    const nextNumPixels = nextControllersConfig.map( controller => {
        const strips = controller?.strips || [];
        return strips.reduce( ( total, strip ) => total + (strip.length || 0), 0 );
    } );
    const nextControllers = [];
    try {
        let setGPIO = false;
        nextControllersConfig.forEach( ( c, i ) => {
            //only 2 GPIO pins can be used at a time.
            switch ( c.type ) {
                case "GPIO":
                    if ( setGPIO === "next" ) {
                        setGPIO = true;
                    } else if ( setGPIO ) {
                        throw "Only 2 GPIO pins can be used. They must be next to each other in the config file.";
                    } else {
                        let arr = [
                            {
                                numPixels: nextNumPixels[i],
                                pin: c.pin
                            }
                        ]
                        if ( nextControllersConfig[i + 1]?.type === "GPIO" ) {
                            setGPIO = "next";
                            arr.push( {
                                numPixels: nextNumPixels[i + 1],
                                pin: nextControllersConfig[i + 1].pin
                            } );
                        } else {
                            setGPIO = true;
                        }
                        nextControllers.push( ...new (require( "./controllers/led-pin-controller" ))( arr ) );
                    }
                    break;
                case "WebSocket":
                    nextControllers.push( new (require( "./controllers/led-esp32-controller" ))( nextNumPixels[i], c.url ) );
                    break;
                case "Mock":
                    nextControllers.push( ...new (require( "./controllers/led-mock-controller" ))( nextNumPixels[i] ) );
                    break;
            }
        } );
    } catch ( e ) {
        console.error( `Failed to initialize LED controllers: ${ e }` );
        if ( exitOnFailure ) {
            process.exit( 1 );
        }
        return false;
    }
    controllersConfig = nextControllersConfig;
    currentLEDs = nextCurrentLEDs;
    controllers = nextControllers;
    controllerUpdates = new Array( nextControllers.length ).fill( true );
    clearInterval( drawOnInterval );
    drawOnInterval = false;
    const hasNextStrips = nextCurrentLEDs.some( controller => controller.length );
    if ( hasNextStrips ) {
        turnAllLightsOff();
    } else {
        drawLEDs();
    }
    return true;
}

rebuildControllers( controllersConfig, { exitOnFailure: true } );

//catch all errors
process.on( 'uncaughtException', function ( err ) {
    console.log( new Date().toString(), " - Got an error:" );
    console.log( err )
} );

//enable add-ons
if ( features.hostWebControl || features.webAPIs || features.gpioButtonsOnWeb ) {
    const express = require( 'express' );
    const app = express();
    const http = require( 'http' ).createServer( app );
    const port = 7974;

    const webRoot = path.join( __dirname, 'vue/dist' );

    if ( features.hostWebControl ) {
        app.use( express.static( webRoot ) );
    }

    if ( features.webAPIs ) {
        const registerWebAPIs = require( './connections/webAPIs' );
        registerWebAPIs( app, {
            setLEDs,
            turnAllLightsOff,
            userPresets,
        } );
    }

    //set the button config to also have a web api
    if ( features.gpioButtonsOnWeb ) {
        buttonMap.forEach( ( config, index ) => {
            app.get( `/button/${ index }`, ( req, res ) => {
                if ( config.pattern ) {
                    const options = {
                        "trigger": 'webAPI',
                        "pattern": config.pattern,
                        "patternOptions": config?.patternOptions,
                        "effect": config?.effect,
                        "effectOptions": config?.effectOptions,
                        "strips": config?.strips,
                        //"transition": 'fade',
                        //"transitionOptions": {"time": .7}
                    }
                    setLEDs( options );
                }
                if ( config.matrix ) {
                    changeMatrix( { id: config.matrix } );
                }
                res.send( 'done' );
            } );
        } );
    }

    if ( features.hostWebControl ) {
        app.get( '*', ( req, res ) => {
            res.sendFile( path.join( webRoot, 'index.html' ) );
        } );
    }

    //websockets
    if ( features.hostWebControl || features.ioStatsUpdate ) {
        const registerWebSockets = require( "./connections/webSockets" );
        registerWebSockets( http, {
            getFeatures: () => features,
            setFeatures: ( next ) => {
                features = next;
            },
            getControllersConfig: () => controllersConfig,
            setControllersConfig: ( next ) => {
                controllersConfig = next;
            },
            getLedScripts: () => ledScripts,
            matrixScripts,
            buttonMap,
            displayMatrix,
            getScriptGroups: () => scriptGroups,
            setScriptGroups: ( next ) => {
                scriptGroups = next;
            },
            getUserPresets: () => userPresets,
            setUserPresets: ( next ) => {
                userPresets = next;
            },
            getDisconnectConfigs: () => disconnectConfigs,
            setDisconnectConfigs: ( next ) => {
                disconnectConfigs = next;
            },
            setConnectedSystemStats: ( next ) => {
                connectedSystemStats = next;
            },
            config,
            setLEDs,
            changeMatrix,
            clearAppConfigs,
            setStripDefaults,
            drawLEDs,
            writeConfigToStrips: writeConfigToStripsWithContext,
            reloadLEDScripts,
            rebuildControllers,
            setHomekitConfig: setupHomekit,
            setLiveViewEnabled,
            setLiveViewEmitter
        } );
    }

    http.listen( port, () => console.log( `listening on port ${ port }` ) );
}

if ( features.weatherSensor || features.weatherFetch ) {
    require( "./connections/weatherData.js" ).setData( weatherData, {
        useSensor: features.weatherSensor,
        fetchOnlineData: features.weatherFetch,
        sensorType: features.sensorType
    } );
}

if ( features.gpioButtons ) {
    const GPIO = require( "./connections/GPIO-control" );

    //set up physical buttons
    buttonMap.forEach( ( config, index ) => {
        GPIO.initButton( index, () => {
            if ( config.pattern ) {
                const options = {
                    "trigger": 'button',
                    "pattern": config.pattern,
                    "patternOptions": config?.patternOptions,
                    "effect": config?.effect,
                    "effectOptions": config?.effectOptions,
                    "strips": config?.strips,
                    //"transition": 'fade',
                    //"transitionOptions": {"time": .7}
                }
                setLEDs( options );
            }
            if ( config.matrix ) {
                changeMatrix( { id: config.matrix } );
            }
        } )
    } );
    GPIO.initDial( 0, () => {
        globalMatrixBrightness++;
        if ( globalMatrixBrightness > 100 ) {
            globalMatrixBrightness = 100;
        }
    }, () => {
        globalMatrixBrightness--;
        if ( globalMatrixBrightness < 0 ) {
            globalMatrixBrightness = 0;
        }
    } );
}

function destroyHomekitInstances() {
    if ( !homekitInstances.length ) {
        return;
    }
    homekitInstances.forEach( instance => {
        instance?.destroy?.();
    } );
    homekitInstances = [];
}

// Set up homekit
function setupHomekit( homeKitConfig ) {
    const nextConfig = homeKitConfig || [];
    if ( !features.homekit ) {
        config.set( 'homekit', nextConfig );
        return nextConfig;
    }
    destroyHomekitInstances();
    const HomeKit = require( './connections/homekit.js' );
    const rebuiltConfig = nextConfig.map( ( cfg, i ) => {
        const instance = new HomeKit( { number: i, ...cfg }, setLEDs, { weatherData } );
        homekitInstances.push( instance );
        return instance?.config ?? cfg;
    } );
    config.set( 'homekit', rebuiltConfig );
    return rebuiltConfig;
}

setupHomekit( config.get( "homekit" ) );

function reloadLEDScripts() {
    console.log( "reloading LED scripts" );
    let test = new RegExp( /\/led-scripts\// );
    let loadedScripts = Object.keys( require.cache ).filter( k => test.test( k.replace( /\\/g, "/" ) ) );
    loadedScripts.forEach( k => delete require.cache[k] );
    ledScripts = require( "./led-scripts/led-scripts" );
}

// LED Code
function writeConfigToStripsWithContext( stripIndex, options ) {
    return writeConfigToStrips( stripIndex, options, {
        currentLEDs,
        controllersConfig,
        ledScripts,
        controllerUpdates,
        maxFps: MAX_FPS,
        drawLEDs
    } );
}

// Assign a patter/effect to a strip
function setLEDs( options ) {
    //clear all other app scripts
    if ( options.trigger === "app" ) {
        clearAppConfigs( options.strips );
        setStripDefaults();
    }
    // Write the config to each strip separately
    options.strips.forEach( ( stripIndex ) => {
        // Unless there is a sharedRender group, then create a virtual strip
        if ( stripIndex[0] === "sharedRender" ) {
            const sharedGroup = scriptGroups?.[stripIndex[1]];
            if ( !sharedGroup ) {
                return;
            }
            // If sharedRender is set to 'off', set each strip individually
            if ( options.pattern === "off" ) {
                sharedGroup.strips.forEach( ( stripId ) => {
                    markControllersUpdated( { controller: stripId[0] }, stripId, controllerUpdates );
                    writeConfigToStripsWithContext( stripId, options );
                } );
                return;
            }

            // No default config is set for strips in a sharedRender
            const sharedStrips = sharedGroup.strips || [];
            const sharedControllers = [ ...new Set( sharedStrips.map( s => s[0] ) ) ];
            const vStrip = {
                type: "sharedRender",
                group: stripIndex[1],
                strips: sharedStrips,
                controllers: sharedControllers
            };
            sharedControllers.forEach( controller => {
                controllerUpdates[controller] = true;
            } );
            writeConfigToStripsWithContext( vStrip, options );
        } else {
            if ( options.trigger === "default" ) {
                currentLEDs[stripIndex[0]][stripIndex[1]].default = options;
            }
            controllerUpdates[stripIndex[0]] = true;
            writeConfigToStripsWithContext( stripIndex, options );
        }
    } );
    // After all the strips are set, draw the colors to the strip
    drawLEDs();
}

// Final layer to pass LED colors to the controller
function drawLEDs() {
    if ( drawTimeout ) {
        drawOnTimeout = true;
        return;
    }
    drawTimeout = setTimeout( () => {
        drawTimeout = null;
        if ( drawOnTimeout ) {
            drawOnTimeout = false;
            drawLEDs();
        }
    }, 1000 / MAX_FPS ) // don't draw more than MAX_FPS times a second
    let arr = new Array( controllers.length ).fill( 0 ).map( e => [] );
    currentLEDs.forEach( ( controller, cIndex ) => {
        controller.forEach( ( strip, sIndex ) => {
            let tempArr = strip.arr;
            const stripConfiguration = controllersConfig[cIndex].strips[sIndex];
            if ( stripConfiguration.modifier ) {
                tempArr = ledScripts.modifiers[stripConfiguration.modifier]
                    .modify( strip.arr, stripConfiguration.modifierOptions );
            }
            if ( stripConfiguration.subgroups ) {
                tempArr = processSubgroups( tempArr, stripConfiguration );
            }
            for ( let i = 0; i < stripConfiguration.length; i++ ) {
                arr[cIndex].push( tempArr[i] );
            }
        } )
    } );
    controllers.forEach( ( c, i ) => {
        if ( controllerUpdates[i] ) {
            c.updateLEDs( arr[i] );
            if ( enableLiveView && emitLiveViewUpdate ) {
                emitLiveViewUpdate( {
                    controllerIndex: i,
                    colors: arr[i]
                } );
            }
        }
    } );
}

// LED helper functions
function clearAppConfigs( noClear ) {
    noClear = noClear.map( s => stripIndexTextKey( s ) ) ?? [];
    currentLEDs.forEach( ( controller, cIndex ) => {
        controller.forEach( ( strip, sIndex ) => {
            if ( strip.trigger === "app" && !noClear.includes( stripIndexTextKey( [ cIndex, sIndex ] ) ) ) {
                clearStrip( strip );
                disableVirtualStripSegments( [ cIndex, sIndex ] );
                controllerUpdates[cIndex] = true;
            }
        } );
    } );
}

function setStripDefaults() {
    currentLEDs.forEach( controller => {
        controller.forEach( ( strip ) => {
            if ( strip.default ) {
                writeConfigToStripsWithContext( strip.id, strip.default );
            } else {
                blankStrip( strip );
            }
        } )
    } );
}

function turnAllLightsOff() {
    if ( !controllersConfig.length ) {
        return;
    }
    controllersConfig.forEach( ( controller, cIndex ) => {
            controller.strips.forEach( ( strip, sIndex ) => {
                controllerUpdates[cIndex] = true;
                writeConfigToStripsWithContext( [ cIndex, sIndex ], {
                    "trigger": "system",
                    "pattern": "off",
                    "patternOptions": {},
                    "effect": "",
                    "effectOptions": {}
                } );
            } );
        }
    );
    drawLEDs();
}

// Matrix
let matrixInterval;

if ( features.matrixDisplay ) {
    setTimeout( () => {
        changeMatrix( { 'id': displayMatrix.default } )
    }, 500 );
}

function changeMatrix( options ) {
    clearInterval( matrixInterval );
    options.strip = options.strip || displayMatrix.strip;

    function runMatrix() {
        matrixScripts[options.id].generate( options.strip, setLEDs, {
            connectedSystemStats,
            weatherData,
            globalBrightness: globalMatrixBrightness
        } );
    }

    runMatrix();
    if ( options.id !== "off" ) {
        matrixInterval = setInterval( runMatrix, matrixScripts[options.id].timeout );
    }
}
