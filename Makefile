.PHONY: clean distclean build run article

export PATH := $(shell npm bin):$(PATH)
export NODE_ENV ?= development

# source file extensions to process
EXTENSIONS = js jsx json pug

SOURCE_FILES := $(subst ./,,$(foreach ext,$(EXTENSIONS),$(shell find . -name "*.$(ext)" -not -path "./build/*" -not -path "./node_modules/*" -not -path "./webpack.config.js" -not -path "./public/*" -print)))

COMPILED_FILES := $(addprefix build/, $(addsuffix .js,$(basename $(SOURCE_FILES))))

PORTS_FILES := $(addprefix ports/, $(shell mongroup names))

SHA_FILE := $(addprefix .git/, $(shell git symbolic-ref HEAD))


build: public/build.js nginx/server.conf build/sha.js $(COMPILED_FILES) $(PORTS_FILES)

article:
	@./create-article.sh

ports/%:
	@mongroup restart $*
	@while [ ! -f $@ ]; do sleep 1; done


nginx/%.conf: nginx/%.conf.pre $(PORTS_FILES)
	@echo "# DO NOT EDIT THIS FILE, INSTEAD EDIT: $<" > "$@"
	@m4 \
		-DDIRNAME=$(realpath $(dir $<)) \
		-DFILENAME=$(join $(realpath $(dir $<)),/$(notdir $@)) \
		< "$<" \
		>> "$@"

build/%.js: %.*
	@mkdir -p $(dir $@)
	@case "$(suffix $<)" in \
		.js) echo "$<": JS source file && \
			babel "$<" --out-file "$@" --source-maps \
			;; \
		.jsx) echo "$<": JSX source file && \
			babel --presets react "$<" --out-file "$@" --source-maps \
			;; \
		.json) echo "$<": JSON source file && \
			printf "module.exports = " > "$@" && \
			node -pe "require('fs').readFileSync('$(abspath $<)', 'utf8').trim()" >> "$@" \
			;; \
		.pug) echo "$<": PUG source file && \
			pug --client < "$<" > "$@" && \
			echo "module.exports = template;" >> "$@" \
			;; \
		esac

build/sha.js: $(SHA_FILE)
	@echo "sha.js: Generating git HEAD SHA file"
	@echo "module.exports = '$(shell cat "$<")';" > "$@"

public/build.js: package.json $(COMPILED_FILES)
	@mkdir -p $(dir $@)
	@webpack # config is in `webpack.config.js`

clean:
	@rm -rfv nginx/*.conf build public/build.* ports/*

distclean:
	@rm -rfv node_modules
