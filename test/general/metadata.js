var assert = require('chai').assert;
var sourceFiles = require('../../util/sourceFiles');

describe('Metadata', function() {

    context('jobs.xml', function(){
        const jobData = sourceFiles.getFiles('jobs.xml').map(f => sourceFiles.getFileData(f)).join('');

        it('Default job metadata site should be RefArch', function() {
            var siteMentionings = [];
            const siteId = new RegExp(/site-id\s?=\s?"([^"]+)"/gm)
            while (result = siteId.exec(jobData)) {
                siteMentionings.push(result[1])
            }
          assert.isTrue(siteMentionings.every(mentioning => mentioning==='RefArch'), `Job metatadata site-id refers to: ${siteMentionings}\n`);
        });

        it('Job modules should not refer to .ds files', function() {
            var modulePaths = [];
            const jobPath = new RegExp(/<parameter name="ExecuteScriptModule.Module">((\w|\/|\.)*)<\/parameter>/gm)
            while (result = jobPath.exec(jobData)) {
                modulePaths.push(result[1])
            }
          assert.isTrue(modulePaths.every(path => !path.endsWith('.ds')), `\n Some module paths in job.xml refer to .ds files. Current paths: ${modulePaths.map(p => '\n' + p)}\n`);
        });
    });
    
});