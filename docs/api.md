# Web API (REST)

These endpoints are registered by `src/connections/webAPIs.js` and are served by
the Express server created in `src/app.js`.

## Availability
- Enabled when `features.webAPIs` is `true`.
- Server listens on port `7974`.
- No authentication or rate limiting is built in.

## Endpoints

### `GET /lightsOff`
Turns every strip (all LEDs) off.

Response:
- `200 OK` with body `done`.

Example:
```bash
curl http://<host>:7974/lightsOff
```

### `GET /presets`
Returns the names of all user defined presets.

Response:
- `200 OK` with a JSON array of strings.

Example response:
```json
["Warm","Rainbow","Christmas","Disco Mode"]
```

Example:
```bash
curl http://<host>:7974/presets
```

### `GET /setPreset`
Sets that user preset.

Input:
- The preset name can be provided as:
  - a `preset` header, or
  - a `preset` query parameter.
- Name matching is exact and case-sensitive.

Responses:
- `200 OK` with body `done` when the preset exists.
- `400 Bad Request` with body `Preset not found` when there is no match.

Examples:
```bash
curl -H "preset: Rainbow" http://<host>:7974/setPreset
curl "http://<host>:7974/setPreset?preset=Rainbow"
```
