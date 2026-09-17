# archive

Work that is no longer wired into the app but worth keeping.

## skins/

The **Notebook** and **Risograph** skins, retired when the app narrowed to the
single Phosphor look. Neither file is loaded by anything.

- `notebook-riso.css` — every `[data-skin="notebook"]` and `[data-skin="riso"]`
  rule, lifted out of `style.css` unchanged.
- `schemes.js` — their `COLOR_SCHEMES` entries, plus the paper-coloured `:root`
  variable defaults they were written against. `:root` now carries the Phosphor
  palette, so restoring a skin means restoring those too.

Restoring one is four steps, listed at the top of `notebook-riso.css`. The theme
picker in `app.js` still renders one dot per scheme and hides itself when there
is only one, so adding an entry back is all it takes to bring the picker back.
