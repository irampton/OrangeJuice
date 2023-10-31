const fs = require( 'fs' );

let configData = {};
const fileName = "config.json";

if ( fs.existsSync( fileName ) ) {
    try {
        configData = JSON.parse( fs.readFileSync( fileName, 'utf8' ) );
    } catch {
        console.error( "could not load config file - trying again" );
        configData = JSON.parse( fs.readFileSync( fileName, 'utf8' ) );
    }
} else {
    configData = JSON.parse( fs.readFileSync( 'base-config.json', 'utf8' ) );
    writeFile();
}

function writeFile( count = 0 ) {
    fs.writeFile( fileName, JSON.stringify( configData, null, 2 ), err => {
        if ( err ) {
            if ( count < 3 ) {
                writeFile( count++ );
            } else {
                console.error( "could not save config file" );
            }
        }
    } );
}

function readFile() {
    try {
        configData = JSON.parse( fs.readFileSync( fileName, 'utf8' ) );
    } catch {
        console.warn( "could not re-load config file" );
    }
}

module.exports = {
    get: function ( key ) {
        return configData[key];
    },
    set: function ( key, value ) {
        configData[key] = value;
        writeFile();
    },
    readFile
}

