import { program } from 'commander';
import { checkbox } from '@inquirer/prompts';
import path from 'path';
import fs from 'fs';
import { createPDF } from '../src/index.js';

program
    .name('node bin/cli.js')
    .argument('<paths...>', 'File path to convert')
    .option('--file-title', 'Show file name')
    .option('--no-file-title', 'Hide file name')
    .option('--line-numbers', 'Show line numbers')
    .option('--no-line-numbers', 'Hide line numbers')
    .option('--header-path', 'Header left: show file path')
    .option('--no-header-path', 'Header left: hide file path')
    .option('--header-lang', 'Header right: show language')
    .option('--no-header-lang', 'Header right: hide language')
    .option('--footer-name', 'Footer left: show file name')
    .option('--no-footer-name', 'Footer left: hide file name')
    .option('--footer-page', 'Footer right: show page number')
    .option('--no-footer-page', 'Footer right: hide page number')
    .showHelpAfterError(
        `\nUsage:    node bin/cli.js <paths...>` +
        `\nExample:  node bin/cli.js ./examples/main.cpp\n` +
        `\nHelp:     node bin/cli.js -h\n`
    )
    .action(async(paths, options) => {
        const inputFilePath = paths[0];
        if (!fs.existsSync(inputFilePath)) {
            console.error(
                `\nERROR: File not found.` +
                `\nPath:  ${inputFilePath}\n` +
                `\nHelp:  node bin/cli.js -h\n`
            );
            process.exit(1);
        }

        // Prompts only if CLI flags weren't explicitly set.
        const needsPrompt =
            options.fileTitle === undefined ||
            options.lineNumbers === undefined ||
            options.headerPath === undefined ||
            options.headerLang === undefined ||
            options.footerName === undefined ||
            options.footerPage === undefined;

        let settings = {
            fileTitle: options.fileTitle,
            lineNumbers: options.lineNumbers,
            headerPath: options.headerPath,
            headerLang: options.headerLang,
            footerName: options.footerName,
            footerPage: options.footerPage
        };

        if (needsPrompt) {
            console.log('\n(Press Ctrl + C to cancel.)\n')
            const selected = await checkbox({
                message: 'Select items to include',
                choices: [
                    {name: 'File title', value: 'fileTitle', checked: settings.fileTitle !== false},
                    {name: 'Line numbers', value: 'lineNumbers', checked: settings.lineNumbers !== false},
                    {name: 'Header left: file path', value: 'headerPath', checked: settings.headerPath !== false},
                    {name: 'Header right: language', value: 'headerLang', checked: settings.headerLang !== false},
                    {name: 'Footer left: file name', value: 'footerName', checked: settings.footerName !== false},
                    {name: 'Footer right: page number', value: 'footerPage', checked: settings.footerPage !== false}
                ]
            });

            settings = {
                fileTitle: selected.includes('fileTitle'),
                lineNumbers: selected.includes('lineNumbers'),
                headerPath: selected.includes('headerPath'),
                headerLang: selected.includes('headerLang'),
                footerName: selected.includes('footerName'),
                footerPage: selected.includes('footerPage')
            };
        }

        await createPDF(inputFilePath, settings);
    });

program.parse();