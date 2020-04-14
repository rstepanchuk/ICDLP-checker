'use strict';

const fs = require('fs');
const config = require('../../util/config');
const sourceFiles = require('../../util/sourceFiles');
const {
    PASCAL_CASE_MASK,
    CAMEL_CASE_MASK,
    ROW_MAX_LENGTH,
} = require('../../util/constants');

const fileNameIsValid = (file) => {
    const fileName = file.split('\\').pop();
    if (file.includes('\\controllers\\')){
        return new RegExp(PASCAL_CASE_MASK).test(fileName);
    }
    if (file.includes('controllers') && file.includes('\\templates\\')) { // both cases are allowed for templates in controllers cartridge
        return true;
    }
    return new RegExp(CAMEL_CASE_MASK).test(fileName);
}

const attentionMark = (file) => {
    const arrowLength = ROW_MAX_LENGTH - file.length > 2 ? ROW_MAX_LENGTH - file.length : 10;
    if (!fileNameIsValid(file)){
        return ` <${new Array(arrowLength).join('-')}NEEDS CHECK`;
    }
    return '';
}

const skip = sourceFiles.cartridges.pipelines.concat(['*changes', 'client','static']);
const files = sourceFiles.getFiles('.isml|.js', '/cartridges', { skip });
const text = files.map(path => `\n${path.replace(config.sourcePath + '\\cartridges\\', '')}${attentionMark(path)}`);
const outputFolder = './output'

if (!fs.existsSync(outputFolder)){
    fs.mkdirSync(outputFolder);
}
fs.writeFile('./output/fileNames.txt', text ,(err)=>{
    if (err){
        throw new Error('CHECKER ERROR: Unable to write filenames to file fileNames.txt');
    }
})