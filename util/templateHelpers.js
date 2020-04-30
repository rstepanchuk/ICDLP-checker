const helpers = require('./helpers');
const SearchMatch = require('../models/SearchMatch');

const { 
    HARDCODED_STRING_IN_TEMPLATE_MASK,
    TAG_START_BOUNDARY_MASK
} = require('./constants');

/**
 * Checks if cursor in the beginning of a comment tag <!-- ... -->
 * This function is not replaced with cursorIsAtTarget(code, cursor, '!--') due to better performance
 * @param {string} code 
 * @param {number} cursor 
 * @returns {boolean}
 */
const cursorIsAtCommentTag = (code, cursor) => {
    return code[cursor] === '!' &&  
    code[cursor + 1] === '-' &&
    code[cursor + 2] === '-';
}

/**
 * Check if cursor is at the beginning of specified tag
 * @param {string} code 
 * @param {number} cursor 
 * @param {string} target tag name for comparison e.g. of matching <script> tag it should be 'script'
 * @returns {boolean}
 */
const cursorIsAtTarget = (code, cursor, target) => {
    for (let i = 0; i < target.length; i++) {
        if (code[cursor + i] !== target[i]) {
            return false;
        }        
    }
    return true
}

/**
 * Check if code that is following cursor matches one of targets
 * @param {string} code 
 * @param {number} cursor 
 * @param {array} target e.g. ['script','isscript']
 * @returns {string/null} e.g 'scirpt'
 */
const atWhichOfTagsIsCursor = (code, cursor, targetArr) => {
    for (const target of targetArr) {
        if (cursorIsAtTarget(code, cursor, target)) {
            return target;
        }
    }
    return null;
}

/**
 * Skips code until it reaches position after target 
 * @param {string} code 
 * @param {number} cursor 
 * @param {string} target e.g. if we want to get position after closure of <isscript> tag input should be '</isscript>'
 * @returns {number} position in code
 */
const getPositionAfterTarget = (code, cursor, target) => {
    while (!cursorIsAfterTarget(code, cursor, target)) {
        cursor++
    }
    return cursor;
}

/**
 * Checks if text that precedes cursor matches target
 * @param {string} code 
 * @param {number} cursor 
 * @param {string} target e.g. if we want to find out if cursor reached closure of <script> tag input should be '</script>'
 * @returns {boolean}
 */
const cursorIsAfterTarget = (code, cursor, target) => {
    for (let i = target.length - 1; i >= 0; i--) {
        const n = target.length - i;
        if (code[cursor - n] !== target[i]){
            return false;
        }
    }
    return true
}

/**
 * Returns end of tag. Implemented to hande nested tags and conditions like: 
 * <isif condition="${pdict.OrdersCount != null && pdict.OrdersCount > 0 && pdict.OrderPagingModel !=null}" >
 * <tr  class="cart-row <isif condition="${gcliloopstate.first}"> first <iselseif condition="${gcliloopstate.last}"> last</isif>">
 * @param {string} code 
 * @param {number} tagNameStart position where tag name starts for e.g. for tag <iscomment> it should be "i" position
 * @returns {number} position in code
 */
const getTagEnd = (code, tagNameStart) => {
    let cursor = tagNameStart;
    if (cursorIsAtCommentTag(code, cursor)) {
        cursor = getPositionAfterTarget(code, cursor, '-->')
    } else {
        let bracesCount = 1;
        while (bracesCount > 0 && cursor < code.length) {
            if (code[cursor] === '>') {
                bracesCount--;
            } else if (code[cursor] === '<') {
                bracesCount++;
            } else if (code[cursor] === '{') { // if there is something like ${} inside tag, it should be skipped e.g. <isif condition="${pdict.OrdersCount != null && pdict.OrdersCount > 0 && pdict.OrderPagingModel !=null}" >
                cursor = helpers.getScopeEnd(code, cursor)
            }
            cursor++;
        }
    
        if (bracesCount > 0) {
            throw new Error(`getTagEnd function was not able to find end of tag at ${tagNameStart}`)
        }
    }
    
    return cursor;
}

/**
 * gets all hardcoded string in provided template code
 * @param {string} code 
 * @returns {array} of SearchMatch objects
 */
const findHardCodedStrings = code => {   
        const tagBoundRegExp = new RegExp(TAG_START_BOUNDARY_MASK, 'gm');
        const hardcodedStrRegExp = new RegExp(HARDCODED_STRING_IN_TEMPLATE_MASK, 'm');
        const hardcodedStrings = [];
        let cursor = 0;
        let tagFirstBoundary;
        let tagContentStart;
        let tagContentEnd;
        while (tagFirstBoundary = tagBoundRegExp.exec(code)) {
            cursor = tagFirstBoundary.index + 1;
            const ignoredTag = atWhichOfTagsIsCursor(code, cursor, ['isscript','script','iscomment']);
            if (ignoredTag) {
                cursor = getPositionAfterTarget(code, cursor, `</${ignoredTag}>`)
            } else {
                cursor = getTagEnd(code, cursor)
                tagContentStart = cursor;
                while (code[cursor] !== '<' && cursor < code.length ) {
                    cursor++
                }
                tagContentEnd = cursor;
                const content = code.substring(tagContentStart, tagContentEnd);
                if (hardcodedStrRegExp.test(content)) {
                    const match = new SearchMatch(content, code, tagContentStart)
                    hardcodedStrings.push(match)
                }
            }
            tagBoundRegExp.lastIndex = cursor; // in order to avoid search in skipped area, regexp index for further search adapted to cursor
    }
    return hardcodedStrings;
}



module.exports = {
    getTagEnd,
    findHardCodedStrings
}