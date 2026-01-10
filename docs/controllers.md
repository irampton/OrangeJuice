# Controllers

Controllers define how OrangeJuice talks to LED hardware (or a mock target).
They are configured in `config.json` under the `controllers` array and are
instantiated in `src/app.js`.

Each controller owns a contiguous pixel array whose length is the sum of
`length` for all of its attached strips. The controller index in the array
matters, because strip indices are flattened in controller order.

## Controller Types

### GPIO (`src/controllers/led-pin-controller.js`)
Drives WS281x LEDs directly from Raspberry Pi GPIO via
`@simontaga/rpi-ws281x-native`.

Required fields:
- `type`: `"GPIO"`
- `pin`: GPIO pin number (see restrictions below)

Restrictions (enforced in `src/controllers/led-pin-controller.js` and
`src/app.js`):
- Only **one or two** GPIO controllers can be used at a time.
- If **one** GPIO controller is configured, its `pin` must be one of:
  - `12, 18, 40, 52, 21, 31, 10, 38`
- If **two** GPIO controllers are configured:
  - They **must be adjacent** in the `controllers` array.
  - The **first** controller must use a primary pin:
    - `12, 18, 40, 52`
  - The **second** controller must use a secondary pin:
    - `13, 19, 41, 45, 53`
- The web UI (`Settings.vue`) will reorder GPIO controllers to keep them
  adjacent, but manual edits to `config.json` must follow the same rules.

### WebSocket / ESP32 (`src/controllers/led-esp32-controller.js`)
Sends RGB data to an ESP32 (or other target) over WebSocket.

Required fields:
- `type`: `"WebSocket"`
- `url`: host or IP **without** protocol and **without** a port

Connection details:
- Connects to `ws://<url>:81`.
- Sends a JSON array of `[r, g, b]` values (one entry per pixel).
- Reconnects on update if the socket is not open.

### Mock (`src/controllers/led-mock-controller.js`)
No-op controller for development.

Required fields:
- `type`: `"Mock"`

Behavior:
- Provides `updateLEDs()` but does nothing.
- Useful for testing UI or scripts without hardware attached.
