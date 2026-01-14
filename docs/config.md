# Configuration File Layout

OrangeJuice uses `config.json` to store all of its settings. 
It is designed to be user-editable.
If `config.json` does not exist on app startup, it uses `base-config.json` to create a new `config.json`.

The runtime reads these keys in `src/app.js`, and the web UI in
`src/vue/src/pages/Settings.vue` updates them via WebSocket.

## Top-Level Shape

```json
{
  "features": {},
  "controllers": [],
  "homekit": [],
  "buttonConfigs": [],
  "disconnectConfigs": [],
  "scriptGroups": [],
  "userPresets": [],
  "displayMatrix": {
    "strip": 0,
    "default": "off"
  }
}
```

Not every key is required. If a section is missing, the app will use defaults
or treat it as empty.

## features
Feature flags used by `src/app.js`:
- `hostWebControl`: Serve the web UI from port `7974`.
- `webAPIs`: Enable REST endpoints in `src/connections/webAPIs.js`.
- `matrixDisplay`: Enable the matrix display add-on.
- `homekit`: Enable HomeKit integration.
- `gpioButtons`: Enable physical GPIO buttons.
- `gpioButtonsOnWeb`: Expose GPIO button configs as web API endpoints.
- `weatherSensor`: Read weather data from a connected sensor.
- `weatherFetch`: Fetch weather data from the web.
- `ioStatsUpdate`: Accept system stats over WebSocket.
- `sensorType`: Optional; passed to the weather data provider when
  `weatherSensor` is enabled.

## controllers
Controllers are the primary hardware endpoints. Each controller can contain its
own `strips` list, and all strips are flattened in controller order.

Controller shape:
```json
{
  "name": "GPIO 1",
  "type": "GPIO",
  "pin": 12,
  "strips": []
}
```

Allowed `type` values:
- `"GPIO"` (requires `pin`)
- `"WebSocket"` (requires `url`)
- `"Mock"` (no extra fields)

Strip shape (nested under `controllers[].strips`):
```json
{
  "name": "Wall Strip",
  "length": 375,
  "type": "strip",
  "modifier": "color",
  "modifierOptions": {
    "red": 100,
    "green": 100,
    "blue": 100
  }
}
```

Strip fields:
- `name`: Display name.
- `length`: Number of LEDs on the strip.
- `type`: `"strip"`, `"matrix"`, `"ring"`, or `"strand"`.
- `modifier`: Optional modifier script id from `led-scripts/modifiers`.
- `modifierOptions`: Optional options for the modifier.

For controller restrictions (GPIO pin limits, adjacency rules, WebSocket
requirements), see `docs/controllers.md`.

## Strip Indices
All parts of the system reference strips **by index**, not by name. Strip
indices are assigned by flattening all controller strips in order:

1. Controller `0` strips (in their listed order)
2. Controller `1` strips
3. Controller `2` strips
4. ...and so on

These indices are used by:
- `userPresets[].strips`
- `homekit[].services[].strips`
- `displayMatrix.strip`
- `buttonConfigs[].strips`
- `disconnectConfigs[].strips`

When you move a strip to a different controller, its index can change.

## homekit
HomeKit accessories are configured as a list of instances. Each instance can
have one or more services.

```json
{
  "name": "Bedroom Lights",
  "services": [
    {
      "name": "Wall Strip",
      "subtype": "wall_strip",
      "type": "light",
      "strips": [0],
      "temperature": true,
      "hueAndSat": true
    }
  ],
  "username": "f2:fb:7c:46:da:23",
  "pincode": "974-88-228"
}
```

Notes:
- `username` and `pincode` are auto-generated if missing.
  - They require a specific format, so do not change unless you know what you are doing 
- Service `type` can be `"light"` or `"temperature sensor"`.
- `strips` is an array of strip indices (see Strip Indices).
- `temperature` and `hueAndSat` control which HomeKit characteristics are
  enabled for a light.

## displayMatrix
Optional configuration for the matrix display add-on.

```json
{
  "strip": 0,
  "default": "off"
}
```

- `strip`: The strip index to treat as the matrix.
- `default`: Matrix script id to load at startup.

## userPresets
User presets are reused by the UI and REST API. They are standard LED configs:

```json
{
  "trigger": "userPreset",
  "pattern": "rainbow",
  "patternOptions": { "multiplier": 3 },
  "effect": "chase-twinkle",
  "effectOptions": { "chase_speed": 16 },
  "strips": [0],
  "name": "Twinkle Rainbow"
}
```

## disconnectConfigs
Each config is applied when a WebSocket client disconnects. The structure is
the same as other LED configs and must include `strips`.

## scriptGroups
Stored grouping data for the web UI. Each entry lists strip ids as controller
tuples.

Example:
```json
{
  "name": "Living Room",
  "strips": [
    [0, 1],
    [0, 2]
  ]
}
```

## Managing Controllers and Strips in the Web UI
The Settings page (`src/vue/src/pages/Settings.vue`) writes to `controllers`
and `features` via WebSocket.

### Add a Controller
1. Open Settings → Controllers → "Add Controller".
2. Enter `name` and choose a `type`.
3. Provide required fields:
   - WebSocket: `url`
   - GPIO: `pin` (must be a supported GPIO pin)
4. Save. The controller is inserted into `controllers`.

### Add or Edit a Strip
1. Open Settings → Attached Strips → "Add Strip".
2. Provide `name`, `length`, `type`, and choose a controller.
3. Save. The strip is stored in `controllers[controllerIndex].strips`.

Other behaviors:
- You must create a controller before adding strips.
- Strips can be moved between controllers by editing them.
- Controllers with attached strips cannot be deleted.
- Modifiers can be configured per-strip via the "Modify" action, which writes
  `modifier` and `modifierOptions` into the strip entry.
  - Modifiers are useful for re-mapping color channels, tweaking brightness, etc.
