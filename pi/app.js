const express = require( 'express' );
const app = express();
const port = 7974;
const http = require( 'http' ).createServer( app );
const { Server } = require( "socket.io" );
const io = new Server( http );
app.use( express.static( 'web' ) );
const nconf = require( 'nconf' );
nconf.file( { file: './config.json' } );

//catch all errors
process.on( 'uncaughtException', function ( err ) {
    console.log( new Date().toString(), " - Got an error:" );
    console.log( err )
} );

//general
let disconnectConfigs = nconf.get( 'disconnectConfigs' );
let connectedSystemStats = { "cpu": "100" };
let weatherData = {
    "indoor": {},
    "outdoor": {}
};
let numPixels = 0;
let currentLEDs = {
    "strips": []
};
let stripConfig = nconf.get( "strips" );
stripConfig.forEach( ( strip, index ) => {
    numPixels += strip.length;
    currentLEDs.strips.push( blankStrip( { "id": index, "name": strip.name, "length": strip.length } ) );
} );

//Load in modules
const ledControlModule = require( "./led-control.js" );
const ledControl = new ledControlModule( numPixels );
const ledScripts = require( "./led-scripts/led-scripts.js" );
require( "./weatherData.js" ).setData( weatherData );
const GPIO = require( "./GPIO-control" );

function drawLEDs() {
    let arr = [];
    currentLEDs.strips.forEach( ( strip ) => {
        let tempArr = strip.arr;
        if ( stripConfig[strip.id].modifier ) {
            tempArr = ledScripts.modifiers[stripConfig[strip.id].modifier].modify( strip.arr, stripConfig[strip.id].modifierOptions );
        }
        for ( let i = 0; i < stripConfig[strip.id].length; i++ ) {
            arr.push( tempArr[i] );
        }
    } );
    ledControl.updateLEDs( arr );
}

//web listeners
app.get( '/rainbowMode', ( req, res ) => {
    let options = {
        "trigger": 'GET',
        "pattern": 'rainbow',
        "patternOptions": { "multiplier": 1 },
        "effect": "chase",
        "effectOptions": { "reverse": true, "speed": 1 },
        "strips": [1],
        //"transition": 'fade',
        "transitionOptions": { "time": 25 }
    }
    setLEDs( options );
    res.send( 'done' );
} );
app.get( '/lightsOff', ( req, res ) => {
    let options = {
        "trigger": 'GET',
        "pattern": 'off',
        "patternOptions": {},
        "effect": "",
        "strips": [1],
        "transition": 'fade',
        "transitionOptions": { "time": 25 }
    }
    setLEDs( options );
    res.send( 'done' );
} );
app.get( '/matrixOff', ( req, res ) => {
    let options = {
        "id": "off"
    }
    changeMatrix( options );
    res.send( 'done' );
} );

app.get( '/matrixOn', ( req, res ) => {
    let options = {
        "id": "tempe"
    }
    changeMatrix( { 'id': displayMatrix.default } );
    res.send( 'done' );
} );

//set up homekit
const HomeKit = require( './homekit.js' );
//const homekit = new HomeKit("hap.orangejuice.light", 'Track Lights', [1, 2, 3, 4, 5], setLEDs);
const homekit = new HomeKit( "hap.orangejuice.light", nconf.get( 'homekit' ), setLEDs );

//set up matrix
let displayMatrix = nconf.get( "displayMatrix" );
const matrixScripts = require( "./matrix-scripts.js" );
let matrixInterval
setTimeout( () => {
    changeMatrix( { 'id': displayMatrix.default } )
}, 500 );

//set up physical buttons
const buttonMap = nconf.get( 'buttonConfigs' );
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
                //"transitionOptions": {"time": 25}
            }
            setLEDs( options );
        }
        if ( config.matrix ) {
            changeMatrix( { id: config.matrix } );
        }
    } )
} );
let globalBrightness = 20;
GPIO.initDial( 0, () => {
    globalBrightness++;
    if(globalBrightness > 100){
        globalBrightness = 100;
    }
}, () => {
    globalBrightness--;
    if(globalBrightness < 0){
        globalBrightness = 0;
    }
} );

//set the button config to also have a web api
buttonMap.forEach((config, index) => {
    app.get(`/button/${index}`, (req, res) => {
        if ( config.pattern ) {
            const options = {
                "trigger": 'webAPI',
                "pattern": config.pattern,
                "patternOptions": config?.patternOptions,
                "effect": config?.effect,
                "effectOptions": config?.effectOptions,
                "strips": config?.strips,
                //"transition": 'fade',
                //"transitionOptions": {"time": 25}
            }
            setLEDs( options );
        }
        if ( config.matrix ) {
            changeMatrix( { id: config.matrix } );
        }
        res.send('done');
    });
});

//websockets
io.on( 'connection', function ( socket ) {
    console.log( 'a user connected' );
    socket.on( 'disconnect', function () {
        console.log( 'user disconnected' );
        disconnectConfigs.forEach( ( config ) => {
            config.strips.forEach( ( stripIndex ) => {
                writeConfigToStrips( stripIndex, config );
            } );
            drawLEDs();
        } )
    } );

    //new actually good stuff
    socket.on( 'getStripConfig', ( callback ) => {
        callback( stripConfig );
    } );
    socket.on( 'getScripts', ( callback ) => {
        let scriptsList = {
            "patterns": [],
            "effects": []
        };
        ledScripts.patterns.list.forEach( ( value ) => {
            scriptsList.patterns.push( {
                'name': ledScripts.patterns[value].name,
                'id': ledScripts.patterns[value].id,
                'options': ledScripts.patterns[value].options
            } );
        } );
        ledScripts.effects.list.forEach( ( value ) => {
            scriptsList.effects.push( {
                'name': ledScripts.effects[value].name,
                'id': ledScripts.effects[value].id,
                'options': ledScripts.effects[value].options
            } );
        } );
        callback( scriptsList );
    } );
    socket.on( 'getLEDScripts', ( callback ) => {
        callback( ledScripts );
    } );
    socket.on( 'getMatrixScripts', ( callback ) => {
        callback( matrixScripts );
    } );
    socket.on( 'setLEDs', ( options ) => {
        setLEDs( options );
    } );
    socket.on( 'setMatrix', ( options ) => {
        changeMatrix( options );
    } );
    socket.on( 'clearAppConfigs', () => {
        clearAppConfigs();
        setStripDefaults();
        drawLEDs();
    } );
    socket.on( 'disconnectConfig', ( method, data ) => {
        switch ( method ) {
            case "replace":
                disconnectConfigs = data;
                nconf.set( 'disconnectConfigs', data );
                break;
            case "add":
                disconnectConfigs.push( data );
                nconf.set( 'disconnectConfigs', disconnectConfigs );
                break;
            case "remove":
                disconnectConfigs.splice( disconnectConfigs.findIndex( ( v ) => v.id = data ), 1 );
                nconf.set( 'disconnectConfigs', disconnectConfigs );
                break;
        }
        saveConfig();
    } );
    socket.on( 'statsUpdate', ( data ) => {
        connectedSystemStats = data;
    } );
    socket.on( 'startDemo', ( data ) => {
        socket.broadcast.emit( 'startDemo' );
    } );
    socket.on( 'pauseDemo', ( data ) => {
        socket.broadcast.emit( 'pauseDemo' );
    } );
} );
http.listen( port, () => console.log( `listening on port ${port}` ) );

//helper functions
function newLEDarr( size, color ) {
    let arr = [];
    for ( let i = 0; i < size; i++ ) {
        arr.push( color );
    }
    return arr;
}

function clearAppConfigs( noClear ) {
    noClear = noClear ?? [];
    currentLEDs.strips.forEach( ( strip, index ) => {
        if ( strip.trigger === "app" && !noClear.includes( index ) ) {
            clearInterval( strip.effectTimout );
            clearInterval( strip.transitionInterval );
            clearTimeout( strip.transitionTimeout );
            currentLEDs.strips[index] = blankStrip( strip );
        }
    } )
}

function blankStrip( strip ) {
    return {
        "id": strip.id,
        "name": strip.name,
        "length": strip.length,
        "arr": newLEDarr( strip.length, "000000" ),
        "trigger": "",
        "effect": {},
        "effectTimout": null,
        "default": strip.default
    };
}

function writeConfigToStrips( stripIndex, options ) {
    //clear any outstanding effects
    let oldColorArr = [];
    if ( currentLEDs.strips[stripIndex].effect ) {
        clearInterval( currentLEDs.strips[stripIndex].effectTimout );
        currentLEDs.strips[stripIndex].effect = {};
    }
    if ( currentLEDs.strips[stripIndex].transition ) {
        clearInterval( currentLEDs.strips[stripIndex].transition.interval );
    }
    if ( options.transition ) {
        oldColorArr = currentLEDs.strips[stripIndex].arr;
        if ( oldColorArr.length === 0 ) {
            oldColorArr = newLEDarr( currentLEDs.strips[stripIndex].length, "000000" );
        }
    }
    //clear strip config completely
    currentLEDs.strips[stripIndex] = blankStrip( currentLEDs.strips[stripIndex] );
    //generate pattern
    currentLEDs.strips[stripIndex].arr = ledScripts.patterns[options.pattern].generate( stripConfig[stripIndex].length, options.patternOptions );
    //set trigger
    currentLEDs.strips[stripIndex].trigger = options.trigger;
    if ( options.transition ) {
        let newColorArr = currentLEDs.strips[stripIndex].arr;
        currentLEDs.strips[stripIndex].arr = oldColorArr;
        currentLEDs.strips[stripIndex].transition = new ledScripts.transitions[options.transition].Create( newColorArr, oldColorArr, options.transitionOptions );
        currentLEDs.strips[stripIndex].transition.interval = setInterval( () => {
            if ( currentLEDs.strips[stripIndex].transition ) {
                currentLEDs.strips[stripIndex].transition.step( ( arr ) => {
                    currentLEDs.strips[stripIndex].arr = arr;
                    drawLEDs();
                } )
            }
        }, currentLEDs.strips[stripIndex].transition.intervalTime );
    }
    //if there is an effect, apply & set it up
    if ( options.effect ) {
        currentLEDs.strips[stripIndex].effect = new ledScripts.effects[options.effect].Create( currentLEDs.strips[stripIndex].arr, options.effectOptions, stripConfig[stripIndex].length );
        currentLEDs.strips[stripIndex].effect.step( ( arr ) => {
            currentLEDs.strips[stripIndex].arr = arr;
        } )
        currentLEDs.strips[stripIndex].effectTimout = setInterval( () => {
            currentLEDs.strips[stripIndex].effect.step( ( arr ) => {
                currentLEDs.strips[stripIndex].arr = arr;
                drawLEDs();
            } )
        }, currentLEDs.strips[stripIndex].effect.interval );
    }
}

function setStripDefaults() {
    currentLEDs.strips.forEach( ( strip ) => {
        if ( strip.default ) {
            writeConfigToStrips( strip.id, strip.default );
        } else {
            blankStrip( strip );
        }
    } )
}

function setLEDs( options ) {
    //clear all other app scripts
    if ( options.trigger === "app" ) {
        clearAppConfigs( options.strips );
        setStripDefaults();
    }
    //write the config to each strip separately
    options.strips.forEach( ( stripIndex ) => {
        if ( options.trigger === "default" ) {
            currentLEDs.strips[stripIndex].default = options;
        }
        writeConfigToStrips( stripIndex, options );
    } );
    //after all the strips are set, draw the colors to the strip
    drawLEDs();
}

function saveConfig() {
    nconf.save( function ( err ) {
        if ( err ) {
            console.error( err.message );
            return;
        }
        //console.log('Configuration saved successfully.');
    } );
}

function changeMatrix( options ) {
    clearInterval( matrixInterval );
    options.strip = options.strip || displayMatrix.strip;

    function runMatrix() {
        matrixScripts[options.id].generate( options.strip, setLEDs, { connectedSystemStats, weatherData, globalBrightness } );
    }

    runMatrix();
    matrixInterval = setInterval( runMatrix, matrixScripts[options.id].timeout );
}