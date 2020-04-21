const assert = require('chai').assert;
const sourceFiles = require('../../util/sourceFiles');
const helpers = require('../../util/helpers');
const { TEST_METHOD_MASK } = require('../../util/constants')

const getRelevantIntegrationTest = (tests, fileName) => {
        for (const test of tests) {
        if (test.endsWith(fileName)) {
            return test;
        }
    }
    return null;
}

const countTests = test => {
    const code = sourceFiles.getFileData(test);
    const testRegExp = new RegExp(TEST_METHOD_MASK, 'gm');
    const result = code.match(testRegExp);
    return result ? result.length : 0;
}

describe('Controllers', function() {
    it('Controllers with JSON responses should have integration tests (SFRA ONLY)', function() {
        const violations = [];
        const controllers = sourceFiles.getSpecificVersionFiles('.js|.ds', 'sfra', { pick: ['controllers'] });
        const tests = sourceFiles.getFiles('.js', '/test/integration');
        controllers.forEach(file => {
            const fileName = sourceFiles.getFileName(file)
            const code = sourceFiles.getFileData(file);
            const jsonEndPoints = helpers.findAllEndpoints(code).filter(ep => ep.scope.includes('res.json'));
            if (jsonEndPoints.length > 0) {
                const intTest = getRelevantIntegrationTest(tests, fileName);
                if(!intTest) {
                    violations.push(`\nSCRIPT: ${file}\n No integration test with name ${fileName} was found, while controller ${fileName} has endpoints that return json: ${jsonEndPoints.map(e => '\n' + e.name)}\n`)
                } else {
                    const testsQuantity = countTests(intTest);
                    if (testsQuantity < jsonEndPoints.length) {
                        violations.push(`\nSCRIPT: ${file}\n File ${fileName} has only ${testsQuantity} tests while there are ${jsonEndPoints.length} endpoints that return json: ${jsonEndPoints.map(e => '\n' + e.name)}\n`)
                    }
                }
            }
        })
        assert.isEmpty(violations, `Some tests missing for controllers: ${violations}`);
    });
});
