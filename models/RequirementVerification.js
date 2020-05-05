const FileAudit = require('./FileAudit');

/**
 * Public class that incapsulates logic of collecting and representing detailed information about all found errors
 */
class RequirementVerification {
    constructor(){
        this.failedAudits = []
        this.currentAudit = null;
    }

    static perform(files, callBack) {
        return new RequirementVerification()
            .doVerification(files, callBack);
    }

    /**
     * creates FileAudit object for provided file and saves as current check. 
     * Until 'saveSelectedFileAuditResult' is called all found violations will be put in this fileAudit
     * @param {CodeFile} codeFile 
     */
    selectFileForAudit(codeFile) {
        this.currentAudit = new FileAudit(codeFile);
    }

    /**
     * If any errors found, adds current audit to failed audit list
     * Clears current file audit 
     */
    saveSelectedFileAuditResult() {
        if (this.currentAudit.isFailed()) {
            this.failedAudits.push(this.currentAudit)
        }
        this.currentAudit = null;
    }

    doVerification(files, callBack){
        files.forEach(file => {
            this.selectFileForAudit(file);
            callBack(file, this);
            this.saveSelectedFileAuditResult();
        });
        return this;
    }

    /**
     * Saves all provided violations to current file audit.
     * @param {array} violations array of objects with mandatory parameters: value, index
     */
    addMultipleViolations(violations) {
        violations.forEach(v => {
            this.currentAudit.addViolation(v.value, v.index);
        })
        
    }

    /**
     * Saves single violation to current file audit
     * @param {string} value 
     * @param {number} index 
     */
    addViolation(value, index) {
        this.currentAudit.addViolation(value, index)
    }

    /**
     * @returns {boolean} if any errors were found.
     */
    isSuccessul() {
        return this.failedAudits.length === 0;
    }

    /**
     * Consolidates whole information about errors in all audited files into one string
     * @param {string} issueDescription this will be a first line after which detailed information for each file will follow
     */
    generateErrorMessage(issueDescription, options) {
        const withRows = options && options.hasOwnProperty('withRows') ? options.withRows : false;
        const beautify = options && options.hasOwnProperty('beautify') ? options.beautify : true;
        const failedAuditReports = this.failedAudits.map(audit => (
            audit.getFailedAuditMessage(withRows, beautify))
            );

        return `${issueDescription}:\n${failedAuditReports.join('\n\n')}\n`
    }


}

module.exports = RequirementVerification;