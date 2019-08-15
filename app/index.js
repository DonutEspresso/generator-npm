'use strict';

// core modules
const fs = require('fs');
const path = require('path');

// external modules
const chalk = require('chalk');
const _ = require('lodash');
const mkdirp = require('mkdirp');
const npmName = require('npm-name');
const Generator = require('yeoman-generator');

/**
 * @class
 */
class NpmGenerator extends Generator {
    /**
     * Initialize genertor
     * @method init
     * @returns {undefined}
     */
    init() {
        const self = this;
        self.data = {};
        self.cwd = process.cwd();
        self.basedir = path.basename(process.cwd());
        self.log('\nDonutEspresso presents...\n');

        const ascii =
            chalk.white(
                fs.readFileSync(path.join(__dirname, 'steam.ascii')).toString()
            ) +
            chalk.blue(
                fs.readFileSync(path.join(__dirname, 'mug.ascii')).toString()
            );

        self.log(ascii);
        self.log('A npm module scaffolding generator');
        self.log('--------------------------------------------------------\n');
    }

    /**
     * Check
     * @method check
     * @returns {undefined}
     */
    check() {
        const self = this;
        const done = self.async();

        fs.stat(path.join(self.cwd, 'package.json'), function(err, stat) {
            if (err) {
                return done();
            }

            const prompts = [
                {
                    name: 'continue',
                    type: 'confirm',
                    message:
                        'It looks like scaffolding has already been ' +
                        'generated for this module. Are you sure you want ' +
                        'to continue?',
                    default: false
                }
            ];
            return self.prompt(prompts, function(answers) {
                if (answers.continue) {
                    return done();
                } else {
                    self.log(
                        chalk.red(
                            '[generator] package.json already exists, aborting!'
                        )
                    );
                    // eslint-disable-next-line no-process-exit
                    return process.exit(1);
                }
            });
        });
    }

    /**
     * Prompt module name
     * @method promptModuleName
     * @returns {undefined}
     */
    promptModuleName() {
        const self = this;
        const basedir = self.basedir;
        const prompts = [
            {
                name: 'name',
                type: 'input',
                message: 'module name',
                default: basedir
            },
            {
                type: 'confirm',
                name: 'taken',
                message: 'This module already exists on npm, choose another?',
                default: true,
                when: function(answers) {
                    return npmName(answers.name).then(function(available) {
                        return !available;
                    });
                }
            }
        ];

        return self.prompt(prompts).then(function(answers) {
            if (answers.taken === true) {
                return self.promptModuleName();
            } else {
                self.data.name = _.kebabCase(answers.name);
                return null;
            }
        });
    }

    /**
     * Promp info
     * @method promptInfo
     * @returns {undefined}
     */
    promptInfo() {
        const self = this;
        const prompts = [
            {
                name: 'description',
                message: 'description'
            },
            {
                name: 'authorName',
                message: 'author name'
            },
            {
                name: 'authorEmail',
                message: 'author email'
            },
            {
                name: 'githubId',
                message: 'github username'
            },
            {
                name: 'repoUrl',
                message: 'repo git url'
            },
            {
                name: 'homepage',
                message: 'repo homepage'
            },
            {
                name: 'copyrightOwner',
                message: 'copyright owner'
            },
            {
                name: 'keywords',
                message: 'keywords (comma separated)'
            },
            {
                name: 'license',
                message: 'license',
                default: 'MIT'
            },
            {
                name: 'testEntry',
                type: 'confirm',
                message:
                    'Do you want a unit test entry point? ' +
                    'By default, all test files are run in parallel, ' +
                    'in a non deterministic order. Choose this option if ' +
                    'your module requires tests to be run in serial order.',
                default: false
            },
            {
                name: 'travis',
                type: 'confirm',
                message:
                    'Do you want to add a Travis badge to the README? ' +
                    'Choose this option if you plan to use Travis CI.',
                default: true
            },
            {
                name: 'coveralls',
                type: 'confirm',
                message:
                    'Do you want Coveralls integration? This will add ' +
                    'a Coveralls badge to the README, and allow testing ' +
                    'coverage to be automatically reported by Travis builds. ' +
                    'This is applicable only when using Travis CI.',
                default: true
            }
        ];

        return self.prompt(prompts).then(function(answers) {
            self.data.description = answers.description;
            self.data.authorName = answers.authorName;
            self.data.authorEmail = answers.authorEmail;
            self.data.githubId = answers.githubId;
            self.data.repoUrl = answers.repoUrl;
            self.data.copyrightOwner = answers.copyrightOwner;
            self.data.homepage = answers.homepage;
            self.data.keywords = answers.keywords.split(',');
            self.data.license = answers.license;
            self.data.year = new Date().getFullYear();
            self.data.coveralls = answers.coveralls;
            self.data.travis = answers.travis;
            self.data.testEntry = answers.testEntry;
            self.data.es6 = answers.es6;
        });
    }

    /**
     * Generate library code
     * @method generate
     * @returns {undefined}
     */
    generate() {
        const self = this;

        mkdirp.sync(path.join(self.cwd, 'lib/'));
        mkdirp.sync(path.join(self.cwd, 'test/'));
        mkdirp.sync(path.join(self.cwd, 'tools/'));
        mkdirp.sync(path.join(self.cwd, 'tools/githooks'));

        self.fs.copyTpl(
            self.templatePath('_package.json'),
            self.destinationPath('package.json'),
            self
        );

        self.fs.copyTpl(
            self.templatePath('_README.md'),
            self.destinationPath('README.md'),
            self
        );

        self.fs.copyTpl(
            self.templatePath('_testIndex.js'),
            self.destinationPath('test/index.js'),
            self
        );

        self.fs.copyTpl(
            self.templatePath('_LICENSE'),
            self.destinationPath('LICENSE'),
            self
        );

        self.fs.copyTpl(
            self.templatePath('_Makefile'),
            self.destinationPath('Makefile'),
            self
        );

        self.fs.copy(
            self.templatePath('.eslintrc.js'),
            self.destinationPath('.eslintrc.js')
        );

        self.fs.copy(
            self.templatePath('.eslintrc.test.js'),
            self.destinationPath('test/.eslintrc.js')
        );

        self.fs.copy(
            self.templatePath('gitignore'),
            self.destinationPath('.gitignore')
        );

        self.fs.copy(
            self.templatePath('index.js'),
            self.destinationPath('lib/index.js')
        );

        self.fs.copy(
            self.templatePath('pre-push'),
            self.destinationPath('tools/githooks/pre-push')
        );

        self.fs.copy(
            self.templatePath('prettierignore'),
            self.destinationPath('.prettierignore')
        );

        self.fs.copy(
            self.templatePath('.prettierrc.js'),
            self.destinationPath('.prettierrc.js')
        );

        if (self.data.travis) {
            self.fs.copy(
                self.templatePath('travis.yml'),
                self.destinationPath('.travis.yml')
            );
        }
    }

    /**
     * Install dependencies
     * @method install
     * @returns {undefined}
     */
    install() {
        var self = this;
        self.yarnInstall()
            .then(() => {
                self.spawnCommandSync('make', ['docs']);
                // TODO: check for .git dir
                // self.spawnCommandSync('make', ['githooks']);
            })
            .catch((err) => {
                // eslint-disable-next-line no-console
                console.error(err);
                process.exit(-1);
            });
    }
}

module.exports = NpmGenerator;
