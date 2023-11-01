const express = require( 'express' );
const app = express();
const port = 7974;
const http = require( 'http' ).createServer( app );
const { Server } = require( "socket.io" );
const io = new Server( http );

app.use( express.static( 'web' ) );

const config = require( './config-manager' );
const stripConfig = config.get( "strips" );
let features = config.get( "features" );
const buttonMap = config.get( 'buttonConfigs' );
let ledScripts = require( "./led-scripts/led-scripts" );

let running = {};
let numLEDs = 16;

io.on( 'connection', function ( socket ) {
    console.log( 'a user connected' );

    socket.on( 'disconnect', function () {
        console.log( 'user disconnected' );
    } );
    socket.on( 'getLEDScripts', ( callback ) => {
        callback( ledScripts );
    } );
    socket.on( 'getStripConfig', callback => {
        callback( [
            {
                "name": "Strip",
                "length": 300,
                "type": "strip"
            }
        ] )
    } );
    socket.on( 'setNumLEDs', value => {
        numLEDs = value;
    } );
    socket.on( 'setLEDs', ( config ) => {
        if ( running.effect ) {
            clearInterval( running.effectInterval );
        }
        running = {};

        numLEDs = Number( config.num ) || numLEDs;
        config.num = numLEDs;

        let colorArr = ledScripts.patterns[config.pattern].generate( Number( numLEDs ), config.patternOptions );
        io.emit( 'newColorArr', config, colorArr );

        if ( config.effect ) {
            running.effect = new ledScripts.effects[config.effect].Create( colorArr, {
                ...config.effectOptions,
                numLEDs: config.num
            } );
            running.effect.step( ( arr ) => {
                io.emit( 'newColorArr', config, arr );
            } );
            running.effectInterval = setInterval( () => {
                running.effect.step( ( arr ) => {
                    io.emit( 'newColorArr', config, arr );
                } )
            }, running.effect.interval );
        }
    } );
    socket.on( 'reloadScripts', ( callback ) => {
        reloadLEDScripts();

        function sendCallback() {
            if ( ledScripts.patterns?.list.length > 0 && ledScripts.effects?.list.length > 0 ) {
                callback( ledScripts );
            } else {
                setTimeout( sendCallback, 50 );
            }
        }

        sendCallback();
    } );
    socket.on( 'getConfig', ( callback ) => {
        let send = {
            features,
            "homekit": config.get( 'homekit' ),
            stripConfig,
            buttonMap
        };
        callback( send );
    } );
} );
http.listen( port, () => console.log( `listening on port ${port}` ) );

function reloadLEDScripts() {
    console.log( "reloading LED scripts" );
    let test = new RegExp( /\/led-scripts\// );
    let loadedScripts = Object.keys( require.cache ).filter( k => test.test( k.replace( /\\/g, "/" ) ) );
    loadedScripts.forEach( k => delete require.cache[k] );
    ledScripts = require( "./led-scripts/led-scripts" );
}