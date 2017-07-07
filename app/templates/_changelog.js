#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */

'use strict';

// core modules
const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

// configurable local globals
const CHANGES_MD_PATH = path.join(__dirname, '../CHANGES.md');
const PKGJSON_PATH = path.join(__dirname, '../package.json');

// local globals
const ACTION = process.argv.length === 3 && process.argv[2];
const PKG_JSON = JSON.parse(fs.readFileSync(PKGJSON_PATH).toString());
let CHANGES_MD = fs.readFileSync(CHANGES_MD_PATH).toString();
const COMMIT_TYPES = [
    'fix',      // for a bug fix
    'update',   // for a backwards-compatible enhancement
    'new',      // implemented a new feature
    'breaking', // for a backwards-incompatible enhancement or feature
    'docs',     // changes to documentation only
    'build',    // changes to build process only
    'upgrade',  // for a dependency upgrade
    'chore'     // for refactoring, adding tests, etc., anything not user-facing
];
const MD_RELEASE_HEADER = '## ';
const MD_COMMIT_TYPE_HEADER = '#### ';

// configurable globals. this special thing where the current package.json
// version is the "staged" version to be published. use that to generate the
// changelog. changing this value to "unreleased" would work just
// as well.
const STR_CURRENT_VERSION = PKG_JSON.version;


/**
 * duck type check for semver
 * @function isSemver
 * @param {String} str the semver string
 * @return {Boolean}
 */
function isSemver(str) {

    let valid = true;

    if (!str) {
        return false;
    }

    const split = str.split('.');

    if (split.length !== 3) {
        return false;
    }

    split.forEach(function(strNum) {
        const parsed = parseInt(strNum);

        if (Number.isNaN(parsed) === true) {
            valid = false;
        }
    });

    return valid;
}


/**
 * filter falsy values from array
 * @function trim
 * @param {Array} arr an array to filter
 * @return {Array} filtered array
 */
function trim(arr) {
    return arr.filter(function(i) {
        return (i !== '' && i !== null && typeof i !== 'undefined');
    });
}


/**
 * determine difference between two arrays. return an array of different
 * elements.
 * @param {Array} arr1 first array to compare
 * @param {Array} arr2 secon array to compare
 * @return {Array}
 */
function difference(arr1, arr2) {
    return arr1.filter(function(i) {
        return arr2.indexOf(i) < 0;
    });
}


/**
 * find all released versions by looking at git tags found on master.
 * returns array of version tags, sorted chronologically creation date:
 * [ v4.1.0, v4.2.0, v4.3.0, v4.4.0 ]
 * @param {Object} opts an options object
 * @returns {Array}
 */
function getVersionsInGit(opts) {
    const stdout = execSync('git tag --sort version:refname').toString();

    // trim empty new lines
    let versions = trim(stdout.split('\n'));

    if (opts && opts.trimVPrefix === true) {
        versions = versions.map(function(version) {
            return version.split('v')[1];
        });
    }

    return versions.reverse();
}


/**
 * find all the versions in changelog (no v prefix, unlike git tags). the
 * newest version has has lowest index.
 * @returns {Array}
 */
function getVersionsInChangelog() {

    // get each version of the changelog split by section header (##)
    const sections = getChangelogSplitByVersions();

    return sections.map(function(version) {
        // split each section header off from the rest of the section by
        // splitting on the first whitespace/newline so we can capture only the
        // header, which is the version.
        return version.split(/\s/)[0];
    });
}


/**
 * parse the changelog, return an array of markdown where each element in the
 * array is a version/release in the changelog.
 * @private
 * @function getChangelogSplitByVersions
 * @return {Array} an array of markdown strings
 */
function getChangelogSplitByVersions() {
    // split existing changes file using the release headers
    const versions = trim(CHANGES_MD.split('\n' + MD_RELEASE_HEADER));

    if (versions.length === 0) {
        return [];
    }

    // remove leading header, since we split by newline, so the very first
    // section may will have extra ## characters
    versions[0] = versions[0].replace(MD_RELEASE_HEADER, '');

    return versions;
}


/**
 * find the last released version number tag.
 * @return {Array}}
 */
function getLastReleasedVersionTag() {
    return getVersionsInGit()[0];
}


/**
 * git the last n commits from the last published version (last published
 * version is assumed to be the current version in package.json).
 * @function getCommits
 * @param {Function} callback a callback function
 * @returns {Array} an array of objects describing commits
 */
function getCommits(callback) {

    // this is usually run after `npm version {rev}`, so we actually want tag
    // from previous release.
    const allTags = getVersionsInGit();
    // tags are in reverse chronological order
    const lastTag = allTags.length > 1 ? allTags[1] : null;
    const gitLogCmd = 'git log ' + ((lastTag) ? lastTag + '..HEAD' : 'HEAD') +
        ' --pretty=oneline';
    const stdout = execSync(gitLogCmd).toString();

    // expected commit message would look like this:
    // ba14b5e Upgrade: commit new deps
    // Expected template is:
    // {gitsha} {commitType}: {commitMsg}
    //
    // commits will be ordered in reverse chronological order, with lowest
    // index being newest. trim empty new lines, then trim the last commit
    // was the last release.
    const lines = trim(stdout.split('\n')).slice(0, -1);
    const rawCommits = [];

    lines.forEach(function(line) {
        const fields = line.split(':');
        let commit;

        // ignore all release commits.
        if (!isSemver(line.split(' ')[1])) {

            // if commit message does not have a {verb}.
            if (fields.length === 1) {
                console.error('[changelog] bad commit message: ' + line);
                console.error('[changelog] commit message must be of format: ');
                console.error('[changelog] {type}: {message}');
                console.error('[changelog] where type is one of the ' +
                    'following values:');
                console.error('[changelog] ' + COMMIT_TYPES.join(', ') + '\n');
                console.error('[changelog] exiting with error');
                process.exit(1);
            }
            // otherwise, commit msg confirms to expected template
            else {
                commit = {
                    gitsha: fields[0].split(' ')[0].trim(),
                    type: fields[0].split(' ')[1].trim().toLowerCase(),
                    msg: fields[1].trim()
                };
            }

            // add a github link url
            if (commit) {
                commit.url = PKG_JSON.homepage + '/commit/' + commit.gitsha;
                rawCommits.push(commit);
            }
        }
    });

    return rawCommits;
}


/**
 * format an array of commit objects into markdown.
 * @function generateUnreleasedMd
 * @param {Array} rawCommits array of objects describing commits
 * @returns {String} markdown string
 */
function generateUnreleasedMd(rawCommits) {

    const categorizedCommits = {};

    // create a bucket of rawCommits by type:
    // { fixes: [], upgrades: [], breaking: [] }
    rawCommits.forEach(function(commit) {

        if (!categorizedCommits.hasOwnProperty(commit.type)) {
            categorizedCommits[commit.type] = [];
        }

        categorizedCommits[commit.type].push(commit);
    });

    // create markdown header section for this new "release" using the
    // specified string
    let markdown = MD_RELEASE_HEADER + STR_CURRENT_VERSION + '\n';
    const commitTypes = Object.keys(categorizedCommits).sort();

    commitTypes.forEach(function(commitType) {

        const commits = categorizedCommits[commitType];
        const capcaseType = commitType[0].toUpperCase() + commitType.slice(1);

        markdown += '\n' + MD_COMMIT_TYPE_HEADER + capcaseType + '\n\n';

        commits.forEach(function(commit) {
            markdown += '* ' + commit.msg + ' ([' + commit.gitsha.slice(0, 7) +
                '](' + commit.url + '))\n';
        });
    });

    return markdown;
}


/**
 * update CHANGES.md with latest unreleased commits
 * @function updateChangelog
 * @param {String} md markdown string
 * @return {undefined}
 */
function updateChangelog(md) {

    let versions = getChangelogSplitByVersions();

    // see what the first section is - if it matches the current unreleased
    // version, get rid of it. otherwise, assume it is from a proper previous
    // release, in which case we can safely move on.
    if (versions.length > 0 &&
        versions[0].indexOf(STR_CURRENT_VERSION) === 0) {
        versions = versions.slice(1);
    }

    // add the new regenerated markdown
    versions.unshift(md);

    // join it back into a string and write it back to file
    writeChangelog(versions.join('\n' + MD_RELEASE_HEADER));
}


/**
 * update local value of changelog contents, write passed in string to disk.
 * @private
 * @function writeChangelog
 * @param {String} str new contents of changelog
 * @return {undefined}
 */
function writeChangelog(str) {
    // update local global value
    CHANGES_MD = str;
    fs.writeFileSync(CHANGES_MD_PATH, str);
}


/**
 * changes the current maybe about to be released version in change log to the
 * actual version being released.
 * @function releaseChangelog
 * @returns {undefined}
 */
function releaseChangelog() {

    const lastVersion = getLastReleasedVersionTag().split('v')[1];
    const dateString = new Date().toISOString().replace(/T..+/, '');
    let lines = CHANGES_MD.split('\n');
    let found = false;

    // first, figure out what the last auto rev patch version was. get the last
    // published tag, and rev the patch.
    const lastVersionSplit = lastVersion.split('.');
    const lastAutoRevPatchVersion = [
        lastVersionSplit[0],
        lastVersionSplit[1],
        parseInt(lastVersionSplit[2]) + 1
    ].join('.');
    const lastAutoRevPatchHeader = MD_RELEASE_HEADER + lastAutoRevPatchVersion;

    // loop through each line, replace the last auto rev patch version with
    // the actual newly released version specified in package.json
    lines = lines.map(function(line) {
        if (line.indexOf(lastAutoRevPatchHeader) === 0) {
            found = true;
            return MD_RELEASE_HEADER + PKG_JSON.version
                + ' (' + dateString + ')';
        } else {
            return line;
        }
    });

    if (found === false) {
        console.error('[changelog] FATAL! Could not find change log for the ' +
            'last auto rev patch version: ' + lastAutoRevPatchVersion);
        process.exit(1);
    }

    writeChangelog(lines.join('\n'));
}


/**
 * verify the following:
 *  * the changelog does not have duplicated sections
 *  * the lastest version reflects what's in package.json
 * @private
 * @function verifyChangelog
 * @return {Boolean} return true if ok, false if not ok
 */
function verifyChangelog() {

    // get all the released versions from git tags
    const gitVersions = getVersionsInGit({
        trimVPrefix: true
    });
    // add add current package.json version to gitVersions
    // gitVersions.unshift(STR_CURRENT_VERSION);

    // get all the released versions found in changelog
    const changelogVersions = getVersionsInChangelog();


    function failVerification() {
        console.warn('[changelog] versions found in git does not match ' +
            'versions found in changelog!');
        console.error('[changelog] git versions:', gitVersions);
        console.error('[changelog] changelog versions:', changelogVersions);
        console.error('[changelog] exiting with error');
        process.exit(1);
    }

    // assert we found same number of versions in both
    if (gitVersions.length !== changelogVersions.length) {
        failVerification();
    }

    // assert that there is diff in elements between both arrays
    const diff = difference(gitVersions, changelogVersions);

    if (diff.length > 0) {
        failVerification();
    }
}


// main function, do something based on argv
let commits;
let markdown;

if (ACTION === 'generate') {
    commits = getCommits();
    markdown = generateUnreleasedMd(commits);
    updateChangelog(markdown);
    verifyChangelog();
} else if (ACTION === 'release') {
    commits = getCommits();
    markdown = generateUnreleasedMd(commits);
    updateChangelog(markdown);
    releaseChangelog();
    verifyChangelog();
} else {
    console.error('[changelog] No action specified');
    process.exit(1);
}
