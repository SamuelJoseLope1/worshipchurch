<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Shared catalog mutations use authenticated server functions with the existing verified SA identity gate; only metadata fields are accepted, and deletion retains files referenced by other churches.
- Mixer sections reuse song markers and engine waveform peaks; bar timing follows the engine's BPM beat convention to keep audio and counters aligned.
- Client downloads prepare files before a separate delivery click to retain mobile browser user activation.

- The live mixer uses a full-width shell and tall channel strips; lyrics/chords live in a separate authenticated route and reuse the active engine song without interrupting playback.
- Keep Web Audio for browser playback; LibreTracks' C++/Tauri engine requires native desktop integration and must not be advertised as running in the web app.
- Await AudioContext activation before a shared stem start timestamp, invalidate pending starts on transport changes, and bound decoding to two workers so mobile playback remains synchronized without parallel memory spikes.
