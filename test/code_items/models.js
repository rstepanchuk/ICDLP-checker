const assert = require('chai').assert;
const sourceFiles = require('../../util/sourceFiles');
const helpers = require('../../util/helpers');
const { 
    SUPER_CALLED_MASK
} = require('../../util/constants')



describe('Models', function() {
    it('All models should have unit tests.', function() {
        const violations = [];
        const models = sourceFiles.getFiles('.js|.ds', '/cartridges', { pick: ['models'] });
        const tests = sourceFiles.getFiles('.js', '/test/unit');
        models.forEach(file => {
            const fileName = sourceFiles.getFileName(file)
            const unitTest =  helpers.getRelevantTestFile(tests, fileName);
            if (!unitTest) {
                violations.push(file)
            }
        })
        assert.isEmpty(violations, `No unit tests were found for models: ${violations}`);
    });

    it('Models should not override SFRA models and only extend them.', function() {
        const violations = [];
        const models = sourceFiles.getFiles('.js|.ds', '/cartridges', { pick: ['models'] });
        models.forEach(file => {
            const code = sourceFiles.getFileData(file);
            const constructors = helpers.findAllConstructors(code);
            constructors.forEach(c => {
                const superCalled =new RegExp(SUPER_CALLED_MASK, 'gm')
                if (!superCalled.test(c.scope)) {
                    violations.push(`MODEL: ${file}\n constructor '${c.name}' doesn\'t call parent constructor`)
                }
            })
        })
        assert.isEmpty(violations, `Some models do not call super constructors. This may mean that they replace original models:\n ${violations}`);
    });
});
