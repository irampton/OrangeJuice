const hap = require( "hap-nodejs" );
module.exports = function ( config, setLEDs, { weatherData } ) {
    const Accessory = hap.Accessory;
    const Characteristic = hap.Characteristic;
    const CharacteristicEventTypes = hap.CharacteristicEventTypes;
    const Service = hap.Service;

    const accessoryUuid = hap.uuid.generate( config.name );
    const accessory = new Accessory( config.name, accessoryUuid );

    function createTemperatureSensor( name, subtype ) {
        const service = new Service.TemperatureSensor( name );

        service.displayName = name;
        service.subtype = subtype;

        service.getCharacteristic( Characteristic.CurrentTemperature )
            .on( CharacteristicEventTypes.GET, callback => {
                callback( null, weatherData.indoor?.temperature );
            } );

        return service;
    }

    function createLight( name, subtype, strips, temperature, hueAndSat ) {
        const lightService = new Service.Lightbulb( name );

        lightService.displayName = name;
        lightService.subtype = subtype;

        let currentLightState = false; // on or off
        let currentBrightnessLevel = 100;
        let currentColorTemp = 3600;
        let currentHue = 0;
        let currentSat = 0;
        let currentMode = "static";

        const onCharacteristic = lightService.getCharacteristic( Characteristic.On );
        const brightnessCharacteristic = lightService.getCharacteristic( Characteristic.Brightness );

        onCharacteristic.on( CharacteristicEventTypes.GET, callback => {
            callback( undefined, currentLightState );
        } );
        onCharacteristic.on( CharacteristicEventTypes.SET, ( value, callback ) => {
            currentLightState = value;
            sendToLights();
            callback();
        } );

        brightnessCharacteristic.on( CharacteristicEventTypes.GET, ( callback ) => {
            callback( undefined, currentBrightnessLevel );
        } );
        brightnessCharacteristic.on( CharacteristicEventTypes.SET, ( value, callback ) => {
            currentBrightnessLevel = value;
            sendToLights();
            callback();
        } );

        //adds option to control color temperature
        if ( temperature ) {
            const colorCharacteristic = lightService.getCharacteristic( Characteristic.ColorTemperature );
            colorCharacteristic.on( CharacteristicEventTypes.GET, ( callback ) => {
                callback( undefined, 1000000 / currentColorTemp );
            } );
            colorCharacteristic.on( CharacteristicEventTypes.SET, ( value, callback ) => {
                currentColorTemp = 1000000 / value;
                currentHue = 0;
                currentSat = 0;
                sendToLights( "temperature" );
                callback();
            } );
        }

        //adds option to control hue and saturation
        if ( hueAndSat ) {
            const hueCharacteristic = lightService.getCharacteristic( Characteristic.Hue );
            hueCharacteristic.on( CharacteristicEventTypes.GET, ( callback ) => {
                callback( undefined, currentHue );
            } );
            hueCharacteristic.on( CharacteristicEventTypes.SET, ( value, callback ) => {
                currentHue = value;
                currentColorTemp = 0;
                sendToLights( "hueAndSat" );
                callback();
            } );
            const satCharacteristic = lightService.getCharacteristic( Characteristic.Saturation );
            satCharacteristic.on( CharacteristicEventTypes.GET, ( callback ) => {
                callback( undefined, currentSat );
            } );
            satCharacteristic.on( CharacteristicEventTypes.SET, ( value, callback ) => {
                currentSat = value;
                currentColorTemp = 0;
                sendToLights( "hueAndSat" );
                callback();
            } );

        }

        function sendToLights( mode = undefined ) {
            currentMode = mode ?? currentMode
            let config;
            if ( mode === "temperature" ) {
                config = createConfig( currentLightState, currentBrightnessLevel, {
                    'type': "temp",
                    'temp': currentColorTemp
                }, strips );
            } else if ( mode === "hueAndSat" ) {
                config = createConfig( currentLightState, currentBrightnessLevel, {
                    'type': "hsl",
                    'hue': currentHue,
                    'sat': currentSat
                }, strips );
            } else {
                config = createConfig( currentLightState, currentBrightnessLevel, { 'type': "none" }, strips );
            }
            setLEDs( config );
        }

        return lightService;
    }

    config.services.forEach( v => {
        switch ( v.type ) {
            case "temperature sensor":
                accessory.addService( createTemperatureSensor( v.name, v.subtype ) );
                break;
            case "light":
            default:
                accessory.addService( createLight( v.name, v.subtype, v.strips, v.temperature, v.hueAndSat ) );
                break;
        }
        console.log( `Added ${ v.name } to HomeKit accessory: ${ config.name }` );
    } )

    //set a random username/password if once isn't set
    if ( !config.username ) {
        config.username = `${ randomInt( 16, 255 ).toString( 16 ) }:${ randomInt( 16, 255 ).toString( 16 ) }:${ randomInt( 16, 255 ).toString( 16 ) }:${ randomInt( 16, 255 ).toString( 16 ) }:${ randomInt( 16, 255 ).toString( 16 ) }:${ randomInt( 16, 255 ).toString( 16 ) }`;
    }
    if ( !config.pincode ) {
        config.pincode = `${ randomInt( 100, 999 ) }-${ randomInt( 10, 99 ) }-${ randomInt( 100, 999 ) }`;
    }
    // once everything is set up, we publish the accessory. Publish should always be the last step!
    accessory.publish( {
        username: config.username,
        pincode: config.pincode,
        port: 47129 + config.number,
        category: hap.Categories.LIGHTBULB, // value here defines the symbol shown in the pairing screen
    } );

    console.log( `Accessory setup finished on HomeKit accessory: ${ config.name }!\nHomeKit username: ${ config.username }\nHomeKit pin: ${ config.pincode }` );

    return config
}

function createConfig( state, brightness, special, strips ) {
    if ( state ) {
        switch ( special.type ) {
            case 'temp':
                return {
                    "trigger": 'homekit',
                    "pattern": 'brightness-kelvin',
                    "patternOptions": { "kelvin": special.temp, "brightness": brightness },
                    "effect": "",
                    "strips": strips,
                    //"transition": 'fade',
                    "transitionOptions": { "time": 25 }
                }
            case 'hsl':
                return {
                    "trigger": 'homekit',
                    "pattern": 'hsl-fill',
                    "patternOptions": {
                        "hue": special.hue,
                        "saturation": special.sat,
                        "lightness": 45,
                        "brightness": brightness
                    },
                    "effect": "",
                    "strips": strips,
                    //"transition": 'fade',
                    "transitionOptions": { "time": 25 }
                }
            case 'none':
                return {
                    "trigger": 'homekit',
                    "pattern": 'brightness-kelvin',
                    "patternOptions": { "kelvin": "3200", "brightness": brightness },
                    "effect": "",
                    "strips": strips,
                    //"transition": 'fade',
                    "transitionOptions": { "time": 25 }
                }
        }

    }
    return {
        "trigger": 'homekit',
        "pattern": 'off',
        "patternOptions": {},
        "effect": "",
        "strips": strips,
        "transition": 'fade',
        "transitionOptions": { "time": 100 }
    }
}

function randomInt( low, high ) {
    return Math.floor( Math.random() * ( high - low ) ) + low;
}