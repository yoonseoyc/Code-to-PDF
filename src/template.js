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

export {buildBody};