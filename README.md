# OrangeJuice
>An All-Inclusive Software for Controlling RGB LEDs

OrangeJuice designed run on a Raspberry Pi to control individually addressable RGB LEDs. 
It uses a powerful system of strips, patterns, and effects to drive LED strips, strands, rings, and matrices.

### Supported Platforms
OrangeJuice uses the NPM module [`rpi-ws281x-native`](https://www.npmjs.com/package/rpi-ws281x-native) to write to any LEDs. 
The module will __only__ work on a Raspberry Pi and supports the WS281x (sometimes called NEOPIXELs) standard. (Including WS2811, WS2812, WS2812b, SK6812, and SK6812W)

>A separate javascript file, [`script-tester.js`](./pi/script-tester.js) can be used to run/test most OrangeJuice features on any platform. 
To support a different LED standard or microcontroller platform, [`led-pin-controller.js`](./pi/led-pin-control.js) could be re-written to use a different library and no other changes would be needed.

### Setup
* Connect GPIO 18 to the data line on the WS281x LEDs and a GPIO ground pin the LED ground line.
* Install NodeJS (version 14 or newer) on your Raspberry Pi. (I recommend using [`n`](https://www.npmjs.com/package/n))
* Clone this repository (or download just [`/pi`](./pi)) to your Raspberry Pi. 
* In `/pi` run `npm install`
* Run `sudo node app.js` to start OrangeJuice.
* Go to `<Raspberry Pi's IP/Hostname>:7974` in a web browser to access the web UI.

OrangeJuice automatically creates one strip of 16 LEDs. 
Use the settings on the control page to turn on those 16 LEDs, or go to the settings page and edit the strips to match your LED setup.

## How it works

OrangeJuice draws to your LEDs using a system of strips, patterns, and effects:

__Strips__ are sets of sequential LEDs that will be controlled together.

__Patterns__ output a static design that can be drawn to any strip.

__Effects__ take in a pattern and output an animated design that can be put on a strip.

Both patterns and effects can have options that you set to customize them. 
You must select a pattern to turn on any lights, but effects are optional.
Patterns cover the whole length of the strip.
Every effect uses the input pattern, but may do different things with it. 
For example, the Strobe effect turns the pattern on and off repeatedly, 
whereas the Blink effect make the entire strip the same color and cycles through the colors in the pattern.

For example, you can use the fill effect to set a strip to alternating white and blue colors:

(insert picture)

Then you could add a Chase effect to make the white and blue lights alternate:

(insert picture)

#### Technical Details

Each pattern and effect is a separate javascript file located in [`/pi/led-scripts`](./pi/led-scripts).
Every file in the directory is loaded in a start-up and can be reloaded through the UI as needed.

Both patterns and effects export a name, id, and a list of options that can be changed.

A pattern exports a function that takes in the number of LEDs in the strip and any options and outputs an array of colors.

An effect exports a constructor that takes in a pattern and any options. 
The constructor creates an object with a step function that is called by the main program on a given interval (set in the constructor).

>~~For more details on effects and patterns, read [How to make Effects and Patterns]() in the wiki.~~

## Additional Features

### HomeKit
OrangeJuice integrates easily with Apple's HomeKit using [`hap-nodejs`](https://www.npmjs.com/package/hap-nodejs).
Set up is easy:

* Turn on HomeKit in the settings webpage
* ~~Add a strip (or set of strips) to the HomeKit Section~~*
* Restart OrangeJuice
* Pair OrangeJuice to HomeKit using the username and pincode in the HomeKit section on the settings page

*This feature is not fully implemented. Edit the config file manually instead.

<sub>OrangeJuice is not an officially certified HomeKit accessory</sub>

### GPIO Buttons
You can set up OrangeJuice to use buttons or rotary encoders to change the LEDs. 
Enable the feature and edit the appropriate parts of the config file to use.

### Matrix Display
OrangeJuice support displaying numbers and text (like a clock) on a 32x8 LED matrix.
Enable to feature and choose a display option to get started.

### Live Weather
OrangeJuice can pull weather info from online or a temperature sensor connected to the GPIO to display on a matrix or use elsewhere.
Turn on the feature in the control panel to use. View or edit [`pi/weatherData.js`](./pi/weatherData.js) for more info or to localize.

### Desktop App
OrangeJuice contains a lightweight desktop app to integrate your Windows PC with OrangeJuice. 
In the app you can set certain presets to run on system changes, such as opening an app.

#### Backlight
The desktop app can use an 8x8 matrix as a backlight that reflects the colors on your screen.

#### System Stats
The desktop app can send system stats (CPU, RAM, and GPU usage) to OrangeJuice to display on a matrix or use elsewhere.