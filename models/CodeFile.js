const fs = require('fs');
const {
    NEW_LINE
} = require('../util/constants');

class CodeFile {
    constructor(path) {
        this.path = path;
        this.newLines = [];
    }

    getName() {
        return this.path.replace(/^.*[\\\/]/, '')
    }

    getCode() {
        return fs.readFileSync(this.path, 'UTF-8');
    }

    /**
     * gets indexes of all new lines in code and saves it to instance newLines property
     * @returns {Array} array of indexes
     */
    setNewLinesIndexes() {
        if (this.newLines.length > 0) {
            return;
        }
        const code = this.getCode();
        const newLineRegExp = new RegExp(NEW_LINE, 'gm');
        const result = [];
        let found
        while (found = newLineRegExp.exec(code)) {
            newLineRegExp.lastIndex += 2 // as far as new line has no length, regExp last Index updated manually. Otherwize it will always find first match
            result.push(found.index)
        }
        this.newLines = result;
}
    
}

module.exports = CodeFile;