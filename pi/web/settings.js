const socket = io();

let ledStripConfig, systemConfig;
socket.on( 'connect', function () {
    socket.emit( 'getStripConfig', ( data ) => {
        ledStripConfig = data;
    } );
    socket.emit( 'getConfig', ( data ) => {
        console.log(data);
        systemConfig = data;

        //hide any features that are not turned on
        if ( !systemConfig.features.matrixDisplay ) {
            document.getElementById( "matrix-section" ).classList.add( "noShow" );
            document.getElementById( "matrix-sidenav" ).classList.add( "noShow" );
        }

        drawFeatures();
    } );
} );

function drawFeatures(){
    let html = ``;
    let list = Object.keys(systemConfig.features).map(k => {
        return {
            id: k,
            name: k,
            default: systemConfig.features[k],
            type: "checkbox"
        }
    })
    list.forEach( v => {
        html += generateInput(v, 'features');
    } );
    document.getElementById( 'features' ).innerHTML = html;
}

function jumpTo(header){
    document.getElementById(`${header}-section`).scrollIntoView();
}