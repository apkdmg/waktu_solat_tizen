/* Example Samsung TV app for waktu-solat-tizen. Plain ES5 so it runs on 2017+ TVs. */
(function () {
    'use strict';

    var KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13, BACK: 10009, ESCAPE: 27 };
    var VISIBLE_ROWS = 12;
    var NAMES = [
        ['Imsak', 'imsak'], ['Subuh', 'fajr'], ['Syuruk', 'syuruk'], ['Isyraq', 'isyraq'],
        ['Zohor', 'dhuhr'], ['Asar', 'asr'], ['Maghrib', 'maghrib'], ['Isyak', 'isha']
    ];

    var client = new WaktuSolat.WaktuSolatClient();
    var zones = [];
    var selected = 0;
    var activeZone = loadZone() || 'SGR01';
    var today = null;

    function $(id) { return document.getElementById(id); }

    function loadZone() {
        try { return localStorage.getItem('zone'); } catch (e) { return null; }
    }

    function saveZone(zone) {
        try { localStorage.setItem('zone', zone); } catch (e) { /* storage unavailable */ }
    }

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    // Prayer times are absolute instants; show them in Malaysia time (UTC+8, no DST).
    function formatTime(unixSeconds) {
        if (unixSeconds === null) return '–';
        var d = new Date((unixSeconds + 8 * 3600) * 1000);
        return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes());
    }

    function nowInMalaysia() {
        return new Date(Date.now() + 8 * 3600 * 1000);
    }

    function showError(message) {
        var el = $('error');
        el.textContent = message;
        el.hidden = !message;
    }

    function renderZones() {
        var list = $('zone-list');
        var first = Math.max(0, Math.min(selected - Math.floor(VISIBLE_ROWS / 2), zones.length - VISIBLE_ROWS));
        list.innerHTML = '';
        for (var i = first; i < Math.min(zones.length, first + VISIBLE_ROWS); i++) {
            var li = document.createElement('li');
            li.className = (i === selected ? 'selected ' : '') + (zones[i].jakimCode === activeZone ? 'active' : '');
            li.innerHTML = '<span class="code"></span><span class="area"></span>';
            li.firstChild.textContent = zones[i].jakimCode;
            li.lastChild.textContent = zones[i].daerah;
            list.appendChild(li);
        }
    }

    function renderTimes() {
        var list = $('times');
        list.innerHTML = '';
        if (!today) return;

        var nowSeconds = Date.now() / 1000;
        var nextKey = null;
        for (var i = 0; i < NAMES.length; i++) {
            var t = today[NAMES[i][1]];
            if (t !== null && t > nowSeconds) { nextKey = NAMES[i][1]; break; }
        }

        for (var j = 0; j < NAMES.length; j++) {
            var li = document.createElement('li');
            if (NAMES[j][1] === nextKey) li.className = 'next';
            li.innerHTML = '<span class="name"></span><span class="time"></span>';
            li.firstChild.textContent = NAMES[j][0];
            li.lastChild.textContent = formatTime(today[NAMES[j][1]]);
            list.appendChild(li);
        }
    }

    function renderClock() {
        var now = nowInMalaysia();
        $('clock').textContent = pad(now.getUTCHours()) + ':' + pad(now.getUTCMinutes());
    }

    function loadToday() {
        $('meta').textContent = activeZone + ' · Memuatkan…';
        var malaysiaToday = nowInMalaysia();
        var date = new Date(malaysiaToday.getUTCFullYear(), malaysiaToday.getUTCMonth(), malaysiaToday.getUTCDate());

        client.getPrayerTimeByDate(activeZone, date).then(function (prayerTime) {
            today = prayerTime;
            showError('');
            $('meta').textContent = activeZone + ' · ' + (prayerTime ? 'Hijri ' + prayerTime.hijri : 'Tiada data');
            renderTimes();
        }, function (e) {
            showError(e.message);
            $('meta').textContent = activeZone;
        });
    }

    function onKey(event) {
        switch (event.keyCode) {
            case KEY.UP:
                selected = Math.max(0, selected - 1);
                renderZones();
                break;
            case KEY.DOWN:
                selected = Math.min(zones.length - 1, selected + 1);
                renderZones();
                break;
            case KEY.ENTER:
                if (zones[selected]) {
                    activeZone = zones[selected].jakimCode;
                    saveZone(activeZone);
                    renderZones();
                    loadToday();
                }
                break;
            case KEY.BACK:
            case KEY.ESCAPE:
                if (window.tizen) {
                    try { tizen.application.getCurrentApplication().exit(); } catch (e) { /* not on a TV */ }
                }
                break;
            default:
                return;
        }
        event.preventDefault();
    }

    function init() {
        document.addEventListener('keydown', onKey);
        renderClock();
        setInterval(function () {
            renderClock();
            renderTimes();
        }, 15000);

        client.getZones().then(function (result) {
            zones = result;
            for (var i = 0; i < zones.length; i++) {
                if (zones[i].jakimCode === activeZone) selected = i;
            }
            renderZones();
        }, function (e) {
            showError(e.message);
        });

        loadToday();
    }

    window.onload = init;
})();
