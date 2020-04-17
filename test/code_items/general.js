'use strict'

const assert = require('chai').assert;
const sourceFiles = require('../../util/sourceFiles');

const {
    INVALID_REQUIRE_MASK,
    TODO_MASK,
    SESSION_VARIABLE_MASK,
    SESSION_CUSTOM_MASK,
    READER_WRITER_VARIABLE_MASK,
    CLOSED_VARIABLE_MASK,
    METHODS_WITH_SEEKABLE_ITERATOR,
    METHOD_CALLED_MASK,
    METHOD_CALL_SAVED_TO_VAR_MASK,
} = require('../../util/constants');

const { 
    createRegExWithVariables,
    findSearchMatchVariables,
    findDwClassUsages,
    createRegExWithMethodCalls,
    findAllfunctions,
    mapSearchResultToFunc
} = require('../../util/helpers');

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
        sourceFiles.getFiles('', '/cartridges', { skip: ['static'] }).forEach(file => {
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
            const sessionCustomRegExp = createRegExWithVariables(sessionVars, SESSION_CUSTOM_MASK, '|')// add found variables to regexp
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
                const closedRegExp = createRegExWithVariables(open, CLOSED_VARIABLE_MASK)
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
        const violations = [];
        sourceFiles.scripts.forEach(file =>{
            const code = sourceFiles.getFileData(file);
            for (let cl in METHODS_WITH_SEEKABLE_ITERATOR) {
                const classVariables = findDwClassUsages(code, cl);
                if (classVariables.length > 0) {
                    const seekIterRegExp = createRegExWithMethodCalls(classVariables, METHODS_WITH_SEEKABLE_ITERATOR[cl], METHOD_CALL_SAVED_TO_VAR_MASK)
                    let found = seekIterRegExp.exec(code);
                    const functionsInCode = found ? findAllfunctions(code) : [];
                    const notClosed = [];
                    while (found){
                        const originFunction = mapSearchResultToFunc(found, functionsInCode);
                        const closedIteratorRegExp = createRegExWithVariables(found[1], CLOSED_VARIABLE_MASK);
                        const closed = closedIteratorRegExp.test(originFunction.scope)
                        if (!closed) {
                            notClosed.push(`\n ${found[0]}`)
                        }
                        found = seekIterRegExp.exec(code);

                    }
                    if (notClosed.length > 0) {
                        violations.push(`\nSCRIPT: ${file}, \nNOT CLOSED: ${notClosed}`)
                    }
                }
            }
        });
        assert.isEmpty(violations, `Not all seekable iterators were closed: ${violations}`);
    });
})