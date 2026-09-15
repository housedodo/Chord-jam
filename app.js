const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_DISPLAY = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];

const CHORD_TYPES = {
  major:  { intervals: [0, 4, 7],         suffix: '',     quality: 'major' },
  minor:  { intervals: [0, 3, 7],         suffix: 'm',    quality: 'minor' },
  '7':    { intervals: [0, 4, 7, 10],     suffix: '7',    quality: 'dom'   },
  m7:     { intervals: [0, 3, 7, 10],     suffix: 'm7',   quality: 'minor' },
  maj7:   { intervals: [0, 4, 7, 11],     suffix: 'maj7', quality: 'major' },
  dim:    { intervals: [0, 3, 6],         suffix: 'dim',  quality: 'dim'   },
  aug:    { intervals: [0, 4, 8],         suffix: 'aug',  quality: 'aug'   },
  sus2:   { intervals: [0, 2, 7],         suffix: 'sus2', quality: 'sus'   },
  sus4:   { intervals: [0, 5, 7],         suffix: 'sus4', quality: 'sus'   },
  add9:   { intervals: [0, 4, 7, 14],     suffix: 'add9', quality: 'major' },
  m9:     { intervals: [0, 3, 7, 10, 14], suffix: 'm9',   quality: 'minor' },
  '9':    { intervals: [0, 4, 7, 10, 14], suffix: '9',    quality: 'dom'   },
};

const SCALES = {
  major:      { steps: [0,2,4,5,7,9,11], chordTypes: ['major','minor','minor','major','major','minor','dim'], degrees: ['I','ii','iii','IV','V','vi','vii°'] },
  minor:      { steps: [0,2,3,5,7,8,10], chordTypes: ['minor','dim','major','minor','minor','major','major'], degrees: ['i','ii°','III','iv','v','VI','VII'] },
  dorian:     { steps: [0,2,3,5,7,9,10], chordTypes: ['minor','minor','major','major','minor','dim','major'], degrees: ['i','ii','III','IV','v','vi°','VII'] },
  mixolydian: { steps: [0,2,4,5,7,9,10], chordTypes: ['major','minor','dim','major','minor','minor','major'], degrees: ['I','ii','iii°','IV','v','vi','VII'] },
};

const PRESETS = [
  { name: 'Pop',         degrees: [0,4,5,3] },
  { name: 'Sad',         degrees: [5,3,0,4] },
  { name: 'Jazz ii-V-I', degrees: [1,4,0], types: ['m7','7','maj7'] },
  { name: '50s',         degrees: [0,5,3,4] },
  { name: 'Blues',       degrees: [0,0,0,0,3,3,0,0,4,3,0,4], types: ['7','7','7','7','7','7','7','7','7','7','7','7'] },
  { name: 'Canon',       degrees: [0,4,5,2,3,0,3,4] },
  { name: 'Andalusian',  degrees: [5,4,3,0], forScale: 'minor' },
];

const SOUND_PRESETS = {
  'warm-pad':      { oscillator: { type: 'sine' },     envelope: { attack: 0.15, decay: 0.3, sustain: 0.6, release: 0.8 }, volume: -10 },
  'electric-piano': { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.5 }, volume: -8  },
  'bright-keys':   { oscillator: { type: 'square' },   envelope: { attack: 0.005,decay: 0.2, sustain: 0.15,release: 0.3 }, volume: -14 },
  'soft-strings':  { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.4, decay: 0.5, sustain: 0.7, release: 1.2 }, volume: -14 },
};

const ARP_PATTERNS = {
  up:     (notes) => [...notes],
  down:   (notes) => [...notes].reverse(),
  updown: (notes) => {
    if (notes.length <= 1) return notes;
    return [...notes, ...notes.slice(1, -1).reverse()];
  },
  random: (notes) => {
    const arr = [...notes];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },
  pinky: (notes) => {
    if (notes.length < 2) return notes;
    const result = [];
    for (let i = 0; i < notes.length - 1; i++) {
      result.push(notes[i], notes[notes.length - 1]);
    }
    return result;
  },
  spread: (notes) => {
    if (notes.length < 2) return notes;
    const result = [];
    let lo = 0, hi = notes.length - 1;
    while (lo <= hi) {
      result.push(notes[lo]);
      if (lo !== hi) result.push(notes[hi]);
      lo++;
      hi--;
    }
    return result;
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
  arp: {
    enabled: false,
    pattern: 'up',
    speed: '4n',
    octaves: 1,
    currentNote: -1,
  },
};

let synth = null;
let reverb = null;
let transportStarted = false;

function initAudio() {
  if (synth) return;
  const preset = SOUND_PRESETS[state.sound];
  synth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 12,
    voice: Tone.Synth,
    options: { oscillator: preset.oscillator, envelope: preset.envelope },
  });
  synth.volume.value = preset.volume;
  reverb = new Tone.Reverb({ decay: 2, wet: 0.25 });
  synth.connect(reverb);
  reverb.toDestination();
}

function updateSynthSound() {
  if (!synth) return;
  const preset = SOUND_PRESETS[state.sound];
  synth.set({ oscillator: preset.oscillator, envelope: preset.envelope });
  synth.volume.value = preset.volume;
}

function noteFromMidi(midi) {
  return NOTES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
}

function getChordNotes(rootIndex, type) {
  const chord = CHORD_TYPES[type];
  if (!chord) return [];
  const baseMidi = 48 + rootIndex;
  return chord.intervals.map(i => noteFromMidi(baseMidi + i));
}

function getChordNotesExpanded(rootIndex, type, octaves) {
  const chord = CHORD_TYPES[type];
  if (!chord) return [];
  const baseMidi = 48 + rootIndex;
  const notes = [];
  for (let oct = 0; oct < octaves; oct++) {
    chord.intervals.forEach(i => {
      notes.push(noteFromMidi(baseMidi + i + oct * 12));
    });
  }
  return notes;
}

function getChordName(rootIndex, type) {
  return NOTES[((rootIndex % 12) + 12) % 12] + CHORD_TYPES[type].suffix;
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
  synth.releaseAll();
  if (state.arp.enabled) {
    const notes = getChordNotesExpanded(rootIndex, type, state.arp.octaves);
    const pattern = ARP_PATTERNS[state.arp.pattern](notes);
    const dur = Tone.Time(state.arp.speed).toSeconds();
    pattern.forEach((note, i) => {
      synth.triggerAttackRelease(note, state.arp.speed, Tone.now() + i * dur);
    });
  } else {
    synth.triggerAttackRelease(getChordNotes(rootIndex, type), '4n');
  }
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
  if (state.paletteTab === 'diatonic') chords = getDiatonicChords();
  else if (state.paletteTab === 'extended') chords = getExtendedChords();
  else chords = getAllChords();

  grid.innerHTML = chords.map((c) => {
    const name = getChordName(c.root, c.type);
    const quality = CHORD_TYPES[c.type].quality;
    const deg = c.degree ? `<span class="degree">${c.degree}</span>` : '';
    return `<button class="chord-btn" data-quality="${quality}" data-root="${c.root}" data-type="${c.type}">${name}${deg}</button>`;
  }).join('');

  grid.querySelectorAll('.chord-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const root = parseInt(btn.dataset.root);
      const type = btn.dataset.type;
      previewChord(root, type);
      addToProgression(root, type);
    });
  });
}

function renderProgression() {
  const track = document.getElementById('progression-track');
  if (state.progression.length === 0) {
    track.innerHTML = '<div class="empty-state">Tap chords to build a progression</div>';
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
      const c = state.progression[parseInt(el.dataset.index)];
      previewChord(c.root, c.type);
    });
    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', el.dataset.index);
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
  });

  track.addEventListener('dragover', (e) => e.preventDefault());
  track.addEventListener('drop', (e) => {
    e.preventDefault();
    const from = parseInt(e.dataTransfer.getData('text/plain'));
    const target = e.target.closest('.prog-chord');
    if (!target) return;
    const to = parseInt(target.dataset.index);
    if (from === to) return;
    const [moved] = state.progression.splice(from, 1);
    state.progression.splice(to, 0, moved);
    renderProgression();
  });

  const last = track.lastElementChild;
  if (last) last.scrollIntoView({ behavior: 'smooth', inline: 'end', block: 'nearest' });
}

function renderPresets() {
  const list = document.getElementById('preset-list');
  list.innerHTML = PRESETS.map((p, i) => {
    const scale = SCALES[p.forScale || state.scale];
    const names = p.degrees.map((d, j) => {
      const root = (state.key + scale.steps[d]) % 12;
      const type = p.types ? p.types[j] : scale.chordTypes[d];
      return getChordName(root, type);
    }).join(' - ');
    return `<button class="preset-btn" data-index="${i}">
      <span class="preset-name">${p.name}</span>
      <span class="preset-chords">${names}</span>
    </button>`;
  }).join('');

  list.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = PRESETS[parseInt(btn.dataset.index)];
      const scale = SCALES[p.forScale || state.scale];
      state.progression = p.degrees.map((d, j) => ({
        root: (state.key + scale.steps[d]) % 12,
        type: p.types ? p.types[j] : scale.chordTypes[d],
      }));
      renderProgression();
      showToast(`Loaded "${p.name}"`);
    });
  });
}

function buildArpSequence(chord) {
  const notes = getChordNotesExpanded(chord.root, chord.type, state.arp.octaves);
  return ARP_PATTERNS[state.arp.pattern](notes);
}

function renderArpVisual(arpNotes, activeIndex) {
  const visual = document.getElementById('arp-visual');
  if (!arpNotes || arpNotes.length === 0) {
    visual.innerHTML = '<p class="arp-hint">Enable arpeggio and play a progression to see the pattern</p>';
    return;
  }
  const midiValues = arpNotes.map(n => {
    const note = n.replace(/\d+/, '');
    const oct = parseInt(n.match(/\d+/)[0]);
    return NOTES.indexOf(note) + (oct + 1) * 12;
  });
  const minMidi = Math.min(...midiValues);
  const maxMidi = Math.max(...midiValues);
  const range = maxMidi - minMidi || 1;

  visual.innerHTML = `<div class="arp-note-row">${midiValues.map((m, i) => {
    const h = 15 + ((m - minMidi) / range) * 85;
    const active = i === activeIndex ? ' active' : '';
    return `<div class="arp-note-bar${active}" style="height:${h}%"></div>`;
  }).join('')}</div>`;
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

  if (state.arp.enabled) {
    startArpPlayback();
  } else {
    startChordPlayback();
  }

  Tone.getTransport().start();
  transportStarted = true;
}

function startChordPlayback() {
  const beatDur = `${state.beatsPerChord * 4}n`;
  const steps = Array.from({ length: state.progression.length }, (_, i) => i);

  const part = new Tone.Sequence((time, step) => {
    state.currentStep = step;
    const c = state.progression[step];
    const notes = getChordNotes(c.root, c.type);
    synth.triggerAttackRelease(notes, beatDur, time);
    Tone.getDraw().schedule(() => renderProgression(), time);
  }, steps, beatDur);

  part.loop = state.loop;
  part.start(0);

  if (!state.loop) {
    const total = Tone.Time(beatDur).toSeconds() * state.progression.length;
    Tone.getTransport().schedule(() => stopPlayback(), total + 0.1);
  }
}

function startArpPlayback() {
  const beatsPerChord = state.beatsPerChord;
  const arpSpeed = state.arp.speed;
  const arpDurSec = Tone.Time(arpSpeed).toSeconds();
  const beatDurSec = Tone.Time('4n').toSeconds();
  const chordDurSec = beatDurSec * beatsPerChord;
  const notesPerChord = Math.max(1, Math.floor(chordDurSec / arpDurSec));

  let globalStep = 0;
  const totalArpNotes = state.progression.length * notesPerChord;

  const allSteps = [];
  state.progression.forEach((chord, chordIdx) => {
    const arpNotes = buildArpSequence(chord);
    for (let n = 0; n < notesPerChord; n++) {
      const noteIdx = n % arpNotes.length;
      allSteps.push({ chordIdx, note: arpNotes[noteIdx], arpNotes, noteIdx });
    }
  });

  const seq = new Tone.Sequence((time, stepIdx) => {
    const step = allSteps[stepIdx];
    if (!step) return;
    state.currentStep = step.chordIdx;
    state.arp.currentNote = step.noteIdx;
    synth.triggerAttackRelease(step.note, arpSpeed, time);
    Tone.getDraw().schedule(() => {
      renderProgression();
      renderArpVisual(step.arpNotes, step.noteIdx);
    }, time);
  }, Array.from({ length: allSteps.length }, (_, i) => i), arpSpeed);

  seq.loop = state.loop;
  seq.start(0);

  if (!state.loop) {
    const total = arpDurSec * allSteps.length;
    Tone.getTransport().schedule(() => stopPlayback(), total + 0.1);
  }
}

function stopPlayback() {
  state.playing = false;
  state.currentStep = -1;
  state.arp.currentNote = -1;
  if (transportStarted) {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    transportStarted = false;
  }
  if (synth) synth.releaseAll();
  updateTransportUI();
  renderProgression();
  if (state.arp.enabled) renderArpVisual(null);
}

function togglePlayback() {
  if (state.playing) stopPlayback();
  else startPlayback();
}

function updateTransportUI() {
  document.getElementById('play-icon').style.display = state.playing ? 'none' : 'block';
  document.getElementById('pause-icon').style.display = state.playing ? 'block' : 'none';
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function setupTabs() {
  document.querySelectorAll('.tab-bar-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-bar-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
    });
  });
}

function setupOptionButtons(containerId, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.arp-btn, .opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.arp-btn, .opt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      callback(btn);
    });
  });
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
    if (transportStarted) Tone.getTransport().bpm.value = state.tempo;
  });

  document.getElementById('play-btn').addEventListener('click', togglePlayback);
  document.getElementById('stop-btn').addEventListener('click', stopPlayback);

  const loopBtn = document.getElementById('loop-btn');
  loopBtn.addEventListener('click', () => {
    state.loop = !state.loop;
    loopBtn.classList.toggle('active', state.loop);
    if (state.playing) { stopPlayback(); startPlayback(); }
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    if (state.progression.length === 0) return;
    stopPlayback();
    state.progression = [];
    renderProgression();
    showToast('Cleared');
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    if (state.progression.length === 0) return;
    const text = state.progression.map(c => getChordName(c.root, c.type)).join(' | ');
    const full = `Key: ${NOTES[state.key]} ${state.scale} | ${text} | ${state.tempo} BPM`;
    navigator.clipboard.writeText(full).then(() => showToast('Copied!')).catch(() => showToast(full));
  });

  document.querySelectorAll('.palette-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.palette-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.paletteTab = tab.dataset.tab;
      renderChordGrid();
    });
  });

  setupTabs();

  setupOptionButtons('arp-patterns', (btn) => {
    state.arp.pattern = btn.dataset.pattern;
    if (state.playing && state.arp.enabled) { stopPlayback(); startPlayback(); }
  });

  setupOptionButtons('arp-speeds', (btn) => {
    state.arp.speed = btn.dataset.speed;
    if (state.playing && state.arp.enabled) { stopPlayback(); startPlayback(); }
  });

  setupOptionButtons('arp-octaves', (btn) => {
    state.arp.octaves = parseInt(btn.dataset.octaves);
    if (state.playing && state.arp.enabled) { stopPlayback(); startPlayback(); }
  });

  document.getElementById('arp-toggle').addEventListener('change', (e) => {
    state.arp.enabled = e.target.checked;
    if (state.playing) { stopPlayback(); startPlayback(); }
    if (!state.arp.enabled) renderArpVisual(null);
  });

  setupOptionButtons('beats-options', (btn) => {
    state.beatsPerChord = parseInt(btn.dataset.val);
    if (state.playing) { stopPlayback(); startPlayback(); }
  });

  setupOptionButtons('sound-options', (btn) => {
    state.sound = btn.dataset.val;
    updateSynthSound();
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
