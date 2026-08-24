import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import hljs from 'highlight.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { buildBody, buildHeader, buildFooter } from './template.js';

/**
 * Font
 */

// Reads a font file and returns base64 for embedding in HTML/CSS.
function fontAsBase64(fontFilePath) {
    const fontPath = fs.readFileSync(path.resolve(import.meta.dirname, '../fonts', fontFilePath));
    return fontPath.toString('base64');
}
const FIRA_CODE_LOCAL = fontAsBase64('Fira_Code/FiraCode-VariableFont_wght.ttf');
const INCLUSIVE_SANS_LOCAL = fontAsBase64('Inclusive_Sans/InclusiveSans-VariableFont_wght.ttf');

// CSS @font-face for embedded local fonts.
const FONT_FACES = `@font-face {
    font-family: 'Fira Code LOCAL';
    src: url(data:font/ttf;base64,${FIRA_CODE_LOCAL}) format('truetype');
}
@font-face {
    font-family: 'Inclusive Sans LOCAL';
    src: url(data:font/ttf;base64,${INCLUSIVE_SANS_LOCAL}) format('truetype');
}`;

const cssStyle = fs.readFileSync(path.resolve(import.meta.dirname, './styles.css'), 'utf-8');
const hljsStyle = fs.readFileSync(path.resolve(import.meta.dirname, '../node_modules/highlight.js/styles/github.min.css'), 'utf-8');

/**
 * Code layout
 */

// Extracts the comment color from the hljs theme for line-number styling.
function getCommentColor(fallback = "#808080") {
    const regexRule = /([^{}]+)\{([^{}]+)\}/g;
    let match;
    while ((match = regexRule.exec(hljsStyle)) !== null) {
        const selectors = match[1].split(',').map((s) => s.trim());

        if (selectors.includes('.hljs-comment')) {
            const colorMatch = match[2].match(/color:\s*([^;}]+)/);
            if (colorMatch) return colorMatch[1].trim();
        }
    }
    return fallback;
}

// Builds the HTML layout for highlighted code.
function buildCodeLayout(highlightedHTML, optionLineNum) {
    return highlightedHTML.split('\n')
        .map((line, i) => {
            const lineNum = i + 1;
            return `<div class="line-row">${optionLineNum ? `<span class="line-number">${lineNum}</span>` : ''}<span class="line-code">${line || ' '}</span></div>`;
        })
    .join('\n');
}

// Draw "current / total" page number
async function addPageNumbers(pdfDocument) {
    const pages = pdfDocument.getPages();
    const font = await pdfDocument.embedFont(StandardFonts.Helvetica);
    const fontSize = 7.125;
    const { width } = pages[0].getSize();

    pages.forEach((page, index) => {
        const pageText = `${index + 1} / ${pages.length}`;
        const textWidth = font.widthOfTextAtSize(pageText, fontSize);
        page.drawText(pageText, {
            x: width - 27.72 - textWidth,
            y: 16.52,
            font,
            size: fontSize,
            color: rgb(0.5, 0.5, 0.5)
        });
    });
}

/**
 * PDF generation
 */

async function createPDF(browser, inputPath, options) {
    const filePath = path.relative(process.cwd(), inputPath);
    const fileName = path.basename(inputPath);
    const code = fs.readFileSync(inputPath, 'utf-8');
    
    const fileExt = path.extname(inputPath).slice(1);
    const language = hljs.getLanguage(fileExt) ? fileExt : 'plaintext';
    const languageName = language === 'plaintext' ? '' : hljs.getLanguage(language).name;

    const highlightedHTML = hljs.highlight(code, {language}).value;
    const lineNumberColor = getCommentColor();
    const codeHTML = buildCodeLayout(highlightedHTML, options.lineNumbers);

    const bodyTemplate = buildBody(fileName, codeHTML, cssStyle, hljsStyle, FONT_FACES, options, lineNumberColor);
    const headerTemplate = buildHeader(filePath, fileName, languageName, FONT_FACES, options);
    const footerTemplate = buildFooter(fileName, FONT_FACES, options);

    const page = await browser.newPage();
    await page.setContent(bodyTemplate, {waitUntil: 'networkidle0'});
    const pdfData = await page.pdf({
        format: 'LETTER',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate,
        footerTemplate,
        margin: {top: '0.5in', bottom: '0.5in', left: '0.4in', right: '0.4in'}
    });
    await page.close();
    return pdfData;
}

async function createIndividualPDFs(inputFilePaths, outputDir, options) {
    const browser = await puppeteer.launch();
    let fileCount = 0;
    
    console.log(`\n> Converting:`);
    for (const inputPath of inputFilePaths) {
        console.log(`  ˙ ${inputPath}`);
        let pdfData = await createPDF(browser, inputPath, options);

        if (options.footerPage !== false) {
            const pdfDocument = await PDFDocument.load(pdfData);
            await addPageNumbers(pdfDocument);
            pdfData = await pdfDocument.save();
        }

        const fileName = path.basename(inputPath);
        const fileExt = path.extname(fileName);
        const baseName = fileExt ? fileName.slice(0, -fileExt.length) : fileName;
        const outputPath = path.join(outputDir, path.dirname(inputPath), `${baseName}${fileExt.replace('.', '_')}.pdf`);
        fs.mkdirSync(path.dirname(outputPath), {recursive: true});
        fs.writeFileSync(outputPath, pdfData);
        fileCount++;
    }
    await browser.close();
    console.log(`  Total: ${fileCount} file(s)`);
    console.log(`\n> PDF created: ${outputDir}...\n`);
}

async function createMergedPDF(inputFilePaths, outputDir, options) {
    const browser = await puppeteer.launch();
    const mergedPDF = await PDFDocument.create();
    let fileCount = 0;

    console.log(`\n> Converting:`);
    for (const inputPath of inputFilePaths) {
        console.log(`  ˙ ${inputPath}`);
        const pdfData = await createPDF(browser, inputPath, options);
        const pdfDocument = await PDFDocument.load(pdfData);
        const pagesToAdd = await mergedPDF.copyPages(pdfDocument, pdfDocument.getPageIndices());
        pagesToAdd.forEach((page) => {
            mergedPDF.addPage(page)
        });
        fileCount++;
    }
    await browser.close();
    console.log(`  Total: ${fileCount} file(s)`);

    if (options.footerPage !== false) {
        await addPageNumbers(mergedPDF);
    }

    const mergedPDFData = await mergedPDF.save();
    fs.mkdirSync(outputDir, {recursive: true});
    fs.writeFileSync(`${outputDir}/merged.pdf`, mergedPDFData);
    console.log(`\n> PDF created: ${outputDir}/merged.pdf\n`);
}

/**
 * File handling
 */

// To skip non-text files (images, etc.)
function isTextFile(targetPath, sampleSize = 8000) {
    const fileDescriptor = fs.openSync(targetPath, 'r');
    try {
        const buffer = Buffer.alloc(sampleSize);
        const bytesRead = fs.readSync(fileDescriptor, buffer, 0, buffer.length, 0);

        for (let i = 0; i < bytesRead; i++) {
            if (buffer[i] === 0) return false;
        }
        return true;
    } finally {
        fs.closeSync(fileDescriptor);
    }
}

// Separates files into text or unreadable(binary)
function findFiles(targetPath) {
    const stat = fs.statSync(targetPath);
    
    if (stat.isFile()) {
        return isTextFile(targetPath) ? {included: [targetPath], skipped: []} : {included: [], skipped: [targetPath]};
    }

    if (stat.isDirectory()) {
        let included = [];
        let skipped = [];
        const entries = fs.readdirSync(targetPath, {withFileTypes: true});

        for (const entry of entries) {
            const fullPath = path.join(targetPath, entry.name);

            if (entry.isDirectory()) {
                const result = findFiles(fullPath);
                included = included.concat(result.included);
                skipped = skipped.concat(result.skipped);
            } else if (isTextFile(fullPath)){
                included.push(fullPath);
            } else {
                skipped.push(fullPath);
            }
        }
        return {included, skipped};
    }
    return {included: [], skipped: []};
}

export { createIndividualPDFs, createMergedPDF, findFiles };