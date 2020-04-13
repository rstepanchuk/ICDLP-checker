'use strict';

const pkg = require('../package.json');

module.exports = {
    sourcePath: pkg.configurations.sourceProject.replace('/','\\'),
    platform: pkg.configurations.platformVersion,
    compatibility: pkg.configurations.compatibility,
    version: pkg.configurations.cartridgeVersion,
    sfra: pkg.configurations.sfraVersion,
    genesis: pkg.configurations.genesisVersion,
    ChgCartridgesExcluded: pkg.configurations.excludeChangesCartridges
};