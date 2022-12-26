const hap = require("hap-nodejs");

module.exports = function (id,name, strips, setLEDs){
    const Accessory = hap.Accessory;
    const Characteristic = hap.Characteristic;
    const CharacteristicEventTypes = hap.CharacteristicEventTypes;
    const Service = hap.Service;

// optionally set a different storage location with code below
// hap.HAPStorage.setCustomStoragePath("...");

    const accessoryUuid = hap.uuid.generate(id);
    const accessory = new Accessory(name, accessoryUuid);

    const lightService = new Service.Lightbulb(name);

    this.currentLightState = false; // on or off
    this.currentBrightnessLevel = 100;

// 'On' characteristic is required for the light service
    const onCharacteristic = lightService.getCharacteristic(Characteristic.On);
// 'Brightness' characteristic is optional for the light service; 'getCharacteristic' will automatically add it to the service!
    const brightnessCharacteristic = lightService.getCharacteristic(Characteristic.Brightness);

// with the 'on' function we can add event handlers for different events, mainly the 'get' and 'set' event
    onCharacteristic.on(CharacteristicEventTypes.GET, callback => {
        callback(undefined, this.currentLightState);
    });
    onCharacteristic.on(CharacteristicEventTypes.SET, (value, callback) => {
        this.currentLightState = value;
        let config = createConfig(this.currentLightState,this.currentBrightnessLevel,strips);
        setLEDs(config);
        callback();
    });

    brightnessCharacteristic.on(CharacteristicEventTypes.GET, (callback) => {
        callback(undefined, this.currentBrightnessLevel);
    });
    brightnessCharacteristic.on(CharacteristicEventTypes.SET, (value, callback) => {
        this.currentBrightnessLevel = value;
        let config = createConfig(this.currentLightState,this.currentBrightnessLevel,strips);
        setLEDs(config);
        callback();
    });

    accessory.addService(lightService); // adding the service to the accessory


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
            "pattern": 'brightness-fill',
            "patternOptions": {"color": "FFFFAF", "brightness": brightness},
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