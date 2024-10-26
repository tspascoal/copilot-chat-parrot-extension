import { defineConfig } from '@vscode/test-cli';

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
