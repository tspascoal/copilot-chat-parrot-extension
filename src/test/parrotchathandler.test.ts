import * as assert from 'assert';
import { getModelFamily, getUserPrompt } from '../parrotchathandler';
import * as vscode from 'vscode';

suite('getModelFamily Test Suite', () => {
    test('Returns user selected model family if present', () => {
        const request = {
            userSelectedModel: {
                family: 'gpt-3'
            }
        };
        const result = getModelFamily(request);
        assert.strictEqual(result, 'gpt-3');
    });

    test('Returns default model family if user selected model is not present', () => {
        const request = {};
        const result = getModelFamily(request);
        assert.strictEqual(result, 'gpt-4o');
    });

    test('Returns default model family if user selected model is undefined', () => {
        const request = { userSelectedModel: undefined };
        const result = getModelFamily(request);
        assert.strictEqual(result, 'gpt-4o');
    });
});

suite('getModelFamily Test Suite', () => {
    test('Returns default model family if userSelectedModel is null', () => {
        const request = { userSelectedModel: null };
        const result = getModelFamily(request);
        assert.strictEqual(result, 'gpt-4o');
    });

    test('Returns user selected model family if userSelectedModel.family is a non-empty string', () => {
        const request = { userSelectedModel: { family: 'gpt-3.5' } };
        const result = getModelFamily(request);
        assert.strictEqual(result, 'gpt-3.5');
    });
});

suite('getUserPrompt Test Suite', () => {
    // test('Returns trimmed user prompt without references', () => {
    //     const request: vscode.ChatRequest = {
    //         prompt: '  Hello, world!  ',
    //         references: []
    //     } as any;

    //     const result = getUserPrompt(request);
    //     assert.strictEqual(result, 'Hello, world!');
    // });

    test('Inlines copilot.selection reference into user prompt', async () => {
        const request: vscode.ChatRequest = {
            prompt: 'Check this out: #selection',
            references: [
                { id: 'copilot.selection', name: 'selection' }
            ]
        } as any;

        await setTextSelection('selected text');

        const result = getUserPrompt(request);
        assert.strictEqual(result, 'Check this out: selected text');
    });

    test('No inline copilot.selection reference because there is no selected test', async () => {
        const request: vscode.ChatRequest = {
            prompt: 'Check this out: #selection',
            references: [
                { id: 'copilot.selection', name: 'selection' }
            ]
        } as any;

        await openTextDocument('dummy text');

        const result = getUserPrompt(request);
        assert.strictEqual(result, 'Check this out: #selection');
    });

    test('Ignores unsupported references in user prompt', () => {
        const request: vscode.ChatRequest = {
            prompt: 'Check this out: #selection',
            references: [
                { id: 'unsupported.reference', name: 'selection' }
            ]
        } as any;

        const result = getUserPrompt(request);
        assert.strictEqual(result, 'Check this out: #selection');
    });

    test('Handles multiple copilot.selection references in user prompt', async () => {
        const request: vscode.ChatRequest = {
            prompt: 'First: #selection, Second: #selection',
            references: [
                { id: 'copilot.selection', name: 'selection' }
            ]
        } as any;

        await setTextSelection('selected text');
       
        const result = getUserPrompt(request);
        assert.strictEqual(result, 'First: selected text, Second: selected text');
    });    

    test('Returns prompt unchanged if no copilot.selection references are present', () => {
        const request: vscode.ChatRequest = {
            prompt: 'No references here',
            references: []
        } as any;

        const result = getUserPrompt(request);
        assert.strictEqual(result, 'No references here');
    });
});

/**
 * Opens a new text document with the given content and displays it in the editor.
 *
 * @param content - The content to be displayed in the new text document.
 * @returns A promise that resolves when the document is opened and displayed.
 */
async function openTextDocument(content: string) {
    // Open a new text document
    const document = await vscode.workspace.openTextDocument({ content: 'selected text' });
    await vscode.window.showTextDocument(document);
}

async function setTextSelection(text: string) {
    // Open a new text document
    const document = await vscode.workspace.openTextDocument({ content: 'selected text' });
    const editor = await vscode.window.showTextDocument(document);

    // Set the selection text
    const selection = new vscode.Selection(0, 0, 0, 'selected text'.length);
    editor.selection = selection;
}