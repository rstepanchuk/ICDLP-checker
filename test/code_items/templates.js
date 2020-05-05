const assert = require('chai').assert;
const sourceFiles = require('../../util/sourceFiles');
const templateHelpers = require('../../util/templateHelpers');
const RequirementVerification = require('../../models/RequirementVerification');

const { 
    ISCACHE_TAG_MASK,
    ENCODING_OFF_MASK,
    ISSCRIPT_MASK,
    ISSCRIPT_ALLOWED_ASSETS_REQUIRE_MASK,
    ISSCRIPT_ALLOWED_ADD_ASSETS_MASK,
    ISSCRIPT_ALLOWED_EMPTY_LINE_MAKS
} = require('../../util/constants');


describe('Templates', function() {
    it('Hardcoded strings should be in a .properties file', function() {
        const result = RequirementVerification.perform(sourceFiles.templates, (template, audit)=>{
            audit.addMultipleViolations(templateHelpers.findHardCodedStrings(template.getCode()));
        });
        assert.isTrue(result.isSuccessul(), result.generateErrorMessage('Some templates have hardcoded strings', {withRows: true}));
    });

    it('<isscript> should be only used to add assets.', function() {
        const allowedIsScriptRegExp = new RegExp(`${ISSCRIPT_ALLOWED_EMPTY_LINE_MAKS}|${ISSCRIPT_ALLOWED_ASSETS_REQUIRE_MASK}|${ISSCRIPT_ALLOWED_ADD_ASSETS_MASK}`)
        const result = RequirementVerification.perform(sourceFiles.templates, (template, audit) => {
            const isscriptRegExp = new RegExp(ISSCRIPT_MASK, 'gm');
            const code = template.getCode();
            let found;
            while (found = isscriptRegExp.exec(code)){
                const lines = found[1].split(/^/m);
                const forbiddenLines = lines.filter(line => !allowedIsScriptRegExp.test(line));
                if (forbiddenLines.length > 0) {
                    audit.addViolation(found[0], found.index)
                }
            }
        });
        assert.isTrue(result.isSuccessul(), result.generateErrorMessage('Some templates have <isscript> tag with extended logic', {withRows: true}));
    });

    it('Middleware cache should be used instead of <iscache>', function() {
        const result = RequirementVerification.perform(sourceFiles.templates, (template, audit)=> {
            const code = template.getCode();
            const isCacheRegExp = new RegExp(ISCACHE_TAG_MASK, 'gm')
            let found;
            while(found = isCacheRegExp.exec(code)) {
                audit.addViolation(found[0], found.index);
            }
        });
        assert.isTrue(result.isSuccessul(), result.generateErrorMessage('Some templates use <iscache> tag', {withRows: true}));
    });

    it('<isprint encoding> should not be off', function() {
        const encodingOffRegExp = new RegExp(ENCODING_OFF_MASK, 'm')
        const result = RequirementVerification.perform(sourceFiles.templates, (template, audit) => {
            const isPrintTags = templateHelpers.findAllIsPrintTags(template.getCode());
            isPrintTags.forEach(tag => {
                if (encodingOffRegExp.test(tag.text)) {
                    audit.addViolation(tag.text, tag.index);
                }
            })
        });
        assert.isTrue(result.isSuccessul(), result.generateErrorMessage('Some templates have <isprint encoding="off"> tags'));
    });

    it('Inline styles should not be used', function() {
        const result = RequirementVerification.perform(sourceFiles.templates, (template, audit) => {
            audit.addMultipleViolations(templateHelpers.findAllInlineStylesInTags(template.getCode()));
        });
        assert.isTrue(result.isSuccessul(), result.generateErrorMessage('In some templates inline styles are used', {withRows: true}));
    });
});