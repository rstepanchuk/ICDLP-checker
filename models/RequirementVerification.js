const FileAudit = require('./FileAudit');

/**
 * Public class that incapsulates logic of collecting and representing detailed information about all found errors
 * @param {string} verifiedIssue short title which represents an issue verification is aimed to check.
 */
class RequirementVerification {
    constructor(verifiedIssue){
        this.verifiedIssue = verifiedIssue;
        this.failedAudits = []
        this.currentAudit = null;
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
     * If any errors found, consolidates current audit result in one string and saves it to failedAudits property
     * Clears current file audit 
     * @param {boolean} withRows 
     * @param {boolean} beautify 
     */
    saveSelectedFileAuditResult(withRows=false, beautify=true) {
        if (this.currentAudit.isFailed()) {
            this.failedAudits.push(this.currentAudit.getFailedAuditMessage(this.verifiedIssue.toUpperCase(), withRows, beautify))
        }
        this.currentAudit = null;
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
    generateErrorMessage(issueDescription) {
        return `${issueDescription}:\n${this.failedAudits.join('\n\n')}\n`
    }
}

module.exports = RequirementVerification;