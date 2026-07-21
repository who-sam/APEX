# APEX IEEE-style graduation book — build with latexmk + XeLaTeX + biber.
MAIN = main

.PHONY: all clean distclean watch

all: $(MAIN).pdf

$(MAIN).pdf: $(MAIN).tex apex-ieee.cls refs.bib \
	$(wildcard chapters/*.tex) $(wildcard frontmatter/*.tex) \
	$(wildcard appendix/*.tex) $(wildcard figures/tikz/*.tex)
	latexmk

watch:
	latexmk -pvc

clean:
	latexmk -c
	rm -f chk-*.* mfput.log missfont.log

distclean: clean
	latexmk -C
	rm -f $(MAIN).pdf FACTS.scratch.md
