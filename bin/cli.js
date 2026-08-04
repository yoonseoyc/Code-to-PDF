import { program } from 'commander';
import { checkbox } from '@inquirer/prompts';
import path from 'path';
import fs from 'fs';
import { createPDF } from '../src/index.js';

program
    .name('codepdf')
    .argument('<paths...>', 'File path to convert')
    .option('--file-title')
    .option('--no-file-title')
    .option('--line-numbers')
    .option('--no-line-numbers')
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
                `\nPath:  ${inputFilePath}\n`
            );
            process.exit(1);
        }

        // Prompts only if CLI flags weren't explicitly set.
        const needsPrompt =
            options.fileTitle === undefined ||
            options.lineNumbers === undefined;

        let settings = {
            fileTitle: options.fileTitle,
            lineNumbers: options.lineNumbers
        };

        if (needsPrompt) {
            console.log('\n(Press Ctrl + C to cancel.)\n')
            const selected = await checkbox({
                message: 'Select items to include',
                choices: [
                    {name: 'File title', value: 'fileTitle', checked: settings.fileTitle !== false},
                    {name: 'Line numbers', value: 'lineNumbers', checked: settings.lineNumbers !== false}
                ]
            });

            settings = {
                fileTitle: selected.includes('fileTitle'),
                lineNumbers: selected.includes('lineNumbers')
            };
        }

        await createPDF(inputFilePath, settings);
    });

program.parse();