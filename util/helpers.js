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

module.exports = {
    findSearchMatchVariables,
    createRegExWithVariables
}