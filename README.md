# waktu-solat-tizen

`waktu-solat-tizen` is a JavaScript/TypeScript library for **Samsung Smart TV (Tizen) web apps** to fetch Malaysia prayer times from [api.waktusolat.app](https://api.waktusolat.app/docs). It also works in any browser and in Node.js, with plain JavaScript or any framework: React, Next.js, Vue, Nuxt, Angular, Svelte, SolidJS, Lightning and more (see [Using with frameworks](#using-with-frameworks)).

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

## Using with frameworks

The library has no framework dependency and doesn't touch the DOM: it is one class whose methods return Promises. Importing it has no side effects, so it is also safe in server-side rendering. The examples below show today's times for a zone in each framework.

They share this small formatter. It uses `Intl`, which modern browsers and Node have. On older TVs use the ES5 version from [step 6](#6-convert-api-unix-timestamps-to-readable-time).

```js
// format.js
export const formatTime = (unixSeconds) =>
  unixSeconds === null
    ? '--:--'
    : new Date(unixSeconds * 1000).toLocaleTimeString('ms-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
```

Requests can't be cancelled, so when a component goes away before a request finishes, ignore the late result, as the React example does.

### Vanilla JavaScript

With the `<script>` build (works on every supported TV, no build step):

```html
<p id="subuh">Loading…</p>
<script src="lib/waktu-solat.min.js"></script>
<script>
  // Malaysia time (UTC+8), without Intl, so it also works on older TVs
  function formatTime(unixSeconds) {
    if (unixSeconds === null) return '--:--';
    var d = new Date((unixSeconds + 8 * 3600) * 1000);
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes());
  }

  var client = new WaktuSolat.WaktuSolatClient();
  client.getPrayerTimeByDate('SGR01', new Date()).then(function (today) {
    document.getElementById('subuh').textContent = today ? 'Subuh: ' + formatTime(today.fajr) : 'No data';
  }, function (e) {
    document.getElementById('subuh').textContent = e.message;
  });
</script>
```

As a native ES module (modern browsers, no bundler):

```html
<script type="module">
  import { WaktuSolatClient } from 'https://cdn.jsdelivr.net/npm/waktu-solat-tizen@1/dist/index.mjs';
  import { formatTime } from './format.js';

  const today = await new WaktuSolatClient().getPrayerTimeByDate('SGR01', new Date());
  document.querySelector('#subuh').textContent = today ? 'Subuh: ' + formatTime(today.fajr) : 'No data';
</script>
```

### React

Also works as is with **Preact** (import the hooks from `preact/hooks`) and **Enact**, the React-based TV framework.

```jsx
import { useEffect, useState } from 'react';
import { WaktuSolatClient } from 'waktu-solat-tizen';
import { formatTime } from './format';

const client = new WaktuSolatClient();

export function PrayerTimes({ zone = 'SGR01' }) {
  const [today, setToday] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    client.getPrayerTimeByDate(zone, new Date()).then(
      (result) => active && setToday(result),
      (e) => active && setError(e.message)
    );
    return () => {
      active = false;
    };
  }, [zone]);

  if (error) return <p>{error}</p>;
  if (!today) return <p>Loading…</p>;
  return (
    <ul>
      <li>Subuh {formatTime(today.fajr)}</li>
      <li>Zohor {formatTime(today.dhuhr)}</li>
      <li>Asar {formatTime(today.asr)}</li>
      <li>Maghrib {formatTime(today.maghrib)}</li>
      <li>Isyak {formatTime(today.isha)}</li>
    </ul>
  );
}
```

If your app uses TanStack Query, pass the method as the query function:

```js
const { data: today } = useQuery({
  queryKey: ['prayer-time', zone],
  queryFn: () => client.getPrayerTimeByDate(zone, new Date()),
});
```

### Next.js (App Router)

In a Server Component you can call the client directly; the result is rendered on the server.

```jsx
// app/page.jsx
import { WaktuSolatClient } from 'waktu-solat-tizen';
import { formatTime } from './format';

export const revalidate = 3600; // re-fetch at most once an hour

export default async function Page() {
  const today = await new WaktuSolatClient().getPrayerTimeByDate('SGR01', malaysiaToday());
  return <p>Subuh {today ? formatTime(today.fajr) : '--:--'}</p>;
}

// The server's clock is often UTC. Build "today" in Malaysia time (UTC+8)
// so the date is right between midnight and 8 a.m.
function malaysiaToday() {
  const now = new Date(Date.now() + 8 * 3600 * 1000);
  return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}
```

In a Client Component (`'use client'`), use the React example above.

### Vue 3

```vue
<script setup>
import { ref, watchEffect } from 'vue';
import { WaktuSolatClient } from 'waktu-solat-tizen';
import { formatTime } from './format';

const props = defineProps({ zone: { type: String, default: 'SGR01' } });
const client = new WaktuSolatClient();
const today = ref(null);
const error = ref(null);

watchEffect(async (onCleanup) => {
  let active = true;
  onCleanup(() => (active = false));
  try {
    const result = await client.getPrayerTimeByDate(props.zone, new Date());
    if (active) today.value = result;
  } catch (e) {
    if (active) error.value = e.message;
  }
});
</script>

<template>
  <p v-if="error">{{ error }}</p>
  <p v-else-if="!today">Loading…</p>
  <p v-else>Subuh {{ formatTime(today.fajr) }} · Maghrib {{ formatTime(today.maghrib) }}</p>
</template>
```

### Nuxt 3

```vue
<script setup>
import { WaktuSolatClient } from 'waktu-solat-tizen';
import { formatTime } from '~/utils/format';

const { data: today, error } = await useAsyncData('prayer-time-sgr01', () =>
  new WaktuSolatClient().getPrayerTimeByDate('SGR01', new Date())
);
</script>

<template>
  <p v-if="error">{{ error.message }}</p>
  <p v-else-if="today">Subuh {{ formatTime(today.fajr) }}</p>
</template>
```

`useAsyncData` runs on the server first, so the same Malaysia-time note as for Next.js applies.

### Angular

A service wraps the client, and the component reads it as a signal (Angular 17+). If you prefer RxJS, wrap the call with `from(...)` instead.

```ts
// prayer-times.service.ts
import { Injectable } from '@angular/core';
import { WaktuSolatClient, PrayerTime } from 'waktu-solat-tizen';

@Injectable({ providedIn: 'root' })
export class PrayerTimesService {
  private readonly client = new WaktuSolatClient();

  today(zone: string): Promise<PrayerTime | null> {
    return this.client.getPrayerTimeByDate(zone, new Date());
  }
}
```

```ts
// prayer-times.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { PrayerTime } from 'waktu-solat-tizen';
import { PrayerTimesService } from './prayer-times.service';
import { formatTime } from './format';

@Component({
  selector: 'app-prayer-times',
  standalone: true,
  template: `
    @if (error()) {
      <p>{{ error() }}</p>
    } @else if (today(); as t) {
      <p>Subuh {{ format(t.fajr) }} · Maghrib {{ format(t.maghrib) }}</p>
    } @else {
      <p>Loading…</p>
    }
  `,
})
export class PrayerTimesComponent implements OnInit {
  private readonly prayerTimes = inject(PrayerTimesService);
  readonly today = signal<PrayerTime | null>(null);
  readonly error = signal<string | null>(null);
  readonly format = formatTime;

  async ngOnInit() {
    try {
      this.today.set(await this.prayerTimes.today('SGR01'));
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
}
```

### Svelte 5 / SvelteKit

```svelte
<script>
  import { WaktuSolatClient } from 'waktu-solat-tizen';
  import { formatTime } from './format';

  let { zone = 'SGR01' } = $props();
  const client = new WaktuSolatClient();
  const today = $derived(client.getPrayerTimeByDate(zone, new Date()));
</script>

{#await today}
  <p>Loading…</p>
{:then t}
  <p>Subuh {t ? formatTime(t.fajr) : '--:--'}</p>
{:catch e}
  <p>{e.message}</p>
{/await}
```

In SvelteKit you can also fetch in a `+page.js` `load` function and return the result.

### SolidJS

```jsx
import { createResource, Show } from 'solid-js';
import { WaktuSolatClient } from 'waktu-solat-tizen';
import { formatTime } from './format';

const client = new WaktuSolatClient();

export function PrayerTimes(props) {
  const [today] = createResource(() => props.zone ?? 'SGR01', (zone) =>
    client.getPrayerTimeByDate(zone, new Date())
  );

  return (
    <Show when={today()} fallback={<p>{today.error ? today.error.message : 'Loading…'}</p>}>
      {(t) => <p>Subuh {formatTime(t().fajr)}</p>}
    </Show>
  );
}
```

### Lightning (LightningJS 2)

```js
import { Lightning } from '@lightningjs/sdk';
import { WaktuSolatClient } from 'waktu-solat-tizen';
import { formatTime } from './format';

const client = new WaktuSolatClient();

export default class PrayerTimes extends Lightning.Component {
  static _template() {
    return { Label: { text: { text: 'Loading…', fontSize: 48 } } };
  }

  _init() {
    client.getPrayerTimeByDate('SGR01', new Date()).then(
      (today) => this.tag('Label').patch({ text: { text: 'Subuh ' + (today ? formatTime(today.fajr) : '--:--') } }),
      (e) => this.tag('Label').patch({ text: { text: e.message } })
    );
  }
}
```

### Node.js (18+)

```js
// ES modules (.mjs, or "type": "module")
import { WaktuSolatClient } from 'waktu-solat-tizen';

const states = await new WaktuSolatClient().getStates();
console.log(states.map((state) => state.negeri));
```

```js
// CommonJS
const { WaktuSolatClient } = require('waktu-solat-tizen');

new WaktuSolatClient().getStates().then((states) => {
  console.log(states.map((state) => state.negeri));
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

## Credits

This library uses the [Malaysia Prayer Time API](https://api.waktusolat.app/docs) created by [Muhammad Fareez Iqmal](https://iqfareez.com/about), a Software Engineer specializing in Flutter, Laravel, and .NET technologies. The API provides accurate prayer times data for all locations in Malaysia.

The data is collected from [e-solat JAKIM](https://www.e-solat.gov.my/) and stored in a database to maintain stability and availability. For more technical information, visit the API repository at [https://github.com/mptwaktusolat/api-waktusolat](https://github.com/mptwaktusolat/api-waktusolat).

## License

MIT. See [LICENSE](LICENSE).
