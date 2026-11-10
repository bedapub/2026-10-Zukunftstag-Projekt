NOTEBOOK := 2026-11-Zukunftstag-simulation.ipynb
HTML := $(NOTEBOOK:.ipynb=.html)

.PHONY: all html clean

all: html

html: $(HTML)

## executes the notebook, which also (re)generates the TSV and PDF in output/
$(HTML): $(NOTEBOOK) $(wildcard data/*.txt)
	poetry run jupyter nbconvert --to html --execute $< --output $(notdir $@)

clean:
	rm -f $(HTML)
