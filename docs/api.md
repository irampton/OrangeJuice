# Web API (REST)

These endpoints are registered by `src/connections/webAPIs.js` and are served by
the Express server created in `src/app.js`.

## Availability
- Enabled when `features.webAPIs` is `true`.
- Server listens on port `7974`.
- Base path for all endpoints is `/api/v1`.
- No authentication or rate limiting is built in.

## Endpoints

### `GET /api/v1/lightsOff`
Turns every strip (all LEDs) off.

Response:
- `200 OK` with body `done`.

Example:
```bash
curl http://<host>:7974/api/v1/lightsOff
```

### `GET /api/v1/presets`
Returns the names of all user defined presets.

Response:
- `200 OK` with a JSON array of strings.

Example response:
```json
["Warm","Rainbow","Christmas","Disco Mode"]
```

Example:
```bash
curl http://<host>:7974/api/v1/presets
```

### `GET /api/v1/scenes`
Returns the names of all scenes.

Response:
- `200 OK` with a JSON array of strings.

Example response:
```json
["Morning","Party"]
```

Example:
```bash
curl http://<host>:7974/api/v1/scenes
```

### `GET /api/v1/strips`
Returns the list of selectable strip target names.

Notes:
- Controller strips are listed first in controller order, then strip order.
- Script groups are appended after controller strips.

Response:
- `200 OK` with a JSON array of strings.

Example response:
```json
["Wall Lights","Box 1","Box 2"]
```

Example:
```bash
curl http://<host>:7974/api/v1/strips
```

### `GET /api/v1/setScene`
Applies a scene by index.

Input:
- The scene index can be provided as:
  - an `index` header or query parameter, or
  - a `scene` header or query parameter.

Responses:
- `200 OK` with body `done` when the scene exists.
- `400 Bad Request` with body `Scene index required` when no index is supplied.
- `400 Bad Request` with body `Scene not found` when the index is out of range.

Examples:
```bash
curl -H "index: 0" http://<host>:7974/api/v1/setScene
curl "http://<host>:7974/api/v1/setScene?scene=1"
```

### `GET /api/v1/setPreset`
Applies a preset to one or more strips.

Input:
- The preset index can be provided as:
  - a `preset` header or query parameter, or
  - an `index` header or query parameter.
- The strip list can be provided as:
  - a `strips` header or query parameter, or
  - a `strip` header or query parameter.
- Strip input is a list of indexes into the `/api/v1/strips` response.
  - Accepts a JSON array (string or native), or
  - a delimiter list using commas, spaces, pipes, or semicolons.

Responses:
- `200 OK` with body `done` when the preset exists.
- `400 Bad Request` with body `Preset index required` when no preset index is supplied.
- `400 Bad Request` with body `Strip index list required` when no strips are supplied.
- `400 Bad Request` with body `Preset not found` when the index is out of range.

Examples:
```bash
curl -H "preset: 0" -H "strips: 0,1,3" http://<host>:7974/api/v1/setPreset
curl "http://<host>:7974/api/v1/setPreset?preset=2&strips=[0,2]"
```
