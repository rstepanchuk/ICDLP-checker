const assert = require('chai').assert;
const sourceFiles = require('../../util/sourceFiles');

describe('Scripts', function() {
    it('All scripts should be .js, not .ds', function() {
        const dsScripts = sourceFiles.getFiles('.ds', '/cartridges', { skip: ['*pipelines', '*changes'] });
        assert.isEmpty(dsScripts, `Some .ds scripts were found: ${dsScripts.map(s => '\n' + s)}\n`);
    });
});
