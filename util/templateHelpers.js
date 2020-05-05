const helpers = require('./helpers');

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
 * @returns {string/null} e.g 'script'
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
 * Skips code until it reaches position after target 
 * @param {string} code 
 * @param {number} cursor 
 * @param {string} target e.g. if we want to get position after closure of <isscript> tag input should be '</isscript>'
 * @returns {number} position in code
 */
const getPositionAfter = (code, cursor, target) => {
    const targets = target.split('|');
    let reachedTargets = targets.map(t => cursorIsAfterTarget(code, cursor, t));
    while (reachedTargets.every(result => result === false)) {
        cursor++
        reachedTargets = targets.map(t => cursorIsAfterTarget(code, cursor, t));

    }
    return cursor;
}

/**
 * Returns position after provided tag is closed
 * Do not confuse with tag end. '*' symbol shows what position will be returned: <script> var some =...</script>*
 * @param {string} code 
 * @param {number} cursor 
 * @param {string} tag name of tag e.g. 'script'
 */
const getPositionAfterTagIsClosed = (code, cursor, tag) => {
    return getPositionAfter(code, cursor, `</${tag}>|/>`);
}



/**
 * Returns end of tag. Implemented to hande nested tags and conditions like: 
 * <isif condition="${pdict.OrdersCount != null && pdict.OrdersCount > 0 && pdict.OrderPagingModel !=null}" >
 * <tr  class="cart-row <isif condition="${gcliloopstate.first}"> first <iselseif condition="${gcliloopstate.last}"> last</isif>">
 * Do not confuse with tag closure. '*' symbol shows what position will be returned: <script>* var some =...</script>
 * @param {string} code 
 * @param {number} tagNameStart position where tag name starts for e.g. for tag <iscomment> it should be "i" position
 * @returns {number} position in code after braces closed
 */
const getTagEnd = (code, tagNameStart) => {
    let cursor = tagNameStart;
    if (cursorIsAtCommentTag(code, cursor)) {
        cursor = getPositionAfter(code, cursor, '-->')
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
 * @returns {array} of object objects
 */
const findHardCodedStrings = code => {   
        const tagBoundRegExp = new RegExp(TAG_START_BOUNDARY_MASK, 'gm');
        const hardcodedStrRegExp = new RegExp(HARDCODED_STRING_IN_TEMPLATE_MASK, 'm');
        const violations = [];
        let cursor = 0;
        let tagFirstBoundary;
        let tagContentStart;
        let tagContentEnd;
        while (tagFirstBoundary = tagBoundRegExp.exec(code)) {
            cursor = tagFirstBoundary.index + 1;
            const ignoredTag = atWhichOfTagsIsCursor(code, cursor, ['isscript','script','iscomment']);
            if (ignoredTag) {
                cursor = getPositionAfterTagIsClosed(code, cursor, ignoredTag);
            } else {
                cursor = getTagEnd(code, cursor)
                tagContentStart = cursor;
                while (!(code[cursor] === '<' && code[cursor+1] !== ' ') && 
                cursor < code.length ) {
                    cursor++
                }
                tagContentEnd = cursor;
                const content = code.substring(tagContentStart, tagContentEnd);
                if (hardcodedStrRegExp.test(content)) {
                    violations.push({value: content, index: tagContentStart });
                }
            }
            tagBoundRegExp.lastIndex = cursor; // in order to avoid search in skipped area, regexp index for further search adapted to cursor
    }
    return violations;
}

/**
 * Finds all <isprint> tags in code. Able to handle tags with complex condiditons e.g.
 * <isprint value="${pdict.SomeValue > 0 ? 'bigger' : 'smaller'}" encoding="UTF-8" >
 * @param {string} code 
 * @returns {array} of objects with text(actual code of tag) and index properties
 */
const findAllIsPrintTags = code => {   
    const tagBoundRegExp = new RegExp(TAG_START_BOUNDARY_MASK, 'gm');
    const result = [];
    let cursor = 0;
    let tagFirstBoundary;
    while (tagFirstBoundary = tagBoundRegExp.exec(code)) {
        cursor = tagFirstBoundary.index + 1 ;
        const isPrintTag = atWhichOfTagsIsCursor(code, cursor, ['isprint']);
        if (isPrintTag) {
            const tagEnd = getTagEnd(code, cursor);
            result.push({
                text:  code.substring(cursor - 1 , tagEnd),
                index: cursor
            })
            cursor = tagEnd;
        } 
    }
    return result;
}

/**
 * This function was created as replacement of style\s?= regExp
 * Any tag can have <isprint value={} style=...> which regexp is unable to filter out.
 * This function searches style\s?= but skips content of <isprint>
 * @param {string} code 
 * @param {number} tagStart 
 * @param {number} tagEnd 
 */
const tagDoesHaveInlineStyles = (code, tagStart, tagEnd) => {
    let cursor = tagStart;
    while (cursor < tagEnd) {
        if (cursorIsAtTarget(code, cursor, 'style')) {
            if (code[cursor + 'style'.length] === '=' || code[cursor + 'style'.length + 1] === '=') {
                return true;
            }
        } else if (cursorIsAfterTarget(code, cursor, '<')) {
            internalIsPrint = atWhichOfTagsIsCursor(code, cursor, ['isprint']);
            if (internalIsPrint) {
                cursor = getPositionAfterTagIsClosed(code, cursor, internalIsPrint);
            }
        }
        cursor++;
    }
    return false;
}

/**
 * finds all tags that have style property, except ['isscript','script','iscomment', 'isprint']
 * @param {string} code 
 */
const findAllInlineStylesInTags = code => {
    const tagBoundRegExp = new RegExp(TAG_START_BOUNDARY_MASK, 'gm');
    const violations = [];
    let cursor = 0;
    let tagFirstBoundary;
    while (tagFirstBoundary = tagBoundRegExp.exec(code)) {
        cursor = tagFirstBoundary.index + 1;
        const ignoredTag = atWhichOfTagsIsCursor(code, cursor, ['isscript','script','iscomment', 'isprint']);
        if (ignoredTag) {
            cursor = getPositionAfterTagIsClosed(code, cursor, ignoredTag)
        } else {
            cursor = getTagEnd(code, cursor)
            if (tagDoesHaveInlineStyles(code, tagFirstBoundary.index, cursor)) {
                violations.push({
                    value: code.substring(tagFirstBoundary.index, cursor),
                    index: tagFirstBoundary.index });
            }
        }
        tagBoundRegExp.lastIndex = cursor; // in order to avoid search in skipped area, regexp index for further search adapted to cursor
}
return violations;
}

module.exports = {
    getTagEnd,
    findHardCodedStrings,
    findAllIsPrintTags,
    findAllInlineStylesInTags
}