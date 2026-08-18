import { program } from 'commander';
import { select, checkbox } from '@inquirer/prompts';
import path from 'path';
import fs from 'fs';
import { createIndividualPDFs, createMergedPDF } from '../src/index.js';

program
    .name('node bin/cli.js')
    .argument('<paths...>', 'File path to convert')
    .option('--merge', 'Merge all files into a single PDF')
    .option('--no-merge', 'Output each file as a separate PDF')
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
        const missingPath = paths.find((inputPath) => !fs.existsSync(inputPath));
        if(missingPath) {
            console.error(
                `\nERROR: File not found.` +
                `\nPath:  ${missingPath}\n` +
                `\nHelp:  node bin/cli.js -h\n`
            );
            process.exit(1);
        }

        // Prompts only if CLI flags weren't explicitly set.
        const needsPrompt =
            options.merge === undefined ||
            options.fileTitle === undefined ||
            options.lineNumbers === undefined ||
            options.headerPath === undefined ||
            options.headerLang === undefined ||
            options.footerName === undefined ||
            options.footerPage === undefined;

        let settings = {
            merge: options.merge,
            fileTitle: options.fileTitle,
            lineNumbers: options.lineNumbers,
            headerPath: options.headerPath,
            headerLang: options.headerLang,
            footerName: options.footerName,
            footerPage: options.footerPage
        };

        if (needsPrompt) {
            console.log('\n(Press Ctrl + C to cancel.)\n')

            const mergeChoice = await select({
                message: 'Select PDF output method:',
                choices: [
                    {name: 'Merge all files into a single PDF', value: true},
                    {name: 'Output each file as a separate PDF', value: false}
                ],
                default: settings.merge !== false
            });

            const selected = await checkbox({
                message: 'Select items to include:',
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
                merge: mergeChoice,
                fileTitle: selected.includes('fileTitle'),
                lineNumbers: selected.includes('lineNumbers'),
                headerPath: selected.includes('headerPath'),
                headerLang: selected.includes('headerLang'),
                footerName: selected.includes('footerName'),
                footerPage: selected.includes('footerPage')
            };
        } else {
            console.log(`\n> Received ${paths.length} file(s).\n`)
        }

        if (settings.merge) {
            await createMergedPDF(paths, settings);
        } else {
            await createIndividualPDFs(paths, settings);
        }
    });

program.parse();