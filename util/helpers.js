'use strict'

const CNST = require('./constants');

const findSearchMatchVariables = (code, searchMask, groupToSave = 1) => {
    const result = [];
    const sessionVarRegExp = new RegExp(searchMask, 'gmi');
    let found;
    while (found = sessionVarRegExp.exec(code)){
        result.push(found[groupToSave]);
    };
    return result;
}

const addVariablesToSearchMask = (varArr, mask, injectSuffix='') => {
    const regExpInject = varArr.length > 0 ? `${varArr.join('|')}${injectSuffix}` : '';
    return mask.replace(CNST.VAR_PLACEHOLDER, regExpInject);
}

module.exports = {
    findSearchMatchVariables,
    addVariablesToSearchMask
}