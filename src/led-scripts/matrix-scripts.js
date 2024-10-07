const fs = require( 'fs' );
const path = require( 'path' );

let matrixScripts = {
    'list': []
};
module.exports = matrixScripts;

fs.readdir( path.join( __dirname, "matrix-scripts" ), ( err, files ) => {
    files.forEach( ( file ) => {
        if ( file.match( /.js$/ ) ) {
            let script = require( path.join( __dirname, "matrix-scripts", file ) );
            matrixScripts[script.id] = script;
            if ( !script.hide ) {
                matrixScripts.list.push( script.id );
            }
        }
    } )
} );