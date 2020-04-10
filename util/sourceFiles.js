'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./config');

const sourcePath = config.sourcePath;
const SKIPPED_BY_DEFAULT = ['node_modules'];

const getFiles = (namePart, relpath, skippedFolders) => {
    const dirPath = relpath ? sourcePath + relpath : sourcePath;
    return _getFiles(namePart, dirPath, skippedFolders)
}

const endingsDoMatch = (filename, namePart) => {
    if (!namePart) {
        return true;
    }
    const endings = namePart.split('|');
    if (endings.length === 1) {
        return filename.endsWith(namePart)
    }
    return endings.some(end=>filename.endsWith(end))
}

const _getFiles = (namePart, dirPath, skippedFolders =[]) => {
    const skipped = [...SKIPPED_BY_DEFAULT];
    skippedFolders.forEach(fold => {
        if (!skipped.some(dir => dir === fold)){
            skipped.push(fold)
        }
    });
    const result = [];
    const files = fs.readdirSync(dirPath);
    files
        .filter(f=> !skipped.some(dir=>dir===f))
        .map(f=>path.join(dirPath, f))
        .forEach(f=>{
            if (fs.statSync(f).isDirectory()){
                _getFiles(namePart, f, skippedFolders).forEach(r=>result.push(r))
            } else if (endingsDoMatch(f, namePart)) {
                result.push(f)
            }
        })
    return result;
}

const getJSON = () => {
    const json = require(path.join('../', sourcePath, 'package.json'));
    return Object.assign({}, json);
}

const getFileData = (filePath) => {
    return fs.readFileSync(filePath, 'UTF-8');
}

const sortCartridgesByVersions = (cartrideArr) => {
    const sfraSubstr = ['sfra']
    const controllersSubstr = ['controllers', 'sg_changes', '_sg']
    const pipelinesSubstr = ['pipelines']

    const result = {
        sfra: [],
        controllers: [],
        pipelines: [],
        common: []
    }
    cartrideArr.forEach(cartridge=>{
        const name = cartridge.toLowerCase();
        if(sfraSubstr.some(substr=>name.includes(substr))) {
            result.sfra.push(name)
        } else if(controllersSubstr.some(substr=>name.includes(substr))) {
            result.controllers.push(name)
        } else if(pipelinesSubstr.some(substr=>name.includes(substr))) {
            result.pipelines.push(name)
        } else {
            result.common.push(name);
        }
    })

    return result;
}

const getCartrides = () => {
    const cartridges = fs.readdirSync(sourcePath + '/cartridges');
    return sortCartridgesByVersions(cartridges);
}


module.exports.scripts = getFiles('.js|.ds', '/cartridges',['static','client'])
module.exports.json = getJSON();
module.exports.cartridges = getCartrides();
module.exports.getFiles = getFiles;
module.exports.getFileData = getFileData;

