import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { parrotSayNameTool } from '../saynametool';

suite('ParrotSayNameTool Test Suite', () => {
    let tool: parrotSayNameTool;
    let mathRandomStub: sinon.SinonStub;

    setup(() => {
        tool = new parrotSayNameTool();
        mathRandomStub = sinon.stub(Math, 'random');
    });

    teardown(() => {
        mathRandomStub.restore();
    });

    test('invoke returns LanguageModelToolResult', async () => {
        mathRandomStub.returns(0.5);
        
        const result = await tool.invoke(
            {} as vscode.LanguageModelToolInvocationOptions<void>,
            new vscode.CancellationTokenSource().token
        );

        assert.ok(result instanceof vscode.LanguageModelToolResult);
    });

    test('invoke returns result with single LanguageModelTextPart', async () => {
        mathRandomStub.returns(0.5);
        
        const result = await tool.invoke(
            {} as vscode.LanguageModelToolInvocationOptions<void>,
            new vscode.CancellationTokenSource().token
        );

        assert.strictEqual(result.content.length, 1);
        assert.ok(result.content[0] instanceof vscode.LanguageModelTextPart);
    });

    test('invoke returns first parrot name when random is 0', async () => {
        mathRandomStub.returns(0);
        
        const result = await tool.invoke(
            {} as vscode.LanguageModelToolInvocationOptions<void>,
            new vscode.CancellationTokenSource().token
        );

        const textPart = result.content[0] as vscode.LanguageModelTextPart;
        assert.strictEqual(textPart.value, '🦜 My name is Polly');
    });

    test('invoke returns last parrot name when random approaches 1', async () => {
        mathRandomStub.returns(0.999);
        
        const result = await tool.invoke(
            {} as vscode.LanguageModelToolInvocationOptions<void>,
            new vscode.CancellationTokenSource().token
        );

        const textPart = result.content[0] as vscode.LanguageModelTextPart;
        assert.strictEqual(textPart.value, '🦜 My name is Storm');
    });

    test('invoke returns specific parrot name for middle random value', async () => {
        mathRandomStub.returns(0.4); // Should select index 3 (Emerald)
        
        const result = await tool.invoke(
            {} as vscode.LanguageModelToolInvocationOptions<void>,
            new vscode.CancellationTokenSource().token
        );

        const textPart = result.content[0] as vscode.LanguageModelTextPart;
        assert.strictEqual(textPart.value, '🦜 My name is Emerald');
    });

    test('invoke returns valid parrot name from predefined list', async () => {
        mathRandomStub.returns(0.7);
        const validNames = [
            "Polly", "Captain Feathers", "Ruby", "Emerald", 
            "Echo", "Mango", "Kiwi", "Pepper", "Storm"
        ];
        
        const result = await tool.invoke(
            {} as vscode.LanguageModelToolInvocationOptions<void>,
            new vscode.CancellationTokenSource().token
        );

        const textPart = result.content[0] as vscode.LanguageModelTextPart;
        const message = textPart.value;
        
        assert.ok(message.startsWith('🦜 My name is '));
        const name = message.replace('🦜 My name is ', '');
        assert.ok(validNames.includes(name));
    });

    test('invoke can return different names with different random values', async () => {
        // First call
        mathRandomStub.returns(0);
        const result1 = await tool.invoke(
            {} as vscode.LanguageModelToolInvocationOptions<void>,
            new vscode.CancellationTokenSource().token
        );

        // Second call with different random value
        mathRandomStub.returns(0.8);
        const result2 = await tool.invoke(
            {} as vscode.LanguageModelToolInvocationOptions<void>,
            new vscode.CancellationTokenSource().token
        );

        const textPart1 = result1.content[0] as vscode.LanguageModelTextPart;
        const textPart2 = result2.content[0] as vscode.LanguageModelTextPart;
        
        assert.notStrictEqual(textPart1.value, textPart2.value);
    });
});