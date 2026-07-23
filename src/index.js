import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import hljs from 'highlight.js';
import {buildBody} from './template.js';

function fontAsBase64(fontFilePath) {
    const fontPath = fs.readFileSync(path.resolve(import.meta.dirname, '../fonts', fontFilePath));
    return fontPath.toString('base64');
}
const FIRA_CODE_LOCAL = fontAsBase64('Fira_Code/FiraCode-VariableFont_wght.ttf');
const INCLUSIVE_SANS_LOCAL = fontAsBase64('Inclusive_Sans/InclusiveSans-VariableFont_wght.ttf');
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

async function createPDF(inputFilePath) {
    const fileName = path.basename(inputFilePath);
    const code = fs.readFileSync(inputFilePath, 'utf-8');
    
    const fileExt = path.extname(inputFilePath).slice(1);
    const language = LANGUAGE_MAP[fileExt] || 'plaintext';
    const highlightedCode = hljs.highlight(code, {language}).value;

    const bodyTemplate = buildBody(fileName, highlightedCode, cssStyle, hljsStyle, FONT_FACES);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(bodyTemplate, {waitUntil: 'networkidle0'});
    await page.pdf({
        path: './output/sample.pdf',
        format: 'LETTER',
        margin: {top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in'}
    });
    await browser.close();
    console.log('\n> PDF created.\n');
}

const inputFilePath = process.argv[2];
if (!inputFilePath) {
    console.error(
        `\n    ERROR: Missing file path.\n` +
        `\n    Format:  node src/index.js <file-path>` +
        `\n    Example: node src/index.js ./examples/sample.cpp\n`
    );
    process.exit(1);
}

createPDF(inputFilePath);