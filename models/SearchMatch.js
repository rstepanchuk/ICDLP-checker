const {
    NEW_LINE
} = require('../util/constants');

/**
 * gets indexes of all new lines in code
 * @param {string} code 
 * @returns {Array} array of indexes
 */
const findAllNewLinesIndexes = code => {
    const newLineRegExp = new RegExp(NEW_LINE, 'gm');
    const result = [];
    let found
    while (found = newLineRegExp.exec(code)) {
        newLineRegExp.lastIndex += 2 // as far as new line has no length, regExp last Index updated manually. Otherwize it will always find first match
        result.push(found.index)
    }
    return result;
}

class SearchMatch {
    constructor(fullMatch, source, index) {
        if (!fullMatch || !source || !index) {
            throw new Error(`Invalid arguments for SearchMatch creation fullMatch:${fullMatch} source:${source} index: ${index}`)
        }
        this.fullMatch = fullMatch;
        this.source = source;
        this.index = index;
        this.row = -1;
    }

    /**
     * As far as split code into rows is a high-cost operation static function is implemented to get rows
     * of all matches at once rather than calculate row for each match as separate function
     * @param {string} code 
     * @param {array} searchMatchArr array of SearchMatchInstances
     */
    static defineRowsForMatches(code, searchMatchArr) {
        const rows = findAllNewLinesIndexes(code);
        searchMatchArr.forEach(match => match._defineRow(rows));
        return searchMatchArr;
    }

    /**
     * Compares index of current searchMatch with indexes of new lines to define in which row it is.
     * Saves result to instance property 'row'
     * @param {array} sortedNewLinesIndexes array of numbers. Each number is position of new line in code
     */
    _defineRow(sortedNewLinesIndexes) {
        for (let i = 0; i < sortedNewLinesIndexes.length; i++) {
            if (sortedNewLinesIndexes[i + 1] > this.index) {
                this.row = i + 1; // adapting number as far as code rows start with 0
                return;
            }
        }
        throw new Error('Unable to match row with occurence');
    }
}

module.exports = SearchMatch;