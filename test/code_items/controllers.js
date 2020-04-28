const assert = require('chai').assert;
const sourceFiles = require('../../util/sourceFiles');
const helpers = require('../../util/helpers');
const { 
    TEST_METHOD_MASK,
    SFRA_REPLACED_CONTROLLER_MASK,
    SG_CALLED_CONTROLLER 
} = require('../../util/constants')

const getRelevantIntegrationTest = (tests, fileName) => {
        for (const test of tests) {
        if (test.toLowerCase().endsWith(fileName.toLowerCase())) {
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

    it('Controllers should prepend or append controllers, not replace them.', function() {
        const violations = [];
        const controllers = sourceFiles.getSpecificVersionFiles('.js|.ds', 'sfra', { pick: ['controllers'] });
        controllers.forEach(file => {
            const code = sourceFiles.getFileData(file);
            const replacedRegEx = new RegExp(SFRA_REPLACED_CONTROLLER_MASK, 'gm');
            const replacedEndpoints = [];
            let found;
            while (found = replacedRegEx.exec(code)) {
                replacedEndpoints.push(`\n${found[1]}`);
            }
            if (replacedEndpoints.length > 0) {
                violations.push(`\nSCRIPT: ${file}\n Endpoints that replace original controllers: ${replacedEndpoints}`)
            }
        })
        assert.isEmpty(violations, `Some endpoints replace controllers: ${violations}\n`);
    });

    it('Controllers should not call other controllers (sg version only)', function() {
        const violations = [];
        const controllers = sourceFiles.getSpecificVersionFiles('.js|.ds', 'controllers', { pick: ['controllers'] });
        controllers.forEach(file => {
            const code = sourceFiles.getFileData(file);
            const calledControllerRegEx = new RegExp(SG_CALLED_CONTROLLER, 'gm');
            const calledControllers = [];
            let found;
            while (found = calledControllerRegEx.exec(code)) {
                calledControllers.push(`\n${found[0]}`);
            }
            if (calledControllers.length > 0) {
                violations.push(`\nSCRIPT: ${file}\n Some controllers call other controllers controllers: ${calledControllers}`)
            }
        })
        assert.isEmpty(violations, `Some endpoints replace controllers: ${violations}\n`);
    });
});
