const fs = require('fs');
const {
    NEW_LINE
} = require('../util/constants');

class CodeFile {
    constructor(path) {
        this.path = path;
        this._rows = [];
    }

    getName() {
        return this.path.replace(/^.*[\\\/]/, '')
    }

    getCode() {
        return fs.readFileSync(this.path, 'UTF-8');
    }

    /**
     * defines indexes of all new lines in code and saves it to instance _newLines property
     * @returns {Array} array of indexes
     */
    _defineRowsInCode() {
        const code = this.getCode();
        const newLineRegExp = new RegExp(NEW_LINE, 'gm');
        const result = [];
        let found
        while (found = newLineRegExp.exec(code)) {
            newLineRegExp.lastIndex += 2 // as far as new line has no length, regExp last Index updated manually. Otherwize it will always find first match
            result.push(found.index)
        }
        this._rows = result;
        return result;
    }

    /**
     * returns _newLines property value, or if it's empty, defines new lines and returns result;
     * @returns {Array} array of indexes
     */
    getCodeRows() {
        return this._rows.length > 0 ? this._rows : this._defineRowsInCode()
    }
    
}

module.exports = CodeFile;