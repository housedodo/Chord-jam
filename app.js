// ── Sound Telephone ──
// A multiplayer music recreation game. Players share one device (pass-and-play).
// One person names a song, others each get an instrument layer to recreate it.
// All layers combine for a reveal playback.

(function () {
  'use strict';

  // ── Config ──
  const INSTRUMENTS = ['drums', 'chords', 'bass', 'melody'];
  const STEPS = 16;
  const REVEAL_TIME = 6;
  const BUILD_TIME = 120;
  const DRUM_NAMES = ['Kick', 'Snare', 'HiHat', 'OpenHH', 'Clap', 'Tom', 'Rim', 'Crash'];
  const NOTE_NAMES_BASS = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3'];
  const NOTE_NAMES_MELODY = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];
  const CHORD_OPTIONS = [
    'C', 'Cm', 'D', 'Dm', 'E', 'Em', 'F', 'Fm',
    'G', 'Gm', 'A', 'Am', 'B', 'Bm',
    'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7',
    'Cmaj7', 'Dmaj7', 'Fmaj7', 'Gmaj7',
    'Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7',
    'Csus4', 'Dsus4', 'Gsus4', 'Asus4',
    'Csus2', 'Dsus2', 'Gsus2', 'Asus2',
    'Cdim', 'Ddim', 'Edim', 'Bdim',
    'Caug', 'Eaug',
    'C6', 'D6', 'F6', 'G6', 'A6',
    'Cm6', 'Dm6', 'Em6', 'Am6',
    'C9', 'D9', 'G9', 'A9'
  ];
  const CHORD_NOTES = {
    'C': ['C4','E4','G4'], 'Cm': ['C4','Eb4','G4'],
    'D': ['D4','F#4','A4'], 'Dm': ['D4','F4','A4'],
    'E': ['E4','G#4','B4'], 'Em': ['E4','G4','B4'],
    'F': ['F4','A4','C5'], 'Fm': ['F4','Ab4','C5'],
    'G': ['G3','B3','D4'], 'Gm': ['G3','Bb3','D4'],
    'A': ['A3','C#4','E4'], 'Am': ['A3','C4','E4'],
    'B': ['B3','D#4','F#4'], 'Bm': ['B3','D4','F#4'],
    'C7': ['C4','E4','G4','Bb4'], 'D7': ['D4','F#4','A4','C5'],
    'E7': ['E4','G#4','B4','D5'], 'F7': ['F4','A4','C5','Eb5'],
    'G7': ['G3','B3','D4','F4'], 'A7': ['A3','C#4','E4','G4'],
    'B7': ['B3','D#4','F#4','A4'],
    'Cmaj7': ['C4','E4','G4','B4'], 'Dmaj7': ['D4','F#4','A4','C#5'],
    'Fmaj7': ['F4','A4','C5','E5'], 'Gmaj7': ['G3','B3','D4','F#4'],
    'Cm7': ['C4','Eb4','G4','Bb4'], 'Dm7': ['D4','F4','A4','C5'],
    'Em7': ['E4','G4','B4','D5'], 'Fm7': ['F4','Ab4','C5','Eb5'],
    'Gm7': ['G3','Bb3','D4','F4'], 'Am7': ['A3','C4','E4','G4'],
    'Bm7': ['B3','D4','F#4','A4'],
    'Csus4': ['C4','F4','G4'], 'Dsus4': ['D4','G4','A4'],
    'Gsus4': ['G3','C4','D4'], 'Asus4': ['A3','D4','E4'],
    'Csus2': ['C4','D4','G4'], 'Dsus2': ['D4','E4','A4'],
    'Gsus2': ['G3','A3','D4'], 'Asus2': ['A3','B3','E4'],
    'Cdim': ['C4','Eb4','Gb4'], 'Ddim': ['D4','F4','Ab4'],
    'Edim': ['E4','G4','Bb4'], 'Bdim': ['B3','D4','F4'],
    'Caug': ['C4','E4','G#4'], 'Eaug': ['E4','G#4','C5'],
    'C6': ['C4','E4','G4','A4'], 'D6': ['D4','F#4','A4','B4'],
    'F6': ['F4','A4','C5','D5'], 'G6': ['G3','B3','D4','E4'],
    'A6': ['A3','C#4','E4','F#4'],
    'Cm6': ['C4','Eb4','G4','A4'], 'Dm6': ['D4','F4','A4','B4'],
    'Em6': ['E4','G4','B4','C#5'], 'Am6': ['A3','C4','E4','F#4'],
    'C9': ['C4','E4','G4','Bb4','D5'], 'D9': ['D4','F#4','A4','C5','E5'],
    'G9': ['G3','B3','D4','F4','A4'], 'A9': ['A3','C#4','E4','G4','B4']
  };
  const PLAYER_COLORS = ['#a78bfa', '#e8a0bf', '#7eb8d4', '#e8b07d', '#8cc5a2', '#c9a0d4'];

  // ── State ──
  let players = [];
  let hostIndex = 0;
  let songName = '';
  let gameBpm = 120;
  let soloMode = false;
  let soloInstrumentIndex = 0;
  let assignments = {};
  let submissions = {};
  let currentPlayerTurn = -1;
  let buildTimer = null;
  let buildSecondsLeft = BUILD_TIME;
  let previewPlaying = false;
  let previewSeq = null;

  // ── Audio ──
  let audioReady = false;
  const synths = {};

  function ensureAudio() {
    if (audioReady) return Promise.resolve();
    return Tone.start().then(() => { audioReady = true; });
  }

  function createDrumSynth() {
    const vol = new Tone.Volume(-4).toDestination();
    const kick = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 6, envelope: { attack: 0.001, decay: 0.3, sustain: 0 } }).connect(vol);
    const snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.15, sustain: 0 } }).connect(vol);
    const hihat = new Tone.MetalSynth({ frequency: 400, envelope: { attack: 0.001, decay: 0.06, sustain: 0 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5, volume: -12 }).connect(vol);
    const openHH = new Tone.MetalSynth({ frequency: 400, envelope: { attack: 0.001, decay: 0.3, sustain: 0 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5, volume: -14 }).connect(vol);
    const clap = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0 } }).connect(vol);
    const tom = new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 4, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).connect(vol);
    const rim = new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 2, envelope: { attack: 0.001, decay: 0.05, sustain: 0 }, volume: -6 }).connect(vol);
    const crash = new Tone.MetalSynth({ frequency: 300, envelope: { attack: 0.001, decay: 0.8, sustain: 0 }, harmonicity: 5.1, modulationIndex: 40, resonance: 3500, octaves: 1.5, volume: -16 }).connect(vol);

    return {
      trigger(name) {
        switch (name) {
          case 'Kick': kick.triggerAttackRelease('C1', '8n'); break;
          case 'Snare': snare.triggerAttackRelease('8n'); break;
          case 'HiHat': hihat.triggerAttackRelease('32n'); break;
          case 'OpenHH': openHH.triggerAttackRelease('16n'); break;
          case 'Clap': clap.triggerAttackRelease('16n'); break;
          case 'Tom': tom.triggerAttackRelease('E2', '8n'); break;
          case 'Rim': rim.triggerAttackRelease('G4', '32n'); break;
          case 'Crash': crash.triggerAttackRelease('16n'); break;
        }
      },
      dispose() {
        [kick, snare, hihat, openHH, clap, tom, rim, crash, vol].forEach(n => n.dispose());
      }
    };
  }

  function createChordSynth() {
    const reverb = new Tone.Reverb({ decay: 2, wet: 0.25 }).toDestination();
    const poly = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3, modulationIndex: 0.8,
      envelope: { attack: 0.02, decay: 0.4, sustain: 0.5, release: 0.8 },
      modulation: { type: 'triangle' },
      modulationEnvelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.4 },
      volume: -8
    }).connect(reverb);
    return {
      play(notes, dur) { poly.triggerAttackRelease(notes, dur); },
      dispose() { poly.dispose(); reverb.dispose(); }
    };
  }

  function createBassSynth() {
    const syn = new Tone.FMSynth({
      harmonicity: 1, modulationIndex: 2,
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.3 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.05, decay: 0.1, sustain: 0.5, release: 0.2 },
      volume: -4
    }).toDestination();
    return {
      play(note, dur) { syn.triggerAttackRelease(note, dur); },
      dispose() { syn.dispose(); }
    };
  }

  function createMelodySynth() {
    const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.2 }).toDestination();
    const syn = new Tone.FMSynth({
      harmonicity: 2, modulationIndex: 1.2,
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.05, decay: 0.15, sustain: 0.4, release: 0.3 },
      volume: -6
    }).connect(reverb);
    return {
      play(note, dur) { syn.triggerAttackRelease(note, dur); },
      dispose() { syn.dispose(); reverb.dispose(); }
    };
  }

  // ── Screens ──
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
  }

  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2000);
  }

  // ── Home ──
  function initHome() {
    const savedName = localStorage.getItem('st-name') || '';
    document.getElementById('input-name').value = savedName;

    document.getElementById('btn-create').addEventListener('click', () => {
      ensureAudio();
      const name = getName();
      if (!name) { toast('Enter your name first'); return; }
      players = [{ name, color: PLAYER_COLORS[0] }];
      hostIndex = 0;
      soloMode = false;
      showLobby();
    });

    document.getElementById('btn-solo').addEventListener('click', () => {
      ensureAudio();
      const name = getName();
      if (!name) { toast('Enter your name first'); return; }
      players = [{ name, color: PLAYER_COLORS[0] }];
      soloMode = true;
      showSoloSetup();
    });
  }

  function showSoloSetup() {
    showScreen('solo');
    const tempoSlider = document.getElementById('solo-tempo');
    const tempoVal = document.getElementById('solo-tempo-val');
    tempoSlider.value = gameBpm;
    tempoVal.textContent = gameBpm;
    tempoSlider.oninput = () => {
      gameBpm = parseInt(tempoSlider.value);
      tempoVal.textContent = gameBpm;
    };

    document.getElementById('btn-solo-start').onclick = () => {
      songName = document.getElementById('solo-song').value.trim() || 'Free Jam';
      soloInstrumentIndex = 0;
      submissions = {};
      startSoloBuild();
    };

    document.getElementById('btn-solo-back').onclick = () => showScreen('home');
  }

  function startSoloBuild() {
    if (soloInstrumentIndex >= INSTRUMENTS.length) {
      showListen();
      return;
    }
    const instrument = INSTRUMENTS[soloInstrumentIndex];
    currentPlayerTurn = 0;
    showBuild(instrument, soloInstrumentIndex);
  }

  function getName() {
    const n = document.getElementById('input-name').value.trim();
    if (n) localStorage.setItem('st-name', n);
    return n;
  }

  // ── Lobby ──
  function showLobby() {
    showScreen('lobby');
    const code = generateCode();
    document.getElementById('room-code').textContent = code;
    renderPlayerList();

    document.getElementById('btn-copy-code').onclick = () => {
      navigator.clipboard.writeText(code).then(() => toast('Code copied'));
    };

    document.getElementById('host-controls').style.display = 'flex';
    document.getElementById('guest-waiting').style.display = 'none';

    const songInput = document.getElementById('input-song');
    const startBtn = document.getElementById('btn-start');
    songInput.value = '';
    startBtn.disabled = true;

    songInput.oninput = () => updateStartBtn();
    updateStartBtn();

    const tempoSlider = document.getElementById('lobby-tempo');
    const tempoVal = document.getElementById('lobby-tempo-val');
    tempoSlider.value = gameBpm;
    tempoVal.textContent = gameBpm;
    tempoSlider.oninput = () => {
      gameBpm = parseInt(tempoSlider.value);
      tempoVal.textContent = gameBpm;
    };

    startBtn.onclick = () => {
      songName = songInput.value.trim();
      if (!songName) return;
      if (players.length < 2) { toast('Need at least 2 players'); return; }
      assignInstruments();
      startReveal(0);
    };

    document.getElementById('btn-leave').onclick = () => {
      players = [];
      submissions = {};
      assignments = {};
      showScreen('home');
    };
  }

  function renderPlayerList() {
    const list = document.getElementById('player-list');
    list.innerHTML = '';

    const addDiv = document.createElement('div');
    addDiv.className = 'player-card';
    addDiv.style.cursor = 'pointer';
    addDiv.style.borderStyle = 'dashed';
    addDiv.innerHTML = `
      <div class="player-avatar" style="background:var(--surface-3);color:var(--text-dim)">+</div>
      <input type="text" class="name-input" placeholder="Add player..." maxlength="20" style="flex:1;width:auto;text-align:left" autocomplete="off" spellcheck="false">
      <button class="btn-secondary" style="padding:8px 14px;font-size:0.8rem">Add</button>
    `;
    const addInput = addDiv.querySelector('input');
    const addBtn = addDiv.querySelector('button');
    function addPlayer() {
      const n = addInput.value.trim();
      if (!n) return;
      if (players.length >= 6) { toast('Max 6 players'); return; }
      if (players.some(p => p.name === n)) { toast('Name taken'); return; }
      players.push({ name: n, color: PLAYER_COLORS[players.length % PLAYER_COLORS.length] });
      renderPlayerList();
      updateStartBtn();
    }
    addInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addPlayer(); });
    addBtn.addEventListener('click', addPlayer);
    list.appendChild(addDiv);

    players.forEach((p, i) => {
      const card = document.createElement('div');
      card.className = 'player-card';
      card.innerHTML = `
        <div class="player-avatar" style="background:${p.color}">${p.name[0].toUpperCase()}</div>
        <span class="player-name">${esc(p.name)}</span>
        ${i === hostIndex ? '<span class="player-badge">Host</span>' : `<button class="btn-icon remove-player" data-i="${i}" title="Remove">&times;</button>`}
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('.remove-player').forEach(btn => {
      btn.onclick = () => {
        players.splice(parseInt(btn.dataset.i), 1);
        renderPlayerList();
        updateStartBtn();
      };
    });
  }

  function updateStartBtn() {
    const songInput = document.getElementById('input-song');
    const startBtn = document.getElementById('btn-start');
    if (!songInput || !startBtn) return;
    const hasSong = songInput.value.trim().length > 0;
    const hasPlayers = players.length >= 2;
    startBtn.disabled = !hasSong || !hasPlayers;
    if (!hasPlayers) {
      startBtn.textContent = 'Add more players to start';
    } else if (!hasSong) {
      startBtn.textContent = 'Enter a song name to start';
    } else {
      startBtn.textContent = 'Start Game';
    }
  }

  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = '';
    for (let i = 0; i < 5; i++) c += chars[Math.floor(Math.random() * chars.length)];
    return c;
  }

  function assignInstruments() {
    assignments = {};
    submissions = {};
    const shuffled = INSTRUMENTS.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const nonHost = players.map((_, i) => i).filter(i => i !== hostIndex);
    nonHost.forEach((pi, idx) => {
      assignments[pi] = shuffled[idx % shuffled.length];
    });
  }

  // ── Reveal ──
  function startReveal(turnIndex) {
    const nonHost = Object.keys(assignments).map(Number);
    if (turnIndex >= nonHost.length) {
      showListen();
      return;
    }
    currentPlayerTurn = nonHost[turnIndex];
    const inst = assignments[currentPlayerTurn];
    const p = players[currentPlayerTurn];

    showScreen('reveal');
    document.getElementById('reveal-song').textContent = songName;
    document.getElementById('reveal-instrument').textContent = inst;

    const bar = document.getElementById('reveal-bar');
    bar.style.transition = 'none';
    bar.style.width = '100%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.transition = `width ${REVEAL_TIME}s linear`;
        bar.style.width = '0%';
      });
    });

    toast(`${p.name}, get ready!`);

    setTimeout(() => {
      showBuild(inst, turnIndex);
    }, REVEAL_TIME * 1000);
  }

  // ── Build ──
  function showBuild(instrument, turnIndex) {
    showScreen('build');

    document.getElementById('build-song').textContent = songName;
    const badge = document.getElementById('build-instrument');
    badge.textContent = instrument;
    badge.setAttribute('data-inst', instrument);

    INSTRUMENTS.forEach(inst => {
      document.getElementById('seq-' + inst).style.display = inst === instrument ? 'flex' : 'none';
      const bpmDisp = document.getElementById(inst + '-bpm-display');
      if (bpmDisp) bpmDisp.textContent = gameBpm + ' BPM';
    });

    clearInterval(buildTimer);
    if (soloMode) {
      document.getElementById('build-time').textContent = 'No limit';
    } else {
      buildSecondsLeft = BUILD_TIME;
      updateBuildTimer();
      buildTimer = setInterval(() => {
        buildSecondsLeft--;
        updateBuildTimer();
        if (buildSecondsLeft <= 0) {
          clearInterval(buildTimer);
          submitLayer(instrument, turnIndex);
        }
      }, 1000);
    }

    initSequencer(instrument);

    document.getElementById('btn-submit').onclick = () => {
      clearInterval(buildTimer);
      submitLayer(instrument, turnIndex);
    };
  }

  function updateBuildTimer() {
    const m = Math.floor(buildSecondsLeft / 60);
    const s = buildSecondsLeft % 60;
    document.getElementById('build-time').textContent = `${m}:${s.toString().padStart(2, '0')}`;
  }

  function submitLayer(instrument, turnIndex) {
    stopPreview();
    const data = collectData(instrument);
    submissions[instrument] = { data, bpm: gameBpm, playerIndex: currentPlayerTurn };

    if (soloMode) {
      soloInstrumentIndex++;
      if (soloInstrumentIndex < INSTRUMENTS.length) {
        toast(`${instrument} done! Next: ${INSTRUMENTS[soloInstrumentIndex]}`);
        setTimeout(() => startSoloBuild(), 600);
      } else {
        toast('All layers done!');
        setTimeout(() => showListen(), 600);
      }
      return;
    }

    toast('Layer submitted!');
    const nonHost = Object.keys(assignments).map(Number);
    const nextTurn = turnIndex + 1;
    if (nextTurn < nonHost.length) {
      setTimeout(() => startReveal(nextTurn), 800);
    } else {
      setTimeout(() => showListen(), 800);
    }
  }

  function collectData(instrument) {
    if (instrument === 'drums') {
      const grid = {};
      DRUM_NAMES.forEach(name => {
        grid[name] = [];
        for (let s = 0; s < STEPS; s++) {
          const cell = document.querySelector(`.drum-cell[data-name="${name}"][data-step="${s}"]`);
          grid[name].push(cell && cell.classList.contains('on'));
        }
      });
      return grid;
    }
    if (instrument === 'chords') {
      const slots = document.querySelectorAll('.chord-slot');
      return Array.from(slots).map(s => s.dataset.chord || null);
    }
    if (instrument === 'bass') {
      return collectNoteGrid('bass', NOTE_NAMES_BASS);
    }
    if (instrument === 'melody') {
      return collectNoteGrid('melody', NOTE_NAMES_MELODY);
    }
  }

  function collectNoteGrid(inst, noteNames) {
    const grid = {};
    noteNames.forEach(note => {
      grid[note] = [];
      for (let s = 0; s < STEPS; s++) {
        const cell = document.querySelector(`.note-cell[data-inst="${inst}"][data-note="${note}"][data-step="${s}"]`);
        grid[note].push(cell && cell.classList.contains('on'));
      }
    });
    return grid;
  }

  // ── Sequencer init ──
  function initSequencer(instrument) {
    if (instrument === 'drums') initDrumGrid();
    else if (instrument === 'chords') initChordSeq();
    else if (instrument === 'bass') initNoteGrid('bass', NOTE_NAMES_BASS);
    else if (instrument === 'melody') initNoteGrid('melody', NOTE_NAMES_MELODY);

    const playBtn = document.getElementById(instrument + '-play');
    const playIcon = document.getElementById(instrument + '-play-icon');
    const stopIcon = document.getElementById(instrument + '-stop-icon');
    playBtn.onclick = () => {
      ensureAudio().then(() => {
        if (previewPlaying) {
          stopPreview();
        } else {
          startPreview(instrument);
        }
        playIcon.style.display = previewPlaying ? 'none' : 'block';
        stopIcon.style.display = previewPlaying ? 'block' : 'none';
      });
    };
  }

  function initDrumGrid() {
    const grid = document.getElementById('drum-grid');
    grid.innerHTML = '';
    DRUM_NAMES.forEach(name => {
      const row = document.createElement('div');
      row.className = 'drum-row';
      row.innerHTML = `<span class="drum-label">${name}</span>`;
      for (let s = 0; s < STEPS; s++) {
        const cell = document.createElement('div');
        cell.className = 'drum-cell' + (s % 4 === 0 ? ' beat' : '');
        cell.dataset.name = name;
        cell.dataset.step = s;
        cell.addEventListener('pointerdown', () => cell.classList.toggle('on'));
        row.appendChild(cell);
      }
      grid.appendChild(row);
    });
  }

  function initChordSeq() {
    const slotsEl = document.getElementById('chord-slots');
    const paletteEl = document.getElementById('chord-palette');
    slotsEl.innerHTML = '';
    paletteEl.innerHTML = '';

    let activeSlot = 0;
    const NUM_SLOTS = 8;

    for (let i = 0; i < NUM_SLOTS; i++) {
      const slot = document.createElement('div');
      slot.className = 'chord-slot' + (i === 0 ? ' active' : '');
      slot.textContent = '—';
      slot.dataset.index = i;
      slot.dataset.chord = '';
      slot.addEventListener('click', () => {
        slotsEl.querySelectorAll('.chord-slot').forEach(s => s.classList.remove('active'));
        slot.classList.add('active');
        activeSlot = i;
      });
      slotsEl.appendChild(slot);
    }

    CHORD_OPTIONS.forEach(ch => {
      const btn = document.createElement('button');
      btn.className = 'chord-pick';
      btn.textContent = ch;
      btn.addEventListener('click', () => {
        ensureAudio().then(() => {
          const slot = slotsEl.querySelector(`.chord-slot[data-index="${activeSlot}"]`);
          slot.textContent = ch;
          slot.dataset.chord = ch;
          slot.classList.add('filled');
          if (!synths.chords) synths.chords = createChordSynth();
          const notes = CHORD_NOTES[ch];
          if (notes) synths.chords.play(notes, '4n');
          if (activeSlot < NUM_SLOTS - 1) {
            activeSlot++;
            slotsEl.querySelectorAll('.chord-slot').forEach(s => s.classList.remove('active'));
            slotsEl.querySelector(`.chord-slot[data-index="${activeSlot}"]`).classList.add('active');
          }
        });
      });
      paletteEl.appendChild(btn);
    });
  }

  function initNoteGrid(inst, noteNames) {
    const grid = document.getElementById(inst + '-grid');
    grid.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'note-grid-inner';
    inner.style.gridTemplateColumns = `44px repeat(${STEPS}, 1fr)`;
    inner.style.gridTemplateRows = `repeat(${noteNames.length}, 28px)`;

    const reversed = [...noteNames].reverse();
    reversed.forEach((note) => {
      const label = document.createElement('div');
      label.className = 'note-label';
      label.textContent = note;
      inner.appendChild(label);

      for (let s = 0; s < STEPS; s++) {
        const cell = document.createElement('div');
        cell.className = 'note-cell' + (s % 4 === 0 ? ' beat' : '');
        cell.dataset.inst = inst;
        cell.dataset.note = note;
        cell.dataset.step = s;
        cell.addEventListener('pointerdown', () => {
          if (!cell.classList.contains('on')) {
            inner.querySelectorAll(`.note-cell[data-step="${s}"].on`).forEach(c => c.classList.remove('on'));
          }
          cell.classList.toggle('on');
          if (cell.classList.contains('on')) {
            ensureAudio().then(() => {
              if (inst === 'bass') {
                if (!synths.bass) synths.bass = createBassSynth();
                synths.bass.play(note, '16n');
              } else {
                if (!synths.melody) synths.melody = createMelodySynth();
                synths.melody.play(note, '16n');
              }
            });
          }
        });
        inner.appendChild(cell);
      }
    });

    grid.appendChild(inner);
  }

  // ── Preview playback ──
  function startPreview(instrument) {
    Tone.Transport.bpm.value = gameBpm;
    Tone.Transport.stop();
    Tone.Transport.cancel();

    previewPlaying = true;

    if (instrument === 'drums') {
      if (!synths.drums) synths.drums = createDrumSynth();
      previewSeq = new Tone.Sequence((time, s) => {
        Tone.Draw.schedule(() => highlightDrumStep(s), time);
        DRUM_NAMES.forEach(name => {
          const cell = document.querySelector(`.drum-cell[data-name="${name}"][data-step="${s}"]`);
          if (cell && cell.classList.contains('on')) {
            synths.drums.trigger(name);
          }
        });
      }, Array.from({ length: STEPS }, (_, i) => i), '16n').start(0);
    } else if (instrument === 'chords') {
      if (!synths.chords) synths.chords = createChordSynth();
      const slots = document.querySelectorAll('.chord-slot');
      const chords = Array.from(slots).map(s => s.dataset.chord).filter(Boolean);
      if (chords.length === 0) { previewPlaying = false; return; }
      let ci = 0;
      previewSeq = new Tone.Sequence((time, s) => {
        if (s % 4 === 0) {
          const ch = chords[ci % chords.length];
          const notes = CHORD_NOTES[ch];
          if (notes) synths.chords.play(notes, '2n');
          Tone.Draw.schedule(() => highlightChordSlot(ci % chords.length), time);
          ci++;
        }
      }, Array.from({ length: STEPS }, (_, i) => i), '16n').start(0);
    } else if (instrument === 'bass' || instrument === 'melody') {
      const noteNames = instrument === 'bass' ? NOTE_NAMES_BASS : NOTE_NAMES_MELODY;
      if (!synths[instrument]) {
        synths[instrument] = instrument === 'bass' ? createBassSynth() : createMelodySynth();
      }
      previewSeq = new Tone.Sequence((time, s) => {
        Tone.Draw.schedule(() => highlightNoteStep(instrument, s), time);
        noteNames.forEach(note => {
          const cell = document.querySelector(`.note-cell[data-inst="${instrument}"][data-note="${note}"][data-step="${s}"]`);
          if (cell && cell.classList.contains('on')) {
            synths[instrument].play(note, '16n');
          }
        });
      }, Array.from({ length: STEPS }, (_, i) => i), '16n').start(0);
    }

    Tone.Transport.start();
  }

  function stopPreview() {
    previewPlaying = false;
    if (previewSeq) { previewSeq.dispose(); previewSeq = null; }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    document.querySelectorAll('.drum-cell.playing, .note-cell.playing, .chord-slot.playing').forEach(el => el.classList.remove('playing'));
    INSTRUMENTS.forEach(inst => {
      const pi = document.getElementById(inst + '-play-icon');
      const si = document.getElementById(inst + '-stop-icon');
      if (pi) pi.style.display = 'block';
      if (si) si.style.display = 'none';
    });
  }

  function highlightDrumStep(step) {
    document.querySelectorAll('.drum-cell.playing').forEach(el => el.classList.remove('playing'));
    document.querySelectorAll(`.drum-cell[data-step="${step}"]`).forEach(el => el.classList.add('playing'));
  }

  function highlightChordSlot(index) {
    document.querySelectorAll('.chord-slot.playing').forEach(el => el.classList.remove('playing'));
    const slot = document.querySelector(`.chord-slot[data-index="${index}"]`);
    if (slot) slot.classList.add('playing');
  }

  function highlightNoteStep(inst, step) {
    document.querySelectorAll(`.note-cell[data-inst="${inst}"].playing`).forEach(el => el.classList.remove('playing'));
    document.querySelectorAll(`.note-cell[data-inst="${inst}"][data-step="${step}"]`).forEach(el => el.classList.add('playing'));
  }

  // ── Listen (combined playback) ──
  function showListen() {
    showScreen('listen');
    document.getElementById('listen-song').textContent = songName;

    const layersEl = document.getElementById('listen-layers');
    layersEl.innerHTML = '';

    INSTRUMENTS.forEach(inst => {
      const sub = submissions[inst];
      const card = document.createElement('div');
      card.className = 'layer-card';
      const pName = sub ? players[sub.playerIndex].name : '—';
      const status = sub ? 'Ready' : 'Empty';
      card.innerHTML = `
        <span class="layer-badge" data-inst="${inst}">${inst}</span>
        <span class="layer-player">${esc(pName)}</span>
        <span class="layer-status">${status}</span>
      `;
      layersEl.appendChild(card);
    });

    let allPlaying = false;
    let allSeqs = [];

    const playAllBtn = document.getElementById('btn-play-all');
    const stopAllBtn = document.getElementById('btn-stop-all');
    playAllBtn.style.display = 'flex';
    stopAllBtn.style.display = 'none';

    playAllBtn.onclick = () => {
      ensureAudio().then(() => {
        if (allPlaying) return;
        allPlaying = true;
        playAllBtn.style.display = 'none';
        stopAllBtn.style.display = 'flex';
        playAllLayers(allSeqs);
      });
    };

    stopAllBtn.onclick = () => {
      allPlaying = false;
      playAllBtn.style.display = 'flex';
      stopAllBtn.style.display = 'none';
      stopAllLayers(allSeqs);
      allSeqs = [];
    };

    document.getElementById('btn-play-again').onclick = () => {
      stopAllLayers(allSeqs);
      allSeqs = [];
      if (soloMode) {
        showSoloSetup();
      } else {
        showLobby();
      }
    };

    document.getElementById('btn-back-lobby').onclick = () => {
      stopAllLayers(allSeqs);
      allSeqs = [];
      showScreen('home');
    };
  }

  function playAllLayers(seqs) {
    Tone.Transport.stop();
    Tone.Transport.cancel();

    const firstSub = Object.values(submissions)[0];
    const bpm = firstSub ? firstSub.bpm : 120;
    Tone.Transport.bpm.value = bpm;

    if (submissions.drums) {
      if (!synths.drums) synths.drums = createDrumSynth();
      const data = submissions.drums.data;
      const seq = new Tone.Sequence((time, s) => {
        DRUM_NAMES.forEach(name => {
          if (data[name] && data[name][s]) {
            synths.drums.trigger(name);
          }
        });
      }, Array.from({ length: STEPS }, (_, i) => i), '16n').start(0);
      seqs.push(seq);
    }

    if (submissions.chords) {
      if (!synths.chords) synths.chords = createChordSynth();
      const chords = submissions.chords.data.filter(Boolean);
      if (chords.length > 0) {
        let ci = 0;
        const seq = new Tone.Sequence((time, s) => {
          if (s % 4 === 0) {
            const ch = chords[ci % chords.length];
            const notes = CHORD_NOTES[ch];
            if (notes) synths.chords.play(notes, '2n');
            ci++;
          }
        }, Array.from({ length: STEPS }, (_, i) => i), '16n').start(0);
        seqs.push(seq);
      }
    }

    if (submissions.bass) {
      if (!synths.bass) synths.bass = createBassSynth();
      const data = submissions.bass.data;
      const seq = new Tone.Sequence((time, s) => {
        NOTE_NAMES_BASS.forEach(note => {
          if (data[note] && data[note][s]) {
            synths.bass.play(note, '16n');
          }
        });
      }, Array.from({ length: STEPS }, (_, i) => i), '16n').start(0);
      seqs.push(seq);
    }

    if (submissions.melody) {
      if (!synths.melody) synths.melody = createMelodySynth();
      const data = submissions.melody.data;
      const seq = new Tone.Sequence((time, s) => {
        NOTE_NAMES_MELODY.forEach(note => {
          if (data[note] && data[note][s]) {
            synths.melody.play(note, '16n');
          }
        });
      }, Array.from({ length: STEPS }, (_, i) => i), '16n').start(0);
      seqs.push(seq);
    }

    Tone.Transport.start();
  }

  function stopAllLayers(seqs) {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    seqs.forEach(s => s.dispose());
  }

  // ── Utils ──
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ── Init ──
  initHome();

})();
