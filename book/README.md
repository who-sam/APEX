# APEX Graduation Book

LaTeX source for the APEX graduation book. Compiles to `main.pdf`.

## Prerequisites

- TeX Live with XeLaTeX, biber, latexmk:
  `texlive-xetex texlive-latex-extra texlive-fonts-extra texlive-bibtex-extra biber latexmk`
- Mermaid CLI: `npm i -g @mermaid-js/mermaid-cli`
- PlantUML (Java): `apt install plantuml`
- SVG → PDF: `apt install librsvg2-bin` (provides `rsvg-convert`)
- Charts: `python3-matplotlib`

## Build

```sh
make figs    # render every diagram and chart in figures/src/ to figures/out/
make book    # compile main.pdf via latexmk + xelatex + biber
make watch   # continuous rebuild on save
make clean   # strip aux files (keeps main.pdf)
```

## Layout

- `main.tex` — document root; loads frontmatter, chapters, appendices.
- `apex-book.cls` — custom class (12 pt A4, geometry, fontspec, biblatex IEEE, listings, hyperref, cleveref, glossaries-extra).
- `refs.bib` — BibLaTeX database, IEEE style.
- `frontmatter/` — title, approval, acknowledgements, abstract.
- `chapters/01-…11-…` — body chapters.
- `appendix/A-…F-…` — appendices.
- `figures/src/{mermaid,plantuml,charts}/` — text-versioned diagram sources.
- `figures/screenshots/` — captured PNGs of the running app.
- `figures/out/` — rendered PDFs (gitignored; produced by `make figs`).

## Project metadata

Edit the `\newcommand` lines at the top of `main.tex` before submission:
`\bookAuthor`, `\bookSupervisor`, `\bookDept`, `\bookUniversity`, `\bookDate`.

## Citations and figures

- Cite with `\cite{key}`; references appear in IEEE numeric style.
- Cross-reference with `\Cref{fig:F4.4}` for figures, tables, and chapters.
- Each figure source file is named `F<chapter>.<num>_<slug>.{mmd,puml,py}` and renders to `figures/out/F<chapter>.<num>_<slug>.pdf`.
