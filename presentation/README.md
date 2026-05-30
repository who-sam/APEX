# APEX Defense Presentation

Self-contained HTML deck built with [Reveal.js](https://revealjs.com/) loaded from CDN. Designed for a 20-minute, five-speaker graduation defense.

## Run

```sh
# Pick one:
python3 -m http.server 8000 -d presentation
# or
npx serve presentation
```

Then open `http://localhost:8000`.

Double-click `index.html` also works in most browsers (CDN assets need internet either way).

## Speaker keys

| Key | Action |
|-----|--------|
| `→` / `Space` | Next slide |
| `←` | Previous slide |
| `S` | Speaker notes window (separate display) |
| `F` | Fullscreen |
| `Esc` | Slide overview |
| `?` | All shortcuts |

A floating chip in the bottom-left shows the current speaker + their time window, hidden on title and section dividers.

## Export to PDF

1. Open `index.html?print-pdf` in **Chromium / Chrome / Edge**.
2. `Ctrl+P` → save as PDF, margins **None**, background graphics **on**.

The deck is sized for 1280×800 (16:10). It scales to projector resolution automatically.

## Edit team member names

Search the file for `[Member 2]`, `[Member 3]`, `[Member 4]`, `[Member 5]` and replace with the real names. They appear on the title slide, the four section dividers, and the speaker chip metadata (`data-speaker="..."` attribute on each slide).

## Structure

```
21 slides, ~20 minutes total

01     Title                                Amr            0:00 – 0:30
02–06  Intro / AI rationale / framing       Amr (Leader)   0:30 – 6:00
07     [divider] Compiler & Grader
08–11  Compiler section                     Member 2       6:30 – 10:30
12     [divider] Database
13–16  Database section                     Member 3       11:00 – 14:00
17     [divider] DevOps
18–20  DevOps section                       Member 4       14:00 – 17:00
21     [divider] Security
22–25  Security section                     Member 5       17:00 – 21:00
26     Close / thanks                       Amr            21:00 – end
```

(Counts include section-divider slides; the deck itself has 21 numbered slides.)

## Customising

- **Brand colors** are CSS variables at the top of `<style>`. Default palette pulls from `frontend/src/index.css` (APEX dark theme — primary blue `hsl(217 92% 70%)` on dark navy `hsl(240 21% 12%)`).
- **Fonts**: Inter (body) + JetBrains Mono (code), loaded from Google Fonts.
- **Code highlighting**: Reveal's `highlight` plugin, Monokai theme. Use `<pre><code class="language-go">…</code></pre>`.
- **Add a slide**: copy any `<section data-speaker="..." data-time="...">…</section>` block. Use `data-state="no-speaker"` to hide the speaker chip (used on title and dividers).

## Live demo backup

If you plan to live-demo:

```sh
cd ..
./start.sh                       # local mode
go run ./cmd/seed                # demo data (idempotent)
```

Demo accounts:
- Teacher: `demo.teacher@apex.test` / `demo1234`
- Students: `omar.hassan@apex.test`, `lina.farouk@apex.test`, etc. (same password)

Rehearse three flows: build exam → take exam → grade written.
