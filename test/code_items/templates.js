const assert = require('chai').assert;
const sourceFiles = require('../../util/sourceFiles');
const templateHelpers = require('../../util/templateHelpers');
// const helpers = require('../../util/helpers');
const SearchMatch = require('../../models/SearchMatch');

const { 
} = require('../../util/constants');


describe('Templates', function() {
    it('Hardcoded strings should be in a .properties file', function() {
        const violations =[];
        sourceFiles.templates.forEach(template => {
            const code = template.getCode();
            const hardcodedStrings = templateHelpers.findHardCodedStrings(code);
            if (hardcodedStrings.length > 0) {
                SearchMatch.defineRowsForMatches(code, hardcodedStrings);
                const stringMsgs = hardcodedStrings.map(match => `row ${match.row}: ${match.fullMatch.replace(/\s+/gm, ' ')}`);
                violations.push(`TEMPLATE: ${template.path}\nHARDCODED STRINGS:\n${stringMsgs.join('\n')}`)
            }
        })
        assert.isEmpty(violations, `Some templates have hardcoded strings:\n${violations.join('\n\n')}\n`);
    });
});