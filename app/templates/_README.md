# <%= data.name %>

[![NPM Version](https://img.shields.io/npm/v/<%= data.name %>.svg)](https://npmjs.org/package/<%= data.name %>)
<%_ if (data.travis) { _%>
[![Build Status](https://travis-ci.org/<%= data.githubId %>/<%= data.name %>.svg?branch=master)](https://travis-ci.org/<%= data.githubId %>/<%= data.name %>)
<%_ } _%>
<%_ if (data.coveralls) { _%>
[![Coverage Status](https://coveralls.io/repos/github/<%= data.githubId %>/<%= data.name %>/badge.svg?branch=master)](https://coveralls.io/github/<%= data.githubId %>/<%= data.name %>?branch=master)
<%_ } else { _%>
[![manual coverage](https://img.shields.io/badge/coverage-0%25-green.svg)]()
<%_ } _%>
[![Dependency Status](https://david-dm.org/<%= data.githubId %>/<%= data.name %>.svg)](https://david-dm.org/<%= data.githubId %>/<%= data.name %>)
[![devDependency Status](https://david-dm.org/<%= data.githubId %>/<%= data.name %>/dev-status.svg)](https://david-dm.org/<%= data.githubId %>/<%= data.name %>#info=devDependencies)

> <%= data.description %>

TODO: Some info about the module.

## Getting Started

Install the module with: `npm install <%= data.name %>`

## Usage

TODO: How to use this module, examples.

## API

See [API](/api.md)

## Contributing

Ensure that all linting and codestyle tasks are passing. Add unit tests for any
new or changed functionality.

To start contributing, install the git prepush hooks:

```sh
make githooks
```

Before committing, lint and test your code using the included Makefile:
```sh
make prepush
```

## License

Copyright (c) <%= data.year %> <%= data.copyrightOwner %>

<%_ if (data.license.toUpperCase() === 'UNLICENSED') { _%>
For internal use only.
<%_ } else { _%>
Licensed under the <%= data.license %> license.
<%_ } _%>
