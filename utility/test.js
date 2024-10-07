const { default: AHT20 } = require( 'aht20-sensor' );
const i2c = require( 'i2c-bus' );

const AHT20_I2CADDR = 0x38;
const AHT20_CMD_SOFTRESET = [0xBA];
const AHT20_CMD_CALIBRATE = [0xE1, 0x08, 0x00];
const AHT20_CMD_MEASURE = [0xAC, 0x33, 0x00];
const AHT20_STATUS_BUSY = 0x80;
const AHT20_STATUS_CALIBRATED = 0x08;

i2c.openPromisified( 1 ).then( async bus => {
    const sensor = new AHT20( bus );
    /*sensor.init().catch(err => {
        console.error(err);
    });*/
    const buf = Buffer.from( AHT20_CMD_SOFTRESET );
    await bus.i2cWrite( AHT20_I2CADDR, buf.length, buf );

    setTimeout( async () => {
        try {
            /*const buf2 = Buffer.from( AHT20_CMD_CALIBRATE );
            console.log( buf2.length, buf2 );
            await bus.i2cWrite( AHT20_I2CADDR, buf2.length, buf2 );*/
        } catch(err){
         console.log(err, "failed, but moving on anyways");
        }
        setTimeout(async ()=>{
            const buf = Buffer.from(AHT20_CMD_MEASURE);
            bus.i2cWrite(AHT20_I2CADDR, buf.length, buf);

            setTimeout( async () => {
                const rbuf = Buffer.alloc( 7 );
                await bus.i2cRead( AHT20_I2CADDR, rbuf.length, rbuf );
                const humidity = round( ((rbuf[1] << 12) | (rbuf[2] << 4) | (rbuf[3] >> 4)) * 100 / 0x100000, 2 );
                const temperature = round( (((rbuf[3] & 0xF) << 16) | (rbuf[4] << 8) | rbuf[5]) * 200.0 / 0x100000 - 50, 2 );
                console.log( rbuf, humidity, temperature );
            }, 100 )
        }, 100)

    }, 100 )


} );

const round = ( value, dmp ) => {
    return Math.round( value / Math.pow( 10, -dmp ) ) / Math.pow( 10, dmp );
};

/*AHT20.open(1).then(async (sensor) => {
    try {
        const temp = await sensor.temperature();
        const hum = await sensor.humidity();
        console.log(temp, hum);
    }
    catch(err) {
        console.error("Failed to get temperature or humidity data.");
    }node
}).catch((err) => {
    console.error("Failed to open bus.", err);
});*/