## 1.0.0

* First release of the Samsung Tizen TV / JavaScript port of `waktu_solat_lib`.
* `WaktuSolatClient` with Promise-based methods:
  * `getStates`, `getZones`
  * `getPrayerTimesByZone`, `getPrayerTimesByGps`
  * `getPrayerTimeByDate`, `getPrayerTimeByDateGps`
* `getStates` is built from `/zones` grouped by state, because the API no longer serves `/v2/negeri`.
* Automatic Imsak (Fajr − 10 min, when missing) and Isyraq (Syuruk + 15 min) calculation.
* `WaktuSolatApiException` for API, network, timeout and parsing errors.
* Compiled to ES5 with an `XMLHttpRequest` fallback for TVs without `fetch`.
* ES module, CommonJS and drop-in `<script>` builds, with TypeScript types.
* Samsung TV example app with remote-control navigation.
