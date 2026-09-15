const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_DISPLAY = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];

const CHORD_TYPES = {
  major:  { intervals: [0, 4, 7],       suffix: '',     quality: 'major' },
  minor:  { intervals: [0, 3, 7],       suffix: 'm',    quality: 'minor' },
  '7':    { intervals: [0, 4, 7, 10],   suffix: '7',    quality: 'dom'   },
  m7:     { intervals: [0, 3, 7, 10],   suffix: 'm7',   quality: 'minor' },
  maj7:   { intervals: [0, 4, 7, 11],   suffix: 'maj7', quality: 'major' },
  dim:    { intervals: [0, 3, 6],       suffix: 'dim',  quality: 'dim'   },
  aug:    { intervals: [0, 4, 8],       suffix: 'aug',  quality: 'aug'   },
  sus2:   { intervals: [0, 2, 7],       suffix: 'sus2', quality: 'sus'   },
  sus4:   { intervals: [0, 5, 7],       suffix: 'sus4', quality: 'sus'   },
  add9:   { intervals: [0, 4, 7, 14],   suffix: 'add9', quality: 'major' },
  m9:     { intervals: [0, 3, 7, 10, 14], suffix: 'm9', quality: 'minor' },
  '9':    { intervals: [0, 4, 7, 10, 14], suffix: '9',  quality: 'dom'   },
};

const SCALES = {
  major:       { steps: [0, 2, 4, 5, 7, 9, 11], chordTypes: ['major','minor','minor','major','major','minor','dim'], degrees: ['I','ii','iii','IV','V','vi','vii°'] },
  minor:       { steps: [0, 2, 3, 5, 7, 8, 10], chordTypes: ['minor','dim','major','minor','minor','major','major'], degrees: ['i','ii°','III','iv','v','VI','VII'] },
  dorian:      { steps: [0, 2, 3, 5, 7, 9, 10], chordTypes: ['minor','minor','major','major','minor','dim','major'], degrees: ['i','ii','III','IV','v','vi°','VII'] },
  mixolydian:  { steps: [0, 2, 4, 5, 7, 9, 10], chordTypes: ['major','minor','dim','major','minor','minor','major'], degrees: ['I','ii','iii°','IV','v','vi','VII'] },
};

const PRESETS = [
  { name: 'Pop',          degrees: [0, 4, 5, 3] },
  { name: 'Sad',          degrees: [5, 3, 0, 4] },
  { name: 'Jazz ii-V-I',  degrees: [1, 4, 0],    types: ['m7', '7', 'maj7'] },
  { name: '50s',          degrees: [0, 5, 3, 4] },
  { name: 'Blues',        degrees: [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4], types: ['7','7','7','7','7','7','7','7','7','7','7','7'] },
  { name: 'Canon',        degrees: [0, 4, 5, 2, 3, 0, 3, 4] },
  { name: 'Andalusian',   degrees: [5, 4, 3, 0],  forScale: 'minor' },
];

const SOUND_PRESETS = {
  'warm-pad': {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.15, decay: 0.3, sustain: 0.6, release: 0.8 },
    volume: -10,
  },
  'electric-piano': {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.5 },
    volume: -8,
  },
  'bright-keys': {
    oscillator: { type: 'square' },
    envelope: { attack: 0.005, decay: 0.2, sustain: 0.15, release: 0.3 },
    volume: -14,
  },
  'soft-strings': {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.4, decay: 0.5, sustain: 0.7, release: 1.2 },
    volume: -14,
  },
};

let state = {
  key: 0,
  scale: 'major',
  tempo: 120,
  beatsPerChord: 2,
  sound: 'warm-pad',
  loop: true,
  progression: [],
  playing: false,
  currentStep: -1,
  paletteTab: 'diatonic',
};

let synth = null;
let reverb = null;
let scheduledEvents = [];
let transportStarted = false;

function initAudio() {
  if (synth) return;
  const preset = SOUND_PRESETS[state.sound];
  synth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 8,
    voice: Tone.Synth,
    options: {
      oscillator: preset.oscillator,
      envelope: preset.envelope,
    },
  });
  synth.volume.value = preset.volume;
  reverb = new Tone.Reverb({ decay: 2, wet: 0.25 });
  synth.connect(reverb);
  reverb.toDestination();
}

function updateSynthSound() {
  if (!synth) return;
  const preset = SOUND_PRESETS[state.sound];
  synth.set({
    oscillator: preset.oscillator,
    envelope: preset.envelope,
  });
  synth.volume.value = preset.volume;
}

function noteFromMidi(midi) {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTES[midi % 12];
  return `${note}${octave}`;
}

function getChordNotes(rootIndex, type) {
  const chord = CHORD_TYPES[type];
  if (!chord) return [];
  const baseOctave = 4;
  const baseMidi = 48 + rootIndex;
  return chord.intervals.map(i => noteFromMidi(baseMidi + i));
}

function getChordName(rootIndex, type) {
  return NOTES[rootIndex % 12] + CHORD_TYPES[type].suffix;
}

function getDiatonicChords() {
  const scale = SCALES[state.scale];
  return scale.steps.map((step, i) => ({
    root: (state.key + step) % 12,
    type: scale.chordTypes[i],
    degree: scale.degrees[i],
  }));
}

function getExtendedChords() {
  const scale = SCALES[state.scale];
  const extended = [];
  const extTypes = ['7', 'm7', 'maj7', 'sus2', 'sus4'];
  scale.steps.forEach((step, i) => {
    const root = (state.key + step) % 12;
    const baseType = scale.chordTypes[i];
    extTypes.forEach(t => {
      if (t === baseType) return;
      if (baseType === 'minor' && t === 'maj7') return;
      if (baseType === 'major' && t === 'm7') return;
      extended.push({ root, type: t, degree: '' });
    });
  });
  return extended;
}

function getAllChords() {
  const chords = [];
  NOTES.forEach((_, rootIndex) => {
    const root = (state.key + rootIndex) % 12;
    Object.keys(CHORD_TYPES).forEach(type => {
      chords.push({ root, type, degree: '' });
    });
  });
  return chords;
}

function previewChord(rootIndex, type) {
  Tone.start();
  initAudio();
  const notes = getChordNotes(rootIndex, type);
  synth.releaseAll();
  synth.triggerAttackRelease(notes, '4n');
}

function addToProgression(rootIndex, type) {
  state.progression.push({ root: rootIndex, type });
  renderProgression();
}

function removeFromProgression(index) {
  state.progression.splice(index, 1);
  renderProgression();
  if (state.playing && state.progression.length === 0) stopPlayback();
}

function renderChordGrid() {
  const grid = document.getElementById('chord-grid');
  let chords;

  if (state.paletteTab === 'diatonic') {
    chords = getDiatonicChords();
  } else if (state.paletteTab === 'extended') {
    chords = getExtendedChords();
  } else {
    chords = getAllChords();
  }

  grid.innerHTML = chords.map((c, i) => {
    const name = getChordName(c.root, c.type);
    const quality = CHORD_TYPES[c.type].quality;
    const degreeLabel = c.degree ? `<span class="degree">${c.degree}</span>` : '';
    return `<button class="chord-btn" data-quality="${quality}" data-index="${i}"
              data-root="${c.root}" data-type="${c.type}">${name}${degreeLabel}</button>`;
  }).join('');

  grid.querySelectorAll('.chord-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const root = parseInt(btn.dataset.root);
      const type = btn.dataset.type;
      previewChord(root, type);
    });
    btn.addEventListener('dblclick', () => {
      const root = parseInt(btn.dataset.root);
      const type = btn.dataset.type;
      addToProgression(root, type);
    });
  });
}

function renderProgression() {
  const track = document.getElementById('progression-track');
  if (state.progression.length === 0) {
    track.innerHTML = '<div class="empty-state">Click or double-click chords above to build your progression</div>';
    return;
  }

  track.innerHTML = state.progression.map((c, i) => {
    const name = getChordName(c.root, c.type);
    const playing = state.currentStep === i ? ' playing' : '';
    return `<div class="prog-chord${playing}" draggable="true" data-index="${i}">
      <span class="chord-name">${name}</span>
      <button class="remove-btn" data-index="${i}">&times;</button>
    </div>`;
  }).join('');

  track.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromProgression(parseInt(btn.dataset.index));
    });
  });

  track.querySelectorAll('.prog-chord').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.index);
      const c = state.progression[idx];
      previewChord(c.root, c.type);
    });

    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', el.dataset.index);
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
  });

  track.addEventListener('dragover', (e) => {
    e.preventDefault();
    track.classList.add('drag-over');
  });
  track.addEventListener('dragleave', () => track.classList.remove('drag-over'));
  track.addEventListener('drop', (e) => {
    e.preventDefault();
    track.classList.remove('drag-over');
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const dropTarget = e.target.closest('.prog-chord');
    if (!dropTarget) return;
    const toIndex = parseInt(dropTarget.dataset.index);
    if (fromIndex === toIndex) return;
    const [moved] = state.progression.splice(fromIndex, 1);
    state.progression.splice(toIndex, 0, moved);
    renderProgression();
  });
}

function renderPresets() {
  const list = document.getElementById('preset-list');
  list.innerHTML = PRESETS.map((p, i) => {
    const scale = SCALES[p.forScale || state.scale];
    const chordNames = p.degrees.map((d, j) => {
      const root = (state.key + scale.steps[d]) % 12;
      const type = p.types ? p.types[j] : scale.chordTypes[d];
      return getChordName(root, type);
    }).join(' - ');
    return `<button class="preset-btn" data-index="${i}">
      <span class="preset-name">${p.name}</span>
      <span class="preset-chords">${chordNames}</span>
    </button>`;
  }).join('');

  list.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = PRESETS[parseInt(btn.dataset.index)];
      const scale = SCALES[preset.forScale || state.scale];
      state.progression = preset.degrees.map((d, j) => ({
        root: (state.key + scale.steps[d]) % 12,
        type: preset.types ? preset.types[j] : scale.chordTypes[d],
      }));
      renderProgression();
      showToast(`Loaded "${preset.name}" progression`);
    });
  });
}

async function startPlayback() {
  if (state.progression.length === 0) return;
  await Tone.start();
  initAudio();

  state.playing = true;
  state.currentStep = -1;
  updateTransportUI();

  Tone.getTransport().bpm.value = state.tempo;
  Tone.getTransport().cancel();

  const totalBeats = state.progression.length * state.beatsPerChord;
  const beatDuration = `${state.beatsPerChord * 4}n`;

  const playStep = (time, step) => {
    const idx = step % state.progression.length;
    state.currentStep = idx;
    const c = state.progression[idx];
    const notes = getChordNotes(c.root, c.type);
    synth.triggerAttackRelease(notes, beatDuration, time);
    Tone.getDraw().schedule(() => {
      renderProgression();
      const name = getChordName(c.root, c.type);
      document.getElementById('now-playing-text').textContent = `Playing: ${name}`;
      document.getElementById('now-playing').style.display = 'block';
    }, time);
  };

  if (state.loop) {
    const part = new Tone.Sequence((time, step) => {
      playStep(time, step);
    }, Array.from({ length: state.progression.length }, (_, i) => i), `${state.beatsPerChord * 4}n`);
    part.loop = true;
    part.start(0);
  } else {
    state.progression.forEach((_, i) => {
      const event = Tone.getTransport().schedule((time) => {
        playStep(time, i);
        if (i === state.progression.length - 1) {
          Tone.getTransport().schedule(() => {
            stopPlayback();
          }, time + Tone.Time(beatDuration).toSeconds());
        }
      }, `0:${i * state.beatsPerChord}:0`);
      scheduledEvents.push(event);
    });
  }

  Tone.getTransport().start();
  transportStarted = true;
}

function stopPlayback() {
  state.playing = false;
  state.currentStep = -1;

  if (transportStarted) {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    transportStarted = false;
  }
  scheduledEvents = [];
  if (synth) synth.releaseAll();

  updateTransportUI();
  renderProgression();
  document.getElementById('now-playing').style.display = 'none';
}

function togglePlayback() {
  if (state.playing) {
    stopPlayback();
  } else {
    startPlayback();
  }
}

function updateTransportUI() {
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  playIcon.style.display = state.playing ? 'none' : 'block';
  pauseIcon.style.display = state.playing ? 'block' : 'none';
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function init() {
  const keySelect = document.getElementById('key-select');
  NOTE_DISPLAY.forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = name;
    keySelect.appendChild(opt);
  });

  keySelect.addEventListener('change', () => {
    state.key = parseInt(keySelect.value);
    renderChordGrid();
    renderPresets();
  });

  document.getElementById('scale-select').addEventListener('change', (e) => {
    state.scale = e.target.value;
    renderChordGrid();
    renderPresets();
  });

  const tempoSlider = document.getElementById('tempo-slider');
  const tempoValue = document.getElementById('tempo-value');
  tempoSlider.addEventListener('input', () => {
    state.tempo = parseInt(tempoSlider.value);
    tempoValue.textContent = state.tempo;
    if (transportStarted) {
      Tone.getTransport().bpm.value = state.tempo;
    }
  });

  document.getElementById('beats-select').addEventListener('change', (e) => {
    state.beatsPerChord = parseInt(e.target.value);
    if (state.playing) {
      stopPlayback();
      startPlayback();
    }
  });

  document.getElementById('sound-select').addEventListener('change', (e) => {
    state.sound = e.target.value;
    updateSynthSound();
  });

  document.getElementById('play-btn').addEventListener('click', togglePlayback);
  document.getElementById('stop-btn').addEventListener('click', stopPlayback);

  const loopBtn = document.getElementById('loop-btn');
  loopBtn.addEventListener('click', () => {
    state.loop = !state.loop;
    loopBtn.classList.toggle('active', state.loop);
    if (state.playing) {
      stopPlayback();
      startPlayback();
    }
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    if (state.progression.length === 0) return;
    stopPlayback();
    state.progression = [];
    renderProgression();
    showToast('Progression cleared');
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    if (state.progression.length === 0) return;
    const text = state.progression.map(c => getChordName(c.root, c.type)).join(' | ');
    const keyName = NOTES[state.key];
    const full = `Key: ${keyName} ${state.scale} | ${text} | ${state.tempo} BPM`;
    navigator.clipboard.writeText(full).then(() => {
      showToast('Copied to clipboard!');
    }).catch(() => {
      showToast(full);
    });
  });

  document.querySelectorAll('.palette-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.palette-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.paletteTab = tab.dataset.tab;
      renderChordGrid();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
      e.preventDefault();
      togglePlayback();
    }
  });

  renderChordGrid();
  renderPresets();
  renderProgression();
}

document.addEventListener('DOMContentLoaded', init);
