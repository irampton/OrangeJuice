const hap = require( "hap-nodejs" );
module.exports = function ( id, configManager, setLEDs, { weatherData } ) {
    let config = configManager.get( 'homekit' );
    const Accessory = hap.Accessory;
    const Characteristic = hap.Characteristic;
    const CharacteristicEventTypes = hap.CharacteristicEventTypes;
    const Service = hap.Service;

// optionally set a different storage location with code below
// hap.HAPStorage.setCustomStoragePath("...");

    const accessoryUuid = hap.uuid.generate( id );
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

// 'On' characteristic is required for the light service
        const onCharacteristic = lightService.getCharacteristic( Characteristic.On );
// 'Brightness' characteristic is optional for the light service; 'getCharacteristic' will automatically add it to the service!
        const brightnessCharacteristic = lightService.getCharacteristic( Characteristic.Brightness );


// with the 'on' function we can add event handlers for different events, mainly the 'get' and 'set' event
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
                sendToLights( "hueAndSat" );
                callback();
            } );
            const satCharacteristic = lightService.getCharacteristic( Characteristic.Saturation );
            satCharacteristic.on( CharacteristicEventTypes.GET, ( callback ) => {
                callback( undefined, currentSat );
            } );
            satCharacteristic.on( CharacteristicEventTypes.SET, ( value, callback ) => {
                currentSat = value;
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
        console.log( `Added ${v.name} to HomeKit` );
    } )

    //set a random username/password if once isn't set
    if ( !config.username ) {
        config.username = `${randomInt( 16, 255 ).toString( 16 )}:${randomInt( 16, 255 ).toString( 16 )}:${randomInt( 16, 255 ).toString( 16 )}:${randomInt( 16, 255 ).toString( 16 )}:${randomInt( 16, 255 ).toString( 16 )}:${randomInt( 16, 255 ).toString( 16 )}`;
        configManager.set( 'homekit', config );
    }
    if ( !config.pincode ) {
        config.pincode = `${randomInt( 100, 999 )}-${randomInt( 10, 99 )}-${randomInt( 100, 999 )}`;
        configManager.set( 'homekit', config );
    }
    // once everything is set up, we publish the accessory. Publish should always be the last step!
    accessory.publish( {
        username: config.username,
        pincode: config.pincode,
        port: 47129,
        category: hap.Categories.LIGHTBULB, // value here defines the symbol shown in the pairing screen
    } );

    console.log( `Accessory setup finished!\nHomeKit Username: ${config.username}\nHomeKit Pin: ${config.pincode}` );
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
        //"transition": 'fade',
        "transitionOptions": { "time": 25 }
    }
}

function randomInt( low, high ) {
    return Math.floor( Math.random() * (high - low) ) + low;
}