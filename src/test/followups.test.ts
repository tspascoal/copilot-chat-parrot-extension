import * as assert from 'assert';
import * as vscode from 'vscode';
import { generateFollowups } from '../followup';

const CONFIGURATION_SECTION = 'tspascoal.copilot.parrot';
const PROVIDE_FOLLOWUPS = 'ProvideFollowups';
const LIKE_ENABLED = 'like.Enabled';

suite('Followup Generation Test Suite', () => {
    test('Followups are generated when enabled', async () => {
        const config = vscode.workspace.getConfiguration(CONFIGURATION_SECTION);
        await config.update(PROVIDE_FOLLOWUPS, true, vscode.ConfigurationTarget.Global);
        await config.update(LIKE_ENABLED, true, vscode.ConfigurationTarget.Global);

        const followups = generateFollowups();
        assert.ok(followups);
        assert.strictEqual(followups!.length, 3);
    });

    test('Followups are not generated when disabled', async () => {
        const config = vscode.workspace.getConfiguration(CONFIGURATION_SECTION);
        await config.update(PROVIDE_FOLLOWUPS, false, vscode.ConfigurationTarget.Global);

        const followups = generateFollowups();
        assert.strictEqual(followups, undefined);
    });

    test('Like followups are not generated when like is disabled', async () => {
        const config = vscode.workspace.getConfiguration(CONFIGURATION_SECTION);
        await config.update(PROVIDE_FOLLOWUPS, true, vscode.ConfigurationTarget.Global);
        await config.update(LIKE_ENABLED, false, vscode.ConfigurationTarget.Global);

        const followups = generateFollowups();
        assert.ok(followups);
        assert.strictEqual(followups!.length, 1);
    });
});