const hap = require("hap-nodejs");

module.exports = function (id,config, setLEDs){
    const Accessory = hap.Accessory;
    const Characteristic = hap.Characteristic;
    const CharacteristicEventTypes = hap.CharacteristicEventTypes;
    const Service = hap.Service;

// optionally set a different storage location with code below
// hap.HAPStorage.setCustomStoragePath("...");

    const accessoryUuid = hap.uuid.generate(id);
    const accessory = new Accessory(config.name, accessoryUuid);

    function createLight(name,subtype,strips){
        const lightService = new Service.Lightbulb(name);

        lightService.displayName = name;
        lightService.subtype = subtype;

        var currentLightState = false; // on or off
        var currentBrightnessLevel = 100;

// 'On' characteristic is required for the light service
        const onCharacteristic = lightService.getCharacteristic(Characteristic.On);
// 'Brightness' characteristic is optional for the light service; 'getCharacteristic' will automatically add it to the service!
        const brightnessCharacteristic = lightService.getCharacteristic(Characteristic.Brightness);

// with the 'on' function we can add event handlers for different events, mainly the 'get' and 'set' event
        onCharacteristic.on(CharacteristicEventTypes.GET, callback => {
            callback(undefined, currentLightState);
        });
        onCharacteristic.on(CharacteristicEventTypes.SET, (value, callback) => {
            currentLightState = value;
            let config = createConfig(currentLightState,currentBrightnessLevel,strips);
            setLEDs(config);
            callback();
        });

        brightnessCharacteristic.on(CharacteristicEventTypes.GET, (callback) => {
            callback(undefined, currentBrightnessLevel);
        });
        brightnessCharacteristic.on(CharacteristicEventTypes.SET, (value, callback) => {
            currentBrightnessLevel = value;
            let config = createConfig(currentLightState,currentBrightnessLevel,strips);
            setLEDs(config);
            callback();
        });
        return lightService;
    }

    config.services.forEach(v=>{
        accessory.addService(createLight(v.name,v.subtype,v.strips));
    })

// once everything is set up, we publish the accessory. Publish should always be the last step!
    accessory.publish({
        username: "17:51:07:F4:BC:8A",
        pincode: "678-90-876",
        port: 47129,
        category: hap.Categories.LIGHTBULB, // value here defines the symbol shown in the pairing screen
    });

    console.log("Accessory setup finished!");   
}

function createConfig(state,brightness, strips){
    if(state) {
        return {
            "trigger": 'homekit',
            "pattern": 'brightness-kelvin',
            "patternOptions": {"kelvin": "3600", "brightness": brightness},
            "effect": "",
            "strips": strips,
            //"transition": 'fade',
            "transitionOptions": {"time": 25}
        }
    }
    return {
        "trigger": 'homekit',
        "pattern": 'off',
        "patternOptions": {},
        "effect": "",
        "strips": strips,
        //"transition": 'fade',
        "transitionOptions": {"time": 25}
    }
}