'use strict'

var assert = require('chai').assert;
var sourceFiles = require('../../util/sourceFiles');

const ALLOWED_IMPORTS_PATTERNS = ['*/', './', '../', '~/', 'dw/', 'server']; // patterns which considered as valid import
const ALLOWED_IMPORTS_REGEXP_ADAPTED = ALLOWED_IMPORTS_PATTERNS.map(pattern => pattern.replace(/\.|\*|\//, '\\$&'));// valid patterns transformed to regex format
const INVALID_REQUIRE_MASK = `require\\(('|")(?!${ALLOWED_IMPORTS_REGEXP_ADAPTED.join('|')})[^)]+?\\)`;
const TODO_MASK = 'TODO.*';
const SESSION_VARIABLE_MASK = '([A-z]+)\\s?=\\s?request\\.getSession\\(\\)[^.]'; // for cases if session was saved as variable with another name
const VAR_PLACEHOLDER = '<%s>';
const SESSION_CUSTOM_MASK = `^.*?(${VAR_PLACEHOLDER}session|request.getSession\\(\\))\\.(custom\\W|getCustom\\(\\)).*?$`;
const READER_WRITER_VARIABLE_MASK = '([A-z]+)(\\s:\\s[A-z]+)?\\s?=\\s?new\\s([A-z.]+)?(Reader|Writer)\\(';
const CLOSED_VARIABLE_MASK = `(${VAR_PLACEHOLDER})\\.close\\(\\)`
const METHODS_WITH_SEEKABLE_ITERATOR = {
    CustomerMgr: ['queryProfiles', 'searchProfiles'],
    OrderMgr: ['queryOrders', 'searchOrders'],
    ProductMgr: ['queryAllSiteProducts', 'queryProductsInCatalog', 'queryAllSiteProductsSorted', 'queryProductsInCatalogSorted'],
    ProductListMgr: ['queryProductLists'],
    SystemObjectMgr: ['querySystemObjects', 'getAllSystemObjects'],
    CustomObjectMgr: ['queryCustomObjects', 'getAllCustomObjects']
};
const SEEKABLE_ITERATOR_VARIABLE_MASK = `([A-z]+)\\s?=\\s?([A-z.]+)\\.(${VAR_PLACEHOLDER})\\(`

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
    return mask.replace(VAR_PLACEHOLDER, regExpInject);
}

const getUnclosedErrorMessage = (notClosedArr) => {
    return notClosedArr.map(obj => `SCRIPT: ${obj.script}\n OPEN FOUND: ${obj.open}\n CLOSED FOUND: ${obj.closed}\n`)
}

describe('General', function() {

    it('All require paths should be not hardcoded and use *.', function() {
        
        const invalidImports = [];
        const invalidRequireRegExp = new RegExp(INVALID_REQUIRE_MASK, 'gm');
        sourceFiles.scripts.forEach(script => {
            const foundInvalid = sourceFiles.getFileData(script).match(invalidRequireRegExp);
            if (foundInvalid) {
                invalidImports.push(`\nSCRIPT: ${script}\nINVALID_IMPORTS: ${foundInvalid.map(imp => '\n      '+ imp)}}`);
            }
        })
        assert.isEmpty(invalidImports, `Invalid imports found: ${invalidImports}`)
    });

    it('The code should not contain any TODOs', function() {

        const toDoRegExp = new RegExp(TODO_MASK, 'gm');
        const toDos = [];
        sourceFiles.getFiles('', '/cartridges', ['static', 'sg_changes']).forEach(file => {
            const foundTODO = sourceFiles.getFileData(file).match(toDoRegExp);
            if (foundTODO) {
                toDos.push(`\nSCRIPT: ${file}\nFOUND: ${foundTODO.map(imp => '\n      '+ imp)}}`);
            }
        })
        assert.isEmpty(toDos, `TODO's found: ${toDos}`);
    });

    it('Session.custom shouldn\'t be used', function() {

        const foundCustom = [];
        sourceFiles.scripts.forEach(file => {
            const code = sourceFiles.getFileData(file);
            const sessionVars = findSearchMatchVariables(code, SESSION_VARIABLE_MASK); // find session that was saved to variables
            const finalSessionCustomMask = addVariablesToSearchMask(sessionVars, SESSION_CUSTOM_MASK, '|')// add found variables to regexp
            const sessionCustomRegExp = new RegExp(finalSessionCustomMask, 'gmi');
            const sesCustom = code.match(sessionCustomRegExp);
            if (sesCustom) {
                foundCustom.push(`\nSCRIPT: ${file}\nFOUND: ${sesCustom.map(found => '\n      '+ found)}}`)
            }
        })
        assert.isEmpty(foundCustom, `Session.custom found: ${foundCustom}`)
    });

    it('All readers and writers should be explicitly closed', function() {
    
        const notClosed = [];
        sourceFiles.scripts.forEach(file => {
            const code = sourceFiles.getFileData(file);
            const open = findSearchMatchVariables(code, READER_WRITER_VARIABLE_MASK);
            if (open.length > 0) {
                const finalSearchMask = addVariablesToSearchMask(open, CLOSED_VARIABLE_MASK)
                const closedRegExp = new RegExp(finalSearchMask, 'gmi');
                const closed = code.match(closedRegExp) || [];
                if (open.length !== closed.length) {
                    notClosed.push({
                        script: file,
                        open,
                        closed
                    })
                }
            }
        })
        assert.isEmpty(notClosed, `Not all readers or writers were closed: \n${getUnclosedErrorMessage(notClosed)}`);
    });

    it('All SeekableIterators should be explicitly closed', function() {
        const notClosed = [];
        sourceFiles.scripts.forEach(file =>{
            const code = sourceFiles.getFileData(file);
            for (let cl in METHODS_WITH_SEEKABLE_ITERATOR) {
                if (code.includes(cl)){
                    const seekIteratorMask = addVariablesToSearchMask(METHODS_WITH_SEEKABLE_ITERATOR[cl], SEEKABLE_ITERATOR_VARIABLE_MASK);
                    const seekIteratorRegExp = new RegExp(seekIteratorMask, 'gmi'); //searching methods that return seekIterator and extracting variables that are actual iterators
                    const iterators = [];
                    let found;
                    while (found = seekIteratorRegExp.exec(code)){
                        iterators.push(found[1])
                    }
                    if (iterators.length > 0) {
                        console.log(`ITERATORS: ${iterators}`)
                        const closedIteratorMask = addVariablesToSearchMask(iterators, CLOSED_VARIABLE_MASK);
                        const closedIteratorRegExp = new RegExp(closedIteratorMask, 'gmi');
                        const closed = code.match(closedIteratorRegExp) || [];
                        if (iterators.length !== closed.length) {
                            notClosed.push({
                                script: file,
                                open: iterators,
                                closed
                            })
                        }
                    }
                }
            }
        });
        assert.isEmpty(notClosed, `Not all seekable iterators were closed: \n${getUnclosedErrorMessage(notClosed)}`);
    });
})