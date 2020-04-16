'use strict';

const assert = require('chai').assert;
const sourceFiles = require('../../util/sourceFiles');
const docExtractor = require('../../util/docExtractor');
const config = require('../../util/config');

const {
    SFRA_SPECIFIC_VERSTION_MASK, 
    SFRA_ANY_VERSION_MASK,
    PLATFORM_SPECIFIC_VERSION_MASK,
    PLATFORM_ANY_VERSION_MASK,
    SITEGEN_SPECIFIC_VERSION_MASK,
    SITEGEN_ANY_VERSION_MASK,
    COMPATIBILITY_SPECIFIC_VERSION_MASK,
    COMPATIBILITY_ANY_VERSION_MASK,
    MINIMAL_AVAILABILITY_SECTION_LENGTH,
    CARTRIDGE_VERSION
 } = require('../../util/constants');


const alternativeFound = (tartgetText, searchMask) => {
    const otherFound = new RegExp(searchMask,'m')
        .exec(tartgetText);
    return otherFound ? `Instead was found: ${otherFound[0]}\n` : '';
}

describe('Documentation', function() {

        it('Version numbers must be in XX.X.X [year].[partner version of the year].[bugfix] format', function() {
            const numbers = config.version.split('.')
            assert.equal(3, numbers.length, `version ${config.version} is expected to be in xx.x.x format`)
            const currentYear = new Date().getFullYear() - 2000;
            assert.equal(parseInt(numbers[0]), currentYear, `CHECKER CONFIGURATION WARNING: Version first digits ${config.version}. should be current year "${currentYear}" even if certification was submitted in previous`);
            assert.isTrue(parseInt(numbers[1]) > 0, 'CHECKER CONFIGURATION WARNING: Patner version of the year should be at least 1');
        });

        it('Valid version numbers must be included in the repository\'s package.json', function() {
            assert.isDefined(sourceFiles.json.version, 'version is missing in project package.json\n');
            assert.equal(config.version, sourceFiles.json.version, `version in project package.json is ${sourceFiles.json.version} while expected ${config.version}\n`);
        });

        it(`Valid cartridge version number ${config.version} should be on a title page of the guide`, async function() {
            const guides = await docExtractor.getGuides();
            const version = new RegExp(CARTRIDGE_VERSION, 'm')
            guides.forEach(g => {
                const fp = g.getFirstPage();
                assert.isTrue(version.test(fp), `Cartridge version ${config.version} wasn't found in guide '${g.name}'\n ${alternativeFound(fp,'(v|v.|version)\\D*(\\d{2}\\.\\d\\.\\d)')}`)
            })            
        });

        it(`SFRA version number ${config.sfra} should be on a title page of the guide`, async function() {
            const guides = await docExtractor.getGuides('sfra');
            guides.forEach(g => {
                const prefixRegEx = new RegExp(SFRA_SPECIFIC_VERSTION_MASK,'m');
                const tartgetText = g.getFirstPage();
                assert.isTrue(prefixRegEx.test(tartgetText), `sfra ${config.sfra} mentioning was not found on title page of file '${g.name}'\n ${alternativeFound(tartgetText, SFRA_ANY_VERSION_MASK)}`)  
            })           
        });

        it(`Сompatibility section should contain SFCC platform version ${config.platform}`, async function() {
            const guides = await docExtractor.getGuides();
            guides.forEach(g => {
                const prefixRegEx = new RegExp(PLATFORM_SPECIFIC_VERSION_MASK,'m');
                const tartgetText = g.getSection('compatibility');

                assert.isTrue(prefixRegEx.test(tartgetText), `version ${config.platform} mentioning was not found in compatibility section of file '${g.name}'\n ${alternativeFound(tartgetText, PLATFORM_ANY_VERSION_MASK)}`)  
            })   
        });

        it(`SFRA guides Сompatibility section should contain sfra version ${config.sfra}`, async function() {
            const guides = await docExtractor.getGuides('sfra');
            guides.forEach(g => {
                const prefixRegEx = new RegExp(SFRA_SPECIFIC_VERSTION_MASK,'m');
                const tartgetText = g.getSection('compatibility');
                assert.isTrue(prefixRegEx.test(tartgetText), `sfra ${config.sfra} mentioning was not found in compatibility section of file '${g.name}'\n ${alternativeFound(tartgetText, SFRA_ANY_VERSION_MASK)}`)  
            })   
        });

        it(`Controllers guides Сompatibility section should contain SiteGen version ${config.genesis}`, async function() {
            const guides = await docExtractor.getGuides('controllers');
            guides.forEach(g => {
                const prefixRegEx = new RegExp(SITEGEN_SPECIFIC_VERSION_MASK,'m');
                const tartgetText = g.getSection('compatibility');
                assert.isTrue(prefixRegEx.test(tartgetText), `SiteGen version ${config.genesis} mentioning was not found in compatibility section of file '${g.name}'\n ${alternativeFound(tartgetText, SITEGEN_ANY_VERSION_MASK)}`)  
            })   
        });

        it(`Сompatibility section should contain compatibility mode ${config.compatibility}`, async function() {
            const guides = await docExtractor.getGuides();
            guides.forEach(g => {
                const prefixRegEx = new RegExp(COMPATIBILITY_SPECIFIC_VERSION_MASK,'m');
                const tartgetText = g.getSection('compatibility');
                assert.isTrue(prefixRegEx.test(tartgetText), `Compatibility ${config.compatibility} mentioning was not found in compatibility section of file '${g.name}'\n ${alternativeFound(tartgetText, COMPATIBILITY_ANY_VERSION_MASK)}`)  
            })   
        });

        it(`Availability section should describe what merchants should expect when the partner's service is down`, async function() {
            const guides = await docExtractor.getGuides();
            guides.forEach(g => {
                const targetText = g.getSection('availability');
                assert.isAbove(targetText.length, MINIMAL_AVAILABILITY_SECTION_LENGTH, `Please, provide explanation (at least ${MINIMAL_AVAILABILITY_SECTION_LENGTH} symbols) of the situation when service is down in guide ${g.name}\n CURRENT CONTENT: ${targetText}\n`)
            })   
        });


        it(`Cartridge overview how to quickly ensure that cartridge is installed and working properly should be provided as separate doc`, async function() {
            const docs = await docExtractor.getDocs();
            assert.isTrue(docs.some(d => d.type === 'overview'), `No cartridge overview/validation was found among files:\n ${docs.map(d => d.name + '\n')}`)
        });
    
});
