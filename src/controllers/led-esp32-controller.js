const WebSocket = require( 'ws' );

module.exports = function ( numPixels, url ) {
    const self = this;
    this.url = url;
    this.numPixels = numPixels;
    this.previousArr = [];

    function connect() {
        return new Promise( ( resolve, reject ) => {
            self.ws = new WebSocket( `ws://${url}:81` );

            self.ws.on( 'open', () => {
                console.log( `Connected to WebSocket server @${url}` );
                resolve();
            } );

            self.ws.on( 'close', () => {
                console.log( `Disconnected from WebSocket server@${url}` );
            } );

            self.ws.on( 'error', function error( err ) {
                //console.error('WebSocket error:', err);
                reject( err );
            } );
        } );
    }

    async function ensureConnection() {
        if ( self.ws.readyState !== WebSocket.OPEN ) {
            console.log( 'WebSocket is not open. Attempting to reconnect...' );
            await connect();
        }
    }

    function hexToRgb( hex ) {
        const bigint = parseInt( hex, 16 );
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
    }

    this.updateLEDs = async ( arr ) => {
        if ( arraysEqual( arr, this.previousArr ) ) {
            return;
        }
        try {
            await ensureConnection();

            const colors = arr.map( hex => hexToRgb( hex ) );
            const payload = JSON.stringify( colors );

            self.ws.send( payload, function ack( err ) {
                if ( err ) {
                    //console.error( 'Error sending data:', err );
                }
            } );
        } catch ( err ) {
            console.error( `Failed to update LEDs via websocket @${this.url}` );
        }

        this.previousArr = structuredClone( arr );
    }

    // Initial connection
    connect().catch( err => console.error( `Initial connection to WebSocket @${this.url} failed` ) );
}

function arraysEqual( arr1, arr2 ) {
    if ( arr1.length !== arr2.length ) return false;
    for ( let i = 0; i < arr1.length; i++ ) {
        if ( arr1[i] !== arr2[i] ) return false;
    }
    return true;
}