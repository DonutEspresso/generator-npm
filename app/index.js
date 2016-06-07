/* eslint-disable global-require */
'use strict';

// core modules
var fs = require('fs');
var path = require('path');

// external modules
var chalk = require('chalk');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var npmName = require('npm-name');
var generators = require('yeoman-generator');


var npmGenerator = generators.Base.extend({
    init: function() {

        var self = this;
        self.data = {};
        self.cwd = process.cwd();
        self.basedir = path.basename(process.cwd());
        self.log('\nDonutEspresso presents...\n');

        var ascii = chalk.white(fs.readFileSync(
            path.join(__dirname,  'steam.ascii')
        ).toString()) + chalk.blue(fs.readFileSync(
            path.join(__dirname,  'mug.ascii')
        ).toString());

        self.log(ascii);
        self.log('A npm module scaffolding generator');
        self.log('--------------------------------------------------------\n');
    },
    check: function() {

        var self = this;
        var done = self.async();

        fs.stat(path.join(self.cwd, 'package.json'), function(err, stat) {
            if (err) {
                return done();
            }

            var prompts = [{
                name: 'continue',
                type: 'confirm',
                message: 'It looks like scaffolding has already been ' +
                         'generated for this module. Are you sure you want ' +
                         'to continue?',
                default: false
            }];
            return self.prompt(prompts, function(answers) {

                if (answers.continue) {
                    return done();
                } else {
                    self.log(chalk.red(
                        '[generator] package.json already exists, aborting!'
                    ));
                    return process.exit(1);
                }
            });
        });
    },
    promptModuleName: function() {

        var self = this;
        var done = self.async();
        var basedir = self.basedir;
        var prompts = [
            {
                name: 'name',
                message: 'module name',
                default: basedir
            },
            {
                type: 'confirm',
                name: 'taken',
                message: 'This module already exists on npm, choose another?',
                default: true,
                when: function(answers) {
                    var cb = self.async();

                    npmName(answers.name)
                        .then(function(available) {
                            return cb(!available);
                        })
                        .catch(function(err) {
                            throw err;
                        });
                }
            }
        ];

        return self.prompt(prompts, function(answers) {
            if (answers.taken) {
                return self.promptModuleName();
            }

            self.data.name = _.kebabCase(answers.name);

            return done();
        });
    },
    promptInfo: function() {

        var self = this;
        var done = self.async();
        var prompts = [
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
                message: 'unit test entry point',
                default: false
            },
            {
                name: 'coveralls',
                type: 'confirm',
                message: 'coveralls integration',
                default: true
            },
            {
                name: 'travis',
                type: 'confirm',
                message: 'travis integration',
                default: true
            }
        ];

        self.prompt(prompts, function(answers) {
            self.data.description = answers.description;
            self.data.authorName = answers.authorName;
            self.data.authorEmail = answers.authorEmail;
            self.data.repoUrl = answers.repoUrl;
            self.data.homepage = answers.homepage;
            self.data.keywords = answers.keywords.split(',');
            self.data.license = answers.license;
            self.data.year = (new Date()).getFullYear();
            self.data.coveralls = answers.coveralls;
            self.data.travis = answers.travis;
            self.data.testEntry = answers.testEntry;
            done();
        });
    },
    generate: function() {

        var self = this;

        mkdirp.sync(path.join(self.cwd, 'lib/'));
        mkdirp.sync(path.join(self.cwd, 'test/'));
        mkdirp.sync(path.join(self.cwd, 'tools/'));
        mkdirp.sync(path.join(self.cwd, 'tools/githooks'));

        self.template('_package.json', 'package.json');
        self.template('_README.md', 'README.md');
        self.template('_testIndex.js', 'test/index.js');
        self.template('_LICENSE', 'LICENSE');
        self.template('_Makefile', 'Makefile');
        self.copy('eslintrc', '.eslintrc');
        self.copy('eslintrc.test', 'test/.eslintrc');
        self.copy('jscsrc', '.jscsrc');
        self.copy('gitignore', '.gitignore');
        self.copy('index.js', 'lib/index.js');
        self.copy('_nspBadge.js', 'tools/nspBadge.js');
        self.copy('pre-push', 'tools/githooks/pre-push');

        if (!self.data.coveralls) {
            self.copy('_coverageBadge.js', 'tools/coverageBadge.js');
        }

        if (self.data.travis) {
            self.copy('travis.yml', '.travis.yml');
        }
    },
    install: function() {

        var self = this;
        self.npmInstall();
    }
});


module.exports = npmGenerator;
