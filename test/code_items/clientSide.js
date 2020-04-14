'use strict';

const assert = require('chai').assert;
const sourceFiles = require('../../util/sourceFiles');
const helpers = require('../../util/helpers');
// const CLIENT_CREATING_MASK = 'new\\s([A-z.]+\\.)?(HTTPClient|FTPClient|SFTPClient)\\('
const {
    HARD_CODED_URL,
    COMMENTED_HARD_CODED_URL
} = require('../../util/constants');


describe('Client-side JS', function() {

        it('URLs come from the server and hardcoded URLs should be avoided.', function() {
            const hardCodedUrls = [];
            sourceFiles.getFiles('.js', '/cartridges', { pick: ['client/default/js', 'js/pages', 'static'] }).forEach(file => {
                const code = sourceFiles.getFileData(file);
                const urlRegExp = new RegExp(HARD_CODED_URL, 'gm')
                let found = code.match(urlRegExp) || [];
                found = found.filter(f => { // checking if any of found values are commented, thus can stay in code
                    const commentedRegExp = new RegExp(COMMENTED_HARD_CODED_URL);
                    // console.log(`URL: ${f}\n REGEXP: ${commentedRegExp} RESULT:${commentedRegExp.test(f)}`)
                    return !commentedRegExp.test(f);
                })
                if (found.length > 0) {
                    hardCodedUrls.push(`\nSCRIPT: ${file}\nURLS: ${found.map(f => `\n ${f}`)}`)
                }
            })
            assert.isEmpty(hardCodedUrls, `Hardcoded urls were found: ${hardCodedUrls}`);
        });
    
});