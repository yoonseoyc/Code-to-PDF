function buildBody(fileName, highlightedCode, cssStyle, hljsStyle, fontFaces) {
    return `<!DOCTYPE html>
<html>
    <head>
        <style>
            ${cssStyle}
            ${hljsStyle}
            ${fontFaces}
        </style>
    </head>
    <body>
        <div class="file-title">${fileName}</div>
        <hr>
        <pre>${highlightedCode}</pre>
        <hr>
    </body>
</html>`;
}

export {buildBody};