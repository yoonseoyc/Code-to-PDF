function buildBody(fileName, code) {
    return `<!DOCTYPE html>
<html>
    <head>
    </head>
    <body>
        <div class="file-title">${fileName}</div>
        <hr>
        <pre>${code}</pre>
        <hr>
    </body>
</html>`;
}

export {buildBody};