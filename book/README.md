# APEX — IEEE-style Graduation Book (`book`)

A complete, self-contained graduation thesis for the **APEX** classroom examination
portal, typeset in **XeLaTeX** with IEEE documentation conventions (Times-family body
font via TeX Gyre Termes, IEEE numeric citations via `biblatex`/`biber`, "Fig." figure
labels). It was written from scratch with self-authored TikZ/pgfplots graphs rather
than an external diagram toolchain.

## Build

```bash
make            # latexmk -> main.pdf  (XeLaTeX + biber, runs to completion)
make watch      # continuous preview build
make clean      # remove build artifacts
```

Requirements: a TeX Live install with `xelatex`, `biber`, and the packages
`fontspec`, `biblatex` + `biblatex-ieee`, `pgfplots`, `pgfgantt`, `tikz`, `listings`,
`tcolorbox`, `booktabs`, `cleveref`. Fonts: *TeX Gyre Termes*, *TeX Gyre Heros*,
*TeX Gyre Cursor*.

## Layout

| Path | Contents |
|------|----------|
| `main.tex` | Master document; sets metadata and `\input`s every part |
| `apex-ieee.cls` | The book class (IEEE-styled `book`) |
| `refs.bib` | IEEE-numbered bibliography (biber) |
| `frontmatter/` | Title page, abstract, acknowledgements, abbreviations |
| `chapters/` | 13 chapters (`01`–`13`) |
| `appendix/` | API reference, schema DDL, env vars, source listings |
| `figures/tikz/` | 15 self-authored TikZ/pgfplots graphs |
| `figures/screenshots/` | UI screenshots used by the user manual |
| `_harness.tex` | Single-file compile-check harness (development aid) |

## Chapters

1. Introduction
2. Background and Literature Review
3. Requirements Engineering
4. System Architecture and Design
5. Data Model and Persistence
6. Implementation
7. Code Execution and the Auto-Grading Engine
8. Security
9. Testing and Quality Assurance
10. Deployment and DevOps
11. Results and Evaluation
12. User Manual
13. Conclusion and Future Work
