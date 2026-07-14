import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import {buildBody} from './template.js';

async function createPDF(inputFilePath) {
    const fileName = path.basename(inputFilePath);
    const code = fs.readFileSync(inputFilePath, 'utf-8');

    const bodyTemplate = buildBody(fileName, code);

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