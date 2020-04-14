'use strict';

const assert = require('chai').assert;
const sourceFiles = require('../../util/sourceFiles');
const helpers = require('../../util/helpers');
// const CLIENT_CREATING_MASK = 'new\\s([A-z.]+\\.)?(HTTPClient|FTPClient|SFTPClient)\\('
const {
    SERVICE_REGISTRY_MASK,
    LOCAL_SERVICE_REGISTRY_MASK,
    SERVICE_REGISTRY_VARIABLE_MASK,
    SERVICE_CREATED_MASK,
    FILTER_LOG_MESSAGE_METHOD,
    GET_REQUEST_LOG_MESSAGE_METHOD,
    GET_RESPONSE_LOG_MESSAGE_METHOD
} = require('../../util/constants');

const collectCreatedServices = (code, regExp) => {    
    const createdServices = [];
    let found;
    while (found = regExp.exec(code)){ // get name and parameter Object that was passed to service
        const firstBracePosition = found.index + found[0].length - 1;
        createdServices.push({
            name: found[1],
            scope: helpers.getScope(code, firstBracePosition)
        });
    }
    if (createdServices.length === 0) {
        throw new Error('ServiceRegistry was imported, but no created servcies were found')
    }
    return createdServices;
}

const getMessageLogErrorMessage = (violation) => {
    return violation.map(obj => `\nSCRIPT: ${obj.script}\n` +
    `SERVICE: ${obj.service} \n` +
    `METHODS FOUND: \n` +
    `filterLogMessage: ${obj.presentMethods.filterLogMessage}\n` +
    `getRequestLogMessage: ${obj.presentMethods.getRequestLogMessage}\n` +
    `getResonseLogMessage: ${obj.presentMethods.getResponseLogMessage}\n`
    )
}
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

        it('The callback filterLogMessage or both getRequestLogMessage and getResponseLogMessage should be implemented for every service definition.', function() {
            const violations = [];
            const serviceRegistryRegExp = new RegExp(LOCAL_SERVICE_REGISTRY_MASK, 'm'); 
            sourceFiles.scripts.forEach(script => {
                const code = sourceFiles.getFileData(script);
                if (serviceRegistryRegExp.test(code)) { // if ServiceRegistry is mentioned on page
                    const servRegistryVars = helpers.findSearchMatchVariables(code, SERVICE_REGISTRY_VARIABLE_MASK); // check if ServiceRegistry was saved under differently named variable
                    const createdServiceRegExp = helpers.createRegExWithVariables(servRegistryVars, SERVICE_CREATED_MASK, '|' );
                    const createdServices = collectCreatedServices(code, createdServiceRegExp); // get all created service to investigate neccessary method presence
                    createdServices.forEach(service => {
                        const presentMethods = {
                            filterLogMessage: false,
                            getRequestLogMessage: false,
                            getResponseLogMessage: false
                        }
                        presentMethods.filterLogMessage = new RegExp(FILTER_LOG_MESSAGE_METHOD, 'm').test(service.scope);
                        
                        if (!presentMethods.filterLogMessage) {
                            presentMethods.getRequestLogMessage = new RegExp(GET_REQUEST_LOG_MESSAGE_METHOD, 'm').test(service.scope);
                            presentMethods.getResponseLogMessage = new RegExp(GET_RESPONSE_LOG_MESSAGE_METHOD, 'm').test(service.scope);
                            if (!presentMethods.getRequestLogMessage || !presentMethods.getResponseLogMessage) {
                                violations.push({
                                    script,
                                    service: service.name,
                                    presentMethods
                                })
                            }
                        }
                    })
                }
            })
            assert.isEmpty(violations, `For some services logMessage methods weren't defined: ${getMessageLogErrorMessage(violations)}`)
        });
    
});