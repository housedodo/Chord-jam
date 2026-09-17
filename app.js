// Sound Telephone — piano-roll music telephone game
(function () {
  'use strict';

  // ── Config ──
  const BASE_INSTRUMENTS = ['drums', 'chords', 'bass', 'melody'];
  let INSTRUMENTS = BASE_INSTRUMENTS.slice();
  const STEPS = 32;
  const BUILD_TIME = 120;
  const ROUND_MIN = 120;
  const ROUND_MAX = 300;
  const SPEED_TIME = 60;
  const SFX_NAMES = ['Siren', 'Laser', 'Boom', 'Sweep', 'Zap', 'Whoosh', 'Glitch', 'Drop'];
  const DRUM_NAMES = ['Kick', 'Snare', 'HiHat', 'OpenHH', 'Clap', 'Tom', 'Rim', 'Crash', 'Cowbell', 'Shaker', 'Conga'];
  const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  function buildRange(startNote, startOct, endNote, endOct) {
    var out = [];
    var i = CHROMATIC.indexOf(startNote);
    var oct = startOct;
    for (;;) {
      out.push(CHROMATIC[i] + oct);
      if (CHROMATIC[i] === endNote && oct === endOct) break;
      i++;
      if (i >= CHROMATIC.length) { i = 0; oct++; }
    }
    return out;
  }
  const NOTE_NAMES_BASS = buildRange('C', 2, 'G', 3);
  const NOTE_NAMES_MELODY = buildRange('C', 4, 'C', 6);
  const NOTE_NAMES_CHORDS = buildRange('C', 3, 'C', 5);
  function isSharp(noteName) { return noteName.indexOf('#') !== -1; }
  const CHORD_ROOTS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const CHORD_QUALITIES = [
    { label: 'Major', suffix: '', intervals: [0, 4, 7] },
    { label: 'Minor', suffix: 'm', intervals: [0, 3, 7] },
    { label: '7th', suffix: '7', intervals: [0, 4, 7, 10] },
    { label: 'Major 7th', suffix: 'maj7', intervals: [0, 4, 7, 11] },
    { label: 'Minor 7th', suffix: 'm7', intervals: [0, 3, 7, 10] },
    { label: 'Sus4', suffix: 'sus4', intervals: [0, 5, 7] },
    { label: 'Sus2', suffix: 'sus2', intervals: [0, 2, 7] },
    { label: 'Dim', suffix: 'dim', intervals: [0, 3, 6] },
    { label: 'Aug', suffix: 'aug', intervals: [0, 4, 8] },
    { label: '6th', suffix: '6', intervals: [0, 4, 7, 9] },
    { label: 'Minor 6th', suffix: 'm6', intervals: [0, 3, 7, 9] },
    { label: '9th', suffix: '9', intervals: [0, 4, 7, 10, 14] },
    { label: 'Add9', suffix: 'add9', intervals: [0, 4, 7, 14] },
    { label: 'Dim7', suffix: 'dim7', intervals: [0, 3, 6, 9] },
    { label: 'Power', suffix: '5', intervals: [0, 7] }
  ];
  const ALL_NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  function getChordNotes(root, quality) {
    var baseOctave = (root === 'A' || root === 'A#' || root === 'B') ? 3 : 4;
    var rootIdx = ALL_NOTES.indexOf(root);
    return quality.intervals.map(function (interval) {
      var noteIdx = (rootIdx + interval) % 12;
      var octave = baseOctave + Math.floor((rootIdx + interval) / 12);
      return ALL_NOTES[noteIdx] + octave;
    });
  }
  function noteToMidi(name) {
    var m = /^([A-G]#?)(-?\d+)$/.exec(name);
    if (!m) return null;
    return (parseInt(m[2], 10) + 1) * 12 + ALL_NOTES.indexOf(m[1]);
  }
  function midiToNote(midi) {
    return ALL_NOTES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
  }
  // Voices a chord upward from wherever it was placed, rather than from a
  // fixed octave, so the row you click is the root you get.
  function chordFromPitch(noteName, quality, ceilingMidi) {
    var root = noteToMidi(noteName);
    if (root === null) return [noteName];
    var out = [];
    quality.intervals.forEach(function (i) {
      var m = root + i;
      if (ceilingMidi != null && m > ceilingMidi) m -= 12;
      var n = midiToNote(m);
      if (out.indexOf(n) < 0) out.push(n);
    });
    return out;
  }
  const PLAYER_COLORS = ['#a78bfa', '#e8a0bf', '#7eb8d4', '#e8b07d', '#8cc5a2', '#c9a0d4'];
  const BASS_SOUNDS = {
    'Sub Bass': { harmonicity: 0.5, modulationIndex: 1, envelope: { attack: 0.01, decay: 0.4, sustain: 0.6, release: 0.3 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.05, decay: 0.1, sustain: 0.5, release: 0.2 }, volume: -6.5 },
    'Analog Bass': { harmonicity: 1, modulationIndex: 2, envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.3 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.05, decay: 0.1, sustain: 0.5, release: 0.2 }, volume: -5.4 },
    'Pluck Bass': { harmonicity: 2, modulationIndex: 4, envelope: { attack: 0.005, decay: 0.15, sustain: 0.1, release: 0.2 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.01, decay: 0.05, sustain: 0.2, release: 0.1 }, volume: 2.6 },
    'Round Bass': { harmonicity: 1.5, modulationIndex: 0.5, envelope: { attack: 0.02, decay: 0.5, sustain: 0.5, release: 0.4 }, modulation: { type: 'triangle' }, modulationEnvelope: { attack: 0.1, decay: 0.2, sustain: 0.4, release: 0.3 }, volume: -6.8 },
    'Wobble Bass': { harmonicity: 3, modulationIndex: 8, envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 }, modulation: { type: 'sawtooth' }, modulationEnvelope: { attack: 0.02, decay: 0.4, sustain: 0.3, release: 0.2 }, volume: -5.9 },
    'Acid Bass': { harmonicity: 1, modulationIndex: 6, envelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.15 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.1 }, volume: -2.1 },
    'Reese Bass': { harmonicity: 1.005, modulationIndex: 0.8, envelope: { attack: 0.01, decay: 0.6, sustain: 0.7, release: 0.5 }, modulation: { type: 'sawtooth' }, modulationEnvelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.4 }, volume: -7.8 },
    'Rubber Bass': { harmonicity: 4, modulationIndex: 3, envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.1 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.01, decay: 0.08, sustain: 0.1, release: 0.05 }, volume: 6.0 }
  };
  const MELODY_SOUNDS = {
    'Piano': { harmonicity: 3, modulationIndex: 0.8, envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.5 }, modulation: { type: 'triangle' }, modulationEnvelope: { attack: 0.05, decay: 0.15, sustain: 0.3, release: 0.3 }, volume: -5.4 },
    'Synth Lead': { harmonicity: 2, modulationIndex: 3, envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.4 }, modulation: { type: 'sawtooth' }, modulationEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.2 }, volume: -9.0 },
    'Flute': { harmonicity: 1, modulationIndex: 0.3, envelope: { attack: 0.08, decay: 0.1, sustain: 0.7, release: 0.6 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.4 }, volume: -9.2 },
    'Bell': { harmonicity: 5.07, modulationIndex: 2, envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 0.5 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.3 }, volume: -7.3 },
    'Organ': { harmonicity: 2, modulationIndex: 1, envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.1 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.01, decay: 0.05, sustain: 0.8, release: 0.1 }, volume: -8.6 },
    'Strings': { harmonicity: 1, modulationIndex: 0.2, envelope: { attack: 0.15, decay: 0.3, sustain: 0.8, release: 0.8 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.2, decay: 0.3, sustain: 0.6, release: 0.5 }, volume: -9.8 },
    'Pad': { harmonicity: 1.5, modulationIndex: 0.5, envelope: { attack: 0.3, decay: 0.5, sustain: 0.8, release: 1.2 }, modulation: { type: 'triangle' }, modulationEnvelope: { attack: 0.3, decay: 0.4, sustain: 0.5, release: 0.8 }, volume: -4.1 },
    'Marimba': { harmonicity: 4, modulationIndex: 1.5, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }, volume: -3.2 },
    'Pluck': { harmonicity: 3, modulationIndex: 2, envelope: { attack: 0.001, decay: 0.2, sustain: 0.05, release: 0.3 }, modulation: { type: 'triangle' }, modulationEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 }, volume: 2.4 },
    'Brass': { harmonicity: 1, modulationIndex: 4, envelope: { attack: 0.06, decay: 0.2, sustain: 0.7, release: 0.3 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.08, decay: 0.1, sustain: 0.6, release: 0.2 }, volume: -9.8 },
    'Whistle': { harmonicity: 1, modulationIndex: 0.1, envelope: { attack: 0.05, decay: 0.05, sustain: 0.9, release: 0.3 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.05, decay: 0.05, sustain: 0.8, release: 0.2 }, volume: -8.3 },
    'Retro': { harmonicity: 2, modulationIndex: 5, envelope: { attack: 0.005, decay: 0.15, sustain: 0.4, release: 0.2 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.01, decay: 0.08, sustain: 0.3, release: 0.1 }, volume: -5.2 }
  };
  const CHORD_SOUNDS = {
    'Piano Chords': { harmonicity: 3, modulationIndex: 0.8, envelope: { attack: 0.02, decay: 0.4, sustain: 0.5, release: 0.8 }, modulation: { type: 'triangle' }, modulationEnvelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.4 }, volume: -9.4 },
    'Warm Pad': { harmonicity: 1.5, modulationIndex: 0.3, envelope: { attack: 0.25, decay: 0.6, sustain: 0.8, release: 1.5 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.3, decay: 0.4, sustain: 0.5, release: 0.8 }, volume: -5.8 },
    'Bright Keys': { harmonicity: 2, modulationIndex: 2, envelope: { attack: 0.01, decay: 0.25, sustain: 0.3, release: 0.5 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.2 }, volume: -8.1 },
    'Electric Piano': { harmonicity: 3.5, modulationIndex: 1.2, envelope: { attack: 0.005, decay: 0.5, sustain: 0.2, release: 0.6 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.3 }, volume: -8.2 },
    'Organ Chords': { harmonicity: 2, modulationIndex: 1, envelope: { attack: 0.01, decay: 0.1, sustain: 0.85, release: 0.15 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.01, decay: 0.05, sustain: 0.8, release: 0.1 }, volume: -9.2 },
    'Synth Stab': { harmonicity: 1, modulationIndex: 4, envelope: { attack: 0.005, decay: 0.15, sustain: 0.1, release: 0.2 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.01, decay: 0.08, sustain: 0.2, release: 0.1 }, volume: -3.0 },
    'Glass': { harmonicity: 5, modulationIndex: 1.5, envelope: { attack: 0.001, decay: 0.6, sustain: 0.1, release: 0.8 }, modulation: { type: 'triangle' }, modulationEnvelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.5 }, volume: -8.2 },
    'Lo-Fi': { harmonicity: 1, modulationIndex: 0.5, envelope: { attack: 0.03, decay: 0.3, sustain: 0.4, release: 0.6 }, modulation: { type: 'triangle' }, modulationEnvelope: { attack: 0.05, decay: 0.15, sustain: 0.3, release: 0.3 }, volume: -8 }
  };

  // One skin for now. `skin` drives shape/texture rules in CSS; colour
  // variables alone were never enough to change the app's character. The
  // Notebook and Riso skins live in archive/skins/ — the picker below still
  // renders a dot per scheme, so adding one back needs no other change.
  const DEFAULT_SCHEME = 'phosphor';
  const COLOR_SCHEMES = {
    phosphor: { label: 'Phosphor', color: '#6cf08a', skin: 'phosphor',
      bg:'#061009', surface:'#0a1a10', surface2:'#0d2216', surface3:'#12301f', border:'#1f5c39',
      text:'#6cf08a', textMuted:'#4fbf7a', textDim:'#2c7a4e',
      accent:'#6cf08a', accentSoft:'#3ec96a',
      grid:'#0a1a10', gridBeat:'#102a18', gridAlt:'#081409', gridAltBeat:'#0e2415', gridBorder:'#1f5c39',
      pianoRollBg:'#061009', note:'#ffcf5c', noteBorder:'#061009' }
  };
  // Grid metrics. Phones get a denser roll so more than five steps fit on
  // screen at once; updateGridMetrics() is called whenever a grid is built,
  // so a roll is always drawn and hit-tested with the same numbers.
  let CELL_W = 34;
  let LABEL_W = 54;
  let CELL_H = 32;

  function isPhoneLayout() { return window.innerWidth <= 600; }

  function updateGridMetrics() {
    var phone = isPhoneLayout();
    CELL_W = phone ? 26 : 34;
    LABEL_W = phone ? 40 : 54;
    CELL_H = phone ? 28 : 32;
  }

  // ── State ──
  let players = [];
  let soloMode = false;
  let gameBpm = 120;
  let games = []; // [{ songName, enteredBy, submissions:{}, guesses:[] }]
  let currentRound = 0;
  let currentTurnPlayer = 0;
  let songEntryIdx = 0;
  let soloInstIdx = 0;
  let currentGameIdx = -1;
  let buildTimer = null;
  let buildSecondsLeft = BUILD_TIME;
  let previewPlaying = false;
  let previewSeqs = [];
  let previewSource = null; // 'current' | 'previous' — which control started it
  let currentBassSound = 'Analog Bass';
  let currentMelodySound = 'Piano';
  let currentChordSound = 'Piano Chords';
  let pianoRollNotes = [];

  // ── Game settings ──
  let gameSettings = {
    sfx: false,
    blind: false,
    speed: false,
    roundSeconds: BUILD_TIME,
    switcheroo: false,
    voting: false,
    buildup: false,
    remix: false,
    vocal: false
  };
  let votes = {};
  let switcherooMap = null;

  function getActiveInstruments() {
    var insts = BASE_INSTRUMENTS.slice();
    if (gameSettings.sfx) insts.push('sfx');
    if (gameSettings.vocal) insts.push('vocal');
    return insts;
  }

  function readGameOptions(prefix) {
    var p = prefix || '';
    gameSettings.sfx = !!(document.getElementById(p + 'opt-sfx') && document.getElementById(p + 'opt-sfx').checked);
    gameSettings.blind = !!(document.getElementById(p + 'opt-blind') && document.getElementById(p + 'opt-blind').checked);
    gameSettings.speed = !!(document.getElementById(p + 'opt-speed') && document.getElementById(p + 'opt-speed').checked);
    gameSettings.switcheroo = !!(document.getElementById(p + 'opt-switcheroo') && document.getElementById(p + 'opt-switcheroo').checked);
    gameSettings.voting = !soloMode;
    var rs = document.getElementById(p + 'round-len');
    if (rs) gameSettings.roundSeconds = Math.max(ROUND_MIN, Math.min(ROUND_MAX, +rs.value || BUILD_TIME));
    gameSettings.buildup = !!(document.getElementById(p + 'opt-buildup') && document.getElementById(p + 'opt-buildup').checked);
    gameSettings.remix = !!(document.getElementById(p + 'opt-remix') && document.getElementById(p + 'opt-remix').checked);
    gameSettings.vocal = !!(document.getElementById(p + 'opt-vocal') && document.getElementById(p + 'opt-vocal').checked);
    INSTRUMENTS = getActiveInstruments();
  }

  function getBuildTime() {
    if (gameSettings.speed) return SPEED_TIME;
    return Math.max(ROUND_MIN, Math.min(ROUND_MAX, gameSettings.roundSeconds || BUILD_TIME));
  }

  // The settings a guest needs so its timers and layer list match the host's.
  function sharedSettings() {
    return {
      sfx: gameSettings.sfx, vocal: gameSettings.vocal, blind: gameSettings.blind,
      speed: gameSettings.speed, switcheroo: gameSettings.switcheroo,
      voting: gameSettings.voting, buildup: gameSettings.buildup,
      remix: gameSettings.remix, roundSeconds: gameSettings.roundSeconds
    };
  }

  function applySharedSettings(cfg) {
    if (!cfg) return;
    Object.keys(cfg).forEach(function (k) { gameSettings[k] = cfg[k]; });
    gameSettings.roundSeconds = Math.max(ROUND_MIN, Math.min(ROUND_MAX, +cfg.roundSeconds || BUILD_TIME));
    INSTRUMENTS = getActiveInstruments();
  }

  function buildSwitcherooMap(numPlayers, numRounds) {
    switcherooMap = {};
    for (var r = 0; r < numRounds; r++) {
      switcherooMap[r] = {};
      var shuffled = [];
      for (var p = 0; p < numPlayers; p++) shuffled.push(p);
      for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
      }
      for (var p2 = 0; p2 < numPlayers; p2++) {
        switcherooMap[r][p2] = shuffled[p2];
      }
    }
  }

  function getGameIdxWithSwitcheroo(playerIdx, round) {
    if (!gameSettings.switcheroo || !switcherooMap || !switcherooMap[round]) return playerIdx;
    return switcherooMap[round][playerIdx] !== undefined ? switcherooMap[round][playerIdx] : playerIdx;
  }

  // ── Network state ──
  let netMode = 'local'; // 'local' | 'host' | 'guest'
  let peer = null;
  let hostConn = null; // guest's connection to host
  let guestConns = []; // host's connections to guests
  let myPlayerIndex = -1;
  let roomCode = '';
  let gameInProgress = false;
  let joinTimer = null;
  const JOIN_TIMEOUT_MS = 15000;
  const MAX_NAME = 24;
  const MAX_TEXT = 120;
  const MAX_VOCAL_BYTES = 4 * 1024 * 1024;

  // University and office networks often block the UDP that direct WebRTC
  // needs. The TURN entries relay over TCP/TLS on 443, which is about the one
  // thing every network allows. Open Relay is a free public TURN service.
  const PEER_OPTIONS = {
    debug: 1,
    serialization: 'json',
    config: {
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
        { urls: 'stun:stun.relay.metered.ca:80' },
        { urls: 'turn:global.relay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:global.relay.metered.ca:80?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:global.relay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
      ]
    }
  };

  function cleanText(v, max) {
    return typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, '').trim().slice(0, max) : '';
  }

  function leaveToHome(message) {
    if (message) toast(message);
    clearTimeout(joinTimer);
    destroyPeer();
    netMode = 'local';
    gameInProgress = false;
    showScreen('home');
  }

  function netSend(conn, msg) {
    try {
      if (!conn || !conn.open) { console.warn('netSend: connection not open', msg.type); return; }
      conn.send(msg);
    } catch (e) { console.warn('net send error', e); }
  }
  function netBroadcast(msg) {
    console.log('Broadcasting', msg.type, 'to', guestConns.length, 'guests');
    guestConns.forEach(function (c) { netSend(c, msg); });
  }
  function netBroadcastExcept(excludeConn, msg) {
    guestConns.forEach(function (c) { if (c !== excludeConn) netSend(c, msg); });
  }

  function destroyPeer() {
    gameInProgress = false;
    clearTimeout(joinTimer);
    if (peer) { try { peer.destroy(); } catch (e) {} peer = null; }
    hostConn = null;
    guestConns = [];
  }

  // The broker socket can drop (sleep, network change) without the data
  // channels dropping. Reconnecting keeps the room reachable for late joiners.
  function watchBroker(p) {
    p.on('disconnected', function () {
      if (peer !== p || p.destroyed) return;
      try { p.reconnect(); } catch (e) {}
    });
  }

  function createHost(code, myName) {
    roomCode = code;
    netMode = 'host';
    myPlayerIndex = 0;
    players = [{ name: myName, color: PLAYER_COLORS[0] }];

    gameInProgress = false;
    peer = new Peer('st-' + code, PEER_OPTIONS);
    watchBroker(peer);
    peer.on('open', function (id) {
      console.log('Host peer open:', id);
      showOnlineLobby();
    });
    peer.on('error', function (err) {
      console.error('Host peer error:', err);
      if (err.type === 'unavailable-id') {
        toast('Room code taken, try again');
        destroyPeer();
        showScreen('home');
      } else if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
        toast('Lost the connection server \u2014 trying to reconnect');
      } else {
        toast('Connection error: ' + err.type);
      }
    });
    peer.on('connection', function (conn) {
      console.log('Host got connection from:', conn.peer);
      conn.on('open', function () {
        console.log('Host connection open:', conn.peer);
        conn.on('data', function (data) {
          if (!data || typeof data !== 'object') return;
          handleHostMessage(conn, data);
        });
        conn.on('close', function () { handleGuestDisconnect(conn); });
        conn.on('error', function () { handleGuestDisconnect(conn); });
      });
    });
  }

  function joinRoom(code, myName) {
    roomCode = code;
    netMode = 'guest';
    toast('Connecting...');

    // Signalling can succeed while the data channel never opens (blocked
    // network). Without a deadline the guest would sit on "Connecting" forever.
    clearTimeout(joinTimer);
    joinTimer = setTimeout(function () {
      var reached = !!(peer && peer.open);
      leaveToHome(reached
        ? 'Could not reach the host \u2014 a firewall may be blocking the connection. Try a different network or a phone hotspot.'
        : 'Could not reach the connection server \u2014 check your internet and try again.');
    }, JOIN_TIMEOUT_MS);

    peer = new Peer(undefined, PEER_OPTIONS);
    watchBroker(peer);
    peer.on('open', function (id) {
      console.log('Guest peer open:', id);
      hostConn = peer.connect('st-' + code, { reliable: true, serialization: 'json' });
      hostConn.on('open', function () {
        console.log('Guest connected to host');
        clearTimeout(joinTimer);
        netSend(hostConn, { type: 'join', name: myName });
      });
      hostConn.on('data', function (data) {
        if (!data || typeof data !== 'object') return;
        handleGuestReceive(data);
      });
      hostConn.on('close', function () { leaveToHome('Disconnected from host'); });
      hostConn.on('error', function (err) {
        console.error('Guest conn error:', err);
        leaveToHome('Connection to the host failed');
      });
      hostConn.on('iceStateChanged', function (state) {
        if (state === 'failed') leaveToHome('Could not reach the host \u2014 a firewall may be blocking the connection. Try a different network or a phone hotspot.');
      });
    });
    peer.on('error', function (err) {
      console.error('Guest peer error:', err);
      if (err.type === 'peer-unavailable') leaveToHome('Room not found \u2014 check the code');
      else if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') leaveToHome('Could not reach the connection server \u2014 check your internet and try again');
      else leaveToHome('Could not join: ' + err.type);
    });
  }

  // ── Host message handling ──
  function findConnPlayerIndex(conn) {
    for (var i = 0; i < guestConns.length; i++) {
      if (guestConns[i] === conn) return i + 1;
    }
    return -1;
  }

  function handleGuestDisconnect(conn) {
    var idx = findConnPlayerIndex(conn);
    if (idx > 0 && idx < players.length) {
      var name = players[idx].name;
      if (gameInProgress) {
        // Submissions and song ownership are keyed by index, so the slot
        // stays; the round timer will end the round without their layer.
        players[idx].left = true;
        guestConns[idx - 1] = null;
        netBroadcast({ type: 'players', players: players });
        toast(name + ' left the game');
        return;
      }
      players.splice(idx, 1);
      guestConns.splice(idx - 1, 1);
      netBroadcast({ type: 'players', players: players });
      toast(name + ' disconnected');
      if (document.getElementById('screen-lobby').classList.contains('active')) {
        renderOnlinePlayerList();
        updateStartBtn();
      }
    }
  }

  function handleHostMessage(conn, msg) {
    switch (msg.type) {
      case 'join':
        var joinName = cleanText(msg.name, MAX_NAME);
        if (!joinName) { netSend(conn, { type: 'error', text: 'Enter a name' }); return; }
        if (gameInProgress) { netSend(conn, { type: 'error', text: 'Game already started' }); return; }
        if (findConnPlayerIndex(conn) > 0) return;
        if (players.length >= 6) { netSend(conn, { type: 'error', text: 'Room is full' }); return; }
        if (players.some(function (p) { return p.name === joinName; })) { netSend(conn, { type: 'error', text: 'Name taken' }); return; }
        guestConns.push(conn);
        players.push({ name: joinName, color: PLAYER_COLORS[players.length % PLAYER_COLORS.length] });
        var pIdx = players.length - 1;
        netSend(conn, { type: 'joined', playerIndex: pIdx, players: players, roomCode: roomCode });
        netBroadcastExcept(conn, { type: 'players', players: players });
        toast(joinName + ' joined');
        if (document.getElementById('screen-lobby').classList.contains('active')) {
          renderOnlinePlayerList();
          updateStartBtn();
        }
        break;

      case 'song_entered':
        var songFrom = findConnPlayerIndex(conn);
        var songName = cleanText(msg.songName, MAX_TEXT);
        if (songFrom !== songEntryIdx || !songName) return;
        games.push({ songName: songName, enteredBy: songFrom, submissions: {}, guesses: [] });
        songEntryIdx++;
        if (songEntryIdx < players.length) {
          netBroadcast({ type: 'enter_song', playerIndex: songEntryIdx });
        } else {
          startGameRoundsOnline();
        }
        break;

      case 'song_vote':
        var voter = findConnPlayerIndex(conn);
        var gi = msg.gameIdx;
        if (voter < 0 || typeof gi !== 'number' || !games[gi]) return;
        if (votedPlayers[voter]) return;         // one vote each
        votedPlayers[voter] = true;
        songVotes[gi] = (songVotes[gi] || 0) + 1;
        votersSeen++;
        netBroadcast({ type: 'song_votes', votes: songVotes, voters: votersSeen });
        renderSongVotes();
        break;

      case 'layer_submitted':
        var from = findConnPlayerIndex(conn);
        if (from < 0 || !gameInProgress) return;
        var gIdx = getGameIdx(from, currentRound);
        var game = games[gIdx];
        var inst = INSTRUMENTS[currentRound];
        if (!game || !inst || game.submissions[inst]) return;
        var data = msg.data;
        if (!data || typeof data !== 'object') return;
        if (inst === 'vocal' && typeof data.dataUrl === 'string' &&
            (data.dataUrl.length > MAX_VOCAL_BYTES || data.dataUrl.indexOf('data:audio/') !== 0)) return;
        game.submissions[inst] = { data: data, bpm: gameBpm, playerIndex: from };
        var soundOk = typeof msg.sound === 'string' && soundNamesFor(inst).indexOf(msg.sound) !== -1;
        if (soundOk) game.submissions[inst].sound = msg.sound;
        if (msg.patch && typeof msg.patch === 'object') game.submissions[inst].patch = normalisePatch(msg.patch);
        var guess = cleanText(msg.guess, MAX_TEXT);
        if (guess) game.guesses.push({ playerIndex: from, guess: guess, round: currentRound, instrument: inst });
        onLayerSubmittedHost();
        break;
    }
  }

  // ── Guest message handling ──
  function handleGuestReceive(msg) {
    switch (msg.type) {
      case 'joined':
        myPlayerIndex = msg.playerIndex;
        players = msg.players;
        showOnlineLobby();
        break;

      case 'players':
        players = msg.players;
        if (document.getElementById('screen-lobby').classList.contains('active')) {
          renderOnlinePlayerList();
        }
        break;

      case 'error':
        toast(msg.text);
        destroyPeer();
        netMode = 'local';
        showScreen('home');
        break;

      case 'enter_song':
        if (msg.playerIndex === myPlayerIndex) {
          showSongEntryOnline();
        } else {
          showWaiting(players[msg.playerIndex].name, 'is naming their song...');
        }
        break;

      case 'your_turn':
        clearInterval(buildTimer);
        stopPreview();
        games = msg.games;
        currentRound = msg.round;
        currentTurnPlayer = msg.turnPlayer;
        currentGameIdx = msg.gameIdx;
        gameBpm = msg.bpm;
        console.log('Got your_turn: round=' + msg.round + ' gameIdx=' + msg.gameIdx);
        var inst = INSTRUMENTS[currentRound];
        if (currentRound === 0) {
          showBuildOnline(inst);
        } else {
          showScreen('reveal');
          var game = games[currentGameIdx];
          document.getElementById('reveal-song').textContent = game.enteredBy === myPlayerIndex ? game.songName : '???';
          document.getElementById('reveal-instrument').textContent = inst.charAt(0).toUpperCase() + inst.slice(1);
          document.getElementById('reveal-bar').style.width = '100%';
          setTimeout(function () { document.getElementById('reveal-bar').style.width = '0%'; }, 50);
          setTimeout(function () { showBuildOnline(inst); }, 3000);
        }
        break;

      case 'round_start':
        clearInterval(buildTimer);
        stopPreview();
        games = msg.games;
        currentRound = msg.round;
        gameBpm = msg.bpm;
        currentGameIdx = getGameIdx(myPlayerIndex, msg.round);
        currentTurnPlayer = myPlayerIndex;
        console.log('Got round_start: round=' + msg.round + ' gameIdx=' + currentGameIdx);
        var rsInst = INSTRUMENTS[currentRound];
        if (currentRound === 0) {
          showBuildOnline(rsInst);
        } else {
          showScreen('reveal');
          var rsGame = games[currentGameIdx];
          document.getElementById('reveal-song').textContent = rsGame.enteredBy === myPlayerIndex ? rsGame.songName : '???';
          document.getElementById('reveal-instrument').textContent = rsInst.charAt(0).toUpperCase() + rsInst.slice(1);
          document.getElementById('reveal-bar').style.width = '100%';
          setTimeout(function () { document.getElementById('reveal-bar').style.width = '0%'; }, 50);
          setTimeout(function () { showBuildOnline(rsInst); }, 3000);
        }
        break;

      case 'wait_turn':
        showWaiting(players[msg.turnPlayer].name, 'is building ' + msg.instrument + '...');
        break;

      case 'reveal':
        songVotes = {}; myVote = null; votersSeen = 0;
        games = msg.games;
        players = msg.players;
        gameBpm = msg.bpm;
        showReveal();
        break;

      case 'song_votes':
        if (msg.votes && typeof msg.votes === 'object') songVotes = msg.votes;
        votersSeen = +msg.voters || 0;
        renderSongVotes();
        break;

      case 'kicked':
        toast('You were removed from the room');
        destroyPeer();
        netMode = 'local';
        showScreen('home');
        break;

      case 'game_start':
        games = [];
        gameBpm = msg.bpm;
        applySharedSettings(msg.settings);
        songEntryIdx = 0;
        if (msg.firstEntry === myPlayerIndex) {
          showSongEntryOnline();
        } else {
          showWaiting(players[msg.firstEntry].name, 'is naming their song...');
        }
        break;
    }
  }

  function initRoundLengthSlider() {
    var el = document.getElementById('round-len');
    var out = document.getElementById('round-len-val');
    if (!el || !out) return;
    var show = function () {
      var v = +el.value;
      out.textContent = Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0');
    };
    el.value = gameSettings.roundSeconds || BUILD_TIME;
    show();
    el.oninput = function () { gameSettings.roundSeconds = +el.value; show(); };
  }

  // ── Online lobby ──
  function showOnlineLobby() {
    if (netMode === 'host') {
      gameInProgress = false;
      // Players who left mid-game kept their slot so indices stayed valid;
      // back in the lobby the slots can go. Everyone gets their new index.
      if (players.some(function (p) { return p.left; })) {
        var keptConns = [];
        players = players.filter(function (p, i) {
          if (i === 0) return true;
          if (p.left) return false;
          keptConns.push(guestConns[i - 1]);
          return true;
        });
        guestConns = keptConns;
        guestConns.forEach(function (c, i) {
          netSend(c, { type: 'joined', playerIndex: i + 1, players: players, roomCode: roomCode });
        });
      }
    }
    showScreen('lobby');
    document.getElementById('room-code').textContent = roomCode;
    document.getElementById('btn-copy-code').onclick = function () {
      var cb = navigator.clipboard;
      if (!cb) { toast('Room code: ' + roomCode); return; }
      cb.writeText(roomCode).then(function () { toast('Code copied!'); })
        .catch(function () { toast('Room code: ' + roomCode); });
    };
    renderOnlinePlayerList();

    var isHost = netMode === 'host';
    document.getElementById('host-controls').style.display = isHost ? 'flex' : 'none';
    document.getElementById('guest-waiting').style.display = isHost ? 'none' : 'block';

    var songRow = document.querySelector('.song-input-row');
    if (songRow) songRow.style.display = 'none';

    if (isHost) {
      var ts = document.getElementById('lobby-tempo');
      var tv = document.getElementById('lobby-tempo-val');
      ts.value = gameBpm; tv.textContent = gameBpm;
      ts.oninput = function () { gameBpm = +ts.value; tv.textContent = gameBpm; };
      initRoundLengthSlider();

      document.getElementById('btn-start').onclick = function () {
        if (players.length < 2) { toast('Need at least 2 players'); return; }
        // The online lobby shares its markup with the local one but never read
        // the toggles, so none of the options applied in an online game — no
        // SFX or vocal layer, no blind or speed round, no round length, no
        // voting — whatever the host had switched on.
        readGameOptions('');
        if (gameSettings.switcheroo) buildSwitcherooMap(players.length, INSTRUMENTS.length);
        games = [];
        songEntryIdx = 0;
        gameInProgress = true;
        netBroadcast({ type: 'game_start', bpm: gameBpm, firstEntry: 0, settings: sharedSettings() });
        showSongEntryOnline();
      };
    }

    document.getElementById('btn-leave').onclick = function () {
      players = [];
      games = [];
      leaveToHome();
    };

    updateStartBtn();
  }

  function renderOnlinePlayerList() {
    var list = document.getElementById('player-list');
    list.innerHTML = '';
    players.forEach(function (p, i) {
      var card = document.createElement('div');
      card.className = 'player-card';
      var badge = '';
      if (i === 0) badge = '<span class="player-badge">Host</span>';
      else if (netMode === 'host') badge = '<button class="btn-icon kick-player" data-i="' + i + '" title="Kick">&times;</button>';
      if (i === myPlayerIndex) badge = '<span class="player-badge" style="color:var(--accent)">You</span>' + (i === 0 ? ' <span class="player-badge">Host</span>' : '');
      card.innerHTML = '<div class="player-avatar" style="background:' + p.color + '">' + esc((p.name || '?')[0].toUpperCase()) + '</div>' +
        '<span class="player-name">' + esc(p.name) + (p.left ? ' <small>(left)</small>' : '') + '</span>' + badge;
      list.appendChild(card);
    });
    if (netMode === 'host') {
      list.querySelectorAll('.kick-player').forEach(function (btn) {
        btn.onclick = function () {
          var idx = +btn.dataset.i;
          if (idx > 0 && idx <= guestConns.length) {
            netSend(guestConns[idx - 1], { type: 'kicked' });
            if (guestConns[idx - 1]) guestConns[idx - 1].close();
            players.splice(idx, 1);
            guestConns.splice(idx - 1, 1);
            netBroadcast({ type: 'players', players: players });
            renderOnlinePlayerList();
            updateStartBtn();
          }
        };
      });
    }
  }

  // ── Online song entry ──
  function showSongEntryOnline() {
    showScreen('songentry');
    document.getElementById('songentry-player').textContent = 'Name your song:';
    var input = document.getElementById('songentry-input');
    input.value = '';
    setTimeout(function () { input.focus(); }, 100);
    document.getElementById('btn-songentry-done').onclick = function () {
      var song = input.value.trim();
      if (!song) { toast('Give your song a name'); return; }
      if (netMode === 'host') {
        games.push({ songName: song, enteredBy: myPlayerIndex, submissions: {}, guesses: [] });
        songEntryIdx++;
        if (songEntryIdx < players.length) {
          netBroadcast({ type: 'enter_song', playerIndex: songEntryIdx });
          showWaiting(players[songEntryIdx].name, 'is naming their song...');
        } else {
          startGameRoundsOnline();
        }
      } else {
        netSend(hostConn, { type: 'song_entered', songName: song, playerIndex: myPlayerIndex });
        showWaiting('Others', 'are entering their songs...');
      }
    };
  }

  // ── Online game rounds (parallel) ──
  let roundSubmissionsCount = 0;
  let roundAdvanced = false;
  let roundTimer = null;

  function startGameRoundsOnline() {
    currentRound = 0;
    startRoundOnline(0);
  }

  function startRoundOnline(round) {
    currentRound = round;
    roundSubmissionsCount = 0;
    roundAdvanced = false;
    clearTimeout(roundTimer);
    var inst = INSTRUMENTS[round];
    console.log('Starting round ' + round + ' (' + inst + ') for ' + players.length + ' players');

    var gamesToSend = games.map(function (g) {
      return { songName: g.songName, enteredBy: g.enteredBy, submissions: g.submissions, guesses: g.guesses };
    });

    console.log('Broadcasting your_turn for round ' + round + ' to ' + guestConns.length + ' guests');
    guestConns.forEach(function (c, ci) {
      var guestIdx = ci + 1;
      var gIdx = getGameIdx(guestIdx, round);
      netSend(c, {
        type: 'your_turn', round: round, turnPlayer: guestIdx,
        gameIdx: gIdx, games: gamesToSend, bpm: gameBpm
      });
    });

    // Host round timer: auto-advance when BUILD_TIME expires
    roundTimer = setTimeout(function () {
      advanceRound(round + 1);
    }, (getBuildTime() * 1000) + 2000);

    currentTurnPlayer = 0;
    currentGameIdx = getGameIdx(0, round);
    showBuildOnline(inst);
  }

  function advanceRound(nextRound) {
    if (roundAdvanced) return;
    roundAdvanced = true;
    clearTimeout(roundTimer);
    console.log('Advancing to round ' + nextRound);
    setTimeout(function () {
      if (nextRound >= INSTRUMENTS.length) {
        netBroadcast({ type: 'reveal', games: games, players: players, bpm: gameBpm });
        showReveal();
        return;
      }
      currentRound = nextRound;
      roundSubmissionsCount = 0;
      roundAdvanced = false;
      clearTimeout(roundTimer);

      var inst = INSTRUMENTS[nextRound];
      console.log('Starting round ' + nextRound + ' (' + inst + ') for ' + players.length + ' players');

      var gamesToSend = games.map(function (g) {
        return { songName: g.songName, enteredBy: g.enteredBy, submissions: g.submissions, guesses: g.guesses };
      });

      // Broadcast round start to all guests at once
      console.log('Broadcasting round_start for round ' + nextRound + ' to ' + guestConns.length + ' guests');
      netBroadcast({ type: 'round_start', round: nextRound, games: gamesToSend, bpm: gameBpm });

      // Host round timer (BUILD_TIME + 3s reveal + 2s buffer)
      var extraDelay = 3000;
      var nr = nextRound + 1;
      roundTimer = setTimeout(function () {
        advanceRound(nr);
      }, (getBuildTime() * 1000) + extraDelay + 2000);

      // Host builds
      currentTurnPlayer = 0;
      currentGameIdx = getGameIdx(0, nextRound);
      showScreen('reveal');
      var game = games[currentGameIdx];
      document.getElementById('reveal-song').textContent = game.enteredBy === 0 ? game.songName : '???';
      document.getElementById('reveal-instrument').textContent = inst.charAt(0).toUpperCase() + inst.slice(1);
      document.getElementById('reveal-bar').style.width = '100%';
      setTimeout(function () { document.getElementById('reveal-bar').style.width = '0%'; }, 50);
      setTimeout(function () { showBuildOnline(inst); }, 3000);
    }, 600);
  }

  function onLayerSubmittedHost() {
    roundSubmissionsCount++;
    console.log('Submissions for round ' + currentRound + ': ' + roundSubmissionsCount + '/' + players.length);
    if (roundSubmissionsCount >= players.length) {
      advanceRound(currentRound + 1);
    }
  }

  function submitOnline(instrument) {
    clearInterval(buildTimer);
    stopPreview();
    var data = collectData(instrument);
    var game = games[currentGameIdx];
    var guess = '';
    if (currentRound > 0 && game.enteredBy !== myPlayerIndex) {
      guess = document.getElementById('guess-input').value.trim();
    }

    if (netMode === 'host') {
      game.submissions[instrument] = { data: data, bpm: gameBpm, playerIndex: myPlayerIndex };
      if (instrument === 'bass') game.submissions[instrument].sound = currentBassSound;
      if (instrument === 'melody') {
        game.submissions[instrument].sound = currentMelodySound;
        if (currentMelodySound === PRODUCER_SOUND) game.submissions[instrument].patch = normalisePatch(melodyPatch);
      }
      if (instrument === 'chords') game.submissions[instrument].sound = currentChordSound;
      if (guess) game.guesses.push({ playerIndex: myPlayerIndex, guess: guess, round: currentRound, instrument: instrument });
      toast('Layer submitted!');
      onLayerSubmittedHost();
      if (!roundAdvanced) {
        showWaiting('Others', 'are still building...');
      }
    } else {
      netSend(hostConn, {
        type: 'layer_submitted',
        playerIndex: myPlayerIndex,
        data: data,
        sound: instrument === 'bass' ? currentBassSound : (instrument === 'melody' ? currentMelodySound : (instrument === 'chords' ? currentChordSound : null)),
        patch: (instrument === 'melody' && currentMelodySound === PRODUCER_SOUND) ? normalisePatch(melodyPatch) : null,
        guess: guess
      });
      toast('Layer submitted!');
      showWaiting('Others', 'are still building...');
    }
  }

  function showBuildOnline(instrument) {
    showBuild(instrument);
    document.getElementById('btn-submit').onclick = function () {
      submitOnline(instrument);
    };
  }

  function showWaiting(name, info) {
    showScreen('waiting');
    document.getElementById('waiting-player').textContent = name;
    document.getElementById('waiting-info').textContent = info;
  }

  // ── Audio ──
  let audioReady = false;
  const synths = {};

  function ensureAudio() {
    if (audioReady) return Promise.resolve();
    return Tone.start().then(function () { audioReady = true; })
      .catch(function () { toast('Tap the screen once to enable sound'); });
  }

  // Per-instrument trims so every layer lands near the same peak level.
  // Measured untrimmed with correct transport scheduling, drums peak near
  // -4 dB while chords/bass/melody sit between -15 and -19. These bring all
  // of them to roughly -10.
  const MIX_TRIM = { drums: -5.5, sfx: -3.5, chords: 5, bass: 7, melody: 9, vocal: 6 };
  // Per-layer trims run as high as +9 dB, which is right for one layer alone
  // but slams the limiter once five or six sum together — that was the
  // distortion. MASTER_TRIM buys back enough headroom for a full mix.
  const MASTER_TRIM = -8;
  let masterBus = null;
  let masterTrim = null;
  const busCache = {};
  const reverbCache = {};

  function getMasterBus() {
    if (!masterBus) {
      masterBus = new Tone.Limiter(-1).toDestination();
      masterTrim = new Tone.Volume(MASTER_TRIM).connect(masterBus);
    }
    return masterTrim;
  }

  // Buses and reverbs are shared per instrument and never disposed. Building a
  // fresh Tone.Reverb per synth meant every sound change rendered a new
  // impulse response, and the old nodes piled up.
  function makeBus(inst) {
    var key = inst || 'melody';
    if (!busCache[key]) busCache[key] = new Tone.Volume(MIX_TRIM[key] || 0).connect(getMasterBus());
    return busCache[key];
  }

  function makeReverb(key, decay, wet, bus) {
    if (!reverbCache[key]) reverbCache[key] = new Tone.Reverb({ decay: decay, wet: wet }).connect(bus);
    return reverbCache[key];
  }

  // A voice limit the sustained chord/pad sounds cannot blow past. Without it
  // long notes stacked until the context ran out of CPU and went silent.
  function capVoices(poly, max) {
    try { poly.maxPolyphony = max; } catch (e) {}
    return poly;
  }

  function createDrumSynth() {
    return withSampledPads('drums', DRUM_NAMES, createSynthDrumKit());
  }

  function createSynthDrumKit() {
    var vol = makeBus('drums');
    var kick = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 6, envelope: { attack: 0.001, decay: 0.3, sustain: 0 } }).connect(vol);
    var snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.15, sustain: 0 } }).connect(vol);
    var hihat = new Tone.MetalSynth({ frequency: 400, envelope: { attack: 0.001, decay: 0.06, sustain: 0 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5, volume: -12 }).connect(vol);
    var openHH = new Tone.MetalSynth({ frequency: 400, envelope: { attack: 0.001, decay: 0.3, sustain: 0 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5, volume: -14 }).connect(vol);
    var clap = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0 } }).connect(vol);
    var tom = new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 4, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).connect(vol);
    var rim = new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 2, envelope: { attack: 0.001, decay: 0.05, sustain: 0 }, volume: -6 }).connect(vol);
    var crash = new Tone.MetalSynth({ frequency: 300, envelope: { attack: 0.001, decay: 0.8, sustain: 0 }, harmonicity: 5.1, modulationIndex: 40, resonance: 3500, octaves: 1.5, volume: -16 }).connect(vol);
    var cowbell = new Tone.MetalSynth({ frequency: 560, envelope: { attack: 0.001, decay: 0.2, sustain: 0 }, harmonicity: 5.1, modulationIndex: 16, resonance: 5000, octaves: 0.5, volume: -12 }).connect(vol);
    var shaker = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.04, sustain: 0 }, volume: -10 }).connect(vol);
    var conga = new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 3, envelope: { attack: 0.001, decay: 0.15, sustain: 0 }, volume: -4 }).connect(vol);
    return {
      trigger: function (name, time) {
        switch (name) {
          case 'Kick': kick.triggerAttackRelease('C1', '8n', time); break;
          case 'Snare': snare.triggerAttackRelease('8n', time); break;
          case 'HiHat': hihat.triggerAttackRelease('32n', time); break;
          case 'OpenHH': openHH.triggerAttackRelease('16n', time); break;
          case 'Clap': clap.triggerAttackRelease('16n', time); break;
          case 'Tom': tom.triggerAttackRelease('E2', '8n', time); break;
          case 'Rim': rim.triggerAttackRelease('G4', '32n', time); break;
          case 'Crash': crash.triggerAttackRelease('16n', time); break;
          case 'Cowbell': cowbell.triggerAttackRelease('16n', time); break;
          case 'Shaker': shaker.triggerAttackRelease('32n', time); break;
          case 'Conga': conga.triggerAttackRelease('D3', '8n', time); break;
        }
      },
      dispose: function () { [kick, snare, hihat, openHH, clap, tom, rim, crash, cowbell, shaker, conga, vol].forEach(function (n) { n.dispose(); }); }
    };
  }

  function createSfxSynth() {
    return withSampledPads('sfx', SFX_NAMES, createSynthSfxKit());
  }

  function createSynthSfxKit() {
    var vol = makeBus('sfx');
    var siren = new Tone.FMSynth({ harmonicity: 3, modulationIndex: 10, envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.3 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.2 } }).connect(vol);
    var laser = new Tone.FMSynth({ harmonicity: 5, modulationIndex: 20, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 } }).connect(vol);
    var boom = new Tone.MembraneSynth({ pitchDecay: 0.1, octaves: 8, envelope: { attack: 0.001, decay: 0.6, sustain: 0 } }).connect(vol);
    var sweep = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.3, decay: 0.5, sustain: 0.2, release: 0.3 }, volume: -8 }).connect(vol);
    var zap = new Tone.FMSynth({ harmonicity: 8, modulationIndex: 30, envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.05 }, modulation: { type: 'sawtooth' }, modulationEnvelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 } }).connect(vol);
    var whoosh = new Tone.NoiseSynth({ noise: { type: 'brown' }, envelope: { attack: 0.1, decay: 0.3, sustain: 0, release: 0.2 }, volume: -6 }).connect(vol);
    var glitch = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 }, volume: -8 }).connect(vol);
    var drop = new Tone.MembraneSynth({ pitchDecay: 0.2, octaves: 10, envelope: { attack: 0.001, decay: 0.8, sustain: 0 }, volume: 2 }).connect(vol);
    return {
      trigger: function (name, time) {
        switch (name) {
          case 'Siren': siren.triggerAttackRelease('C5', '8n', time); break;
          case 'Laser': laser.triggerAttackRelease('G6', '16n', time); break;
          case 'Boom': boom.triggerAttackRelease('C1', '4n', time); break;
          case 'Sweep': sweep.triggerAttackRelease('8n', time); break;
          case 'Zap': zap.triggerAttackRelease('A5', '32n', time); break;
          case 'Whoosh': whoosh.triggerAttackRelease('8n', time); break;
          case 'Glitch': glitch.triggerAttackRelease('32n', time); break;
          case 'Drop': drop.triggerAttackRelease('C1', '4n', time); break;
        }
      },
      dispose: function () { [siren, laser, boom, sweep, zap, whoosh, glitch, drop, vol].forEach(function (n) { n.dispose(); }); }
    };
  }

  function createChordSynth(presetName) {
    var name = presetName || currentChordSound;
    var sampled = packEntry('chords', name);
    if (sampled) return createSampledInstrument(sampled, 'chords');
    var preset = CHORD_SOUNDS[name] || CHORD_SOUNDS['Piano Chords'];
    var bus = makeBus('chords');
    var reverb = makeReverb('chords', 2, 0.25, bus);
    var poly = capVoices(new Tone.PolySynth(Tone.FMSynth, preset).connect(reverb), 16);
    return {
      play: function (notes, dur, time) { poly.triggerAttackRelease(notes, dur, time); },
      dispose: function () { poly.dispose(); }
    };
  }

  function getOrCreateChordSynth() {
    if (synths.chords) { synths.chords.dispose(); synths.chords = null; }
    synths.chords = createChordSynth();
    return synths.chords;
  }

  function createSynthFromPreset(preset, poly, inst) {
    var key = inst || (poly ? 'melody' : 'bass');
    var bus = makeBus(key);
    var reverb = makeReverb(key + ':std', 1.5, 0.2, bus);
    var syn;
    if (poly) {
      syn = capVoices(new Tone.PolySynth(Tone.FMSynth, preset).connect(reverb), 16);
    } else {
      syn = new Tone.FMSynth(preset).connect(reverb);
    }
    return {
      play: function (note, dur, time) { syn.triggerAttackRelease(note, dur, time); },
      dispose: function () { syn.dispose(); }
    };
  }

  // ── Sample pack ──
  // Optional. Drop a manifest at samples/pack.json to replace any built-in
  // sound with real recordings. Anything the pack does not name keeps its
  // synth, so a partial pack is fine and a missing one changes nothing.
  var samplePack = null;

  function loadSamplePack() {
    return fetch('samples/pack.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (p) { samplePack = p; })
      .catch(function () { samplePack = null; });
  }

  function packEntry(group, name) {
    return (samplePack && samplePack[group] && samplePack[group][name]) || null;
  }

  function packBase(sub) {
    return (samplePack && samplePack.baseUrl ? samplePack.baseUrl : 'samples/') + (sub || '');
  }

  // A failed decode must not leave the Transport waiting forever.
  function loadGuard(promise) {
    return Promise.race([
      promise,
      new Promise(function (res) { setTimeout(res, 8000); })
    ]);
  }

  function createSampledInstrument(def, inst) {
    var bus = makeBus(inst);
    var sampler;
    var loaded = new Promise(function (resolve) {
      sampler = new Tone.Sampler({
        urls: def.urls,
        baseUrl: packBase(def.baseUrl),
        release: def.release != null ? def.release : 1,
        volume: def.gain || 0,
        onload: resolve,
        onerror: resolve
      }).connect(bus);
    });
    pendingAudioLoads.push(loadGuard(loaded));
    return {
      play: function (note, dur, time) {
        if (!sampler.loaded) return;
        sampler.triggerAttackRelease(note, dur, time);
      },
      dispose: function () { sampler.dispose(); }
    };
  }

  // One-shot kits (drums, sfx) fall back per pad, so a pack can replace just
  // the kick and leave the rest synthesised.
  function withSampledPads(group, names, fallback) {
    var map = samplePack && samplePack[group];
    if (!map) return fallback;
    var bus = makeBus(group);
    var players = {};
    var pending = [];
    names.forEach(function (name) {
      var src = map[name];
      if (!src) return;
      pending.push(loadGuard(new Promise(function (resolve) {
        players[name] = new Tone.Player({
          url: packBase(typeof src === 'string' ? src : src.url),
          volume: (typeof src === 'object' && src.gain) || 0,
          onload: resolve,
          onerror: resolve
        }).connect(bus);
      })));
    });
    if (!pending.length) return fallback;
    pendingAudioLoads.push(Promise.all(pending));
    return {
      trigger: function (name, time) {
        var pl = players[name];
        if (pl && pl.loaded) { pl.start(time); return; }
        fallback.trigger(name, time);
      },
      dispose: function () {
        Object.keys(players).forEach(function (k) { players[k].dispose(); });
        fallback.dispose();
      }
    };
  }

  // ── Producer Edition ──
  // A plain oscillator + ADSR the player can dial in, rather than a fixed
  // preset. The patch travels with the layer so everyone hears the same sound.
  const PRODUCER_SOUND = 'Producer Edition';
  const PRODUCER_WAVES = ['sine', 'triangle', 'sawtooth', 'square'];
  const PRODUCER_DEFAULT = { wave: 'sawtooth', attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4, cutoff: 6000 };
  const CUTOFF_MIN = 80;
  const CUTOFF_MAX = 14000;
  let melodyPatch = Object.assign({}, PRODUCER_DEFAULT);

  function normalisePatch(patch) {
    var p = Object.assign({}, PRODUCER_DEFAULT, patch || {});
    if (PRODUCER_WAVES.indexOf(p.wave) < 0) p.wave = PRODUCER_DEFAULT.wave;
    ['attack', 'decay', 'release'].forEach(function (k) {
      p[k] = Math.max(0.001, Math.min(2, +p[k] || PRODUCER_DEFAULT[k]));
    });
    p.sustain = Math.max(0, Math.min(1, +p.sustain));
    if (isNaN(p.sustain)) p.sustain = PRODUCER_DEFAULT.sustain;
    p.cutoff = Math.max(CUTOFF_MIN, Math.min(CUTOFF_MAX, +p.cutoff || PRODUCER_DEFAULT.cutoff));
    return p;
  }

  // Pitch is perceived logarithmically, so the cutoff slider is too — a linear
  // one would bury everything useful in its first tenth.
  function cutoffToSlider(hz) {
    return Math.log(hz / CUTOFF_MIN) / Math.log(CUTOFF_MAX / CUTOFF_MIN);
  }
  function sliderToCutoff(t) {
    return CUTOFF_MIN * Math.pow(CUTOFF_MAX / CUTOFF_MIN, t);
  }

  function createProducerSynth(patch, inst) {
    var p = normalisePatch(patch);
    var bus = makeBus(inst);
    var reverb = makeReverb((inst || 'melody') + ':prod', 1.2, 0.14, bus);
    var filter = new Tone.Filter({ type: 'lowpass', frequency: p.cutoff, rolloff: -24, Q: 1 }).connect(reverb);
    var syn = capVoices(new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: p.wave },
      envelope: { attack: p.attack, decay: p.decay, sustain: p.sustain, release: p.release },
      volume: -10
    }).connect(filter), 16);
    return {
      play: function (note, dur, time) { syn.triggerAttackRelease(note, dur, time); },
      // Sweeping the cutoff should not tear the synth down and rebuild it.
      setCutoff: function (hz) { filter.frequency.rampTo(hz, 0.03); },
      dispose: function () { syn.dispose(); filter.dispose(); }
    };
  }

  // Built-in sounds plus any the pack adds, so a pack can extend the picker
  // rather than only replacing what is already there.
  function bankFor(group) {
    if (group === 'bass') return BASS_SOUNDS;
    if (group === 'chords') return CHORD_SOUNDS;
    return MELODY_SOUNDS;
  }

  function soundNamesFor(group) {
    var bank = bankFor(group);
    var names = Object.keys(bank);
    var fromPack = (samplePack && samplePack[group]) ? Object.keys(samplePack[group]) : [];
    fromPack.forEach(function (n) { if (names.indexOf(n) < 0) names.push(n); });
    return names;
  }

  function createInstrument(group, soundName, poly, patch) {
    if (soundName === PRODUCER_SOUND) return createProducerSynth(patch, group);
    var def = packEntry(group, soundName);
    if (def) return createSampledInstrument(def, group);
    var bank = bankFor(group);
    var preset = bank[soundName] || bank[Object.keys(bank)[0]];
    return createSynthFromPreset(preset, poly, group);
  }

  function getOrCreateBassSynth() {
    if (synths.bass) synths.bass.dispose();
    synths.bass = createInstrument('bass', currentBassSound, false);
    return synths.bass;
  }

  function getOrCreateMelodySynth() {
    if (synths.melody) synths.melody.dispose();
    synths.melody = createInstrument('melody', currentMelodySound, true, melodyPatch);
    return synths.melody;
  }

  // ── Screens & Utility ──
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
    document.getElementById('screen-' + id).classList.add('active');
    updateMenuMusic(id);
  }

  // ── Menu music ──
  // Optional: drop an mp3 at music/theme.mp3 and it plays on the title, lobby
  // and setup screens.
  //
  // Played through Web Audio rather than an <audio> element. An mp3 carries
  // encoder padding that a plain loop cannot skip, which is the half-second
  // gap you hear on every repeat; an AudioBufferSourceNode loops on exact
  // sample positions, so the seam is silent. Those positions are measured
  // from the decoded audio, so trimming the file by hand is never needed and
  // a replacement track is handled automatically.
  const MENU_SCREENS = { home: 1, lobby: 1, solo: 1 };
  const MUSIC_VOLUME = 0.3;
  const MUSIC_FADE = 0.45;        // seconds, fading out
  const MUSIC_ATTACK = 2.6;       // seconds, fading in
  const MUSIC_SILENCE = 0.0032;   // about -50 dBFS

  var musicCtx = null;
  var musicGain = null;
  var musicBuffer = null;
  var musicSource = null;
  var musicLoop = { start: 0, end: 0 };
  var musicOn = true;
  var musicWanted = false;
  var musicArmed = false;

  // Silence at either end pushes the seam out of time. Find the real first
  // and last audible samples and loop between those instead.
  function findLoopPoints(buf) {
    var n = buf.length, ch = buf.numberOfChannels, data = [], c;
    for (c = 0; c < ch; c++) data.push(buf.getChannelData(c));
    function loud(i) {
      for (var k = 0; k < ch; k++) if (Math.abs(data[k][i]) > MUSIC_SILENCE) return true;
      return false;
    }
    var first = 0;
    while (first < n - 1 && !loud(first)) first++;
    var last = n - 1;
    while (last > first && !loud(last)) last--;
    // A few ms of tail so a decaying note is not clipped mid-sample.
    last = Math.min(n - 1, last + Math.round(buf.sampleRate * 0.005));
    return { start: first / buf.sampleRate, end: (last + 1) / buf.sampleRate };
  }

  function musicNow() { return musicCtx ? musicCtx.currentTime : 0; }

  // The track opens on a hard transient — it goes from -27 dB to -7 dB inside
  // 50ms — so coming in on a longer ramp is what keeps it from barking at you.
  // Rising exponentially rather than linearly makes that ramp even in decibels,
  // which is what the ear reads as a smooth swell.
  function fadeMusicTo(value, seconds) {
    if (!musicGain) return;
    var g = musicGain.gain;
    var t0 = musicNow();
    var dur = seconds != null ? seconds : MUSIC_FADE;
    g.cancelScheduledValues(t0);
    if (value > 0) {
      // exponentialRampToValueAtTime cannot start from zero, and starting from
      // a hair above it would waste the ramp climbing out of inaudibility.
      var floor = Math.max(g.value, value * 0.01);
      g.setValueAtTime(floor, t0);
      g.exponentialRampToValueAtTime(value, t0 + dur);
    } else {
      g.setValueAtTime(g.value, t0);
      g.linearRampToValueAtTime(0, t0 + dur);
    }
  }

  function startMusicSource() {
    if (!musicBuffer || musicSource) return;
    musicSource = musicCtx.createBufferSource();
    musicSource.buffer = musicBuffer;
    musicSource.loop = true;
    musicSource.loopStart = musicLoop.start;
    musicSource.loopEnd = musicLoop.end;
    musicSource.connect(musicGain);
    musicSource.start(0, musicLoop.start);
  }

  function stopMusicSource() {
    if (!musicSource) return;
    try { musicSource.stop(); } catch (e) {}
    musicSource.disconnect();
    musicSource = null;
  }

  // Autoplay stays blocked until the page has been interacted with. Arm every
  // gesture type, in the capture phase so it lands before a button handler
  // navigates away, and keep the listeners until playback actually starts.
  function armMusicGesture() {
    if (musicArmed) return;
    musicArmed = true;
    var events = ['pointerdown', 'touchstart', 'keydown'];
    function go() {
      musicCtx.resume().then(function () {
        if (musicCtx.state !== 'running') return;
        events.forEach(function (e) { document.removeEventListener(e, go, true); });
        musicArmed = false;
        if (musicWanted && musicOn) { startMusicSource(); fadeMusicTo(MUSIC_VOLUME, MUSIC_ATTACK); }
      }).catch(function () {});
    }
    events.forEach(function (e) { document.addEventListener(e, go, true); });
  }

  function updateMenuMusic(screenId) {
    musicWanted = !!MENU_SCREENS[screenId];
    var btn = document.getElementById('btn-music');
    if (btn) btn.style.display = musicWanted && musicBuffer ? 'flex' : 'none';
    if (!musicBuffer) return;

    if (musicWanted && musicOn) {
      if (musicCtx.state === 'running') {
        startMusicSource();
        fadeMusicTo(MUSIC_VOLUME, MUSIC_ATTACK);
      } else {
        // Arm the gesture listeners first and unconditionally. A resume() with
        // no user activation behind it does not reject — Chrome leaves the
        // promise pending until a gesture arrives — so waiting on it to fail
        // meant the fallback was never set up and the title screen stayed
        // silent until something else happened to start the context.
        armMusicGesture();
        musicCtx.resume().then(function () {
          if (musicCtx.state === 'running' && musicWanted && musicOn) {
            startMusicSource();
            fadeMusicTo(MUSIC_VOLUME, MUSIC_ATTACK);
          }
        }).catch(function () {});
      }
    } else if (musicSource) {
      fadeMusicTo(0);
      // Tear the source down once silent, not before, or the fade is cut off.
      setTimeout(function () {
        if (!musicWanted || !musicOn) stopMusicSource();
      }, MUSIC_FADE * 1000 + 60);
    }
  }

  function initMenuMusic() {
    var btn = document.getElementById('btn-music');
    musicOn = localStorage.getItem('st-music') !== 'off';
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    musicCtx = new Ctx();
    musicGain = musicCtx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(musicCtx.destination);

    fetch('music/theme.mp3')
      .then(function (r) { return r.ok ? r.arrayBuffer() : Promise.reject(new Error('no track')); })
      .then(function (ab) {
        return new Promise(function (resolve, reject) {
          // Callback form as well as the promise: older Safari only has that.
          var ret = musicCtx.decodeAudioData(ab, resolve, reject);
          if (ret && ret.then) ret.then(resolve, reject);
        });
      })
      .then(function (buf) {
        musicBuffer = buf;
        musicLoop = findLoopPoints(buf);
        var active = document.querySelector('.screen.active');
        updateMenuMusic(active ? active.id.replace('screen-', '') : 'home');
      })
      // No file, or an unplayable one: stay silent and keep the button hidden.
      .catch(function () {
        musicBuffer = null;
        if (btn) btn.style.display = 'none';
      });

    if (!btn) return;
    btn.setAttribute('aria-pressed', String(!musicOn));
    btn.classList.toggle('muted', !musicOn);
    btn.onclick = function () {
      musicOn = !musicOn;
      localStorage.setItem('st-music', musicOn ? 'on' : 'off');
      btn.setAttribute('aria-pressed', String(!musicOn));
      btn.classList.toggle('muted', !musicOn);
      var active = document.querySelector('.screen.active');
      updateMenuMusic(active ? active.id.replace('screen-', '') : 'home');
    };
  }

  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2000);
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function applyColorScheme(name) {
    var s = COLOR_SCHEMES[name] || COLOR_SCHEMES[DEFAULT_SCHEME];
    if (!s) return;
    name = COLOR_SCHEMES[name] ? name : DEFAULT_SCHEME;
    var r = document.documentElement.style;
    r.setProperty('--bg', s.bg);
    r.setProperty('--surface', s.surface);
    r.setProperty('--surface-2', s.surface2);
    r.setProperty('--surface-3', s.surface3);
    r.setProperty('--border', s.border);
    r.setProperty('--text', s.text);
    r.setProperty('--text-muted', s.textMuted);
    r.setProperty('--text-dim', s.textDim);
    r.setProperty('--accent', s.accent);
    r.setProperty('--accent-soft', s.accentSoft);
    var hex = s.accent.replace('#','');
    var rr = parseInt(hex.substr(0,2),16), gg = parseInt(hex.substr(2,2),16), bb = parseInt(hex.substr(4,2),16);
    r.setProperty('--accent-glow', 'rgba('+rr+','+gg+','+bb+',0.25)');
    r.setProperty('--grid-cell', s.grid);
    r.setProperty('--grid-beat', s.gridBeat);
    r.setProperty('--grid-alt', s.gridAlt);
    r.setProperty('--grid-alt-beat', s.gridAltBeat);
    r.setProperty('--grid-border', s.gridBorder);
    r.setProperty('--piano-roll-bg', s.pianoRollBg);
    r.setProperty('--note-color', s.note);
    r.setProperty('--note-border', s.noteBorder);
    if (s.skin) document.documentElement.setAttribute('data-skin', s.skin);
    else document.documentElement.removeAttribute('data-skin');
    localStorage.setItem('st-theme', name);
  }

  function initThemePicker() {
    var container = document.getElementById('theme-picker');
    if (!container) return;
    var saved = localStorage.getItem('st-theme');
    if (!COLOR_SCHEMES[saved]) saved = DEFAULT_SCHEME;
    var keys = Object.keys(COLOR_SCHEMES);
    // A picker with one option is just a decoration that invites a click.
    if (keys.length < 2) {
      container.style.display = 'none';
      applyColorScheme(saved);
      return;
    }
    keys.forEach(function (key) {
      var s = COLOR_SCHEMES[key];
      var dot = document.createElement('button');
      dot.className = 'theme-dot' + (key === saved ? ' active' : '');
      dot.style.background = s.color;
      dot.title = s.label;
      dot.onclick = function () {
        container.querySelectorAll('.theme-dot').forEach(function (d) { d.classList.remove('active'); });
        dot.classList.add('active');
        applyColorScheme(key);
      };
      container.appendChild(dot);
    });
    applyColorScheme(saved);
  }

  function generateCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', c = '';
    for (var i = 0; i < 5; i++) c += chars[Math.floor(Math.random() * chars.length)];
    return c;
  }

  // ── Home ──
  function initHome() {
    var savedName = localStorage.getItem('st-name') || '';
    document.getElementById('input-name').value = savedName;

    // Create Room (online host)
    document.getElementById('btn-create').addEventListener('click', function () {
      ensureAudio();
      var name = getName();
      if (!name) { toast('Enter your name first'); return; }
      soloMode = false;
      var code = generateCode();
      toast('Creating room ' + code + '...');
      createHost(code, name);
    });

    // Join Room (online guest)
    document.getElementById('btn-join').addEventListener('click', function () {
      ensureAudio();
      var name = getName();
      if (!name) { toast('Enter your name first'); return; }
      var code = document.getElementById('input-room-code').value.trim().toUpperCase();
      if (!code) { toast('Enter a room code'); return; }
      soloMode = false;
      joinRoom(code, name);
    });

    // Local Multiplayer (pass-and-play)
    document.getElementById('btn-local').addEventListener('click', function () {
      ensureAudio();
      var name = getName();
      if (!name) { toast('Enter your name first'); return; }
      players = [{ name: name, color: PLAYER_COLORS[0] }];
      soloMode = false;
      netMode = 'local';
      showLobby();
    });

    // Solo
    document.getElementById('btn-solo').addEventListener('click', function () {
      ensureAudio();
      var name = getName();
      if (!name) { toast('Enter your name first'); return; }
      players = [{ name: name, color: PLAYER_COLORS[0] }];
      soloMode = true;
      netMode = 'local';
      showSoloSetup();
    });
  }

  function getName() {
    var n = document.getElementById('input-name').value.trim();
    if (n) localStorage.setItem('st-name', n);
    return n;
  }

  // ── Solo ──
  function showSoloSetup() {
    showScreen('solo');
    var ts = document.getElementById('solo-tempo');
    var tv = document.getElementById('solo-tempo-val');
    ts.value = gameBpm; tv.textContent = gameBpm;
    ts.oninput = function () { gameBpm = +ts.value; tv.textContent = gameBpm; };
    document.getElementById('btn-solo-start').onclick = function () {
      readGameOptions('solo-');
      var sn = document.getElementById('solo-song').value.trim() || 'Free Jam';
      soloInstIdx = 0;
      games = [{ songName: sn, enteredBy: 0, submissions: {}, guesses: [] }];
      currentGameIdx = 0;
      startSoloBuild();
    };
    document.getElementById('btn-solo-back').onclick = function () { showScreen('home'); };
  }

  function startSoloBuild() {
    if (soloInstIdx >= INSTRUMENTS.length) {
      if (gameSettings.buildup) { showBuildupReveal(0); return; }
      showReveal();
      return;
    }
    currentTurnPlayer = 0;
    currentGameIdx = 0;
    showBuild(INSTRUMENTS[soloInstIdx]);
  }

  // ── Lobby ──
  function showLobby() {
    showScreen('lobby');
    document.getElementById('room-code').textContent = generateCode();
    renderPlayerList();

    document.getElementById('host-controls').style.display = 'flex';
    document.getElementById('guest-waiting').style.display = 'none';

    var songRow = document.querySelector('.song-input-row');
    if (songRow) songRow.style.display = 'none';

    var ts = document.getElementById('lobby-tempo');
    var tv = document.getElementById('lobby-tempo-val');
    ts.value = gameBpm; tv.textContent = gameBpm;
    ts.oninput = function () { gameBpm = +ts.value; tv.textContent = gameBpm; };
    initRoundLengthSlider();

    var startBtn = document.getElementById('btn-start');
    startBtn.onclick = function () {
      if (players.length < 2) { toast('Need at least 2 players'); return; }
      readGameOptions('');
      if (gameSettings.switcheroo) buildSwitcherooMap(players.length, INSTRUMENTS.length);
      startSongEntry();
    };

    document.getElementById('btn-leave').onclick = function () {
      players = []; games = []; showScreen('home');
    };

    updateStartBtn();
  }

  function renderPlayerList() {
    var list = document.getElementById('player-list');
    list.innerHTML = '';
    var addDiv = document.createElement('div');
    addDiv.className = 'player-card';
    addDiv.style.cursor = 'pointer';
    addDiv.style.borderStyle = 'dashed';
    addDiv.innerHTML = '<div class="player-avatar" style="background:var(--surface-3);color:var(--text-dim)">+</div>' +
      '<input type="text" class="name-input" placeholder="Add player..." maxlength="20" style="flex:1;width:auto;text-align:left" autocomplete="off" spellcheck="false">' +
      '<button class="btn-secondary" style="padding:8px 14px;font-size:0.8rem">Add</button>';
    var addInput = addDiv.querySelector('input');
    var addBtn = addDiv.querySelector('button');
    function addPlayer() {
      var n = addInput.value.trim();
      if (!n) return;
      if (players.length >= 6) { toast('Max 6 players'); return; }
      if (players.some(function (p) { return p.name === n; })) { toast('Name taken'); return; }
      players.push({ name: n, color: PLAYER_COLORS[players.length % PLAYER_COLORS.length] });
      renderPlayerList();
      updateStartBtn();
    }
    addInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') addPlayer(); });
    addBtn.addEventListener('click', addPlayer);
    list.appendChild(addDiv);

    players.forEach(function (p, i) {
      var card = document.createElement('div');
      card.className = 'player-card';
      card.innerHTML = '<div class="player-avatar" style="background:' + p.color + '">' + esc((p.name || '?')[0].toUpperCase()) + '</div>' +
        '<span class="player-name">' + esc(p.name) + '</span>' +
        (i === 0 ? '<span class="player-badge">Host</span>' : '<button class="btn-icon remove-player" data-i="' + i + '" title="Remove">&times;</button>');
      list.appendChild(card);
    });
    list.querySelectorAll('.remove-player').forEach(function (btn) {
      btn.onclick = function () { players.splice(+btn.dataset.i, 1); renderPlayerList(); updateStartBtn(); };
    });
  }

  function updateStartBtn() {
    var startBtn = document.getElementById('btn-start');
    if (!startBtn) return;
    startBtn.disabled = players.length < 2;
    startBtn.textContent = players.length < 2 ? 'Add more players' : 'Start Game';
  }

  // ── Song Entry Phase ──
  function startSongEntry() {
    games = [];
    songEntryIdx = 0;
    showSongEntryHandoff();
  }

  function showSongEntryHandoff() {
    showScreen('handoff');
    document.getElementById('handoff-label').textContent = 'It\'s your turn';
    document.getElementById('handoff-player').textContent = players[songEntryIdx].name;
    document.getElementById('handoff-instrument').textContent = 'Name your song (no peeking, everyone!)';
    document.getElementById('handoff-hint').textContent = 'Share your screen on Discord when ready';
    document.getElementById('btn-handoff-ready').onclick = function () { showSongEntry(); };
  }

  function showSongEntry() {
    showScreen('songentry');
    document.getElementById('songentry-player').textContent = players[songEntryIdx].name + ', name your song:';
    var input = document.getElementById('songentry-input');
    input.value = '';
    setTimeout(function () { input.focus(); }, 100);
    document.getElementById('btn-songentry-done').onclick = function () {
      var song = input.value.trim();
      if (!song) { toast('Give your song a name'); return; }
      games.push({ songName: song, enteredBy: songEntryIdx, submissions: {}, guesses: [] });
      songEntryIdx++;
      if (songEntryIdx < players.length) showSongEntryHandoff();
      else startGameRounds();
    };
  }

  // ── Game Rounds ──
  function startGameRounds() {
    currentRound = 0;
    currentTurnPlayer = 0;
    nextTurn();
  }

  function getGameIdx(playerIdx, round) {
    return (playerIdx + round) % games.length;
  }

  function nextTurn() {
    if (currentRound >= INSTRUMENTS.length) {
      songVotes = {}; votedPlayers = {}; myVote = null; votersSeen = 0;
      if (gameSettings.buildup) { showBuildupReveal(0); return; }
      showReveal();
      return;
    }
    if (currentTurnPlayer >= players.length) {
      currentRound++;
      currentTurnPlayer = 0;
      nextTurn();
      return;
    }
    showHandoff();
  }

  function showHandoff() {
    showScreen('handoff');
    var p = players[currentTurnPlayer];
    var inst = INSTRUMENTS[currentRound];
    var gIdx = getGameIdxWithSwitcheroo(currentTurnPlayer, currentRound);
    var game = games[gIdx];
    var existingCount = Object.keys(game.submissions).length;

    document.getElementById('handoff-label').textContent = 'It\'s your turn';
    document.getElementById('handoff-player').textContent = p.name;
    document.getElementById('handoff-instrument').textContent = 'Your instrument: ' + inst.charAt(0).toUpperCase() + inst.slice(1);

    if (currentRound === 0) {
      document.getElementById('handoff-hint').textContent = 'Build ' + inst + ' for your song — share your screen!';
    } else {
      document.getElementById('handoff-hint').textContent =
        'Listen to ' + existingCount + ' layer' + (existingCount !== 1 ? 's' : '') + ' so far, then add your ' + inst + '!';
    }

    document.getElementById('btn-handoff-ready').onclick = function () {
      currentGameIdx = gIdx;
      showBuild(inst);
    };
  }

  // ── Build ──
  function showBuild(instrument) {
    showScreen('build');
    var game = games[currentGameIdx];
    var playerIdx = (netMode !== 'local') ? myPlayerIndex : currentTurnPlayer;
    var isOwn = game.enteredBy === playerIdx;

    var showSong = gameSettings.blind ? false : (isOwn || currentRound === 0);
    document.getElementById('build-song').textContent = showSong ? game.songName : '???';

    var badge = document.getElementById('build-instrument');
    badge.textContent = instrument + (gameSettings.speed ? ' SPEED' : '');
    badge.setAttribute('data-inst', instrument);

    // Show/hide sequencers
    var allInsts = BASE_INSTRUMENTS.concat(['sfx', 'vocal']);
    allInsts.forEach(function (i) {
      var el = document.getElementById('seq-' + i);
      if (el) {
        el.style.display = i === instrument ? 'flex' : 'none';
      }
      var bpm = document.getElementById(i + '-bpm-display');
      if (bpm) bpm.textContent = gameBpm + ' BPM';
    });

    // Listen: plays previous layer + current instrument
    var listenBtn = document.getElementById('btn-listen-existing');
    var instIdx = INSTRUMENTS.indexOf(instrument);
    var prevInst = instIdx > 0 ? INSTRUMENTS[instIdx - 1] : null;
    var hasPrev = prevInst && game.submissions[prevInst];
    listenBtn.style.display = hasPrev ? 'flex' : 'none';
    var prevLabel = prevInst ? 'Play with ' + prevInst.charAt(0).toUpperCase() + prevInst.slice(1) : 'Play';
    listenBtn.dataset.label = prevLabel;
    listenBtn.onclick = function () {
      ensureAudio().then(function () {
        // Same rule as the other control: if this one is running, stop;
        // otherwise take over from whatever is.
        if (previewPlaying && previewSource === 'previous') stopPreview();
        else { stopPreview(); startPreview(instrument, true); }
      });
    };
    refreshTransportButtons();

    // Guess section
    var guessSection = document.getElementById('guess-section');
    var guessInput = document.getElementById('guess-input');
    if (currentRound > 0 && !isOwn && !soloMode) {
      guessSection.style.display = 'block';
      guessInput.value = '';
    } else {
      guessSection.style.display = 'none';
    }

    // Timer
    clearInterval(buildTimer);
    if (soloMode) {
      document.getElementById('build-time').textContent = 'No limit';
    } else {
      buildSecondsLeft = getBuildTime();
      updateBuildTimer();
      buildTimer = setInterval(function () {
        buildSecondsLeft--;
        updateBuildTimer();
        if (buildSecondsLeft <= 0) {
          clearInterval(buildTimer);
          if (netMode !== 'local') { submitOnline(instrument); }
          else { submitLayer(instrument); }
        }
      }, 1000);
    }

    initSequencer(instrument);

    document.getElementById('btn-submit').onclick = function () {
      clearInterval(buildTimer);
      submitLayer(instrument);
    };
  }

  function updateBuildTimer() {
    var m = Math.floor(buildSecondsLeft / 60);
    var s = buildSecondsLeft % 60;
    document.getElementById('build-time').textContent = m + ':' + s.toString().padStart(2, '0');
  }

  function submitLayer(instrument) {
    stopPreview();
    var data = collectData(instrument);
    var game = games[currentGameIdx];
    game.submissions[instrument] = { data: data, bpm: gameBpm, playerIndex: currentTurnPlayer };
    if (instrument === 'bass') game.submissions[instrument].sound = currentBassSound;
    if (instrument === 'melody') {
      game.submissions[instrument].sound = currentMelodySound;
      if (currentMelodySound === PRODUCER_SOUND) game.submissions[instrument].patch = normalisePatch(melodyPatch);
    }

    if (currentRound > 0 && game.enteredBy !== currentTurnPlayer && !soloMode) {
      var guess = document.getElementById('guess-input').value.trim();
      if (guess) game.guesses.push({ playerIndex: currentTurnPlayer, guess: guess, round: currentRound, instrument: instrument });
    }

    if (soloMode) {
      soloInstIdx++;
      if (soloInstIdx < INSTRUMENTS.length) {
        toast(instrument + ' done! Next: ' + INSTRUMENTS[soloInstIdx]);
        setTimeout(startSoloBuild, 600);
      } else {
        toast('All layers done!');
        if (gameSettings.buildup) { setTimeout(function () { showBuildupReveal(0); }, 600); }
        else { setTimeout(showReveal, 600); }
      }
      return;
    }

    toast('Layer submitted!');
    currentTurnPlayer++;
    setTimeout(nextTurn, 600);
  }

  function collectData(instrument) {
    if (instrument === 'drums') {
      var grid = {};
      DRUM_NAMES.forEach(function (name) {
        grid[name] = [];
        for (var s = 0; s < STEPS; s++) {
          var cell = document.querySelector('#drum-grid .drum-cell[data-name="' + name + '"][data-step="' + s + '"]');
          grid[name].push(cell && cell.classList.contains('on'));
        }
      });
      return grid;
    }
    if (instrument === 'sfx') {
      var sfxGrid = {};
      SFX_NAMES.forEach(function (name) {
        sfxGrid[name] = [];
        for (var s = 0; s < STEPS; s++) {
          var cell = document.querySelector('#sfx-grid .drum-cell[data-name="' + name + '"][data-step="' + s + '"]');
          sfxGrid[name].push(cell && cell.classList.contains('on'));
        }
      });
      return sfxGrid;
    }
    if (instrument === 'vocal') {
      return vocalClip
        ? { dataUrl: vocalClip.dataUrl, start: vocalClip.start, steps: vocalClip.steps }
        : { dataUrl: null };
    }
    return pianoRollNotes.slice();
  }

  // ── Sequencer Init ──
  function initSequencer(instrument) {
    pianoRollNotes = [];
    if (instrument === 'drums') initDrumGrid();
    else if (instrument === 'chords') initPianoRoll('chords', NOTE_NAMES_CHORDS, true, true);
    else if (instrument === 'bass') initPianoRoll('bass', NOTE_NAMES_BASS, false);
    else if (instrument === 'melody') initPianoRoll('melody', NOTE_NAMES_MELODY, true);
    else if (instrument === 'sfx') initSfxGrid();
    else if (instrument === 'vocal') {
      initVocalRecorder();
      return;
    }

    var playBtn = document.getElementById(instrument + '-play');
    playBtn.onclick = function () {
      ensureAudio().then(function () {
        // Playing from the other control counts as playing: switch to this one
        // rather than needing a stop first.
        if (previewPlaying && previewSource === 'current') stopPreview();
        else { stopPreview(); startPreview(instrument, false); }
      });
    };
  }

  // Both play controls reflect one piece of state, so neither can be left
  // showing "Stop" while the other is the one running.
  function refreshTransportButtons() {
    INSTRUMENTS.forEach(function (inst) {
      var pi = document.getElementById(inst + '-play-icon');
      var si = document.getElementById(inst + '-stop-icon');
      var on = previewPlaying && previewSource === 'current';
      if (pi) pi.style.display = on ? 'none' : 'block';
      if (si) si.style.display = on ? 'block' : 'none';
    });
    var listenBtn = document.getElementById('btn-listen-existing');
    if (listenBtn && listenBtn.dataset.label) {
      var playing = previewPlaying && previewSource === 'previous';
      listenBtn.innerHTML = playing
        ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg> Stop'
        : '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="7,4 21,12 7,20"/></svg> ' + listenBtn.dataset.label;
    }
  }

  // A bar ruler above the lanes. On a phone the grid scrolls sideways, so
  // without it there is nothing to count against once step 1 is off screen.
  function buildStepRuler() {
    var row = document.createElement('div');
    row.className = 'drum-row drum-ruler';
    row.innerHTML = '<span class="drum-label"></span>';
    for (var s = 0; s < STEPS; s++) {
      var tick = document.createElement('div');
      tick.className = 'drum-tick' + (s % 4 === 0 ? ' beat' : '');
      tick.textContent = s % 4 === 0 ? String(s / 4 + 1) : '';
      row.appendChild(tick);
    }
    return row;
  }

  // Quick fill works off an anchor: the last step you switched on. A fill
  // then rewrites that one lane with a hit on the anchor and every Nth step
  // after it. Rewriting rather than adding keeps the buttons switchable —
  // pressing Quarter after Eighth leaves you with quarters, not both.
  var fillAnchor = null;

  function setFillAnchor(name, step) {
    fillAnchor = { name: name, step: step };
    updateFillBar();
  }

  function clearFillActive() {
    document.querySelectorAll('.fill-btn.active').forEach(function (b) {
      b.classList.remove('active');
    });
  }

  function updateFillBar() {
    var hint = document.getElementById('fill-hint');
    var btns = document.querySelectorAll('.fill-btn');
    if (!btns.length) return;
    btns.forEach(function (b) { b.disabled = !fillAnchor; });
    if (!hint) return;
    hint.textContent = fillAnchor
      ? 'Filling ' + fillAnchor.name + ' from step ' + (fillAnchor.step + 1)
      : 'Tap a step, then a fill — it repeats from there';
  }

  function fillDrumLane(every) {
    if (!fillAnchor) return;
    var start = fillAnchor.step;
    for (var s = 0; s < STEPS; s++) {
      var cell = document.querySelector(
        '#drum-grid .drum-cell[data-name="' + fillAnchor.name + '"][data-step="' + s + '"]');
      if (!cell) continue;
      cell.classList.toggle('on', s >= start && (s - start) % every === 0);
    }
  }

  function initFillBar() {
    document.querySelectorAll('.fill-btn').forEach(function (btn) {
      btn.onclick = function () {
        if (!fillAnchor) return;
        fillDrumLane(+btn.dataset.every);
        clearFillActive();
        btn.classList.add('active');
      };
    });
    updateFillBar();
  }

  function initDrumGrid() {
    var grid = document.getElementById('drum-grid');
    grid.innerHTML = '';
    grid.appendChild(buildStepRuler());
    fillAnchor = null;
    clearFillActive();
    DRUM_NAMES.forEach(function (name) {
      var row = document.createElement('div');
      row.className = 'drum-row';
      row.innerHTML = '<span class="drum-label">' + name + '</span>';
      for (var s = 0; s < STEPS; s++) {
        var cell = document.createElement('div');
        cell.className = 'drum-cell' + (s % 4 === 0 ? ' beat' : '');
        cell.dataset.name = name;
        cell.dataset.step = s;
        cell.addEventListener('pointerdown', (function (c) {
          return function () {
            c.classList.toggle('on');
            // The anchor is the last step you touched, on or off. Only moving
            // it on an on-tap left the hint naming a lane you had since left.
            // A hand-placed step also means the lane no longer matches
            // whichever fill produced it.
            clearFillActive();
            setFillAnchor(c.dataset.name, +c.dataset.step);
          };
        })(cell));
        row.appendChild(cell);
      }
      grid.appendChild(row);
    });
    initFillBar();
  }

  function initSfxGrid() {
    var grid = document.getElementById('sfx-grid');
    grid.innerHTML = '';
    grid.appendChild(buildStepRuler());
    SFX_NAMES.forEach(function (name) {
      var row = document.createElement('div');
      row.className = 'drum-row';
      row.innerHTML = '<span class="drum-label">' + name + '</span>';
      for (var s = 0; s < STEPS; s++) {
        var cell = document.createElement('div');
        cell.className = 'drum-cell' + (s % 4 === 0 ? ' beat' : '');
        cell.dataset.name = name;
        cell.dataset.step = s;
        cell.addEventListener('pointerdown', (function (c) { return function () { c.classList.toggle('on'); }; })(cell));
        row.appendChild(cell);
      }
      grid.appendChild(row);
    });
  }

  // Furthest left a block can be dragged before it would run into the block
  // in front of it. `laneNote` limits the check to one pitch row; pass null
  // when any block blocks (monophonic bass, and the single chord lane).
  function leftBoundFor(notes, idx, anchorEnd, laneNote) {
    var limit = 0;
    for (var i = 0; i < notes.length; i++) {
      if (i === idx) continue;
      var n = notes[i];
      if (laneNote !== null && n.note !== laneNote) continue;
      var nEnd = n.start + n.length;
      if (nEnd <= anchorEnd && nEnd > limit) limit = nEnd;
    }
    return limit;
  }

  // ── Chord roll ──
  // Chords live on a piano roll like every other pitched part. The row you
  // click is the root; the selector only chooses the quality. Stacks stay
  // grouped so they behave like one pad rather than loose notes.
  let selectedQuality = CHORD_QUALITIES[0];
  let chordPlaceMode = 'chord';
  let chordGroupSeq = 0;

  function buildChordBar() {
    var bar = document.createElement('div');
    bar.className = 'chord-bar';

    var qLabel = document.createElement('span');
    qLabel.className = 'chord-bar-label';
    qLabel.textContent = 'Chord';
    bar.appendChild(qLabel);

    var sel = document.createElement('select');
    sel.className = 'chord-select';
    CHORD_QUALITIES.forEach(function (q, i) {
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = q.label;
      if (q === selectedQuality) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.onchange = function () { selectedQuality = CHORD_QUALITIES[+sel.value]; };
    bar.appendChild(sel);

    var modes = document.createElement('div');
    modes.className = 'chord-mode-toggle';
    [['chord', 'Chord'], ['note', 'Single note']].forEach(function (m) {
      var b = document.createElement('button');
      b.className = 'mode-btn' + (chordPlaceMode === m[0] ? ' active' : '');
      b.textContent = m[1];
      b.onclick = function () {
        modes.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        chordPlaceMode = m[0];
      };
      modes.appendChild(b);
    });
    bar.appendChild(modes);

    var hint = document.createElement('span');
    hint.className = 'chord-bar-hint';
    hint.textContent = 'click a row to place it there';
    bar.appendChild(hint);

    return bar;
  }

  // Which edge of a block the pointer landed on, or null for its middle.
  function grabbedEdge(rect, clientX) {
    var x = clientX - rect.left;
    var grip = Math.min(12, rect.width / 3);
    if (x < grip) return 'left';
    if (x > rect.width - grip) return 'right';
    return null;
  }

  function buildProducerPanel() {
    var panel = document.createElement('div');
    panel.className = 'producer-panel';

    var waveRow = document.createElement('div');
    waveRow.className = 'producer-waves';
    PRODUCER_WAVES.forEach(function (w) {
      var b = document.createElement('button');
      b.className = 'wave-btn' + (melodyPatch.wave === w ? ' active' : '');
      b.title = w;
      b.appendChild(waveIcon(w));
      b.onclick = function () {
        waveRow.querySelectorAll('.wave-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        melodyPatch.wave = w;
        repatch();
      };
      waveRow.appendChild(b);
    });
    panel.appendChild(waveRow);

    var knobs = document.createElement('div');
    knobs.className = 'producer-knobs';
    function secs(v) { return (+v).toFixed(2) + 's'; }
    [
      { key: 'cutoff', label: 'Cutoff', log: true, live: true,
        fmt: function (v) { return v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v) + 'Hz'; } },
      { key: 'attack', label: 'Attack', min: 0.001, max: 2, step: 0.001, fmt: secs },
      { key: 'decay', label: 'Decay', min: 0.001, max: 2, step: 0.001, fmt: secs },
      { key: 'sustain', label: 'Sustain', min: 0, max: 1, step: 0.01,
        fmt: function (v) { return Math.round(v * 100) + '%'; } },
      { key: 'release', label: 'Release', min: 0.001, max: 2, step: 0.001, fmt: secs }
    ].forEach(function (c) {
      var wrap = document.createElement('label');
      wrap.className = 'producer-knob' + (c.log ? ' knob-wide' : '');
      var name = document.createElement('span');
      name.className = 'knob-label';
      name.textContent = c.label;
      var val = document.createElement('span');
      val.className = 'knob-value';
      val.textContent = c.fmt(melodyPatch[c.key]);
      var slider = document.createElement('input');
      slider.type = 'range';
      if (c.log) {
        slider.min = 0; slider.max = 1; slider.step = 0.001;
        slider.value = cutoffToSlider(melodyPatch[c.key]);
      } else {
        slider.min = c.min; slider.max = c.max; slider.step = c.step;
        slider.value = melodyPatch[c.key];
      }
      slider.oninput = function () {
        var v = c.log ? sliderToCutoff(+slider.value) : +slider.value;
        melodyPatch[c.key] = v;
        val.textContent = c.fmt(v);
        // A cutoff sweep updates the live filter; everything else needs the
        // voices rebuilt, which is debounced so dragging does not thrash.
        if (c.live && synths.melody && synths.melody.setCutoff) synths.melody.setCutoff(v);
        else repatch();
      };
      wrap.appendChild(name);
      wrap.appendChild(slider);
      wrap.appendChild(val);
      knobs.appendChild(wrap);
    });
    panel.appendChild(knobs);

    var footer = document.createElement('div');
    footer.className = 'producer-footer';
    var preview = document.createElement('button');
    preview.className = 'btn-secondary btn-sm';
    preview.textContent = 'Hear it';
    preview.onclick = function () {
      ensureAudio().then(function () {
        var s = getOrCreateMelodySynth();
        var now = Tone.now();
        ['C4', 'E4', 'G4'].forEach(function (n, i) { s.play(n, 0.4, now + i * 0.16); });
      });
    };
    var reset = document.createElement('button');
    reset.className = 'btn-text';
    reset.textContent = 'Reset';
    reset.onclick = function () {
      melodyPatch = Object.assign({}, PRODUCER_DEFAULT);
      var fresh = buildProducerPanel();
      fresh.style.display = 'flex';
      panel.replaceWith(fresh);
      repatch();
    };
    footer.appendChild(preview);
    footer.appendChild(reset);
    panel.appendChild(footer);

    return panel;
  }

  // Tone has no live patch update for PolySynth voices, so rebuild on change —
  // debounced, or dragging a slider disposes and recreates the synth per tick.
  var repatchTimer = null;
  function repatch() {
    if (currentMelodySound !== PRODUCER_SOUND) return;
    clearTimeout(repatchTimer);
    repatchTimer = setTimeout(function () {
      ensureAudio().then(getOrCreateMelodySynth);
    }, 120);
  }

  function waveIcon(type) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 32 16');
    svg.setAttribute('width', '30');
    svg.setAttribute('height', '15');
    var d = {
      sine: 'M1 8 Q5 0 9 8 T17 8 T25 8 T31 8',
      triangle: 'M1 13 L7 3 L13 13 L19 3 L25 13 L31 5',
      sawtooth: 'M1 13 L8 3 L8 13 L15 3 L15 13 L22 3 L22 13 L29 3',
      square: 'M1 13 L1 3 L8 3 L8 13 L15 13 L15 3 L22 3 L22 13 L29 13 L29 3'
    }[type];
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
    return svg;
  }

  // ── Piano Roll (bass/melody with edge-drag) ──
  function initPianoRoll(inst, noteNames, polyphonic, chordMode) {
    updateGridMetrics();
    rollRebuild = function () { initPianoRoll(inst, noteNames, polyphonic, chordMode); };
    var grid = document.getElementById(inst + '-grid');
    grid.innerHTML = '';
    pianoRollNotes = [];

    var wrapper = document.createElement('div');
    wrapper.className = 'piano-roll-wrapper';

    // Sound selector
    var soundBar = document.createElement('div');
    soundBar.className = 'sound-selector';
    var curSound = inst === 'bass' ? currentBassSound : (inst === 'chords' ? currentChordSound : currentMelodySound);
    soundNamesFor(inst).forEach(function (name) {
      var btn = document.createElement('button');
      btn.className = 'sound-btn' + (name === curSound ? ' active' : '');
      btn.textContent = name;
      btn.onclick = function () {
        soundBar.querySelectorAll('.sound-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        if (inst === 'bass') { currentBassSound = name; getOrCreateBassSynth(); }
        else if (inst === 'chords') { currentChordSound = name; getOrCreateChordSynth(); }
        else { currentMelodySound = name; getOrCreateMelodySynth(); }
      };
      soundBar.appendChild(btn);
    });

    var producerPanel = null;
    if (inst === 'melody') {
      var pBtn = document.createElement('button');
      pBtn.className = 'sound-btn sound-btn-producer' + (curSound === PRODUCER_SOUND ? ' active' : '');
      pBtn.textContent = PRODUCER_SOUND;
      pBtn.onclick = function () {
        soundBar.querySelectorAll('.sound-btn').forEach(function (b) { b.classList.remove('active'); });
        pBtn.classList.add('active');
        currentMelodySound = PRODUCER_SOUND;
        getOrCreateMelodySynth();
        producerPanel.style.display = 'flex';
      };
      // First, not last: the bar scrolls horizontally and nobody finds the
      // far right of it on a phone.
      soundBar.insertBefore(pBtn, soundBar.firstChild);

      // Selecting any stock sound hides the panel again.
      soundBar.querySelectorAll('.sound-btn:not(.sound-btn-producer)').forEach(function (b) {
        var prev = b.onclick;
        b.onclick = function (e) { prev.call(b, e); producerPanel.style.display = 'none'; };
      });
    }

    wrapper.appendChild(soundBar);
    if (chordMode) wrapper.appendChild(buildChordBar());
    if (inst === 'melody') {
      producerPanel = buildProducerPanel();
      producerPanel.style.display = currentMelodySound === PRODUCER_SOUND ? 'flex' : 'none';
      wrapper.appendChild(producerPanel);
    }

    var rollContainer = document.createElement('div');
    rollContainer.className = 'piano-roll';

    var canvas = document.createElement('div');
    canvas.className = 'piano-roll-canvas';

    var reversed = noteNames.slice().reverse();
    var cellH = CELL_H;
    rollRedraw = function () { renderPR(inst, reversed, cellH); };

    canvas.style.width = (LABEL_W + STEPS * CELL_W) + 'px';
    canvas.style.height = (reversed.length * cellH) + 'px';
    canvas.style.position = 'relative';

    reversed.forEach(function (name, ri) {
      var label = document.createElement('div');
      label.className = 'pr-label' + (isSharp(name) ? ' pr-label-sharp' : '');
      label.style.top = (ri * cellH) + 'px';
      label.style.height = cellH + 'px';
      label.style.lineHeight = cellH + 'px';
      label.textContent = name;
      canvas.appendChild(label);

      for (var s = 0; s < STEPS; s++) {
        var cell = document.createElement('div');
        cell.className = 'pr-cell' + (s % 4 === 0 ? ' pr-beat' : '') + (isSharp(name) ? ' pr-sharp' : '');
        cell.style.left = (LABEL_W + s * CELL_W) + 'px';
        cell.style.top = (ri * cellH) + 'px';
        cell.style.width = CELL_W + 'px';
        cell.style.height = cellH + 'px';
        cell.dataset.note = name;
        cell.dataset.step = s;
        cell.dataset.row = ri;
        canvas.appendChild(cell);
      }
    });

    var notesLayer = document.createElement('div');
    notesLayer.className = 'pr-notes-layer';
    notesLayer.id = inst + '-notes-layer';
    canvas.appendChild(notesLayer);

    var ph = document.createElement('div');
    ph.className = 'pr-playhead';
    ph.id = inst + '-playhead';
    ph.style.display = 'none';
    canvas.appendChild(ph);

    rollContainer.appendChild(canvas);
    wrapper.appendChild(rollContainer);
    grid.appendChild(wrapper);

    // Interaction: edge-drag resize
    var resizing = null;

    canvas.addEventListener('pointerdown', function (e) {
      var block = e.target.closest('.pr-note-block');
      if (block) {
        var idx = +block.dataset.index;
        var edge = grabbedEdge(block.getBoundingClientRect(), e.clientX);
        var grabbed = pianoRollNotes[idx];
        if (edge && grabbed) {
          resizing = { noteIdx: idx, edge: edge, anchorEnd: grabbed.start + grabbed.length };
          canvas.setPointerCapture(e.pointerId);
          e.preventDefault();
        } else {
          removeNoteAt(idx);
          renderPR(inst, reversed, cellH);
        }
        return;
      }

      var cell = e.target.closest('.pr-cell');
      if (!cell) return;
      var step = +cell.dataset.step;
      var noteName = cell.dataset.note;

      var existing = pianoRollNotes.findIndex(function (n) {
        return n.note === noteName && step >= n.start && step < n.start + n.length;
      });
      if (existing >= 0) {
        removeNoteAt(existing);
        renderPR(inst, reversed, cellH);
        return;
      }

      if (!polyphonic) {
        pianoRollNotes = pianoRollNotes.filter(function (n) {
          return n.start + n.length <= step || n.start > step;
        });
      }

      var placed;
      if (chordMode && chordPlaceMode === 'chord') {
        var gid = 'g' + (++chordGroupSeq);
        placed = chordFromPitch(noteName, selectedQuality, noteToMidi(noteNames[noteNames.length - 1]))
          .map(function (n) { return { note: n, start: step, length: 1, chord: gid }; });
      } else {
        placed = [{ note: noteName, start: step, length: 1 }];
      }
      placed.forEach(function (n) { pianoRollNotes.push(n); });
      renderPR(inst, reversed, cellH);

      resizing = { noteIdx: pianoRollNotes.length - 1, edge: 'right' };
      canvas.setPointerCapture(e.pointerId);

      ensureAudio().then(function () {
        if (inst === 'bass') { if (!synths.bass) getOrCreateBassSynth(); synths.bass.play(noteName, '16n'); }
        else if (inst === 'chords') {
          if (!synths.chords) synths.chords = createChordSynth();
          synths.chords.play(placed.map(function (n) { return n.note; }), '8n');
        }
        else { if (!synths.melody) getOrCreateMelodySynth(); synths.melody.play(noteName, '16n'); }
      });
    });

    // Deleting or resizing one note of a chord acts on the whole stack.
    function groupIdxs(idx) {
      var n = pianoRollNotes[idx];
      if (!n || !n.chord) return [idx];
      var out = [];
      pianoRollNotes.forEach(function (m, i) { if (m.chord === n.chord && m.start === n.start) out.push(i); });
      return out;
    }
    function removeNoteAt(idx) {
      var kill = groupIdxs(idx).sort(function (a, b) { return b - a; });
      kill.forEach(function (i) { pianoRollNotes.splice(i, 1); });
    }

    canvas.addEventListener('pointermove', function (e) {
      if (!resizing) return;
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var step = Math.floor((x - LABEL_W) / CELL_W);
      var note = pianoRollNotes[resizing.noteIdx];
      if (!note) return;

      var siblings = groupIdxs(resizing.noteIdx).map(function (i) { return pianoRollNotes[i]; });

      if (resizing.edge === 'left') {
        // The right edge stays put; the start slides and the length follows.
        var end = resizing.anchorEnd;
        var floor = 0;
        siblings.forEach(function (sn) {
          var i = pianoRollNotes.indexOf(sn);
          floor = Math.max(floor, leftBoundFor(pianoRollNotes, i, end, polyphonic ? sn.note : null));
        });
        var newStart = Math.max(floor, Math.min(end - 1, step));
        if (newStart !== note.start) {
          siblings.forEach(function (sn) { sn.start = newStart; sn.length = end - newStart; });
          renderPR(inst, reversed, cellH);
        }
        return;
      }

      var newLen = Math.max(1, Math.min(STEPS - note.start, step - note.start + 1));
      if (!polyphonic) {
        var next = pianoRollNotes.find(function (n) { return n !== note && n.note === note.note && n.start > note.start; });
        if (next && note.start + newLen > next.start) return;
      }
      if (newLen !== note.length) {
        siblings.forEach(function (sn) { sn.length = newLen; });
        renderPR(inst, reversed, cellH);
      }
    });

    canvas.addEventListener('pointerup', function () { resizing = null; });
  }

  // Crossing the phone/desktop breakpoint (usually a rotation) needs the roll
  // rebuilt at the new metrics. initPianoRoll clears the notes, so they are
  // carried across by hand.
  let rollRebuild = null;
  let rollRedraw = null;
  let lastPhoneLayout = isPhoneLayout();

  window.addEventListener('resize', function () {
    var phone = isPhoneLayout();
    if (phone === lastPhoneLayout) return;
    lastPhoneLayout = phone;
    if (rollRebuild) {
      var saved = pianoRollNotes.slice();
      rollRebuild();
      pianoRollNotes = saved;
      if (rollRedraw) rollRedraw();
    }
    if (document.getElementById('vocal-timeline')) renderVocalTimeline();
  });

  function renderPR(inst, noteNames, cellH) {
    var layer = document.getElementById(inst + '-notes-layer');
    if (!layer) return;
    layer.innerHTML = '';

    pianoRollNotes.forEach(function (n, i) {
      var rowIdx = noteNames.indexOf(n.note);
      if (rowIdx < 0) return;

      var block = document.createElement('div');
      block.className = 'pr-note-block';
      block.dataset.index = i;
      block.dataset.inst = inst;
      block.style.left = (LABEL_W + n.start * CELL_W) + 'px';
      block.style.top = (rowIdx * cellH + 1) + 'px';
      block.style.width = (n.length * CELL_W - 1) + 'px';
      block.style.height = (cellH - 2) + 'px';

      var handle = document.createElement('div');
      handle.className = 'pr-resize-handle';
      block.appendChild(handle);

      if (n.length > 1) {
        var lbl = document.createElement('span');
        lbl.className = 'pr-note-label';
        lbl.textContent = n.note;
        block.appendChild(lbl);
      }

      layer.appendChild(block);
    });
  }

  // ── Chord Timeline (Klimper-style single line) ──

  // ── Preview ──
  function startPreview(instrument, includePrevious) {
    // Never drop sequence references on the floor: a second start used to leak
    // the previous run's sequences, which kept stacking voices.
    disposePreviewSeqs();
    Tone.Transport.bpm.value = gameBpm;
    Tone.Transport.stop();
    Tone.Transport.cancel();
    previewPlaying = true;
    previewSource = includePrevious ? 'previous' : 'current';
    previewSeqs = [];
    refreshTransportButtons();

    if (includePrevious && currentGameIdx >= 0 && games[currentGameIdx]) {
      addExistingLayerSeqs(currentGameIdx, instrument, previewSeqs);
    }

    if (instrument === 'drums') {
      if (!synths.drums) synths.drums = createDrumSynth();
      var seq = new Tone.Sequence(safeStep(function (time, s) {
        Tone.Draw.schedule(function () { highlightDrumStep(s); }, time);
        DRUM_NAMES.forEach(function (name) {
          var cell = document.querySelector('#drum-grid .drum-cell[data-name="' + name + '"][data-step="' + s + '"]');
          if (cell && cell.classList.contains('on')) synths.drums.trigger(name, time);
        });
      }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0);
      previewSeqs.push(seq);
    } else if (instrument === 'sfx') {
      if (!synths.sfx) synths.sfx = createSfxSynth();
      var sfxSeq = new Tone.Sequence(safeStep(function (time, s) {
        Tone.Draw.schedule(function () { highlightSfxStep(s); }, time);
        SFX_NAMES.forEach(function (name) {
          var cell = document.querySelector('#sfx-grid .drum-cell[data-name="' + name + '"][data-step="' + s + '"]');
          if (cell && cell.classList.contains('on')) synths.sfx.trigger(name, time);
        });
      }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0);
      previewSeqs.push(sfxSeq);
    } else if (instrument === 'vocal') {
      pendingAudioLoads.push(addVocalToTransport({ data: vocalClip }, previewSeqs));
    } else {
      if (instrument === 'chords') { if (!synths.chords) synths.chords = createChordSynth(); }
      else if (instrument === 'bass') { if (!synths.bass) getOrCreateBassSynth(); }
      else { if (!synths.melody) getOrCreateMelodySynth(); }

      var seq2 = new Tone.Sequence(safeStep(function (time, s) {
        Tone.Draw.schedule(function () { showPlayhead(instrument, s); }, time);
        // Read the live array every step, never a captured reference.
        pianoRollNotes.forEach(function (n) {
          if (n.start === s) {
            var dur = n.length * Tone.Time('16n').toSeconds();
            if (instrument === 'chords') { synths.chords.play(n.note, dur, time); }
            else if (instrument === 'bass') { synths.bass.play(n.note, dur, time); }
            else { synths.melody.play(n.note, dur, time); }
          }
        });
      }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0);
      previewSeqs.push(seq2);
    }

    startTransportWhenReady();
  }

  function addExistingLayerSeqs(gameIdx, currentInst, seqs) {
    var game = games[gameIdx];
    var curIdx = INSTRUMENTS.indexOf(currentInst);
    var prevInst = curIdx > 0 ? INSTRUMENTS[curIdx - 1] : null;
    if (!prevInst) return;

    var allowedInsts = [prevInst];
    allowedInsts.forEach(function (inst) {
      var sub = game.submissions[inst];
      if (!sub) return;

      if (gameSettings.remix) {
        var remixed = { data: remixLayerData(inst, sub.data), sound: sub.sound };
        addLayerSeq(inst, remixed, seqs);
      } else {
        addLayerSeq(inst, sub, seqs);
      }
    });
  }

  function addLayerSeq(inst, sub, seqs) {
    if (inst === 'drums') {
      if (!synths.bgDrums) synths.bgDrums = createDrumSynth();
      var data = sub.data;
      seqs.push(new Tone.Sequence(safeStep(function (time, s) {
        DRUM_NAMES.forEach(function (name) { if (data[name] && data[name][s]) synths.bgDrums.trigger(name, time); });
      }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
    } else if (inst === 'sfx') {
      if (!synths.bgSfx) synths.bgSfx = createSfxSynth();
      var sfxData = sub.data;
      seqs.push(new Tone.Sequence(safeStep(function (time, s) {
        SFX_NAMES.forEach(function (name) { if (sfxData[name] && sfxData[name][s]) synths.bgSfx.trigger(name, time); });
      }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
    } else if (inst === 'chords') {
      if (!synths.bgChords) synths.bgChords = createChordSynth();
      var notes = sub.data;
      seqs.push(new Tone.Sequence(safeStep(function (time, s) {
        notes.forEach(function (n) {
          if (n.start === s) synths.bgChords.play(n.note, n.length * Tone.Time('16n').toSeconds(), time);
        });
      }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
    } else if (inst === 'bass') {
      if (!synths.bgBass) synths.bgBass = createInstrument('bass', sub.sound || 'Analog Bass', false);
      var bnotes = sub.data;
      seqs.push(new Tone.Sequence(safeStep(function (time, s) {
        bnotes.forEach(function (n) { if (n.start === s) synths.bgBass.play(n.note, n.length * Tone.Time('16n').toSeconds(), time); });
      }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
    } else if (inst === 'melody') {
      if (!synths.bgMelody) synths.bgMelody = createInstrument('melody', sub.sound || 'Piano', true, sub.patch);
      var mnotes = sub.data;
      seqs.push(new Tone.Sequence(safeStep(function (time, s) {
        mnotes.forEach(function (n) { if (n.start === s) synths.bgMelody.play(n.note, n.length * Tone.Time('16n').toSeconds(), time); });
      }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
    } else if (inst === 'vocal' && sub.data && sub.data.dataUrl) {
      pendingAudioLoads.push(addVocalToTransport(sub, seqs));
    }
  }

  function playExistingOnly(gameIdx) {
    disposePreviewSeqs();
    Tone.Transport.bpm.value = gameBpm;
    Tone.Transport.stop();
    Tone.Transport.cancel();
    previewPlaying = true;
    previewSource = 'previous';
    previewSeqs = [];
    addExistingLayerSeqs(gameIdx, null, previewSeqs);
    startTransportWhenReady();
  }

  function disposePreviewSeqs() {
    previewSeqs.forEach(function (s) { try { s.dispose(); } catch (e) {} });
    previewSeqs = [];
  }

  function stopPreview() {
    previewPlaying = false;
    previewSource = null;
    cancelPendingPlayback();
    disposePreviewSeqs();
    Tone.Transport.stop();
    Tone.Transport.cancel();
    ['bgDrums', 'bgChords', 'bgBass', 'bgMelody', 'bgSfx'].forEach(function (k) {
      if (synths[k]) { synths[k].dispose(); synths[k] = null; }
    });
    document.querySelectorAll('.drum-cell.playing').forEach(function (el) { el.classList.remove('playing'); });
    document.querySelectorAll('.pr-playhead').forEach(function (el) { el.style.display = 'none'; });
    refreshTransportButtons();
  }

  function highlightDrumStep(step) {
    document.querySelectorAll('#drum-grid .drum-cell.playing').forEach(function (el) { el.classList.remove('playing'); });
    document.querySelectorAll('#drum-grid .drum-cell[data-step="' + step + '"]').forEach(function (el) { el.classList.add('playing'); });
  }

  function highlightSfxStep(step) {
    document.querySelectorAll('#sfx-grid .drum-cell.playing').forEach(function (el) { el.classList.remove('playing'); });
    document.querySelectorAll('#sfx-grid .drum-cell[data-step="' + step + '"]').forEach(function (el) { el.classList.add('playing'); });
  }

  function showPlayhead(inst, step) {
    var ph = document.getElementById(inst + '-playhead');
    if (!ph) return;
    var offset = inst === 'chords' ? 0 : LABEL_W;
    ph.style.display = 'block';
    ph.style.left = (offset + step * CELL_W) + 'px';
  }

  // ── Reveal ──
  function showReveal() {
    showRevealForSong(0);
  }

  function showRevealForSong(idx) {
    showScreen('listen');
    var game = games[idx];
    document.getElementById('listen-song').textContent = game.songName;

    var layersEl = document.getElementById('listen-layers');
    layersEl.innerHTML = '';
    INSTRUMENTS.forEach(function (inst) {
      var sub = game.submissions[inst];
      var card = document.createElement('div');
      card.className = 'layer-card';
      var pName = sub && players[sub.playerIndex] ? players[sub.playerIndex].name : '-';
      var status = sub ? (sub.sound || 'Recorded') : 'Empty';
      card.innerHTML = '<span class="layer-badge" data-inst="' + inst + '">' + inst + '</span>' +
        '<span class="layer-player">' + esc(pName) + '</span>' +
        '<span class="layer-status">' + esc(status) + '</span>';
      layersEl.appendChild(card);
    });

    // Guesses
    var guessesEl = document.getElementById('listen-guesses');
    guessesEl.innerHTML = '';
    if (game.guesses.length > 0) {
      guessesEl.style.display = 'flex';
      var title = document.createElement('h4');
      title.className = 'guesses-title';
      title.textContent = 'Guesses';
      guessesEl.appendChild(title);
      game.guesses.forEach(function (g) {
        var row = document.createElement('div');
        row.className = 'guess-row';
        var isCorrect = g.guess.toLowerCase().trim() === game.songName.toLowerCase().trim();
        row.innerHTML = '<span class="guess-player">' + esc(players[g.playerIndex] ? players[g.playerIndex].name : '?') + '</span>' +
          '<span class="guess-text">"' + esc(g.guess) + '"</span>' +
          '<span class="guess-badge ' + (isCorrect ? 'correct' : 'wrong') + '">' + (isCorrect ? 'Correct!' : 'Nope') + '</span>';
        guessesEl.appendChild(row);
      });
    } else {
      guessesEl.style.display = 'none';
    }

    // Song counter
    var songCounter = document.getElementById('listen-counter');
    if (songCounter) {
      songCounter.textContent = games.length > 1 ? 'Song ' + (idx + 1) + ' of ' + games.length : '';
    }

    // Playback
    var allSeqs = [];
    var playBtn = document.getElementById('btn-play-all');
    var stopBtn = document.getElementById('btn-stop-all');
    playBtn.style.display = 'flex';
    stopBtn.style.display = 'none';

    playBtn.onclick = function () {
      ensureAudio().then(function () {
        playBtn.style.display = 'none';
        stopBtn.style.display = 'flex';
        playAllLayersForGame(idx, allSeqs);
      });
    };
    stopBtn.onclick = function () {
      stopAllLayers(allSeqs);
      allSeqs = [];
      playBtn.style.display = 'flex';
      stopBtn.style.display = 'none';
    };

    var nextBtn = document.getElementById('btn-play-again');
    var backBtn = document.getElementById('btn-back-lobby');

    if (games.length > 1 && idx < games.length - 1) {
      nextBtn.textContent = 'Next Song';
      nextBtn.onclick = function () { stopAllLayers(allSeqs); allSeqs = []; showRevealForSong(idx + 1); };
    } else if (gameSettings.voting && games.length > 1) {
      nextBtn.textContent = 'Vote';
      nextBtn.onclick = function () { stopAllLayers(allSeqs); allSeqs = []; showSongVote(); };
    } else {
      nextBtn.textContent = 'Play Again';
      nextBtn.onclick = function () {
        stopAllLayers(allSeqs); allSeqs = [];
        if (soloMode) showSoloSetup();
        else if (netMode === 'host' || netMode === 'guest') showOnlineLobby();
        else showLobby();
      };
    }
    backBtn.onclick = function () {
      stopAllLayers(allSeqs); allSeqs = [];
      destroyPeer();
      netMode = 'local';
      showScreen('home');
    };
  }

  function playAllLayersForGame(gameIdx, seqs) {
    var game = games[gameIdx];
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = gameBpm;

    INSTRUMENTS.forEach(function (inst) {
      var sub = game.submissions[inst];
      if (!sub) return;

      if (inst === 'drums') {
        if (!synths.drums) synths.drums = createDrumSynth();
        var data = sub.data;
        seqs.push(new Tone.Sequence(safeStep(function (time, s) {
          DRUM_NAMES.forEach(function (name) { if (data[name] && data[name][s]) synths.drums.trigger(name, time); });
        }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
      } else if (inst === 'chords') {
        if (!synths.chords) synths.chords = createChordSynth();
        var notes = sub.data;
        seqs.push(new Tone.Sequence(safeStep(function (time, s) {
          notes.forEach(function (n) {
            if (n.start === s) synths.chords.play(n.note, n.length * Tone.Time('16n').toSeconds(), time);
          });
        }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
      } else if (inst === 'bass') {
        currentBassSound = sub.sound || 'Analog Bass';
        getOrCreateBassSynth();
        var bnotes = sub.data;
        seqs.push(new Tone.Sequence(safeStep(function (time, s) {
          bnotes.forEach(function (n) { if (n.start === s) synths.bass.play(n.note, n.length * Tone.Time('16n').toSeconds(), time); });
        }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
      } else if (inst === 'melody') {
        currentMelodySound = sub.sound || 'Piano';
        if (sub.patch) melodyPatch = normalisePatch(sub.patch);
        getOrCreateMelodySynth();
        var mnotes = sub.data;
        seqs.push(new Tone.Sequence(safeStep(function (time, s) {
          mnotes.forEach(function (n) { if (n.start === s) synths.melody.play(n.note, n.length * Tone.Time('16n').toSeconds(), time); });
        }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
      } else if (inst === 'sfx') {
        if (!synths.sfx) synths.sfx = createSfxSynth();
        var sfxData = sub.data;
        seqs.push(new Tone.Sequence(safeStep(function (time, s) {
          SFX_NAMES.forEach(function (name) { if (sfxData[name] && sfxData[name][s]) synths.sfx.trigger(name, time); });
        }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
      } else if (inst === 'vocal' && sub.data && sub.data.dataUrl) {
        pendingAudioLoads.push(addVocalToTransport(sub, seqs));
      }
    });

    startTransportWhenReady();
  }

  // ── Voting ──
  const PLAY_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="7,4 21,12 7,20"/></svg>';
  const STOP_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';

  // ── Song vote ──
  // Runs once, after every song has been played through on the reveal screen.
  // One row per song: hear it again, then vote. A device votes once.
  var songVotes = {};       // gameIdx -> count
  var votedPlayers = {};    // host only: playerIndex -> true
  var myVote = null;
  var votersSeen = 0;

  function totalVoters() {
    if (netMode === 'local') return 1;
    // Someone who dropped mid-game keeps their slot so indices stay valid, but
    // they are never going to vote — waiting on them would hang the screen.
    return players.filter(function (p) { return !p.left; }).length || 1;
  }

  function showSongVote() {
    showScreen('voting');
    var optionsEl = document.getElementById('voting-options');
    var resultsEl = document.getElementById('voting-results');
    var statusEl = document.getElementById('voting-status');
    var nextBtn = document.getElementById('btn-vote-next');
    var homeBtn = document.getElementById('btn-vote-home');
    optionsEl.innerHTML = '';
    resultsEl.style.display = 'none';
    nextBtn.style.display = 'none';

    var seqs = [];
    var playingIdx = -1;

    function stopSong() {
      stopAllLayers(seqs);
      playingIdx = -1;
      optionsEl.querySelectorAll('.vote-song-play').forEach(function (b) {
        b.classList.remove('playing');
        b.innerHTML = PLAY_SVG + ' Play';
      });
    }

    games.forEach(function (game, idx) {
      var row = document.createElement('div');
      row.className = 'vote-song';
      row.dataset.idx = idx;
      var author = players[game.enteredBy] ? players[game.enteredBy].name : '';

      var title = document.createElement('div');
      title.className = 'vote-song-title';
      title.innerHTML = '<span class="vote-song-name">' + esc(game.songName) + '</span>' +
        (author ? '<span class="vote-song-by">named by ' + esc(author) + '</span>' : '');

      var play = document.createElement('button');
      play.className = 'vote-song-play';
      play.innerHTML = PLAY_SVG + ' Play';
      play.onclick = function () {
        ensureAudio().then(function () {
          var wasPlaying = playingIdx === idx;
          stopSong();
          if (wasPlaying) return;
          playingIdx = idx;
          play.classList.add('playing');
          play.innerHTML = STOP_SVG + ' Stop';
          playAllLayersForGame(idx, seqs);
        });
      };

      var pick = document.createElement('button');
      pick.className = 'vote-song-pick';
      pick.textContent = 'Vote';
      // Voting for your own song would just be a popularity contest with
      // yourself; only enforceable online, where we know who you are.
      var ownSong = netMode !== 'local' && game.enteredBy === myPlayerIndex;
      if (ownSong) { pick.disabled = true; pick.title = 'You named this one'; }
      pick.onclick = function () {
        if (myVote !== null) return;
        castSongVote(idx);
      };

      var count = document.createElement('span');
      count.className = 'vote-song-count';
      count.textContent = '';

      row.appendChild(title);
      row.appendChild(play);
      row.appendChild(pick);
      row.appendChild(count);
      optionsEl.appendChild(row);
    });

    nextBtn.onclick = function () {
      stopSong();
      if (soloMode) showSoloSetup();
      else if (netMode === 'host' || netMode === 'guest') showOnlineLobby();
      else showLobby();
    };
    homeBtn.onclick = function () {
      stopSong();
      leaveToHome();
    };

    renderSongVotes();
  }

  function castSongVote(idx) {
    myVote = idx;
    if (netMode === 'guest') {
      netSend(hostConn, { type: 'song_vote', gameIdx: idx });
    } else {
      if (netMode === 'host') votedPlayers[myPlayerIndex] = true;
      songVotes[idx] = (songVotes[idx] || 0) + 1;
      votersSeen++;
      if (netMode === 'host') netBroadcast({ type: 'song_votes', votes: songVotes, voters: votersSeen });
    }
    renderSongVotes();
  }

  function renderSongVotes() {
    var optionsEl = document.getElementById('voting-options');
    if (!optionsEl) return;
    var statusEl = document.getElementById('voting-status');
    var nextBtn = document.getElementById('btn-vote-next');
    var need = totalVoters();
    var done = votersSeen >= need;

    var best = -1, bestCount = 0, topCount = 0;
    Object.keys(songVotes).forEach(function (k) {
      if (songVotes[k] > bestCount) { bestCount = songVotes[k]; best = +k; }
    });
    Object.keys(songVotes).forEach(function (k) { if (songVotes[k] === bestCount) topCount++; });
    var tied = topCount > 1;

    optionsEl.querySelectorAll('.vote-song').forEach(function (row) {
      var idx = +row.dataset.idx;
      var pick = row.querySelector('.vote-song-pick');
      var count = row.querySelector('.vote-song-count');
      count.textContent = songVotes[idx] ? songVotes[idx] : '';
      pick.classList.toggle('voted', myVote === idx);
      if (myVote !== null) { pick.disabled = true; pick.textContent = myVote === idx ? 'Voted' : 'Vote'; }
      // Nothing is crowned on a tie; highlighting one of them would be a lie.
      row.classList.toggle('winner', done && !tied && bestCount > 0 && idx === best);
    });

    if (statusEl) {
      if (myVote === null) statusEl.textContent = 'Pick the one you liked best.';
      else if (!done) statusEl.textContent = 'Waiting for the others\u2026 ' + votersSeen + ' of ' + need + ' voted.';
      else if (bestCount > 0) {
        statusEl.textContent = tied
          ? 'It\u2019s a tie \u2014 nobody wins, everybody wins.'
          : '\u201c' + games[best].songName + '\u201d wins with ' + bestCount + ' vote' + (bestCount !== 1 ? 's' : '') + '.';
      }
    }
    if (nextBtn) nextBtn.style.display = done ? 'flex' : 'none';
  }

  // ── Buildup Reveal ──
  function showBuildupReveal(gameIdx) {
    showScreen('listen');
    var game = games[gameIdx];
    document.getElementById('listen-song').textContent = game.songName;
    var songCounter = document.getElementById('listen-counter');
    if (songCounter) songCounter.textContent = games.length > 1 ? 'Song ' + (gameIdx + 1) + ' of ' + games.length : '';

    var layersEl = document.getElementById('listen-layers');
    layersEl.innerHTML = '';
    INSTRUMENTS.forEach(function (inst) {
      var sub = game.submissions[inst];
      var card = document.createElement('div');
      card.className = 'layer-card';
      var pName = sub && players[sub.playerIndex] ? players[sub.playerIndex].name : '-';
      var status = sub ? (sub.sound || 'Recorded') : 'Empty';
      card.innerHTML = '<span class="layer-badge" data-inst="' + inst + '">' + inst + '</span>' +
        '<span class="layer-player">' + esc(pName) + '</span>' +
        '<span class="layer-status">' + esc(status) + '</span>';
      layersEl.appendChild(card);
    });

    var guessesEl = document.getElementById('listen-guesses');
    guessesEl.innerHTML = '';
    guessesEl.style.display = 'none';

    var allSeqs = [];
    var playBtn = document.getElementById('btn-play-all');
    var stopBtn = document.getElementById('btn-stop-all');
    playBtn.style.display = 'none';
    stopBtn.style.display = 'none';

    var layerIdx = 0;
    var submittedInsts = INSTRUMENTS.filter(function (inst) { return !!game.submissions[inst]; });

    var controlsArea = document.createElement('div');
    controlsArea.className = 'buildup-controls';
    var statusText = document.createElement('p');
    statusText.className = 'buildup-status';
    controlsArea.appendChild(statusText);

    var buildupPlayBtn = document.createElement('button');
    buildupPlayBtn.className = 'btn-primary';
    buildupPlayBtn.textContent = 'Play Layer 1';
    controlsArea.appendChild(buildupPlayBtn);

    var buildupNextBtn = document.createElement('button');
    buildupNextBtn.className = 'btn-secondary';
    buildupNextBtn.textContent = 'Add Next Layer';
    buildupNextBtn.style.display = 'none';
    controlsArea.appendChild(buildupNextBtn);

    layersEl.parentNode.insertBefore(controlsArea, layersEl.nextSibling);

    function updateStatus() {
      var playing = submittedInsts.slice(0, layerIdx + 1).map(function (i) { return i.charAt(0).toUpperCase() + i.slice(1); });
      statusText.textContent = 'Playing: ' + playing.join(' + ');
    }

    function playUpToLayer() {
      stopAllLayers(allSeqs);
      allSeqs = [];
      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.bpm.value = gameBpm;

      for (var i = 0; i <= layerIdx; i++) {
        var inst = submittedInsts[i];
        addLayerSeqForPlayAll(inst, game, allSeqs);
      }
      startTransportWhenReady();
      updateStatus();
    }

    buildupPlayBtn.onclick = function () {
      ensureAudio().then(function () {
        playUpToLayer();
        buildupPlayBtn.textContent = 'Restart';
        if (layerIdx < submittedInsts.length - 1) buildupNextBtn.style.display = 'inline-flex';
      });
    };

    buildupNextBtn.onclick = function () {
      layerIdx++;
      ensureAudio().then(function () {
        playUpToLayer();
        if (layerIdx >= submittedInsts.length - 1) {
          buildupNextBtn.style.display = 'none';
        }
      });
    };

    var nextBtn = document.getElementById('btn-play-again');
    var backBtn = document.getElementById('btn-back-lobby');

    if (games.length > 1 && gameIdx < games.length - 1) {
      nextBtn.textContent = 'Next Song';
      nextBtn.onclick = function () { stopAllLayers(allSeqs); allSeqs = []; controlsArea.remove(); showBuildupReveal(gameIdx + 1); };
    } else {
      nextBtn.textContent = 'Play Again';
      nextBtn.onclick = function () { stopAllLayers(allSeqs); allSeqs = []; controlsArea.remove(); soloMode ? showSoloSetup() : showLobby(); };
    }
    backBtn.onclick = function () { stopAllLayers(allSeqs); allSeqs = []; controlsArea.remove(); showScreen('home'); };
  }

  function addLayerSeqForPlayAll(inst, game, seqs) {
    var sub = game.submissions[inst];
    if (!sub) return;
    if (inst === 'drums') {
      if (!synths.drums) synths.drums = createDrumSynth();
      seqs.push(new Tone.Sequence(safeStep(function (time, s) {
        DRUM_NAMES.forEach(function (name) { if (sub.data[name] && sub.data[name][s]) synths.drums.trigger(name, time); });
      }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
    } else if (inst === 'chords') {
      if (!synths.chords) synths.chords = createChordSynth();
      seqs.push(new Tone.Sequence(safeStep(function (time, s) {
        sub.data.forEach(function (n) {
          if (n.start === s) synths.chords.play(n.note, n.length * Tone.Time('16n').toSeconds(), time);
        });
      }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
    } else if (inst === 'bass') {
      currentBassSound = sub.sound || 'Analog Bass';
      getOrCreateBassSynth();
      seqs.push(new Tone.Sequence(safeStep(function (time, s) {
        sub.data.forEach(function (n) { if (n.start === s) synths.bass.play(n.note, n.length * Tone.Time('16n').toSeconds(), time); });
      }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
    } else if (inst === 'melody') {
      currentMelodySound = sub.sound || 'Piano';
      if (sub.patch) melodyPatch = normalisePatch(sub.patch);
      getOrCreateMelodySynth();
      seqs.push(new Tone.Sequence(safeStep(function (time, s) {
        sub.data.forEach(function (n) { if (n.start === s) synths.melody.play(n.note, n.length * Tone.Time('16n').toSeconds(), time); });
      }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
    } else if (inst === 'sfx') {
      if (!synths.sfx) synths.sfx = createSfxSynth();
      seqs.push(new Tone.Sequence(safeStep(function (time, s) {
        SFX_NAMES.forEach(function (name) { if (sub.data[name] && sub.data[name][s]) synths.sfx.trigger(name, time); });
      }), Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
    } else if (inst === 'vocal' && sub.data && sub.data.dataUrl) {
      pendingAudioLoads.push(addVocalToTransport(sub, seqs));
    }
  }

  function stopAllLayers(seqs) {
    cancelPendingPlayback();
    Tone.Transport.stop();
    Tone.Transport.cancel();
    seqs.forEach(function (s) { s.dispose(); });
    seqs.length = 0;
  }


  // ── Remix Mode ──
  function remixLayerData(instrument, data) {
    if (instrument === 'drums' || instrument === 'sfx') {
      var remixed = {};
      var names = instrument === 'drums' ? DRUM_NAMES : SFX_NAMES;
      names.forEach(function (name) {
        remixed[name] = [];
        for (var s = 0; s < STEPS; s++) {
          var srcStep = (s + Math.floor(Math.random() * 4) - 2 + STEPS) % STEPS;
          remixed[name].push(data[name] ? !!data[name][srcStep] : false);
        }
      });
      return remixed;
    }
    if (Array.isArray(data)) {
      return data.map(function (n) {
        var shift = Math.floor(Math.random() * 5) - 2;
        return { note: n.note, start: Math.max(0, Math.min(STEPS - 1, n.start + shift)), length: n.length };
      });
    }
    return data;
  }


  // ── Vocal Recording ──
  // The clip is a block on the 32-step grid like a chord: { dataUrl, start, steps }
  var vocalClip = null;

  // A Sequence callback that throws takes the Transport down with it, which is
  // how a single bad note could silence the whole song. Every step callback
  // goes through here.
  function safeStep(fn) {
    return function (time, s) {
      try { fn(time, s); } catch (e) { console.warn('step error', e); }
    };
  }

  function stepSeconds() { return Tone.Time('16n').toSeconds(); }

  // Audio clips decode asynchronously; the Transport must not start until every
  // scheduled buffer is armed, or the clip silently misses its slot.
  var pendingAudioLoads = [];
  var playbackGeneration = 0;

  // One bar of the grid, in seconds at the current tempo.
  function loopSeconds() { return STEPS * stepSeconds(); }

  function startTransportWhenReady() {
    // Tone.Sequence loops itself, but a synced Player is scheduled once at an
    // absolute transport time — without a Transport loop on the same period it
    // fires on the first pass only while everything else keeps repeating.
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = loopSeconds();

    var waiting = pendingAudioLoads;
    pendingAudioLoads = [];
    if (!waiting.length) { Tone.Transport.start(); return; }
    var gen = playbackGeneration;
    Promise.all(waiting).then(function () {
      if (gen === playbackGeneration) Tone.Transport.start();
    });
  }

  // Invalidates any in-flight buffer loads so a slow decode cannot restart
  // playback after the user has already stopped it.
  function cancelPendingPlayback() {
    playbackGeneration++;
    pendingAudioLoads = [];
  }

  // Decode a data URL into an AudioBuffer so we know how many steps the clip spans.
  function decodeVocal(dataUrl) {
    return fetch(dataUrl)
      .then(function (r) { return r.arrayBuffer(); })
      .then(function (buf) { return Tone.getContext().rawContext.decodeAudioData(buf); });
  }

  // Schedules the clip on the Transport so it lines up with every other layer.
  // Returns a promise that resolves once the buffer is loaded and armed.
  function addVocalToTransport(sub, seqs) {
    var d = sub && sub.data;
    if (!d || !d.dataUrl) return Promise.resolve();
    return new Promise(function (resolve) {
      var bus = makeBus('vocal');
      var player = new Tone.Player({
        url: d.dataUrl,
        onload: function () {
          try {
            // Cut at the bar line so a clip longer than the loop cannot
            // overlap its own restart on the next pass.
            player.sync().start((d.start || 0) * stepSeconds()).stop(loopSeconds());
          } catch (e) { /* transport torn down before load finished */ }
          resolve();
        },
        onerror: function () { resolve(); }
      }).connect(bus);
      seqs.push({
        dispose: function () {
          try { player.unsync(); player.stop(); } catch (e) { /* not started */ }
          player.dispose();
        }
      });
    });
  }

  function initVocalRecorder() {
    var recBtn = document.getElementById('vocal-rec');
    var playBtn = document.getElementById('vocal-play');
    var statusEl = document.getElementById('vocal-status');
    var canvas = document.getElementById('vocal-waveform');
    var ctx = canvas.getContext('2d');
    var recording = false;
    var mediaRecorder = null;
    var chunks = [];
    var recordTimeout = null;

    vocalClip = null;
    playBtn.style.display = 'none';
    statusEl.textContent = 'Tap to record (max 8s)';
    renderVocalTimeline();

    function drawWaveform(analyser) {
      if (!recording) return;
      var bufLen = analyser.frequencyBinCount;
      var data = new Uint8Array(bufLen);
      analyser.getByteTimeDomainData(data);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#1a1528';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#a78bfa';
      ctx.beginPath();
      var sliceW = canvas.width / bufLen;
      var x = 0;
      for (var i = 0; i < bufLen; i++) {
        var v = data[i] / 128.0;
        var y = v * canvas.height / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceW;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      requestAnimationFrame(function () { drawWaveform(analyser); });
    }

    recBtn.onclick = function () {
      if (recording) {
        recording = false;
        if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
        clearTimeout(recordTimeout);
        statusEl.textContent = 'Recording saved';
        recBtn.classList.remove('recording');
        return;
      }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        recording = true;
        chunks = [];
        recBtn.classList.add('recording');
        statusEl.textContent = 'Recording...';

        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var source = audioCtx.createMediaStreamSource(stream);
        var analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        drawWaveform(analyser);

        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = function (e) { if (e.data.size > 0) chunks.push(e.data); };
        mediaRecorder.onstop = function () {
          stream.getTracks().forEach(function (t) { t.stop(); });
          // Safari records audio/mp4, not webm; a wrong MIME on the data URL
          // breaks decoding on the other players' devices.
          var blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
          var reader = new FileReader();
          reader.onloadend = function () {
            var url = reader.result;
            decodeVocal(url).then(function (buf) {
              var steps = Math.max(1, Math.min(STEPS, Math.ceil(buf.duration / stepSeconds())));
              vocalClip = { dataUrl: url, start: 0, steps: steps };
              playBtn.style.display = 'inline-flex';
              statusEl.textContent = 'Drag the block to place your clip';
              renderVocalTimeline();
            }).catch(function () {
              vocalClip = { dataUrl: url, start: 0, steps: 8 };
              playBtn.style.display = 'inline-flex';
              statusEl.textContent = 'Drag the block to place your clip';
              renderVocalTimeline();
            });
          };
          reader.readAsDataURL(blob);
          audioCtx.close();
        };
        mediaRecorder.start();
        recordTimeout = setTimeout(function () {
          if (recording) {
            recording = false;
            mediaRecorder.stop();
            recBtn.classList.remove('recording');
          }
        }, 8000);
      }).catch(function () {
        statusEl.textContent = 'Mic access denied';
      });
    };

    playBtn.onclick = function () {
      if (!vocalClip) return;
      ensureAudio().then(function () {
        if (previewPlaying) { stopPreview(); return; }
        startPreview('vocal', false);
      });
    };
  }

  // Draggable clip block on the same 32-step grid the other instruments use.
  function renderVocalTimeline() {
    updateGridMetrics();
    var strip = document.getElementById('vocal-timeline');
    if (!strip) return;
    strip.innerHTML = '';

    var canvas = document.createElement('div');
    canvas.className = 'vocal-timeline-canvas';
    canvas.style.width = (STEPS * CELL_W) + 'px';

    for (var s = 0; s < STEPS; s++) {
      var cell = document.createElement('div');
      cell.className = 'vocal-cell' + (s % 4 === 0 ? ' beat' : '');
      cell.style.left = (s * CELL_W) + 'px';
      cell.style.width = CELL_W + 'px';
      canvas.appendChild(cell);
    }

    if (vocalClip) {
      var block = document.createElement('div');
      block.className = 'vocal-block';
      block.style.left = (vocalClip.start * CELL_W) + 'px';
      block.style.width = (vocalClip.steps * CELL_W) + 'px';
      block.textContent = 'Vocal';
      canvas.appendChild(block);

      var dragging = false;
      var grabOffset = 0;
      canvas.addEventListener('pointerdown', function (e) {
        if (!e.target.closest('.vocal-block')) return;
        dragging = true;
        grabOffset = e.clientX - block.getBoundingClientRect().left;
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      canvas.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var x = e.clientX - canvas.getBoundingClientRect().left - grabOffset;
        var step = Math.round(x / CELL_W);
        step = Math.max(0, Math.min(STEPS - vocalClip.steps, step));
        vocalClip.start = step;
        block.style.left = (step * CELL_W) + 'px';
      });
      canvas.addEventListener('pointerup', function (e) {
        if (!dragging) return;
        dragging = false;
        canvas.releasePointerCapture(e.pointerId);
      });
    }

    strip.appendChild(canvas);
  }

  loadSamplePack();
  initMenuMusic();
  initThemePicker();
  initHome();
})();
