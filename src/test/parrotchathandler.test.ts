import * as assert from 'assert';
import { addReferencesToResponse, generateLikeSystemPrompt, getModelFamily, getUserPrompt } from '../parrotchathandler';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import path from 'path';

function getMockedRequest(family: string, id: string): vscode.ChatRequest {
    return {
        model: {
            family: family,
            id: id,
            name: family,
            vendor: 'copilot',
            version: '',
            maxInputTokens: 0,
            sendRequest: function (messages: vscode.LanguageModelChatMessage[], options?: vscode.LanguageModelChatRequestOptions, token?: vscode.CancellationToken): Thenable<vscode.LanguageModelChatResponse> {
                throw new Error('Function not implemented.');
            },
            countTokens: function (text: string | vscode.LanguageModelChatMessage, token?: vscode.CancellationToken): Thenable<number> {
                throw new Error('Function not implemented.');
            }
        },
        prompt: '',
        command: '',
        references: [],
        toolReferences: [],
        toolInvocationToken: (undefined as never)
    }
}

function normalizeLineEndings(text: string): string {
    return text.replace(/\r\n/g, '\n');
}

suite('getModelFamily Test Suite', () => {
    test('Returns user selected model family if present', () => {
        const request = getMockedRequest('gpt-3', 'gpt-3');
        const result = getModelFamily(request);
        assert.strictEqual(result, 'gpt-3');
    });
});

suite('getUserPrompt Test Suite', () => {
    test('Returns trimmed user prompt without references', async () => {
        const request: vscode.ChatRequest = {
            prompt: '  Hello, world!  ',
            references: []
        } as any;

        const { userPrompt } = await getUserPrompt(request);
        assert.strictEqual(userPrompt, 'Hello, world!');
    });

    test('Inlines copilot.selection reference into user prompt', async () => {
        const request: vscode.ChatRequest = {
            prompt: 'Check this out: #selection',
            references: [
                { id: 'copilot.selection', name: 'selection' }
            ]
        } as any;

        await setTextSelection('selected text');

        const { userPrompt } = await getUserPrompt(request);
        assert.strictEqual(userPrompt, 'Check this out: selected text');
    });

    test('No inline copilot.selection reference because there is no selected test', async () => {
        const request: vscode.ChatRequest = {
            prompt: 'Check this out: #selection',
            references: [
                { id: 'copilot.selection', name: 'selection' }
            ]
        } as any;

        await openTextDocument('dummy text');

        const { userPrompt } = await getUserPrompt(request);
        assert.strictEqual(userPrompt, 'Check this out: #selection');
    });

    test('Inlines vscode.selection reference into user prompt', async () => {

        const { document, editor } = await setTextSelection('selected text');

        const fileName = document.fileName;
        const textualRange = `${editor.selection.start.line + 1}-${editor.selection.end.line + 1}`;

        const request: vscode.ChatRequest = {
            prompt: `Check this out: #file:${fileName}:${textualRange}`,
            references: [
                {
                    id: 'vscode.selection',
                    name: `file:${fileName}:${textualRange}`,
                    value: {
                        uri: document.uri,
                        range: editor.selection
                    }
                }
            ]
        } as any;

        const { userPrompt } = await getUserPrompt(request);
        assert.strictEqual(userPrompt, 'Check this out: selected text');
    });

    test('Does not inline vscode.selection with closed editor (of unsaved file)', async () => {

        const { document, editor } = await setTextSelection('selected text');

        const fileName = document.fileName;
        const textualRange = `${editor.selection.start.line + 1}-${editor.selection.end.line + 1}`;

        const prompt = `Check this out: #file:${fileName}:${textualRange}`;

        const request: vscode.ChatRequest = {
            prompt: prompt,
            references: [
                {
                    id: 'vscode.selection',
                    name: `file:${fileName}:${textualRange}`,
                    value: {
                        uri: document.uri,
                        range: editor.selection
                    }
                }
            ]
        } as any;

        // close editor
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

        const { userPrompt, references } = await getUserPrompt(request);
        assert.strictEqual(userPrompt, prompt); // unchanged prompt
        assert.strictEqual(references.length, 0); // no references
    });

    test('Ignores unsupported references in user prompt', async () => {
        const request: vscode.ChatRequest = {
            prompt: 'Check this out: #selection',
            references: [
                { id: 'unsupported.reference', name: 'selection' }
            ]
        } as any;

        const { userPrompt } = await await getUserPrompt(request);
        assert.strictEqual(userPrompt, 'Check this out: #selection');
    });

    test('Handles multiple copilot.selection references in user prompt', async () => {
        const request: vscode.ChatRequest = {
            prompt: 'First: #selection, Second: #selection',
            references: [
                { id: 'copilot.selection', name: 'selection' }
            ]
        } as any;

        await setTextSelection('selected text');

        const { userPrompt, references } = await getUserPrompt(request);
        assert.strictEqual(userPrompt, 'First: selected text, Second: selected text');
        assert.strictEqual(references.length, 1); // the reference is only added once. Even if duplicated in the prompt
    });

    test('Returns prompt unchanged if no copilot.selection references are present', async () => {
        const request: vscode.ChatRequest = {
            prompt: 'No references here',
            references: []
        } as any;

        const { userPrompt, references } = await getUserPrompt(request);
        assert.strictEqual(userPrompt, 'No references here');
        assert.strictEqual(references.length, 0);
    });

    test('Returns prompt unchanged if no references are present', async () => {
        const request: vscode.ChatRequest = {
            prompt: 'No references here',
            references: []
        } as any;

        const { userPrompt, references } = await getUserPrompt(request);
        assert.strictEqual(userPrompt, 'No references here');
        assert.strictEqual(references.length, 0);
    });

    test('returns prompt with appended implicit selection content', async () => {

        const { document, editor } = await setTextSelection('selected text');

        const request: vscode.ChatRequest = {
            prompt: 'Check this out:',
            references: [
                { 
                    id: 'copilot.implicit.selection', 
                    name: 'selection',
                    value: {
                        uri: document.uri,
                        range: editor.selection
                    }
                }                    
            ]
        } as any;

        const { userPrompt, references } = await getUserPrompt(request);
        assert.strictEqual(userPrompt, 'Check this out: selected text');
        assert.strictEqual(references.length, 1);
    });

    test('returns prompt with file content when a file is referenced explicitely', async () => {

        const testFileUri = vscode.Uri.file(path.join(__dirname, 'data', 'test.txt'));

        const request: vscode.ChatRequest = {
            prompt: '#file:test.txt',
            references: [
                { id: 'vscode.file', name: 'file:test.txt', value: testFileUri }
            ]
        } as any;

        const { userPrompt, references } = await getUserPrompt(request);
        assert.strictEqual(userPrompt, 'file content');
        assert.strictEqual(references.length, 1);
    });

    test('Handles file references that do not exist', async () => {
        const nonExistentUri = vscode.Uri.file(path.join(__dirname, 'data', 'non_existent.txt'));
        const request: vscode.ChatRequest = {
            prompt: '#file:non_existent.txt',
            references: [
                { id: 'vscode.file', name: 'file:non_existent.txt', value: nonExistentUri }
            ]
        } as any;
    
        await assert.rejects(async () => {
            await getUserPrompt(request);
        });        
        
    });    

    test('returns prompt with multiline file explicitly referenced', async () => {
        const testFileUri = vscode.Uri.file(path.join(__dirname, 'data', 'test_multiline.txt'));
        const request: vscode.ChatRequest = {
            prompt: '#file:test_multiline.txt',
            references: [
                { id: 'vscode.file', name: 'file:test_multiline.txt', value: testFileUri }
            ]
        } as any;
        const { userPrompt, references } = await getUserPrompt(request);
        assert.strictEqual(normalizeLineEndings(userPrompt), normalizeLineEndings('line 1\nline 2\nline 3'));
        assert.strictEqual(references.length, 1);

    });
});

suite('addReferencesToResponse Test Suite', () => {
    let responseStream: any;
    let sandbox: sinon.SinonSandbox;

    const blogUrlReference = 'https://pascoal.net/2024/10/22/gh-copilot-extensions';

    setup(() => {
        // close all windows
        vscode.commands.executeCommand('workbench.action.closeAllEditors');
        sandbox = sinon.createSandbox();
        responseStream = {
            reference: sandbox.stub()
        };
    });

    teardown(() => {
        sandbox.restore();
    });

    test('adds default reference', () => {
        const request = { command: 'normal' } as vscode.ChatRequest;

        const references: (vscode.Uri | vscode.Location)[] = [];
        addReferencesToResponse(request, responseStream, references);

        sinon.assert.calledWith(responseStream.reference, vscode.Uri.parse(blogUrlReference));
    });

    test('adds Yoda reference when using likeyoda command', () => {
        const request = { command: 'likeyoda' } as vscode.ChatRequest;

        const references: (vscode.Uri | vscode.Location)[] = [];
        addReferencesToResponse(request, responseStream, references);

        sinon.assert.calledWith(responseStream.reference, vscode.Uri.parse(blogUrlReference));
        sinon.assert.calledWith(responseStream.reference,
            vscode.Uri.parse('https://en.wikipedia.org/wiki/Yoda'));
    });

    test('adds pirate reference when using likeapirate command', () => {
        const request = { command: 'likeapirate' } as vscode.ChatRequest;

        const references: (vscode.Uri | vscode.Location)[] = [];
        addReferencesToResponse(request, responseStream, references);

        sinon.assert.calledWith(responseStream.reference, vscode.Uri.parse(blogUrlReference));
        sinon.assert.calledWith(responseStream.reference,
            vscode.Uri.parse('https://en.wikipedia.org/wiki/International_Talk_Like_a_Pirate_Day'));
    });

    test('adds passed reference', () => {
        const request = { command: 'normal' } as vscode.ChatRequest;

        const references: (vscode.Uri | vscode.Location)[] = [
            vscode.Uri.parse('https://example.com')
        ];
        addReferencesToResponse(request, responseStream, references);

        sinon.assert.calledWith(responseStream.reference, vscode.Uri.parse(blogUrlReference));
        sinon.assert.calledWith(responseStream.reference, vscode.Uri.parse('https://example.com'));
    });
});
suite('generateLikeSystemPrompt Test Suite', () => {
    test('Returns yoda prompt when command contains yoda', () => {
        const result = generateLikeSystemPrompt('likeyoda');
        assert.equal(result.role, vscode.LanguageModelChatMessageRole.User);
        //TODO: understand why content is not really a string like it should be
        assert.equal((result as any).content[0].value, 'Repeat what I will say below, but make it sound like a coding yoda parrot. Return the text in plaintext');
    });

    test('Returns pirate prompt for when command contains pirate', () => {
        const result = generateLikeSystemPrompt('likeapirate');
        assert.equal(result.role, vscode.LanguageModelChatMessageRole.User);
        //TODO: understand why content is not really a string like it should be
        assert.equal((result as any).content[0].value, 'Repeat what I will say below, but make it sound like a coding pirate parrot. Return the text in plaintext');

    });
});


/**
 * Opens a new text document with the given content and displays it in the editor.
 *
 * @param content - The content to be displayed in the new text document.
 */
async function openTextDocument(content: string) {
    // Open a new text document
    const document = await vscode.workspace.openTextDocument({ content: content });
    await vscode.window.showTextDocument(document);
}

/**
 * Creates a new text document with the specified content and sets the selection to the entire text
 * 
 * @param text - The text content to be inserted into the new document
 * 
 * @throws {Error} If the document cannot be opened or the selection cannot be set
 */
async function setTextSelection(text: string): Promise<{ document: vscode.TextDocument; editor: vscode.TextEditor }> {
    // Open a new text document
    const document = await vscode.workspace.openTextDocument({ content: text });
    const editor = await vscode.window.showTextDocument(document);

    // Set the selection text
    const selection = new vscode.Selection(0, 0, 0, text.length);
    editor.selection = selection;

    return { document, editor };
}


