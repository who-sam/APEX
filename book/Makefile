# APEX graduation book — build pipeline
# Usage:
#   make figs        render every diagram and chart in figures/src/ → figures/out/
#   make book        compile main.pdf via latexmk + xelatex + biber
#   make watch       latexmk continuous mode (rebuild on save)
#   make clean       strip aux files (keeps main.pdf)
#   make distclean   strip aux files AND main.pdf AND figures/out/

MMD_SRC := $(wildcard figures/src/mermaid/*.mmd)
PUML_SRC := $(wildcard figures/src/plantuml/*.puml)
CHART_SRC := $(wildcard figures/src/charts/*.py)

MMD_OUT := $(patsubst figures/src/mermaid/%.mmd,figures/out/%.png,$(MMD_SRC))
PUML_OUT := $(patsubst figures/src/plantuml/%.puml,figures/out/%.pdf,$(PUML_SRC))
CHART_OUT := $(patsubst figures/src/charts/%.py,figures/out/%.pdf,$(CHART_SRC))

FIGS := $(MMD_OUT) $(PUML_OUT) $(CHART_OUT)

.PHONY: all book figs watch clean distclean
.DEFAULT_GOAL := book

all: figs book

figs: $(FIGS)

figures/out/%.png: figures/src/mermaid/%.mmd figures/src/mermaid.css
	@mkdir -p figures/out
	mmdc -i $< -o $@ -b transparent --cssFile figures/src/mermaid.css --scale 2 --width 1600

figures/out/%.pdf: figures/src/plantuml/%.puml
	@mkdir -p figures/out
	plantuml -tsvg -o $(CURDIR)/figures/out $<
	inkscape --export-type=pdf --export-area-drawing --export-text-to-path --export-filename=$@ figures/out/$*.svg
	@rm -f figures/out/$*.svg

figures/out/%.pdf: figures/src/charts/%.py
	@mkdir -p figures/out
	MPLBACKEND=Agg python3 $< $@

book:
	latexmk main.tex

watch:
	latexmk -pvc main.tex

clean:
	latexmk -c
	@rm -f *.bbl *.run.xml *.glo *.gls *.glg *.ist

distclean: clean
	@rm -f main.pdf
	@rm -rf figures/out
