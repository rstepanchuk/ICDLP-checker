'use strict'

const { 
    PLACEHOLDER,
    DW_IMPORTED_CLASS_VARIABLE,
    DW_IMPORTED_CLASS_DIRECT,
    METHOD_PLACEHOLDER,
    FUNCTION_MASK
 } = require('./constants');

/**
 * Escapes letters
 * Used for cases when search result are used in new reqExp expressions
 * @param {string} str 
 */
 const escapeLetters = (str) => {
    const escaped = ['.',')','(','\\','*','?']
    return str
        .split('')
        .map(char => escaped
            .some(symb => symb === char) ? `\\${char}` : char)
        .join('');
}

/**
 * creates regex, performes search and provides array of search results
 * @param {string} code 
 * @param {string} searchMask 
 * @param {number} groupToSave - matching regex group number
 */
const findSearchMatchVariables = (code, searchMask, groupToSave = 1) => {
    const result = [];
    const sessionVarRegExp = new RegExp(searchMask, 'gmi');
    let found;
    while (found = sessionVarRegExp.exec(code)){
        result.push(found[groupToSave]);
    };
    return result;
}

/**
 * transforms array of variables that will be used for search in regex in xxx|xxxxx|xxxxx format
 * @param {string} suffix - sometimes it may be needed to somehow join included variables with already existing maske e.g. xxx|xxxx|OrderMgr.createOrder
 */
const adaptInputToSearchMask = (input, suffix ='') => {
    let result;
    if (Array.isArray(input)) {
        result = input.length > 0 ? `${input.join('|')}${suffix}` : '';
    } else {
        result = `${input}${suffix}`
    }
    return result;
}

/**
 * Takes two kind of inputs (variables and methods those variables should call), replaces inputs in search mask instead of placeholders and creates RegExp
 * @param {string} suffix - sometimes it may be needed to somehow join included variables with already existing maske e.g. xxx|xxxx|OrderMgr.createOrder
 */
const createRegExWithMethodCalls = (variable, method, mask) => {
    const varMask = adaptInputToSearchMask(variable);
    const methodMask = adaptInputToSearchMask(method)
    const finalMask = mask.replace(PLACEHOLDER, varMask)
                            .replace(METHOD_PLACEHOLDER, methodMask);
    return new RegExp(finalMask, 'gm')
}

/**
 * Replaces placeholder in search mask with provided variables and creates RegExp
 * @param {string} suffix - sometimes it may be needed to somehow join included variables with already existing maske e.g. xxx|xxxx|OrderMgr.createOrder
 */
const createRegExWithVariables = (variable, mask, injectSuffix='') => {
    let regExpInject  = adaptInputToSearchMask(variable, injectSuffix)
    const finalMask = mask.replace(PLACEHOLDER, regExpInject);
    return new RegExp(finalMask, 'gm');
}

/**
 * Creates RegExp and returns variables that imported class was saved to. 
 * if any methods were called directly after requiring class, such cases are also added to results
 * Result is converted to regex-friendly format to be used for creating new regexp searches.
 * for example: 
 * var ordMgr = require('dw/order/OrderMgr'); will return ['ordMgr'] 
 * require('dw/order/OrderMgr').createOrder(...) will return ['OrderMgr\'\\)']
 * @param {string} code 
 * @param {*} className 
 */
const findDwClassUsages = (code, className) => {

    const result = [];
    const searchMask = DW_IMPORTED_CLASS_VARIABLE.replace(PLACEHOLDER, className);
    const classRegEx = new RegExp(searchMask, 'gm');

    let found;
    while (found = classRegEx.exec(code)){
        result.push(found[1]);
    };

    const dirUsRegExp = DW_IMPORTED_CLASS_DIRECT.replace(PLACEHOLDER, className);
    const directUsage = new RegExp(dirUsRegExp,'m').exec(code);

    if (directUsage && result.every(r => r !== directUsage[1])) {
        result.push(escapeLetters(directUsage[1]));
    }
    return result;
}


/**
 * Returns code text from certain position (scope beginning) to the end of the scope
 * nested scopes are also included
 * @param {string} code 
 * @param {number} firstBracePosition position where target scope starts
 * @param {string} brace symbol which marks scope borders
 */
const getScope = (code, firstBracePosition, brace = '{') => {
    const openCloseMap = {
        '{':'}',
        '(':')',
        '[':']'
    }
    let cursor = firstBracePosition + 1;
    let bracesCount = 1;
    while (bracesCount > 0) {
        if (code[cursor] === openCloseMap[brace]) {
            bracesCount--;
        } else if (code[cursor] === brace) {
            bracesCount++;
        }
        cursor++;
    }
    return code.substring(firstBracePosition, cursor);
}

/**
 * Taking regexResult of function, collects func name, parameters, scope and some other statistic 
 * @param {strig} code 
 * @param {regex.exec() result} regexResult 
 */
const collectFunctionData = (code, regexResult) => {
    const functionTextLengh = regexResult[0].length - 1 // last parenthesis doesn't count
    const firstBracePosition = regexResult.index + functionTextLengh;
    const parametersText =  getScope(code, firstBracePosition, '(')
    let scopeStartIndex = regexResult.index + functionTextLengh + parametersText.length;
    while (code[scopeStartIndex] !== '{') {
        scopeStartIndex++;
    }
    const scope = getScope(code, scopeStartIndex);
    const result = {
        name: regexResult[1],
        params: parametersText,
        scope,
        scopeStart: scopeStartIndex,
        scopeEnd: scopeStartIndex + scope.length
    }
    return result;
}

/**
 * Looks for all functions in code and collects their name, parameters, scope and some other statistic
 * @param {strig} code 
 * @returns {Array} array of function objects
 */
const findAllfunctions = (code) => {
    const result = [];
    const funcRegEx = new RegExp(FUNCTION_MASK, 'gm');
    let found;
    while (found = funcRegEx.exec(code)) {
        result.push(collectFunctionData(code, found))
    }
    return result;
}

/**
 * 
 * @param {regExp.exec() result} searchResult 
 * @param {Array} functionsArr array of function objects
 * @returns {Object} function that searchResult belongs to
 */
const mapSearchResultToFunc = (searchResult, functionsArr) => {
    let result = {
        scopeStart: 0
    };
    for (let f of functionsArr) {
        if (searchResult.index < f.scopeEnd && searchResult.index > f.scopeStart) { // if variable is within func scope
            if ( searchResult.index - f.scopeStart < searchResult.index - result.scopeStart) {//function with the closest distance between start and variable is the one that has it in scope
                result = f;
            } 
        }
    }
    if (!result) {
        throw new Error(`Unable to map variable ${searchResult[1]} to any of ${functionsArr.length} functions on the page`)
    }
    return result;
}



module.exports = {
    findSearchMatchVariables,
    createRegExWithVariables,
    createRegExWithMethodCalls,
    findAllfunctions,
    mapSearchResultToFunc,
    getScope,
    findDwClassUsages
}