const assert = require('chai').assert;
const sourceFiles = require('../../util/sourceFiles');
const templateHelpers = require('../../util/templateHelpers');
const RequirementVerification = require('../../models/RequirementVerification');

const { 
    ISCACHE_TAG_MASK,
    ISPRING_ENCODING_OFF_MASK,
    INLINE_STYLES_MASK
} = require('../../util/constants');


describe('Templates', function() {
    it('Hardcoded strings should be in a .properties file', function() {
        const audit = new RequirementVerification('hardcoded strings');
        sourceFiles.templates.forEach(template => {
            audit.selectFileForAudit(template);
            const code = template.getCode();
            audit.addMultipleViolations(templateHelpers.findHardCodedStrings(code));
            audit.saveSelectedFileAuditResult(true);
        });
        assert.isTrue(audit.isSuccessul(), audit.generateErrorMessage('Some templates have hardcoded strings'));
    });

    it('Middleware cache should be used instead of <iscache>.', function() {
        const audit = new RequirementVerification('<iscache> tag used');
        sourceFiles.templates.forEach(template => {
            audit.selectFileForAudit(template);
            const code = template.getCode();
            const isCacheRegExp = new RegExp(ISCACHE_TAG_MASK, 'gm')
            let found;
            while(found = isCacheRegExp.exec(code)) {
                audit.addViolation(found[0], found.index)
            }
            audit.saveSelectedFileAuditResult(true);
        });
        assert.isTrue(audit.isSuccessul(), audit.generateErrorMessage('Some templates use <iscache> tag'));
    });

    it('<isprint encoding> should not be off', function() {
        const audit = new RequirementVerification('endcoding is off');
        sourceFiles.templates.forEach(template => {
            audit.selectFileForAudit(template);
            const code = template.getCode();
            const isCacheRegExp = new RegExp(ISPRING_ENCODING_OFF_MASK, 'gm')
            let found;
            while(found = isCacheRegExp.exec(code)) {
                audit.addViolation(found[0], found.index)
            }
            audit.saveSelectedFileAuditResult(true);
        });
        assert.isTrue(audit.isSuccessul(), audit.generateErrorMessage('Some templates have <isprint encoding="off"> tags'));
    });

    it('Inline styles should not be used.', function() {
        const audit = new RequirementVerification('Inline styles used');
        sourceFiles.templates.forEach(template => {
            audit.selectFileForAudit(template);
            const code = template.getCode();
            const isCacheRegExp = new RegExp(INLINE_STYLES_MASK, 'gm')
            let found;
            while(found = isCacheRegExp.exec(code)) {
                audit.addViolation(found[0], found.index)
            }
            audit.saveSelectedFileAuditResult(true);
        });
        assert.isTrue(audit.isSuccessul(), audit.generateErrorMessage('In some templates inline styles are used'));
    });
});