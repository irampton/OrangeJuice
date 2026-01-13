module.exports = {
    'id': "wipe",
    'name': "Wipe",
    'animate': true,
    'options': [
        { 'id': "time", 'name': "Time", 'type': "number", 'default': 1 }
    ],
    "Create": function ( colorArray, oldArr, options, MAX_FPS ) {
        this.steps = Math.max( 2, Math.floor( MAX_FPS * options.time ) );
        this.intervalTime = 1 / MAX_FPS * 1000;
        this.interval = null;
        this.oldArr = [...oldArr];
        this.newArr = [...colorArray];
        this.currentStep = 0;
        this.step = function ( callback ) {
            const percent = this.currentStep / (this.steps - 1);
            const cut = Math.min( this.newArr.length, Math.floor( percent * this.newArr.length ) );
            const arr = new Array( this.newArr.length );
            for ( let i = 0; i < this.newArr.length; i++ ) {
                arr[i] = i < cut ? this.newArr[i] : this.oldArr[i];
            }
            this.currentStep++;
            if ( this.currentStep >= this.steps ) {
                clearInterval( this.interval );
            }
            callback( arr );
        }
    }
};
