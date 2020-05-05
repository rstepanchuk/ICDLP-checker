
/**
 * Class that should not be exposed in test or utils files.
 * Represents found SFCC rule violation
 */
class Violation {
    constructor(value, index) {
        if (!value || (!index && index !==0 )) {
            throw new Error(`One of mandatory parameters for Violation creation weren't provided. value:${value} index: ${index}`)
        }
        this.value = value;
        this.index = index;
        this.row = -1;
    }

    getMsg(beautify = true) {
        const displayValue = beautify ? this.value.replace(/\s+/gm, ' ').trim() : this.value;
        if (this.row === -1) {
            return `   ${displayValue}`;
        } 
        return `   row ${this.row}: ${displayValue}`
    }

    setRow(row) {
        this.row = row;
    }


}

module.exports = Violation;