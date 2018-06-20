# generator-npm

> A yeoman generator for npm modules

## Getting Started

Make sure you have yeoman installed:

```sh
$ npm install -g yo
```

Clone this repo into your global node_modules directory, run `npm install` in
the cloned repo, then use it with yeoman:

```sh
$ yo npm
```

## About

The generator creates a directory structure like so:

```
.eslintrc.js
.prettierrc.js
.prettierignore
.travis.yml
Makefile
package.json
README.md
lib/
test/
tools/
```

The purpose of each of the directories are:

* `lib/` module source code
* `test/` test files
* `tools/` githooks and other scripts


The generated Makefile supports all the following targets, and they can be
listed by running `make`:

```sh
$ make
clean                          Cleans unit test coverage files and node_modules.
coverage                       Run unit tests with coverage reporting. Generates reports into /coverage.
githooks                       Install git pre-push hooks.
lint                           Run lint checker (eslint).
lint-fix                       Reprint code (prettier, eslint).
security                       Check for dependency vulnerabilities.
prepush                        Git pre-push hook task. Run before committing and pushing.
release                        Versions, tags, and updates changelog based on commit messages.
test                           Run unit tests.
```


## Contributing

Add unit tests for any new or changed functionality. Ensure that lint and style
checks pass.

To start contributing, install the git prepush hooks:

```sh
make githooks
```

Before committing, run the prepush hook:

```sh
make prepush
```

If you have style errors, you can auto fix whitespace issues by running:

```sh
make codestyle-fix
```

## License

Copyright (c) 2016 Alex Liu

Licensed under the MIT license.
