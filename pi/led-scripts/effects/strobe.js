module.exports = {
    'id': "strobe",
    'name': "Strobe",
    'animate': true,
    'options': [
        { 'id': "speed", 'name': "Speed", 'type': "number", 'default': 1 }
    ],
    "Create": function ( colorArray, options ) {
        this.colorArray = [...colorArray];
        this.pattern = [...colorArray];
        this.speed = options.speed;
        this.interval = 1 / this.speed * 1000;
        this.step = function ( callback ) {
            if ( this.colorArray[0] === '000000' ) {
                this.colorArray = [...this.pattern];
            } else {
                for ( let i = 0; i < (this.colorArray.length); i++ ) {
                    this.colorArray[i] = '000000';
                }
            }
            callback( this.colorArray );
        }
    }
}