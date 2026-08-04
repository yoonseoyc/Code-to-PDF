import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import hljs from 'highlight.js';
import {buildBody} from './template.js';

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

const cssStyle = fs.readFileSync('./src/styles.css', 'utf-8');
const hljsStyle = fs.readFileSync(path.resolve(import.meta.dirname, '../node_modules/highlight.js/styles/github.min.css'), 'utf-8');
const LANGUAGE_MAP = {
    cpp: 'cpp'
}

// Extracts the comment color from the hljs theme for line-number styling.
function getCommentColor(fallback = "#bbb") {
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
    const lines = highlightedHTML.split('\n');
    return lines
        .map((line, i) => {
            const lineNum = i + 1;
            return `<div class="line-row">${optionLineNum ? `<span class="line-number">${lineNum}</span>` : ''}<span class="line-code">${line || ' '}</span></div>`;
        })
    .join('\n');
}

async function createPDF(inputFilePath, options) {
    const fileName = path.basename(inputFilePath);
    const code = fs.readFileSync(inputFilePath, 'utf-8');
    
    const fileExt = path.extname(inputFilePath).slice(1);
    const language = LANGUAGE_MAP[fileExt] || 'plaintext';
    const highlightedHTML = hljs.highlight(code, {language}).value;
    const lineNumberColor = getCommentColor();
    const codeHTML = buildCodeLayout(highlightedHTML, options.lineNumbers);

    const bodyTemplate = buildBody(fileName, codeHTML, cssStyle, hljsStyle, FONT_FACES, options, lineNumberColor);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(bodyTemplate, {waitUntil: 'networkidle0'});
    await page.pdf({
        path: './output/sample.pdf',
        format: 'LETTER',
        margin: {top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in'},
    });
    await browser.close();
    console.log('\n> PDF created.\n');
}

export {createPDF};