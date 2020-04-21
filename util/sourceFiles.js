'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./config');

const sourcePath = config.sourcePath;
const alwaysSkippedFolders = ['node_modules', 'app_storefront_core', 'app_storefront_controllers'];
if (config.ChgCartridgesExcluded) {
    alwaysSkippedFolders.push('*changes')
}

const getCartrides = () => {
    const cartridges = fs.readdirSync(sourcePath + '\\cartridges');
    return sortCartridgesByVersions(cartridges);
}

const getFiles = (namePart, path, options) => {
    let toSkip = [];
    let toPick = [];
    if (options) {
        toSkip = options.skip || [];
        toPick = options.pick ? options.pick.map(name => `\\${name.replace(/\//g,'\\')}\\`) : [];
    }
    const dirPath = path ? sourcePath + path : sourcePath;
    return _getFiles(namePart, dirPath, toSkip, toPick)
}

const getSpecificVersionFiles = (namePart, version, options) => {
    const versions = [].concat(version); // in order to be able to accept both single value or array of versions
    const cartridges = getCartrides();
    const targetCartridges = versions.reduce((result, v) => {
        if (!cartridges[v]) {
            throw new Error (`No cartridge version ${v} found`);
        }
        return result.concat(cartridges[v]);
    }, []);
    return targetCartridges.reduce((files, vers) => {
        const path = `\\cartridges\\${vers}`
        return files.concat(getFiles(namePart, path, options));
    }, [])
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
            const regExp = new RegExp(`^${toSkip.replace(/\*/g,'.*')}$`)
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
    const developmentSubstr = ['app_storefront'];

    const result = {
        sfra: [],
        controllers: [],
        pipelines: [],
        common: [],
        development: []
    }
    cartrideArr.forEach(cartridge=>{
        const name = cartridge.toLowerCase();
        if (developmentSubstr.some(substr => name.includes(substr))) {
            result.development.push(name)
        } else if(sfraSubstr.some(substr => name.includes(substr))) {
            result.sfra.push(name)
        } else if(controllersSubstr.some(substr => name.includes(substr))) {
            result.controllers.push(name)
        } else if(pipelinesSubstr.some(substr => name.includes(substr))) {
            result.pipelines.push(name)
        } else {
            result.common.push(name);
        }
    })

    return result;
}

const getFileName = path => path.replace(/^.*[\\\/]/, '');


module.exports.scripts = getFiles('.js|.ds', '/cartridges',{ skip: ['static','client'] });
module.exports.styles = getFiles('.css|.scss', '/cartridges', { pick: ['css', 'scss'] });
module.exports.clientScripts = getFiles('.js', '/cartridges', { pick: ['client/default/js', 'js/pages', 'static'] });
module.exports.json = getJSON();
module.exports.cartridges = getCartrides();
module.exports.getFiles = getFiles;
module.exports.getSpecificVersionFiles = getSpecificVersionFiles;
module.exports.getFileData = getFileData;
module.exports.getFileName = getFileName;
