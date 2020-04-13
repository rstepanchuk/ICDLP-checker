'use strict'

const assert = require('chai').assert;
const sourceFiles = require('../../util/sourceFiles');
const helpers = require('../../util/helpers');
const CNST = require('../../util/constants');

const addVariablesToSearchMask = helpers.addVariablesToSearchMask;
const findSearchMatchVariables = helpers.findSearchMatchVariables;

const getUnclosedErrorMessage = (notClosedArr) => {
    return notClosedArr.map(obj => `SCRIPT: ${obj.script}\n OPEN FOUND: ${obj.open}\n CLOSED FOUND: ${obj.closed}\n`)
}

describe('General', function() {

    it('All require paths should be not hardcoded and use *.', function() {
        
        const invalidImports = [];
        const invalidRequireRegExp = new RegExp(CNST.INVALID_REQUIRE_MASK, 'gm');
        sourceFiles.scripts.forEach(script => {
            const foundInvalid = sourceFiles.getFileData(script).match(invalidRequireRegExp);
            if (foundInvalid) {
                invalidImports.push(`\nSCRIPT: ${script}\nINVALID_IMPORTS: ${foundInvalid.map(imp => '\n      '+ imp)}}`);
            }
        })
        assert.isEmpty(invalidImports, `Invalid imports found: ${invalidImports}`)
    });

    it('The code should not contain any TODOs', function() {

        const toDoRegExp = new RegExp(CNST.TODO_MASK, 'gm');
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
            const sessionVars = findSearchMatchVariables(code, CNST.SESSION_VARIABLE_MASK); // find session that was saved to variables
            const finalSessionCustomMask = addVariablesToSearchMask(sessionVars, CNST.SESSION_CUSTOM_MASK, '|')// add found variables to regexp
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
            const open = findSearchMatchVariables(code, CNST.READER_WRITER_VARIABLE_MASK);
            if (open.length > 0) {
                const finalSearchMask = addVariablesToSearchMask(open, CNST.CLOSED_VARIABLE_MASK)
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
            for (let cl in CNST.METHODS_WITH_SEEKABLE_ITERATOR) {
                if (code.includes(cl)){
                    const seekIteratorMask = addVariablesToSearchMask(CNST.METHODS_WITH_SEEKABLE_ITERATOR[cl], CNST.SEEKABLE_ITERATOR_VARIABLE_MASK);
                    const seekIteratorRegExp = new RegExp(seekIteratorMask, 'gmi'); //searching methods that return seekIterator and extracting variables that are actual iterators
                    const iterators = [];
                    let found;
                    while (found = seekIteratorRegExp.exec(code)){
                        iterators.push(found[1])
                    }
                    if (iterators.length > 0) {
                        const closedIteratorMask = addVariablesToSearchMask(iterators, CNST.CLOSED_VARIABLE_MASK);
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