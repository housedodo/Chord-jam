// Archived COLOR_SCHEMES entries for the Notebook and Riso skins.
// Paste back into app.js alongside the phosphor entry to restore them; the
// theme picker renders one dot per key, so nothing else in app.js changes.
// Their CSS is in notebook-riso.css next to this file.
//
// Both were written against the paper-coloured :root defaults style.css used
// to carry. :root is now the Phosphor palette, so restoring a skin also means
// restoring those defaults, which were:
//
//   --bg #f6eeda   --surface #fffbf0  --surface-2 #f3ead6  --surface-3 #ebe0c8
//   --border #23324f  --text #23324f  --text-muted #7a6a55  --text-dim #9aa6b8
//   --accent #23324f  --accent-soft #41568a
//   --accent-glow rgba(35,50,79,0.2)  --accent-bg rgba(35,50,79,0.08)
//   --rose #e8a0bf  --peach #e8b07d  --sage #8cc5a2  --sky #7eb8d4
//   --lavender #b4a0d4  --mauve #c9a0d4  --sand #d4c9a0  --vocal-color #d4a0b8
//   --drums-color #e8a0bf  --chords-color #7eb8d4
//   --bass-color #e8b07d   --melody-color #8cc5a2
//   --grid-cell #fffbf0  --grid-beat #f1ead8  --grid-alt #fdf8ec
//   --grid-alt-beat #efe7d3  --grid-border rgba(35,50,79,0.18)
//   --piano-roll-bg #fffbf0  --note-color #e8a33c  --note-border #23324f

    notebook: { label: 'Notebook', color: '#f6eeda', skin: 'notebook',
      bg:'#f6eeda', surface:'#fffbf0', surface2:'#f3ead6', surface3:'#ebe0c8', border:'#23324f',
      text:'#23324f', textMuted:'#7a6a55', textDim:'#9aa6b8',
      accent:'#23324f', accentSoft:'#41568a',
      grid:'#fffbf0', gridBeat:'#f1ead8', gridAlt:'#fdf8ec', gridAltBeat:'#efe7d3', gridBorder:'rgba(35,50,79,0.18)',
      pianoRollBg:'#fffbf0', note:'#e8a33c', noteBorder:'#23324f' },
    riso: { label: 'Riso Zine', color: '#ff4f9a', skin: 'riso',
      bg:'#f2efe2', surface:'#ffffff', surface2:'#e9e5d5', surface3:'#ddd8c6', border:'#17161a',
      text:'#17161a', textMuted:'#5f5c55', textDim:'#8d8980',
      accent:'#0a8fd8', accentSoft:'#0a63a8',
      grid:'#201f24', gridBeat:'#2a282e', gridAlt:'#1b1a1f', gridAltBeat:'#252329', gridBorder:'#3a383f',
      pianoRollBg:'#17161a', note:'#0a8fd8', noteBorder:'#f2efe2' }
