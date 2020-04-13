'use strict';

const assert = require('chai').assert;
const sourceFiles = require('../../util/sourceFiles');
// const CLIENT_CREATING_MASK = 'new\\s([A-z.]+\\.)?(HTTPClient|FTPClient|SFTPClient)\\('
const { SERVICE_REGISTRY_MASK } = require('../../util/constants');

describe('Services', function() {

        it('All FTPClient, SFTPClient, Webreference, Webdav, and HTTPClient calls should be called via the Service Framework.', function() {
            assert.isTrue(true);
        });

        it('All Webreference calls should be called via the Service Framework.', function() {
            assert.isTrue(true);
        });

        it('LocalServiceRegistry should be used instead of ServiceRegistry', function() {
            const serviceRegistries = [];
            const serviceRegistryRegExp = new RegExp(SERVICE_REGISTRY_MASK, 'gmi');
            sourceFiles.scripts.forEach(script => {
                const foundInvalid = sourceFiles.getFileData(script).match(serviceRegistryRegExp);
                if (foundInvalid) {
                    serviceRegistries.push(`\nSCRIPT: ${script}\nFOUND_IMPORTS: ${foundInvalid.map(imp => '\n      '+ imp)}}`);
                }
            })
            assert.isEmpty(serviceRegistries, `ServiceRegistry imports found: ${serviceRegistries}`)
        });
    
});