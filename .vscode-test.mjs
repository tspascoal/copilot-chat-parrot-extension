import { defineConfig } from '@vscode/test-cli';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure the output directory exists
const outputDir = join(__dirname, 'out', 'test', 'data');
mkdirSync(outputDir, { recursive: true });

// Copy all tests data files to the output directory
const dataDir = join(__dirname, 'src', 'test', 'data');
const dataFiles = readdirSync(dataDir); // Read all files in the data directory
dataFiles.forEach(file => {
    const src = join(dataDir, file);
    const dest = join(outputDir, file);
    copyFileSync(src, dest);
});

export default defineConfig({
    files: 'out/test/**/*.test.js',
    mocha: {
        "reporter": "mocha-multi-reporters",
        "reporterOptions": {
            "reporterEnabled": "spec,mocha-junit-reporter",
            "mochaJunitReporterReporterOptions": {
                "mochaFile": "./junit-testresults.xml"
            }
        }
    }
});
