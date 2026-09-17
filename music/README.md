# music

Drop a looping track here as **`theme.mp3`** and it plays on the title,
lobby and solo-setup screens. Nothing else is needed — the app picks it up
on load.

- If the file is absent or unplayable, the app stays silent and the music
  button stays hidden. It is entirely optional.
- It loops seamlessly only if the file itself does; trim the tail so the
  end runs straight into the start.
- Keep it small. It is fetched on every page load, so aim for under ~2 MB
  (a 60–90 second loop at 128 kbps is plenty).
- It plays at 30% volume, fades in and out between screens, and stops the
  moment a round starts.
- Browsers block autoplay until the page has been clicked, so on a fresh
  tab the music starts on the first tap rather than immediately.
- Players can mute it with the button in the bottom-right; the choice is
  remembered.
