const assert = require('chai').assert;
const sourceFiles = require('../../util/sourceFiles');
const templateHelpers = require('../../util/templateHelpers');
const RequirementVerification = require('../../models/RequirementVerification');
// const helpers = require('../../util/helpers');

const { 
} = require('../../util/constants');


describe('Templates', function() {
    it('Hardcoded strings should be in a .properties file', function() {
        const audit = new RequirementVerification('hardcoded strings');
        sourceFiles.templates.forEach(template => {
            audit.selectFileForAudit(template);
            const code = template.getCode();
            audit.addViolations(templateHelpers.findHardCodedStrings(code));
            audit.saveSelectedFileAuditResult();
        });
        assert.isTrue(audit.isSuccessul(), audit.generateErrorMessage('Some templates have hardcoded strings'));
    });
});