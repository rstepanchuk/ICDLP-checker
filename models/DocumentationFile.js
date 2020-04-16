
const CONTENT_BULLET_POINT_MAKS = '([^0-9\\s\\t.]\\D+)\\d'; // at least 2 non-digits followed by digit

class DocumenationFile {
    constructor(name){
        this.name = name;
        this.content = '';
        this.type = null;
        this.version = null;
        this.contentsStart = 0;
        this.mainStart = 0;
    }

    getContentsStartIndex (isHeaderIncluded=true){
        if (this.contentsStart !== 0) {
            return this.contentsStart;
        }
        let headerLength = 'tableofcontents'.length
        let start = this.content.indexOf('tableofcontents');
        if (start === -1) {
            start = this.content.indexOf('contents');
            headerLength = 'contents'.length;
        }
        if (start === -1) {
            throw new Error('No table of contents section found (or table of contents doesn\' have header')
        }
        return isHeaderIncluded ? start : start + headerLength;
    }

    getMainStartIndex (){
        if (this.mainStart !== 0) {
            return this.mainStart;
        }
        const startIndex = this.getContentsStartIndex(false);
        let tabOfContents = this.content.substring(startIndex);
        const bpRegex = new RegExp(CONTENT_BULLET_POINT_MAKS, 'm')
        const firstPoint = bpRegex.exec(tabOfContents)[1] // finds first bullet point in table of contents
        const fpRegExp = new RegExp(firstPoint, 'gm');
        fpRegExp.exec(this.content); // first match - bullet point found in table of contents
        const match2 = fpRegExp.exec(this.content); // second match - header of relevant clause found in text
        return match2.index;
    }

    getFirstPage () {
        const endOfPage = this.getContentsStartIndex(this.content);
        return this.content.substring(0, endOfPage)
    }

    getTableOfContents () {
        const startIndex = this.getContentsStartIndex(false);
        const endIndex = this.getMainStartIndex();
        return this.content.substring(startIndex, endIndex)
    }

    getMainContent () {
        return this.content.substring(this.getMainStartIndex());
    }

    getSection(sectionName) {
        const table = this.getTableOfContents();
        const bpRegex = new RegExp(CONTENT_BULLET_POINT_MAKS, 'gm');
        let currentSection;
        let nextSection; 
        let bulletPoint;
        const sections = [];
        let found = false;
        while ((bulletPoint = bpRegex.exec(table)) && !found) {
            const curName = bulletPoint[1];
            if (currentSection) { 
                nextSection = curName;
                found = true;
            } else if (curName.includes(sectionName.toLowerCase())) {
                currentSection = curName;
            } else {
                sections.push(curName) // latest section before target will be used further in search to reduce chance of coincident match
            }
        }

        if (!currentSection) {
            throw new Error(`Section '${sectionName}' wasn't found. One of the reasons may be that it's not mentioned in table of content`)
        }

        const mainContent = this.getMainContent();        
        const sectionBeforeTargetIdx = mainContent.indexOf(sections.pop()); // to reduce chance of coincident happening of section name in code, search will start from section before our target 
        const startIndex = mainContent.indexOf(currentSection, sectionBeforeTargetIdx) + sectionName.length;
        const endIndex = mainContent.indexOf(nextSection, sectionBeforeTargetIdx);        

        return (mainContent.substring(startIndex, endIndex))
    }

}

module.exports = DocumenationFile;