# waktu-solat-tizen

`waktu-solat-tizen` is a JavaScript/TypeScript library for **Samsung Smart TV (Tizen) web apps** to fetch Malaysia prayer times from [api.waktusolat.app](https://api.waktusolat.app/docs). It also works in any browser.

It is the TV counterpart of the Flutter [`waktu_solat_lib`](https://github.com/apkdmg/waktu_solat_lib), Swift [`WaktuSolatSwift`](https://github.com/apkdmg/waktu_solat_swift) and Android [`waktu_solat_android`](https://github.com/apkdmg/waktu_solat_android) packages.

## Features

- Fetch all states with their zone codes
- Fetch all zones with daerah/negeri (`/zones`)
- Fetch monthly prayer times by zone (`/v2/solat/{zone}`)
- Fetch monthly prayer times by GPS (`/v2/solat/gps/{lat}/{long}`)
- Convenience methods for a single date
- API/network/parsing error handling with `WaktuSolatApiException`
- Auto-calculates:
  - `imsak` = `fajr - 10 minutes` if missing
  - `isyraq` = `syuruk + 15 minutes`
- No dependencies, about 10 KB minified, TypeScript types included

## Compatibility

The library is compiled to **ES5** and uses `fetch` where available, falling back to `XMLHttpRequest`.

| Samsung TV year | Tizen | Supported |
|---|---|---|
| 2017 and later | 3.0+ | ✅ |
| 2016 | 2.4 | Should work (uses the `XMLHttpRequest` fallback); not tested |

## Installation

### npm (with a bundler: webpack, Vite, Rollup, …)

```bash
npm install waktu-solat-tizen
```

```js
import { WaktuSolatClient } from 'waktu-solat-tizen';
```

### Plain `<script>` (no build step)

Copy `node_modules/waktu-solat-tizen/dist/waktu-solat.min.js` into your app (for example as `lib/waktu-solat.min.js`) and load it before your code. It exposes a global `WaktuSolat`:

```html
<script src="lib/waktu-solat.min.js"></script>
<script>
  var client = new WaktuSolat.WaktuSolatClient();
</script>
```

Bundle the file with your app rather than loading it from a CDN, so the app still starts when the TV's connection is slow.

### Tizen `config.xml`

Your app needs the internet privilege and access to the API host:

```xml
<tizen:privilege name="http://tizen.org/privilege/internet"/>
<access origin="https://api.waktusolat.app" subdomains="true"/>
```

## Quick Start

```js
import { WaktuSolatClient, WaktuSolatApiException } from 'waktu-solat-tizen';

const client = new WaktuSolatClient();

try {
  const result = await client.getPrayerTimesByZone('SGR01');
  console.log('Zone:', result.zone, 'days returned:', result.prayerTime.length);
} catch (e) {
  if (e instanceof WaktuSolatApiException) {
    console.error('API error:', e.message);
  }
}
```

Every method returns a Promise. In plain ES5 code (for older TVs) use `.then()`:

```js
client.getPrayerTimesByZone('SGR01').then(function (result) {
  console.log(result.zone);
}, function (e) {
  console.error(e.message);
});
```

## Guide: How To Use

### 1. Get all states

```js
const states = await client.getStates();
states.forEach((state) => console.log(state.negeri, state.zones));
```

### 2. Get all zones

```js
const zones = await client.getZones();
zones.slice(0, 5).forEach((zone) => console.log(`${zone.jakimCode} - ${zone.daerah} (${zone.negeri})`));
```

### 3. Get monthly prayer times by zone

```js
const data = await client.getPrayerTimesByZone('SGR01', { year: 2026, month: 2 });

const firstDay = data.prayerTime[0];
console.log(firstDay.hijri, firstDay.fajr, firstDay.maghrib);
```

### 4. Get monthly prayer times by GPS

```js
const data = await client.getPrayerTimesByGps(3.1390, 101.6869);
console.log('Detected zone:', data.zone);
```

### 5. Get prayer time for one date

The date is read in the TV's local time.

```js
const today = new Date();

const byZone = await client.getPrayerTimeByDate('SGR01', today);
if (byZone) console.log('Today Fajr:', byZone.fajr);

const byGps = await client.getPrayerTimeByDateGps(3.1390, 101.6869, today);
if (byGps) console.log('Today Maghrib:', byGps.maghrib);
```

### 6. Convert API unix timestamps to readable time

API times are unix seconds. `toDate()` converts one to a `Date`. Older TVs have limited `Intl` support, so to always show Malaysia time, shift by UTC+8 and read the UTC fields:

```js
import { toDate } from 'waktu-solat-tizen';

function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

function formatMalaysiaTime(unixSeconds) {
  if (unixSeconds === null) return '--:--';
  var d = toDate(unixSeconds + 8 * 3600);
  return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes());
}
```

## Error Handling

All failures (HTTP errors, network errors and timeouts, unexpected JSON) reject with `WaktuSolatApiException`:

```js
try {
  await client.getPrayerTimesByZone('INVALID_ZONE');
} catch (e) {
  console.log(e.message);
  console.log(e.statusCode); // e.g. 404, or null for network errors
  console.log(e.apiError);   // parsed {"status": "error", "message": ...} body, if any
}
```

## Options

```js
const client = new WaktuSolatClient({
  timeoutMs: 15000,         // request timeout; 0 disables it (default 15000)
  fetch: myFetch,           // custom fetch implementation (default: global fetch, else XMLHttpRequest)
  baseUrl: 'https://...',   // for testing only
});
```

## Main Types

- `WaktuSolatClient`
- `WaktuState`
- `ZoneInfo`
- `PrayerTime`
- `SolatV2`
- `ApiError`
- `WaktuSolatApiException`
- `toDate()`

## Example TV App

A Samsung TV example app lives in [`example/`](example): a zone list you move through with the remote (▲ ▼ to pick, OK to show, Back to exit) and today's times with the next prayer highlighted.

```bash
npm install
npm run example   # builds the library and copies it to example/lib/
```

Then open `example/` with the **Tizen extension for VS Code** or **Tizen Studio**, and run it on the TV Web Simulator, the TV emulator, or a TV in developer mode. To try it in a desktop browser, serve the folder (for example `npx serve example`) and use the arrow keys and Enter.

## Development

```bash
npm test             # unit tests
npm run test:live    # tests against the real API
npm run build        # dist/: ES module, CommonJS, <script> build, types
npm run check:es5    # fails if a built file uses syntax older TVs can't parse
```

### Releasing

1. Update `version` in `package.json` and `CHANGELOG.md`.
2. `npm publish` (runs the type check, tests, build and ES5 check first).
3. Tag and push: `git tag 1.0.0 && git push origin 1.0.0`.

## License

MIT. See [LICENSE](LICENSE).
