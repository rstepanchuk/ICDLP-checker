'use strict';

const StreamZip = require('node-stream-zip');
const DocumentationFile = require('../models/DocumentationFile');
const { TABLE_OF_CONTENTS_MAKS } = require('./constants');

const sourceFiles = require('./sourceFiles');

/**
 * Transforms docx file into object with name and content fields
 * @param {string} filePath file path
 */
const _readDocFile = (filePath) => new Promise((resolve, reject)=>{
    const zip = new StreamZip({
        file: filePath,
        storeEntries: true
    })
    zip.on('ready', () => {
        const chunks = [];
        zip.stream('word/document.xml', (err, stream) => {
            if (err) {
            reject(err);
            }
            stream.on('data', function (chunk) {
            chunks.push(chunk);
            })
            stream.on('end', function () {
                const content = Buffer.concat(chunks);
                zip.close();
                const result = new DocumentationFile(filePath.split('\\').pop());
                const components = content.toString().split('<w:t');
                for (let i = 0; i < components.length; i++) {
                    const tags = components[i].split('>');
                    const text = tags[1].replace(/<.*$/, '');
                    result.content += text + ' ';
                }
                resolve(result);
            })
        });
    });
})

const getGuides = (docArray, version) => {
    let result = [];
    switch (version) {
        case 'sfra':
            result = docArray.filter(doc=>doc.type === 'guide' && (doc.version === 'sfra' || doc.version === 'mixed'));
            break;    
        case 'controllers':
            result = docArray.filter(doc=>doc.type === 'guide' && (doc.version === 'controllers' || doc.version === 'mixed'));
            break;        
        default:
            result = docArray.filter(doc=>doc.type === 'guide');
    }
    if (result.length === 0) {
        throw new Error(`No guides ${version || 'any'} version were found`)
    }
    return result;
}

const defineDocType = (docObject) => {
    const name = docObject.name;
    const text = docObject.content;
    const tableOfContRegEx = new RegExp(TABLE_OF_CONTENTS_MAKS, 'm')
    if (name.includes('guide') ||
        ((tableOfContRegEx.test(text) || text.includes('contents')) && text.includes('implementation guide'))) {
        return 'guide'
    }

    if (name.includes('test')) {
        return 'test cases'
    }

    if (name.includes('overview') || name.includes('validation') ||
    (text.includes('validation') && text.indexOf('validation') < 10)) { // most of cartridges overview start with "Validation"
        return 'overview'
    }
    return null;
}

const defineGuideVersion = (docObject) => {
    const name = docObject.name;
    const text = docObject.content;

    const traits = {
        sfra: false,
        controllers: false,
        pipelines: false
    }

    sourceFiles.cartridges;

    if (name.includes('controller') || name.includes('sgjc')) {
        traits.controllers = true;
    }

    if (name.includes('pipeline')) {
        traits.pipelines = true;
    }

    if (name.includes('sfra')) {
        traits.sfra = true
    }

    if (!traits.sfra) {
        traits.sfra = sourceFiles.cartridges.sfra.every(c=>text.includes(c));
    }

    if (!traits.sfra) {
        traits.sfra = docObject.getFirstPage().includes('sfra')
    }

    if (!traits.controllers) {
        traits.controllers = sourceFiles.cartridges.controllers.length > 0 && 
            sourceFiles.cartridges.controllers.every(c=>text.includes(c));
    }

    if (!traits.controllers) {
        traits.controllers = docObject.getFirstPage().includes('controller')
    }
    
    if (!traits.controllers) {
        const customControllersCode = new RegExp('custom\\scode\\s?\\([^)]*controller[^)]*\\)', 'gm')
        const contents = docObject.getTableOfContents()
        traits.controllers = customControllersCode.test(contents);
    }

    if (!traits.pipelines) {
        traits.pipelines = sourceFiles.cartridges.pipelines.length > 0 && sourceFiles.cartridges.pipelines.every(c=>text.includes(c))
    }

    if (!traits.sfra && !traits.controllers && !traits.pipelines) {
        traits.pipelines = docObject.getFirstPage().includes('pipeline')
    }

    if (traits.sfra) {
        return traits.controllers ? 'mixed' : 'sfra'
    }

    if (traits.controllers) { // even if guide covers both controllers and pipelines, guide is considered as controllers, cause pipelines are obsolette and ignored during certification
        return 'controllers'
    }

    if (traits.pipelines) {
        return 'pipelines'
    }
    throw new Error(`Unable to define cartridge version for ${name}` );
}

const sourceDocs = sourceFiles.getFiles('.docx', '/documentation');
if (sourceDocs.length === 0) {
    throw new Error("Documenation files were not found")
}

const docs = Promise.all(sourceDocs.map(file => _readDocFile(file.path)))
    .then(result => {
        const spaces = /\s{2,100}|\t{1,100}|\n{1,100}/gm;
        const brokenNum =/(\d{1,4})\s?\.\s?(\d{1,4})(?:\s?(\.)\s?(\d{1,4}))?/ // sometimes unneccessary spaces appear in xx.xx.xx numbers eg 'version 20 .1.0'
        result.forEach(doc=>{
            doc.name = doc.name.toLowerCase();
            doc.content = doc.content.toLowerCase()
                .replace(spaces, ' ')
                .replace(brokenNum, '$1.$2$3$4');
            doc.type = defineDocType(doc)
            if (doc.type === 'guide') {
                doc.version = defineGuideVersion(doc);
            }
        });
        return result;
    });

module.exports.getDocs = () => docs;
module.exports.getGuides = async (version) => getGuides(await docs, version).filter(doc => doc.version != 'pipelines');