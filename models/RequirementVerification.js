const FileAudit = require('./FileAudit');

class RequirementVerification {
    constructor(verifiedIssue){
        this.verifiedIssue = verifiedIssue;
        this.failedAudits = []
        this.currentAudit = null;
    }

    selectFileForAudit(codeFile) {
        this.currentAudit = new FileAudit(codeFile);
    }

    saveSelectedFileAuditResult() {
        if (this.currentAudit.isFailed()) {
            this.failedAudits.push(this.currentAudit.getFailedAuditMessage(this.verifiedIssue.toUpperCase()))
        }
        this.currentAudit = null;
    }

    addViolations(violation) {
        this.currentAudit.addViolations(violation);
    }

    isSuccessul() {
        return this.failedAudits.length === 0;
    }

    generateErrorMessage(issueDescription) {
        return `${issueDescription}:\n${this.failedAudits.join('\n\n')}\n`
    }
}

module.exports = RequirementVerification;