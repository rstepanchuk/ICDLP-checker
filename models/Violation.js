class Violation {
    constructor(value, index) {
        if (!value || !index) {
            throw new Error(`Invalid arguments for SearchMatch creation fullMatch:${value} index: ${index}`)
        }
        this.value = value;
        this.index = index;
        this.row = -1;
    }

    getMsg(beautify = true) {
        const displayValue = beautify ? this.value.replace(/\s+/gm, ' ').trim() : this.value;
        if (this.row === -1) {
            return displayValue;
        } 
        return `row ${this.row}: ${displayValue}`
    }

    setRow(row) {
        this.row = row;
    }


}

module.exports = Violation;