'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./config');

const sourcePath = config.sourcePath;
const alwaysSkippedFolders = ['node_modules'];
if (config.ChgCartridgesExcluded) {
    alwaysSkippedFolders.push('*changes')
}

const getFiles = (namePart, path, options) => {
    let toSkip = [];
    let toPick = [];
    if (options) {
        toSkip = options.skip || [];
        toPick = options.pick ? options.pick.map(name => `\\${name.replace('/','\\')}\\`) : [];
    }
    const dirPath = path ? sourcePath + path : sourcePath;
    return _getFiles(namePart, dirPath, toSkip, toPick)
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

const folderIsSkipped = (folderName, skippedArr) => {
    for (const toSkip of skippedArr) {
        if (toSkip === folderName) {
            return true;
        }
        if (toSkip.includes('*')) {
            const regExp = new RegExp(`^${toSkip.replace('*','.*')}$`)
            if (regExp.test(folderName)) {
                return true;
            }
        }
    }
    return false;
}

const _getFiles = (namePart, dirPath, skippedFolders =[], targetFolders=[]) => {
    const skipped = [...alwaysSkippedFolders];
    skippedFolders.forEach(fold => {
        if (!skipped.some(dir => dir === fold)){
            skipped.push(fold)
        }
    });
    const result = [];
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
            const filePath = path.join(dirPath, file)
            if (fs.statSync(filePath).isDirectory()){
                if (!folderIsSkipped(file, skipped)) {
                    _getFiles(namePart, filePath, skippedFolders).forEach(r=>result.push(r))
                }
            } else if (endingsDoMatch(file, namePart)) {
                result.push(filePath)
            }
        })
    if (targetFolders.length > 0) {
        return result.filter(path => targetFolders.some(folder => path.includes(folder)))
    }
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


module.exports.scripts = getFiles('.js|.ds', '/cartridges',{skip: ['static','client']});
module.exports.json = getJSON();
module.exports.cartridges = getCartrides();
module.exports.getFiles = getFiles;
module.exports.getFileData = getFileData;

