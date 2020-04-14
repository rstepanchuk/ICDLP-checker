'use strict'

const { VAR_PLACEHOLDER } = require('./constants');

const findSearchMatchVariables = (code, searchMask, groupToSave = 1) => {
    const result = [];
    const sessionVarRegExp = new RegExp(searchMask, 'gmi');
    let found;
    while (found = sessionVarRegExp.exec(code)){
        result.push(found[groupToSave]);
    };
    return result;
}

const createRegExWithVariables = (varArr, mask, injectSuffix='') => {
    const regExpInject = varArr.length > 0 ? `${varArr.join('|')}${injectSuffix}` : '';
    const finalMask = mask.replace(VAR_PLACEHOLDER, regExpInject);
    return new RegExp(finalMask, 'gm');
}

const getScope = (code, firstBracePosition) => {
    let cursor = firstBracePosition + 1;
    let bracesCount = 1;
    while (bracesCount > 0) {
        if (code[cursor] === '}') {
            bracesCount--;
        } else if (code[cursor] === '{') {
            bracesCount++;
        }
        cursor++;
    }
    return code.substring(firstBracePosition, cursor);
}

module.exports = {
    findSearchMatchVariables,
    createRegExWithVariables,
    getScope
}