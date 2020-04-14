'use strict';

const assert = require('chai').assert;
const sourceFiles = require('../../util/sourceFiles');
const helpers = require('../../util/helpers');

const {
    SIZE_IN_PX,
    MAXIMUM_ALLOWED_SIZE_IN_PX,
    IMPORTANT_CSS
} = require('../../util/constants');


describe('Client-side JS', function() {

        it(`em or rems should be used instead of px (checker config allows values ${MAXIMUM_ALLOWED_SIZE_IN_PX} or less) `, function() {
            const violations = [];
            sourceFiles.styles.forEach(file => {
                const code = sourceFiles.getFileData(file);
                const pxRegExp = new RegExp(SIZE_IN_PX, 'gm')
                let found;
                const pixelValues = []
                while (found = pxRegExp.exec(code)) {
                    const value = found[1];
                    if (value > MAXIMUM_ALLOWED_SIZE_IN_PX) {
                        pixelValues.push(found[0])
                    }
                }
                if (pixelValues.length > 0) {
                    violations.push(`\nSCRIPT: ${file}\n PIXEL VALUES FOUND: ${pixelValues.map(v => '\n ' + v)}`)
                }
            })
            assert.isEmpty(violations, `Some pixel values may be changed to em/rem: ${violations}`);
        });

        it(`!important should be avoided `, function() {
            const violations = [];
            sourceFiles.styles.forEach(file => {
                const code = sourceFiles.getFileData(file);
                const impRegExp = new RegExp(IMPORTANT_CSS, 'gm');
                const found = code.match(impRegExp) || [];
                if (found.length > 0) {
                    violations.push(`\nSCRIPT: ${file}\n !IMPORTANT USAGE: ${found.map(f => '\n ' + f)}`)
                }
            })
            assert.isEmpty(violations, `!important usages were found: ${violations}`);
        });
    
});