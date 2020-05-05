const Violation = require('./Violation');

/**
 * Class that should not be exposed in test or util files. 
 * Responsible for collecting and representing found errors data within specific file with code.
 */
class FileAudit {
    constructor(file) {
        this.file = file;
        this.violations = []
    }

    addViolation(value, index) {
        this.violations.push(new Violation(value, index));
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
     * @param {boolean} withRows 
     */
    getFailedAuditMessage(withRows=false, beautify=true) {
        if (withRows) {
            this.defineRowsForViolations();
        }
        const violationMessages = this.violations.map(v => v.getMsg(beautify))
        return `SOURCE: ${this.file.path}\n${violationMessages.join('\n')}`
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
    return sortedNewLinesIndexes.length + 1; // if violation index is higher than index of the last line, this means, that it is in the last line
}

module.exports = FileAudit;