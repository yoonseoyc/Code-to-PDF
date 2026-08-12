function buildBody(fileName, codeHTML, cssStyle, hljsStyle, fontFaces, options, lineNumberColor) {
    const showTitle = options.fileTitle !== false;
    const titleOption = showTitle ? `<div class="file-title">${fileName}</div>` : '';

    return `<!DOCTYPE html>
<html>
    <head>
        <style>
            ${cssStyle}
            ${hljsStyle}
            ${fontFaces}
            .line-number { color: ${lineNumberColor} !important; }
        </style>
    </head>
    <body>
        ${titleOption}
        <hr class="divider-start">
        ${codeHTML}
        <hr class="divider-end">
    </body>
</html>`;
}

function buildHeader(filePath, fileName, languageName, fontFaces, options) {
    const showPath = options.headerPath !== false;
    const showLang = options.headerLang !== false;
    const headerLeft = showPath ? `<span>${filePath.replace(fileName, '')}<b style="color:#696969;">${fileName}</b></span>`: '<span></span>';
    const headerRight = showLang ? `<span>${languageName}</span>`: '<span></span>';

    return `<style>${fontFaces}</style>
<div style="
    display: flex;
    width: 100%;
    padding: 0 0.385in;
    justify-content: space-between;
    print-color-adjust: exact;
    font-family: 'Inclusive Sans LOCAL', 'Courier New', Courier, monospace;
    font-weight: 500;
    color: #808080;
    font-size: 9.5px;
">
    ${headerLeft}
    ${headerRight}
</div>`;
}

function buildFooter(fileName, fontFaces, options) {
    const showName = options.footerName !== false;
    const showPage = options.footerPage !== false;
    const footerLeft = showName ? `<span>${fileName}</span>`: '<span></span>';
    const footerRight = showPage ? `<span><span class="pageNumber"></span> / <span class="totalPages"></span></span>`: '<span></span>';
    return `<style>${fontFaces}</style>
<div style="
    display: flex;
    width: 100%;
    padding: 0 0.385in;
    justify-content: space-between;
    print-color-adjust: exact;
    font-family: 'Inclusive Sans LOCAL', 'Courier New', Courier, monospace;
    font-weight: 500;
    color: #808080;
    font-size: 9.5px;
">
    ${footerLeft}
    ${footerRight}
</div>`;
}

export {buildBody, buildHeader, buildFooter};