#
# Directories
#
ROOT           := $(shell pwd)
NODE_MODULES   := $(ROOT)/node_modules
NODE_BIN       := $(NODE_MODULES)/.bin
TOOLS          := $(ROOT)/tools
TMP            := $(ROOT)/tmp


#
# Tools and binaries
#
ESLINT		:= $(NODE_BIN)/eslint
JSCS		:= $(NODE_BIN)/jscs
NSP         := $(NODE_BIN)/nsp
NPM		    := npm
GIT         := git
NSP_BADGE   := $(TOOLS)/nspBadge.js


#
# Directories
#
LIB_FILES  	   := $(ROOT)/lib


#
# Files and globs
#
GIT_HOOK_SRC    = '../../tools/githooks/pre-push'
GIT_HOOK_DEST   = '.git/hooks/pre-push'
TEST_ENTRY     := $(ROOT)/test/index.js
SHRINKWRAP     := $(ROOT)/npm-shrinkwrap.json
ALL_FILES      := $(ROOT)/app/index.js



#
# Targets
#

.PHONY: help
help:
	@perl -nle'print $& if m{^[a-zA-Z_-]+:.*?## .*$$}' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'


.PHONY: all
all: prepush


node_modules: package.json
	@$(NPM) install
	@touch $(NODE_MODULES)


.PHONY: githooks
githooks: ## Install git pre-push hooks.
	@ln -s $(GIT_HOOK_SRC) $(GIT_HOOK_DEST)


.PHONY: lint
lint: node_modules $(ALL_FILES) ## Run lint checker (eslint).
	@$(ESLINT) $(ALL_FILES)


.PHONY: codestyle
codestyle: node_modules $(ALL_FILES) ## Run code style checker (jscs).
	@$(JSCS) $(ALL_FILES)


.PHONY: codestyle-fix
codestyle-fix: node_modules $(ALL_FILES) ## Run code style checker with auto whitespace fixing.
	@$(JSCS) $(ALL_FILES) --fix


.PHONY: nsp
nsp: node_modules $(ALL_FILES) ## Run nsp. Shrinkwraps dependencies, checks for vulnerabilities.
	@$(NPM) shrinkwrap --dev
	@($(NSP) check) | $(NSP_BADGE)
	@rm $(SHRINKWRAP)


.PHONY: prepush
prepush: node_modules lint codestyle nsp ## Git pre-push hook task. Run before committing and pushing.


.PHONY: clean
clean: clean-coverage ## Cleans unit test coverage files and node_modules.
	@rm -rf $(NODE_MODULES)


#
## Debug -- print out a a variable via `make print-FOO`
#
print-%  : ; @echo $* = $($*)
