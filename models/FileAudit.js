class FileAudit {
    constructor(file) {
        this.file = file;
        this.violations = []
    }

    addViolations(violation) {
        const input = [].concat(violation);
        input.forEach(i => this.violations.push(i));
    }

    isFailed() {
        return this.violations.length > 0;
    }

    /**
     * Sets row number to each violation in violations property
     * @param {array} rowsIndexes array of indexes, each represents the position of new line in code;
     */
    defineRowsForViolations() {
        const rows = this.file.getCodeRows();
        this.violations.forEach(v => v.setRow(getViolationRow(rows, v)));
    }

    /**
     * Consolidates all found violations and file path into one string;
     * @param {string} violationsHeader description of the problem. This will be a header for all violation occurences in file
     * @param {boolean} withRows 
     */
    getFailedAuditMessage(violationsHeader, withRows=false) {
        if (withRows) {
            this.defineRowsForViolations();
        }
        const violationMessages = this.violations.map(v => v.getMsg())
        return `SOURCE: ${this.file.path}\n${violationsHeader}:\n${violationMessages.join('\n')}`
    }
}


/**
 * Compares index of current searchMatch with indexes of new lines to define in which row it is.
 * @param {array} sortedNewLinesIndexes array of numbers. Each number is position of new line in code
 * @param {Violation} violation Violation object
 */
function getViolationRow(sortedNewLinesIndexes, violation) {
    for (let i = 0; i < sortedNewLinesIndexes.length; i++) {
        if (sortedNewLinesIndexes[i + 1] > violation.index) {
            return i + 1; // adapting number as far as code rows start with 0
        }
    }
    throw new Error(`Unable to match row for violation ${this.violation.value}`);
}

module.exports = FileAudit;