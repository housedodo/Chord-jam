// Sound Telephone — piano-roll music telephone game
(function () {
  'use strict';

  // ── Config ──
  const INSTRUMENTS = ['drums', 'chords', 'bass', 'melody'];
  const STEPS = 32;
  const BUILD_TIME = 120;
  const DRUM_NAMES = ['Kick', 'Snare', 'HiHat', 'OpenHH', 'Clap', 'Tom', 'Rim', 'Crash', 'Cowbell', 'Shaker', 'Conga'];
  const NOTE_NAMES_BASS = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3'];
  const NOTE_NAMES_MELODY = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'];
  const CHORD_NAMES = ['C','Cm','D','Dm','E','Em','F','Fm','G','Gm','A','Am','B','Bm',
    'C7','D7','E7','F7','G7','A7','B7',
    'Cmaj7','Dmaj7','Fmaj7','Gmaj7',
    'Cm7','Dm7','Em7','Fm7','Gm7','Am7','Bm7',
    'Csus4','Dsus4','Gsus4','Asus4','Csus2','Dsus2','Gsus2','Asus2',
    'Cdim','Ddim','Edim','Bdim','Caug','Eaug',
    'C6','D6','F6','G6','A6','Cm6','Dm6','Em6','Am6',
    'C9','D9','G9','A9'];
  const CHORD_NOTES = {
    'C':['C4','E4','G4'],'Cm':['C4','Eb4','G4'],'D':['D4','F#4','A4'],'Dm':['D4','F4','A4'],
    'E':['E4','G#4','B4'],'Em':['E4','G4','B4'],'F':['F4','A4','C5'],'Fm':['F4','Ab4','C5'],
    'G':['G3','B3','D4'],'Gm':['G3','Bb3','D4'],'A':['A3','C#4','E4'],'Am':['A3','C4','E4'],
    'B':['B3','D#4','F#4'],'Bm':['B3','D4','F#4'],
    'C7':['C4','E4','G4','Bb4'],'D7':['D4','F#4','A4','C5'],'E7':['E4','G#4','B4','D5'],
    'F7':['F4','A4','C5','Eb5'],'G7':['G3','B3','D4','F4'],'A7':['A3','C#4','E4','G4'],
    'B7':['B3','D#4','F#4','A4'],
    'Cmaj7':['C4','E4','G4','B4'],'Dmaj7':['D4','F#4','A4','C#5'],
    'Fmaj7':['F4','A4','C5','E5'],'Gmaj7':['G3','B3','D4','F#4'],
    'Cm7':['C4','Eb4','G4','Bb4'],'Dm7':['D4','F4','A4','C5'],'Em7':['E4','G4','B4','D5'],
    'Fm7':['F4','Ab4','C5','Eb5'],'Gm7':['G3','Bb3','D4','F4'],'Am7':['A3','C4','E4','G4'],
    'Bm7':['B3','D4','F#4','A4'],
    'Csus4':['C4','F4','G4'],'Dsus4':['D4','G4','A4'],'Gsus4':['G3','C4','D4'],'Asus4':['A3','D4','E4'],
    'Csus2':['C4','D4','G4'],'Dsus2':['D4','E4','A4'],'Gsus2':['G3','A3','D4'],'Asus2':['A3','B3','E4'],
    'Cdim':['C4','Eb4','Gb4'],'Ddim':['D4','F4','Ab4'],'Edim':['E4','G4','Bb4'],'Bdim':['B3','D4','F4'],
    'Caug':['C4','E4','G#4'],'Eaug':['E4','G#4','C5'],
    'C6':['C4','E4','G4','A4'],'D6':['D4','F#4','A4','B4'],'F6':['F4','A4','C5','D5'],
    'G6':['G3','B3','D4','E4'],'A6':['A3','C#4','E4','F#4'],
    'Cm6':['C4','Eb4','G4','A4'],'Dm6':['D4','F4','A4','B4'],
    'Em6':['E4','G4','B4','C#5'],'Am6':['A3','C4','E4','F#4'],
    'C9':['C4','E4','G4','Bb4','D5'],'D9':['D4','F#4','A4','C5','E5'],
    'G9':['G3','B3','D4','F4','A4'],'A9':['A3','C#4','E4','G4','B4']
  };
  const PLAYER_COLORS = ['#a78bfa', '#e8a0bf', '#7eb8d4', '#e8b07d', '#8cc5a2', '#c9a0d4'];
  const BASS_SOUNDS = {
    'Sub Bass': { harmonicity: 0.5, modulationIndex: 1, envelope: { attack: 0.01, decay: 0.4, sustain: 0.6, release: 0.3 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.05, decay: 0.1, sustain: 0.5, release: 0.2 }, volume: -2 },
    'Analog Bass': { harmonicity: 1, modulationIndex: 2, envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.3 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.05, decay: 0.1, sustain: 0.5, release: 0.2 }, volume: -4 },
    'Pluck Bass': { harmonicity: 2, modulationIndex: 4, envelope: { attack: 0.005, decay: 0.15, sustain: 0.1, release: 0.2 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.01, decay: 0.05, sustain: 0.2, release: 0.1 }, volume: -4 },
    'Round Bass': { harmonicity: 1.5, modulationIndex: 0.5, envelope: { attack: 0.02, decay: 0.5, sustain: 0.5, release: 0.4 }, modulation: { type: 'triangle' }, modulationEnvelope: { attack: 0.1, decay: 0.2, sustain: 0.4, release: 0.3 }, volume: -4 },
    'Wobble Bass': { harmonicity: 3, modulationIndex: 8, envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 }, modulation: { type: 'sawtooth' }, modulationEnvelope: { attack: 0.02, decay: 0.4, sustain: 0.3, release: 0.2 }, volume: -4 },
    'Acid Bass': { harmonicity: 1, modulationIndex: 6, envelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.15 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.1 }, volume: -4 },
    'Reese Bass': { harmonicity: 1.005, modulationIndex: 0.8, envelope: { attack: 0.01, decay: 0.6, sustain: 0.7, release: 0.5 }, modulation: { type: 'sawtooth' }, modulationEnvelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.4 }, volume: -3 },
    'Rubber Bass': { harmonicity: 4, modulationIndex: 3, envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.1 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.01, decay: 0.08, sustain: 0.1, release: 0.05 }, volume: -4 }
  };
  const MELODY_SOUNDS = {
    'Piano': { harmonicity: 3, modulationIndex: 0.8, envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.5 }, modulation: { type: 'triangle' }, modulationEnvelope: { attack: 0.05, decay: 0.15, sustain: 0.3, release: 0.3 }, volume: -6 },
    'Synth Lead': { harmonicity: 2, modulationIndex: 3, envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.4 }, modulation: { type: 'sawtooth' }, modulationEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.2 }, volume: -8 },
    'Flute': { harmonicity: 1, modulationIndex: 0.3, envelope: { attack: 0.08, decay: 0.1, sustain: 0.7, release: 0.6 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.4 }, volume: -6 },
    'Bell': { harmonicity: 5.07, modulationIndex: 2, envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 0.5 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.3 }, volume: -8 },
    'Organ': { harmonicity: 2, modulationIndex: 1, envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.1 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.01, decay: 0.05, sustain: 0.8, release: 0.1 }, volume: -8 },
    'Strings': { harmonicity: 1, modulationIndex: 0.2, envelope: { attack: 0.15, decay: 0.3, sustain: 0.8, release: 0.8 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.2, decay: 0.3, sustain: 0.6, release: 0.5 }, volume: -6 },
    'Pad': { harmonicity: 1.5, modulationIndex: 0.5, envelope: { attack: 0.3, decay: 0.5, sustain: 0.8, release: 1.2 }, modulation: { type: 'triangle' }, modulationEnvelope: { attack: 0.3, decay: 0.4, sustain: 0.5, release: 0.8 }, volume: -8 },
    'Marimba': { harmonicity: 4, modulationIndex: 1.5, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }, volume: -6 },
    'Pluck': { harmonicity: 3, modulationIndex: 2, envelope: { attack: 0.001, decay: 0.2, sustain: 0.05, release: 0.3 }, modulation: { type: 'triangle' }, modulationEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 }, volume: -6 },
    'Brass': { harmonicity: 1, modulationIndex: 4, envelope: { attack: 0.06, decay: 0.2, sustain: 0.7, release: 0.3 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.08, decay: 0.1, sustain: 0.6, release: 0.2 }, volume: -8 },
    'Whistle': { harmonicity: 1, modulationIndex: 0.1, envelope: { attack: 0.05, decay: 0.05, sustain: 0.9, release: 0.3 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.05, decay: 0.05, sustain: 0.8, release: 0.2 }, volume: -8 },
    'Retro': { harmonicity: 2, modulationIndex: 5, envelope: { attack: 0.005, decay: 0.15, sustain: 0.4, release: 0.2 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.01, decay: 0.08, sustain: 0.3, release: 0.1 }, volume: -8 }
  };
  const CHORD_SOUNDS = {
    'Piano Chords': { harmonicity: 3, modulationIndex: 0.8, envelope: { attack: 0.02, decay: 0.4, sustain: 0.5, release: 0.8 }, modulation: { type: 'triangle' }, modulationEnvelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.4 }, volume: -8 },
    'Warm Pad': { harmonicity: 1.5, modulationIndex: 0.3, envelope: { attack: 0.25, decay: 0.6, sustain: 0.8, release: 1.5 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.3, decay: 0.4, sustain: 0.5, release: 0.8 }, volume: -10 },
    'Bright Keys': { harmonicity: 2, modulationIndex: 2, envelope: { attack: 0.01, decay: 0.25, sustain: 0.3, release: 0.5 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.2 }, volume: -8 },
    'Electric Piano': { harmonicity: 3.5, modulationIndex: 1.2, envelope: { attack: 0.005, decay: 0.5, sustain: 0.2, release: 0.6 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.3 }, volume: -8 },
    'Organ Chords': { harmonicity: 2, modulationIndex: 1, envelope: { attack: 0.01, decay: 0.1, sustain: 0.85, release: 0.15 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.01, decay: 0.05, sustain: 0.8, release: 0.1 }, volume: -10 },
    'Synth Stab': { harmonicity: 1, modulationIndex: 4, envelope: { attack: 0.005, decay: 0.15, sustain: 0.1, release: 0.2 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.01, decay: 0.08, sustain: 0.2, release: 0.1 }, volume: -8 },
    'Glass': { harmonicity: 5, modulationIndex: 1.5, envelope: { attack: 0.001, decay: 0.6, sustain: 0.1, release: 0.8 }, modulation: { type: 'triangle' }, modulationEnvelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.5 }, volume: -10 },
    'Lo-Fi': { harmonicity: 1, modulationIndex: 0.5, envelope: { attack: 0.03, decay: 0.3, sustain: 0.4, release: 0.6 }, modulation: { type: 'triangle' }, modulationEnvelope: { attack: 0.05, decay: 0.15, sustain: 0.3, release: 0.3 }, volume: -8 }
  };
  const GENRE_SUGGESTIONS = [
    { genre: 'Pop', bpm: [100,130], icon: '🎤', examples: ['Shape of You','Blinding Lights','Happy','Uptown Funk','Bad Guy','Shake It Off','Rolling in the Deep','Somebody That I Used to Know'] },
    { genre: 'Rock', bpm: [110,140], icon: '🎸', examples: ['Seven Nation Army','Smells Like Teen Spirit','Back in Black','Smoke on the Water','Highway to Hell','Sweet Child O\' Mine','Bohemian Rhapsody','Stairway to Heaven'] },
    { genre: 'Hip Hop', bpm: [80,100], icon: '🎧', examples: ['Lose Yourself','HUMBLE.','Sicko Mode','In Da Club','Hotline Bling','Old Town Road','God\'s Plan','Alright'] },
    { genre: 'EDM / House', bpm: [120,130], icon: '🎛️', examples: ['Levels','Titanium','Lean On','Wake Me Up','Don\'t You Worry Child','Clarity','Animals','This Is What You Came For'] },
    { genre: 'Drum & Bass', bpm: [160,180], icon: '🥁', examples: ['Gold Dust','Hold Your Colour','T2 - Heartbroken','Netsky - Memory Lane','Chase & Status - Blind Faith','Sub Focus - Splash'] },
    { genre: 'R&B / Soul', bpm: [60,80], icon: '🎷', examples: ['No Scrubs','Crazy in Love','Stay','Kiss from a Rose','Ain\'t No Sunshine','Superstition','I Will Always Love You','Fallin\''] },
    { genre: 'Reggaeton', bpm: [90,100], icon: '🌴', examples: ['Despacito','Mi Gente','Dákiti','Gasolina','Tusa','Con Calma','Baila Conmigo','Hawái'] },
    { genre: 'Jazz', bpm: [100,160], icon: '🎺', examples: ['Take Five','So What','Fly Me to the Moon','Autumn Leaves','My Favorite Things','Blue in Green','Summertime','All of Me'] },
    { genre: 'Country', bpm: [100,120], icon: '🤠', examples: ['Jolene','Ring of Fire','Take Me Home Country Roads','Wagon Wheel','Friends in Low Places','Chicken Fried','Need You Now','The Gambler'] },
    { genre: 'Funk', bpm: [100,120], icon: '🕺', examples: ['Superstition','Get Lucky','Le Freak','Play That Funky Music','Brick House','September','I Got You','Give Up the Funk'] },
    { genre: 'Metal', bpm: [120,180], icon: '🤘', examples: ['Enter Sandman','Master of Puppets','Chop Suey!','Ace of Spades','Iron Man','The Trooper','Raining Blood','Paranoid'] },
    { genre: 'Ballad', bpm: [60,80], icon: '💜', examples: ['Someone Like You','All of Me','Perfect','Hallelujah','Let It Be','Imagine','Yesterday','My Heart Will Go On'] },
    { genre: 'Disco', bpm: [110,130], icon: '🪩', examples: ['Stayin\' Alive','I Will Survive','Don\'t Stop \'Til You Get Enough','Le Freak','Funkytown','Night Fever','Boogie Wonderland','Hot Stuff'] },
    { genre: 'Lo-Fi', bpm: [70,90], icon: '☕', examples: ['Snowman','Coffee','Afternoon','Daydream','Rainy Days','Sunflower','Moonlight','Chillwave'] },
    { genre: 'Punk', bpm: [140,180], icon: '⚡', examples: ['Basket Case','Blitzkrieg Bop','American Idiot','Dammit','All the Small Things','Anarchy in the U.K.','London Calling','I Wanna Be Sedated'] },
    { genre: 'Latin', bpm: [90,110], icon: '💃', examples: ['Livin\' La Vida Loca','Bailando','Hips Don\'t Lie','Waka Waka','La Bamba','Conga','Vivir Mi Vida','Mas Que Nada'] }
  ];

  const COLOR_SCHEMES = {
    purple: { label: 'Purple', color: '#b89cff',
      bg:'#1a1528', surface:'#241e38', surface2:'#2d2648', surface3:'#362f54', border:'#43396a',
      text:'#e4ddf5', textMuted:'#9b8fc0', textDim:'#6e6194',
      accent:'#b89cff', accentSoft:'#8b72d4',
      grid:'#1b2a3a', gridBeat:'#1f3348', gridAlt:'#172535', gridAltBeat:'#1c2e42', gridBorder:'rgba(70,120,160,0.25)',
      pianoRollBg:'#1b2a3a', note:'#ef6b5a', noteBorder:'#d44e3d' },
    blue: { label: 'Blue', color: '#8EB2EB',
      bg:'#101828', surface:'#182030', surface2:'#1e2940', surface3:'#26324e', border:'#334466',
      text:'#dde6f5', textMuted:'#8ba0c4', textDim:'#5a7094',
      accent:'#8EB2EB', accentSoft:'#5C8BD6',
      grid:'#162030', gridBeat:'#1c2940', gridAlt:'#121c2c', gridAltBeat:'#18253a', gridBorder:'rgba(90,130,200,0.25)',
      pianoRollBg:'#162030', note:'#f0a050', noteBorder:'#d4883a' },
    green: { label: 'Green', color: '#8cc5a2',
      bg:'#101e18', surface:'#182820', surface2:'#1e3228', surface3:'#263c30', border:'#33554a',
      text:'#d8f0e4', textMuted:'#88b09c', textDim:'#5a8070',
      accent:'#8cc5a2', accentSoft:'#5ca880',
      grid:'#142820', gridBeat:'#1a3228', gridAlt:'#10221c', gridAltBeat:'#162c24', gridBorder:'rgba(80,160,120,0.25)',
      pianoRollBg:'#142820', note:'#e88070', noteBorder:'#c86858' },
    red: { label: 'Rose', color: '#e8a0bf',
      bg:'#1e1018', surface:'#2a1822', surface2:'#34202c', surface3:'#3e2836', border:'#553848',
      text:'#f5dde8', textMuted:'#c08898', textDim:'#945a70',
      accent:'#e8a0bf', accentSoft:'#c47090',
      grid:'#281820', gridBeat:'#321e28', gridAlt:'#221420', gridAltBeat:'#2c1a26', gridBorder:'rgba(200,100,140,0.25)',
      pianoRollBg:'#281820', note:'#70b8e0', noteBorder:'#5098c0' },
    orange: { label: 'Amber', color: '#e8b07d',
      bg:'#1e1410', surface:'#2a1e16', surface2:'#34261e', surface3:'#3e2e26', border:'#555040',
      text:'#f5e8dd', textMuted:'#c0a088', textDim:'#947860',
      accent:'#e8b07d', accentSoft:'#c48850',
      grid:'#281e16', gridBeat:'#32241c', gridAlt:'#221a12', gridAltBeat:'#2c2018', gridBorder:'rgba(180,140,80,0.25)',
      pianoRollBg:'#281e16', note:'#70b0d8', noteBorder:'#5090b8' },
    yellow: { label: 'Gold', color: '#EED263',
      bg:'#1a1810', surface:'#242018', surface2:'#2e2820', surface3:'#383028', border:'#504838',
      text:'#f5f0dd', textMuted:'#c0b888', textDim:'#949060',
      accent:'#EED263', accentSoft:'#c4a840',
      grid:'#22201a', gridBeat:'#2a2820', gridAlt:'#1e1c16', gridAltBeat:'#26241c', gridBorder:'rgba(180,160,80,0.25)',
      pianoRollBg:'#22201a', note:'#7090e0', noteBorder:'#5070c0' }
  };
  const CELL_W = 34;
  const LABEL_W = 54;

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
  let currentBassSound = 'Analog Bass';
  let currentMelodySound = 'Piano';
  let currentChordSound = 'Piano Chords';
  let pianoRollNotes = [];

  // ── Audio ──
  let audioReady = false;
  const synths = {};

  function ensureAudio() {
    if (audioReady) return Promise.resolve();
    return Tone.start().then(function () { audioReady = true; });
  }

  function createDrumSynth() {
    var vol = new Tone.Volume(-4).toDestination();
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
      trigger: function (name) {
        switch (name) {
          case 'Kick': kick.triggerAttackRelease('C1', '8n'); break;
          case 'Snare': snare.triggerAttackRelease('8n'); break;
          case 'HiHat': hihat.triggerAttackRelease('32n'); break;
          case 'OpenHH': openHH.triggerAttackRelease('16n'); break;
          case 'Clap': clap.triggerAttackRelease('16n'); break;
          case 'Tom': tom.triggerAttackRelease('E2', '8n'); break;
          case 'Rim': rim.triggerAttackRelease('G4', '32n'); break;
          case 'Crash': crash.triggerAttackRelease('16n'); break;
          case 'Cowbell': cowbell.triggerAttackRelease('16n'); break;
          case 'Shaker': shaker.triggerAttackRelease('32n'); break;
          case 'Conga': conga.triggerAttackRelease('D3', '8n'); break;
        }
      },
      dispose: function () { [kick, snare, hihat, openHH, clap, tom, rim, crash, cowbell, shaker, conga, vol].forEach(function (n) { n.dispose(); }); }
    };
  }

  function createChordSynth(presetName) {
    var preset = CHORD_SOUNDS[presetName || currentChordSound] || CHORD_SOUNDS['Piano Chords'];
    var reverb = new Tone.Reverb({ decay: 2, wet: 0.25 }).toDestination();
    var poly = new Tone.PolySynth(Tone.FMSynth, preset).connect(reverb);
    return {
      play: function (notes, dur) { poly.triggerAttackRelease(notes, dur); },
      dispose: function () { poly.dispose(); reverb.dispose(); }
    };
  }

  function getOrCreateChordSynth() {
    if (synths.chords) { synths.chords.dispose(); synths.chords = null; }
    synths.chords = createChordSynth();
    return synths.chords;
  }

  function createSynthFromPreset(preset, poly) {
    var reverb = new Tone.Reverb({ decay: 1.5, wet: 0.2 }).toDestination();
    var syn;
    if (poly) {
      syn = new Tone.PolySynth(Tone.FMSynth, preset).connect(reverb);
    } else {
      syn = new Tone.FMSynth(preset).connect(reverb);
    }
    return {
      play: function (note, dur) { syn.triggerAttackRelease(note, dur); },
      dispose: function () { syn.dispose(); reverb.dispose(); }
    };
  }

  function getOrCreateBassSynth() {
    if (synths.bass) synths.bass.dispose();
    synths.bass = createSynthFromPreset(BASS_SOUNDS[currentBassSound], false);
    return synths.bass;
  }

  function getOrCreateMelodySynth() {
    if (synths.melody) synths.melody.dispose();
    synths.melody = createSynthFromPreset(MELODY_SOUNDS[currentMelodySound], true);
    return synths.melody;
  }

  // ── Screens & Utility ──
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
    document.getElementById('screen-' + id).classList.add('active');
  }

  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2000);
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function renderGenreRoller(container, tempoSlider, tempoDisplay) {
    container.innerHTML = '';
    var resultDiv = document.createElement('div');
    resultDiv.className = 'genre-result';
    resultDiv.style.display = 'none';

    var genreLabel = document.createElement('div');
    genreLabel.className = 'genre-result-genre';
    var bpmLabel = document.createElement('div');
    bpmLabel.className = 'genre-result-bpm';
    var exampleLabel = document.createElement('div');
    exampleLabel.className = 'genre-result-example';

    resultDiv.appendChild(genreLabel);
    resultDiv.appendChild(bpmLabel);
    resultDiv.appendChild(exampleLabel);

    var btn = document.createElement('button');
    btn.className = 'btn-secondary genre-roll-btn';
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg> Random Genre';
    btn.onclick = function () {
      var g = GENRE_SUGGESTIONS[Math.floor(Math.random() * GENRE_SUGGESTIONS.length)];
      var mid = Math.round((g.bpm[0] + g.bpm[1]) / 2);
      var example = g.examples[Math.floor(Math.random() * g.examples.length)];
      genreLabel.textContent = g.icon + ' ' + g.genre;
      bpmLabel.textContent = g.bpm[0] + '-' + g.bpm[1] + ' BPM';
      exampleLabel.textContent = 'Try: ' + example;
      resultDiv.style.display = 'flex';
      resultDiv.classList.add('genre-result-pop');
      setTimeout(function () { resultDiv.classList.remove('genre-result-pop'); }, 300);
      if (tempoSlider) { tempoSlider.value = mid; tempoDisplay.textContent = mid; gameBpm = mid; }
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg> Roll Again';
    };
    container.appendChild(btn);
    container.appendChild(resultDiv);
  }

  function applyColorScheme(name) {
    var s = COLOR_SCHEMES[name];
    if (!s) return;
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
    localStorage.setItem('st-theme', name);
  }

  function initThemePicker() {
    var container = document.getElementById('theme-picker');
    if (!container) return;
    var saved = localStorage.getItem('st-theme') || 'purple';
    Object.keys(COLOR_SCHEMES).forEach(function (key) {
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

    document.getElementById('btn-create').addEventListener('click', function () {
      ensureAudio();
      var name = getName();
      if (!name) { toast('Enter your name first'); return; }
      players = [{ name: name, color: PLAYER_COLORS[0] }];
      soloMode = false;
      showLobby();
    });

    document.getElementById('btn-solo').addEventListener('click', function () {
      ensureAudio();
      var name = getName();
      if (!name) { toast('Enter your name first'); return; }
      players = [{ name: name, color: PLAYER_COLORS[0] }];
      soloMode = true;
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
    var gc = document.getElementById('solo-genres');
    if (gc) renderGenreRoller(gc, ts, tv);
    document.getElementById('btn-solo-start').onclick = function () {
      var sn = document.getElementById('solo-song').value.trim() || 'Free Jam';
      soloInstIdx = 0;
      games = [{ songName: sn, enteredBy: 0, submissions: {}, guesses: [] }];
      currentGameIdx = 0;
      startSoloBuild();
    };
    document.getElementById('btn-solo-back').onclick = function () { showScreen('home'); };
  }

  function startSoloBuild() {
    if (soloInstIdx >= INSTRUMENTS.length) { showReveal(); return; }
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
    var lgc = document.getElementById('lobby-genres');
    if (lgc) renderGenreRoller(lgc, ts, tv);

    var startBtn = document.getElementById('btn-start');
    startBtn.onclick = function () {
      if (players.length < 2) { toast('Need at least 2 players'); return; }
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
      card.innerHTML = '<div class="player-avatar" style="background:' + p.color + '">' + p.name[0].toUpperCase() + '</div>' +
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
    document.getElementById('handoff-instrument').textContent = 'Enter your song (no peeking, everyone!)';
    document.getElementById('handoff-hint').textContent = 'Share your screen on Discord when ready';
    document.getElementById('btn-handoff-ready').onclick = function () { showSongEntry(); };
  }

  function showSongEntry() {
    showScreen('songentry');
    document.getElementById('songentry-player').textContent = players[songEntryIdx].name + ', enter your song:';
    var input = document.getElementById('songentry-input');
    input.value = '';
    var gc = document.getElementById('songentry-genres');
    if (gc) renderGenreRoller(gc, null, null);
    setTimeout(function () { input.focus(); }, 100);
    document.getElementById('btn-songentry-done').onclick = function () {
      var song = input.value.trim();
      if (!song) { toast('Enter a song name'); return; }
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
    if (currentRound >= 4) { showReveal(); return; }
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
    var gIdx = getGameIdx(currentTurnPlayer, currentRound);
    var game = games[gIdx];
    var existingCount = Object.keys(game.submissions).length;

    document.getElementById('handoff-label').textContent = 'It\'s your turn';
    document.getElementById('handoff-player').textContent = p.name;
    document.getElementById('handoff-instrument').textContent = 'Your instrument: ' + inst.charAt(0).toUpperCase() + inst.slice(1);

    if (currentRound === 0) {
      document.getElementById('handoff-hint').textContent = 'Build ' + inst + ' for your song — share your screen!';
    } else {
      document.getElementById('handoff-hint').textContent =
        'Listen to ' + existingCount + ' existing layer' + (existingCount !== 1 ? 's' : '') + ', guess the song, and add ' + inst + '!';
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
    var isOwn = game.enteredBy === currentTurnPlayer;

    document.getElementById('build-song').textContent = currentRound === 0 ? game.songName : '???';

    var badge = document.getElementById('build-instrument');
    badge.textContent = instrument;
    badge.setAttribute('data-inst', instrument);

    INSTRUMENTS.forEach(function (i) {
      document.getElementById('seq-' + i).style.display = i === instrument ? 'flex' : 'none';
      var bpm = document.getElementById(i + '-bpm-display');
      if (bpm) bpm.textContent = gameBpm + ' BPM';
    });

    // Listen: plays existing layers + current instrument together
    var listenBtn = document.getElementById('btn-listen-existing');
    var hasExisting = Object.keys(game.submissions).length > 0;
    var listeningExisting = false;
    listenBtn.style.display = hasExisting ? 'flex' : 'none';
    listenBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="7,4 21,12 7,20"/></svg> Play with Existing Layers';
    listenBtn.onclick = function () {
      ensureAudio().then(function () {
        if (listeningExisting) {
          stopPreview();
          listenBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="7,4 21,12 7,20"/></svg> Play with Existing Layers';
          listeningExisting = false;
        } else {
          stopPreview();
          startPreview(instrument);
          listenBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg> Stop';
          listeningExisting = true;
        }
      });
    };

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
      buildSecondsLeft = BUILD_TIME;
      updateBuildTimer();
      buildTimer = setInterval(function () {
        buildSecondsLeft--;
        updateBuildTimer();
        if (buildSecondsLeft <= 0) { clearInterval(buildTimer); submitLayer(instrument); }
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
    if (instrument === 'melody') game.submissions[instrument].sound = currentMelodySound;

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
        setTimeout(showReveal, 600);
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
          var cell = document.querySelector('.drum-cell[data-name="' + name + '"][data-step="' + s + '"]');
          grid[name].push(cell && cell.classList.contains('on'));
        }
      });
      return grid;
    }
    return pianoRollNotes.slice();
  }

  // ── Sequencer Init ──
  function initSequencer(instrument) {
    pianoRollNotes = [];
    if (instrument === 'drums') initDrumGrid();
    else if (instrument === 'chords') initChordTimeline();
    else if (instrument === 'bass') initPianoRoll('bass', NOTE_NAMES_BASS, false);
    else if (instrument === 'melody') initPianoRoll('melody', NOTE_NAMES_MELODY, true);

    var playBtn = document.getElementById(instrument + '-play');
    var playIcon = document.getElementById(instrument + '-play-icon');
    var stopIcon = document.getElementById(instrument + '-stop-icon');
    playBtn.onclick = function () {
      ensureAudio().then(function () {
        if (previewPlaying) stopPreview();
        else startPreview(instrument);
        playIcon.style.display = previewPlaying ? 'none' : 'block';
        stopIcon.style.display = previewPlaying ? 'block' : 'none';
      });
    };
  }

  function initDrumGrid() {
    var grid = document.getElementById('drum-grid');
    grid.innerHTML = '';
    DRUM_NAMES.forEach(function (name) {
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

  // ── Piano Roll (bass/melody with edge-drag) ──
  function initPianoRoll(inst, noteNames, polyphonic) {
    var grid = document.getElementById(inst + '-grid');
    grid.innerHTML = '';
    pianoRollNotes = [];

    var wrapper = document.createElement('div');
    wrapper.className = 'piano-roll-wrapper';

    // Sound selector
    var soundBar = document.createElement('div');
    soundBar.className = 'sound-selector';
    var sounds = inst === 'bass' ? BASS_SOUNDS : MELODY_SOUNDS;
    var curSound = inst === 'bass' ? currentBassSound : currentMelodySound;
    Object.keys(sounds).forEach(function (name) {
      var btn = document.createElement('button');
      btn.className = 'sound-btn' + (name === curSound ? ' active' : '');
      btn.textContent = name;
      btn.onclick = function () {
        soundBar.querySelectorAll('.sound-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        if (inst === 'bass') { currentBassSound = name; getOrCreateBassSynth(); }
        else { currentMelodySound = name; getOrCreateMelodySynth(); }
      };
      soundBar.appendChild(btn);
    });
    wrapper.appendChild(soundBar);

    var rollContainer = document.createElement('div');
    rollContainer.className = 'piano-roll';

    var canvas = document.createElement('div');
    canvas.className = 'piano-roll-canvas';

    var reversed = noteNames.slice().reverse();
    var cellH = 32;

    canvas.style.width = (LABEL_W + STEPS * CELL_W) + 'px';
    canvas.style.height = (reversed.length * cellH) + 'px';
    canvas.style.position = 'relative';

    reversed.forEach(function (name, ri) {
      var label = document.createElement('div');
      label.className = 'pr-label';
      label.style.top = (ri * cellH) + 'px';
      label.style.height = cellH + 'px';
      label.style.lineHeight = cellH + 'px';
      label.textContent = name;
      canvas.appendChild(label);

      for (var s = 0; s < STEPS; s++) {
        var cell = document.createElement('div');
        cell.className = 'pr-cell' + (s % 4 === 0 ? ' pr-beat' : '') + (ri % 2 === 0 ? ' pr-alt' : '');
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
        var rect = block.getBoundingClientRect();
        var x = e.clientX - rect.left;
        if (x > rect.width - 12) {
          resizing = { noteIdx: idx };
          canvas.setPointerCapture(e.pointerId);
          e.preventDefault();
        } else {
          pianoRollNotes.splice(idx, 1);
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
        pianoRollNotes.splice(existing, 1);
        renderPR(inst, reversed, cellH);
        return;
      }

      if (!polyphonic) {
        pianoRollNotes = pianoRollNotes.filter(function (n) {
          return n.start + n.length <= step || n.start > step;
        });
      }

      pianoRollNotes.push({ note: noteName, start: step, length: 1 });
      renderPR(inst, reversed, cellH);

      resizing = { noteIdx: pianoRollNotes.length - 1 };
      canvas.setPointerCapture(e.pointerId);

      ensureAudio().then(function () {
        if (inst === 'bass') { if (!synths.bass) getOrCreateBassSynth(); synths.bass.play(noteName, '16n'); }
        else { if (!synths.melody) getOrCreateMelodySynth(); synths.melody.play(noteName, '16n'); }
      });
    });

    canvas.addEventListener('pointermove', function (e) {
      if (!resizing) return;
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var step = Math.floor((x - LABEL_W) / CELL_W);
      var note = pianoRollNotes[resizing.noteIdx];
      if (!note) return;
      var newLen = Math.max(1, Math.min(STEPS - note.start, step - note.start + 1));
      if (!polyphonic) {
        var next = pianoRollNotes.find(function (n) { return n !== note && n.note === note.note && n.start > note.start; });
        if (next && note.start + newLen > next.start) return;
      }
      if (newLen !== note.length) { note.length = newLen; renderPR(inst, reversed, cellH); }
    });

    canvas.addEventListener('pointerup', function () { resizing = null; });
  }

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
  function initChordTimeline() {
    var grid = document.getElementById('chords-grid');
    grid.innerHTML = '';
    pianoRollNotes = [];

    var wrapper = document.createElement('div');
    wrapper.className = 'chord-timeline-wrapper';

    var selectedChord = 'C';

    // Sound selector for chords
    var soundBar = document.createElement('div');
    soundBar.className = 'sound-selector';
    Object.keys(CHORD_SOUNDS).forEach(function (name) {
      var btn = document.createElement('button');
      btn.className = 'sound-btn' + (name === currentChordSound ? ' active' : '');
      btn.textContent = name;
      btn.onclick = function () {
        soundBar.querySelectorAll('.sound-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentChordSound = name;
        getOrCreateChordSynth();
      };
      soundBar.appendChild(btn);
    });
    wrapper.appendChild(soundBar);

    // Chord palette
    var palette = document.createElement('div');
    palette.className = 'chord-palette-bar';
    CHORD_NAMES.forEach(function (ch) {
      var btn = document.createElement('button');
      btn.className = 'chord-pick' + (ch === 'C' ? ' active' : '');
      btn.textContent = ch;
      btn.onclick = function () {
        palette.querySelectorAll('.chord-pick').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        selectedChord = ch;
        ensureAudio().then(function () {
          if (!synths.chords) synths.chords = createChordSynth();
          var cn = CHORD_NOTES[ch];
          if (cn) synths.chords.play(cn, '8n');
        });
      };
      palette.appendChild(btn);
    });
    wrapper.appendChild(palette);

    // Timeline
    var timeline = document.createElement('div');
    timeline.className = 'chord-timeline';

    var canvas = document.createElement('div');
    canvas.className = 'chord-timeline-canvas';

    var cellH = 64;
    canvas.style.width = (STEPS * CELL_W) + 'px';
    canvas.style.height = cellH + 'px';
    canvas.style.position = 'relative';

    for (var s = 0; s < STEPS; s++) {
      var cell = document.createElement('div');
      cell.className = 'ct-cell' + (s % 4 === 0 ? ' ct-beat' : '');
      cell.style.left = (s * CELL_W) + 'px';
      cell.style.top = '0';
      cell.style.width = CELL_W + 'px';
      cell.style.height = cellH + 'px';
      cell.dataset.step = s;
      canvas.appendChild(cell);
    }

    // Beat numbers
    for (var b = 0; b < STEPS / 4; b++) {
      var num = document.createElement('div');
      num.className = 'ct-beat-num';
      num.style.left = (b * 4 * CELL_W + 2) + 'px';
      num.textContent = b + 1;
      canvas.appendChild(num);
    }

    var notesLayer = document.createElement('div');
    notesLayer.className = 'ct-notes-layer';
    notesLayer.id = 'chords-notes-layer';
    canvas.appendChild(notesLayer);

    var ph = document.createElement('div');
    ph.className = 'pr-playhead';
    ph.id = 'chords-playhead';
    ph.style.display = 'none';
    canvas.appendChild(ph);

    timeline.appendChild(canvas);
    wrapper.appendChild(timeline);
    grid.appendChild(wrapper);

    // Interaction
    var resizing = null;

    canvas.addEventListener('pointerdown', function (e) {
      var block = e.target.closest('.ct-note-block');
      if (block) {
        var idx = +block.dataset.index;
        var rect = block.getBoundingClientRect();
        var x = e.clientX - rect.left;
        if (x > rect.width - 12) {
          resizing = { noteIdx: idx };
          canvas.setPointerCapture(e.pointerId);
          e.preventDefault();
        } else {
          pianoRollNotes.splice(idx, 1);
          renderCT(cellH);
        }
        return;
      }

      var cell = e.target.closest('.ct-cell');
      if (!cell) return;
      var step = +cell.dataset.step;

      var existing = pianoRollNotes.findIndex(function (n) {
        return step >= n.start && step < n.start + n.length;
      });
      if (existing >= 0) {
        pianoRollNotes.splice(existing, 1);
        renderCT(cellH);
        return;
      }

      pianoRollNotes.push({ note: selectedChord, start: step, length: 1 });
      renderCT(cellH);

      resizing = { noteIdx: pianoRollNotes.length - 1 };
      canvas.setPointerCapture(e.pointerId);

      ensureAudio().then(function () {
        if (!synths.chords) synths.chords = createChordSynth();
        var cn = CHORD_NOTES[selectedChord];
        if (cn) synths.chords.play(cn, '16n');
      });
    });

    canvas.addEventListener('pointermove', function (e) {
      if (!resizing) return;
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var step = Math.floor(x / CELL_W);
      var note = pianoRollNotes[resizing.noteIdx];
      if (!note) return;
      var newLen = Math.max(1, Math.min(STEPS - note.start, step - note.start + 1));
      var nextChord = pianoRollNotes
        .filter(function (n, i) { return i !== resizing.noteIdx && n.start > note.start; })
        .sort(function (a, b) { return a.start - b.start; })[0];
      var maxLen = nextChord ? nextChord.start - note.start : STEPS - note.start;
      var clamped = Math.min(newLen, maxLen);
      if (clamped !== note.length && clamped >= 1) { note.length = clamped; renderCT(cellH); }
    });

    canvas.addEventListener('pointerup', function () { resizing = null; });
  }

  function renderCT(cellH) {
    var layer = document.getElementById('chords-notes-layer');
    if (!layer) return;
    layer.innerHTML = '';

    pianoRollNotes.forEach(function (n, i) {
      var block = document.createElement('div');
      block.className = 'ct-note-block';
      block.dataset.index = i;
      block.style.left = (n.start * CELL_W) + 'px';
      block.style.top = '4px';
      block.style.width = (n.length * CELL_W - 2) + 'px';
      block.style.height = (cellH - 8) + 'px';

      var lbl = document.createElement('span');
      lbl.className = 'ct-note-label';
      lbl.textContent = n.note;
      block.appendChild(lbl);

      var handle = document.createElement('div');
      handle.className = 'ct-handle-right';
      block.appendChild(handle);

      layer.appendChild(block);
    });
  }

  // ── Preview ──
  function startPreview(instrument) {
    Tone.Transport.bpm.value = gameBpm;
    Tone.Transport.stop();
    Tone.Transport.cancel();
    previewPlaying = true;
    previewSeqs = [];

    if (!soloMode && currentGameIdx >= 0 && games[currentGameIdx]) {
      addExistingLayerSeqs(currentGameIdx, instrument, previewSeqs);
    }

    if (instrument === 'drums') {
      if (!synths.drums) synths.drums = createDrumSynth();
      var seq = new Tone.Sequence(function (time, s) {
        Tone.Draw.schedule(function () { highlightDrumStep(s); }, time);
        DRUM_NAMES.forEach(function (name) {
          var cell = document.querySelector('.drum-cell[data-name="' + name + '"][data-step="' + s + '"]');
          if (cell && cell.classList.contains('on')) synths.drums.trigger(name);
        });
      }, Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0);
      previewSeqs.push(seq);
    } else {
      if (instrument === 'chords') { if (!synths.chords) synths.chords = createChordSynth(); }
      else if (instrument === 'bass') { if (!synths.bass) getOrCreateBassSynth(); }
      else { if (!synths.melody) getOrCreateMelodySynth(); }

      var notes = pianoRollNotes;
      var seq2 = new Tone.Sequence(function (time, s) {
        Tone.Draw.schedule(function () { showPlayhead(instrument, s); }, time);
        notes.forEach(function (n) {
          if (n.start === s) {
            var dur = n.length * Tone.Time('16n').toSeconds();
            if (instrument === 'chords') { var cn = CHORD_NOTES[n.note]; if (cn) synths.chords.play(cn, dur); }
            else if (instrument === 'bass') { synths.bass.play(n.note, dur); }
            else { synths.melody.play(n.note, dur); }
          }
        });
      }, Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0);
      previewSeqs.push(seq2);
    }

    Tone.Transport.start();
  }

  function addExistingLayerSeqs(gameIdx, skipInst, seqs) {
    var game = games[gameIdx];
    INSTRUMENTS.forEach(function (inst) {
      if (inst === skipInst) return;
      var sub = game.submissions[inst];
      if (!sub) return;

      if (inst === 'drums') {
        if (!synths.bgDrums) synths.bgDrums = createDrumSynth();
        var data = sub.data;
        seqs.push(new Tone.Sequence(function (time, s) {
          DRUM_NAMES.forEach(function (name) { if (data[name] && data[name][s]) synths.bgDrums.trigger(name); });
        }, Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
      } else if (inst === 'chords') {
        if (!synths.bgChords) synths.bgChords = createChordSynth();
        var notes = sub.data;
        seqs.push(new Tone.Sequence(function (time, s) {
          notes.forEach(function (n) {
            if (n.start === s) { var cn = CHORD_NOTES[n.note]; if (cn) synths.bgChords.play(cn, n.length * Tone.Time('16n').toSeconds()); }
          });
        }, Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
      } else if (inst === 'bass') {
        if (!synths.bgBass) synths.bgBass = createSynthFromPreset(BASS_SOUNDS[sub.sound || 'Analog Bass'], false);
        var bnotes = sub.data;
        seqs.push(new Tone.Sequence(function (time, s) {
          bnotes.forEach(function (n) { if (n.start === s) synths.bgBass.play(n.note, n.length * Tone.Time('16n').toSeconds()); });
        }, Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
      } else if (inst === 'melody') {
        if (!synths.bgMelody) synths.bgMelody = createSynthFromPreset(MELODY_SOUNDS[sub.sound || 'Piano'], true);
        var mnotes = sub.data;
        seqs.push(new Tone.Sequence(function (time, s) {
          mnotes.forEach(function (n) { if (n.start === s) synths.bgMelody.play(n.note, n.length * Tone.Time('16n').toSeconds()); });
        }, Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
      }
    });
  }

  function playExistingOnly(gameIdx) {
    Tone.Transport.bpm.value = gameBpm;
    Tone.Transport.stop();
    Tone.Transport.cancel();
    previewPlaying = true;
    previewSeqs = [];
    addExistingLayerSeqs(gameIdx, null, previewSeqs);
    Tone.Transport.start();
  }

  function stopPreview() {
    previewPlaying = false;
    previewSeqs.forEach(function (s) { s.dispose(); });
    previewSeqs = [];
    Tone.Transport.stop();
    Tone.Transport.cancel();
    ['bgDrums', 'bgChords', 'bgBass', 'bgMelody'].forEach(function (k) {
      if (synths[k]) { synths[k].dispose(); synths[k] = null; }
    });
    document.querySelectorAll('.drum-cell.playing').forEach(function (el) { el.classList.remove('playing'); });
    document.querySelectorAll('.pr-playhead').forEach(function (el) { el.style.display = 'none'; });
    INSTRUMENTS.forEach(function (inst) {
      var pi = document.getElementById(inst + '-play-icon');
      var si = document.getElementById(inst + '-stop-icon');
      if (pi) pi.style.display = 'block';
      if (si) si.style.display = 'none';
    });
  }

  function highlightDrumStep(step) {
    document.querySelectorAll('.drum-cell.playing').forEach(function (el) { el.classList.remove('playing'); });
    document.querySelectorAll('.drum-cell[data-step="' + step + '"]').forEach(function (el) { el.classList.add('playing'); });
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
      var pName = sub ? players[sub.playerIndex].name : '-';
      var status = sub ? (sub.sound || 'Recorded') : 'Empty';
      card.innerHTML = '<span class="layer-badge" data-inst="' + inst + '">' + inst + '</span>' +
        '<span class="layer-player">' + esc(pName) + '</span>' +
        '<span class="layer-status">' + status + '</span>';
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
        row.innerHTML = '<span class="guess-player">' + esc(players[g.playerIndex].name) + '</span>' +
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
    } else {
      nextBtn.textContent = 'Play Again';
      nextBtn.onclick = function () { stopAllLayers(allSeqs); allSeqs = []; soloMode ? showSoloSetup() : showLobby(); };
    }
    backBtn.onclick = function () { stopAllLayers(allSeqs); allSeqs = []; showScreen('home'); };
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
        seqs.push(new Tone.Sequence(function (time, s) {
          DRUM_NAMES.forEach(function (name) { if (data[name] && data[name][s]) synths.drums.trigger(name); });
        }, Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
      } else if (inst === 'chords') {
        if (!synths.chords) synths.chords = createChordSynth();
        var notes = sub.data;
        seqs.push(new Tone.Sequence(function (time, s) {
          notes.forEach(function (n) {
            if (n.start === s) { var cn = CHORD_NOTES[n.note]; if (cn) synths.chords.play(cn, n.length * Tone.Time('16n').toSeconds()); }
          });
        }, Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
      } else if (inst === 'bass') {
        currentBassSound = sub.sound || 'Analog Bass';
        getOrCreateBassSynth();
        var bnotes = sub.data;
        seqs.push(new Tone.Sequence(function (time, s) {
          bnotes.forEach(function (n) { if (n.start === s) synths.bass.play(n.note, n.length * Tone.Time('16n').toSeconds()); });
        }, Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
      } else if (inst === 'melody') {
        currentMelodySound = sub.sound || 'Piano';
        getOrCreateMelodySynth();
        var mnotes = sub.data;
        seqs.push(new Tone.Sequence(function (time, s) {
          mnotes.forEach(function (n) { if (n.start === s) synths.melody.play(n.note, n.length * Tone.Time('16n').toSeconds()); });
        }, Array.from({ length: STEPS }, function (_, i) { return i; }), '16n').start(0));
      }
    });

    Tone.Transport.start();
  }

  function stopAllLayers(seqs) {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    seqs.forEach(function (s) { s.dispose(); });
    seqs.length = 0;
  }

  initThemePicker();
  initHome();
})();
