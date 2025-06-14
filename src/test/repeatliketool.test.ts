import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { parrotRepeatLikeTool } from '../repeatliketool';

suite('RepeatLikeTool Test Suite', () => {
    let tool: parrotRepeatLikeTool;
    let transformWithLLMStub: sinon.SinonStub;

    setup(() => {
        tool = new parrotRepeatLikeTool();
        // Mock the private transformWithLLM method
        transformWithLLMStub = sinon.stub(tool as any, 'transformWithLLM');
    });

    teardown(() => {
        sinon.restore();
    });

    test('invoke returns LanguageModelToolResult', async () => {
        transformWithLLMStub.resolves('Strong with the Force, you are.');
        
        const result = await tool.invoke(
            { input: { text: 'Hello world', like: 'yoda' } } as vscode.LanguageModelToolInvocationOptions<{ text: string; like: string }>,
            new vscode.CancellationTokenSource().token
        );

        assert.ok(result instanceof vscode.LanguageModelToolResult);
    });

    test('invoke returns result with LanguageModelTextPart', async () => {
        transformWithLLMStub.resolves('Mocked transformed text');
        
        const result = await tool.invoke(
            { input: { text: 'Hello world', like: 'yoda' } } as vscode.LanguageModelToolInvocationOptions<{ text: string; like: string }>,
            new vscode.CancellationTokenSource().token
        );

        assert.strictEqual(result.content.length, 1);
        assert.ok(result.content[0] instanceof vscode.LanguageModelTextPart);
    });

    test('invoke transforms text like Yoda using LLM', async () => {
        transformWithLLMStub.resolves('Strong with the Force, you are.');
        
        const result = await tool.invoke(
            { input: { text: 'You are strong', like: 'yoda' } } as vscode.LanguageModelToolInvocationOptions<{ text: string; like: string }>,
            new vscode.CancellationTokenSource().token
        );

        const textPart = result.content[0] as vscode.LanguageModelTextPart;
        assert.strictEqual(textPart.value, 'Strong with the Force, you are.');
    });

    test('invoke transforms text like parrot does not use LLM', async () => {
        const result = await tool.invoke(
            { input: { text: 'Hello world', like: 'parrot' } } as vscode.LanguageModelToolInvocationOptions<{ text: string; like: string }>,
            new vscode.CancellationTokenSource().token
        );

        const textPart = result.content[0] as vscode.LanguageModelTextPart;
        assert.ok(textPart.value.length > 0);
        // Should contain the original text
        assert.strictEqual(textPart.value, 'Hello world');
    });

    test('invoke handles unknown styles using LLM', async () => {
        transformWithLLMStub.resolves('Greetings, fair world, thou art most beauteous!');
        
        const result = await tool.invoke(
            { input: { text: 'Hello world', like: 'shakespeare' } } as vscode.LanguageModelToolInvocationOptions<{ text: string; like: string }>,
            new vscode.CancellationTokenSource().token
        );

        const textPart = result.content[0] as vscode.LanguageModelTextPart;
        assert.strictEqual(textPart.value, 'Greetings, fair world, thou art most beauteous!');
    });

    test('invoke handles pirate style using LLM', async () => {
        transformWithLLMStub.resolves('Ahoy there, world! Arr!');
        
        const result = await tool.invoke(
            { input: { text: 'Hello world', like: 'pirate' } } as vscode.LanguageModelToolInvocationOptions<{ text: string; like: string }>,
            new vscode.CancellationTokenSource().token
        );

        const textPart = result.content[0] as vscode.LanguageModelTextPart;
        assert.strictEqual(textPart.value, 'Ahoy there, world! Arr!');
    });

    test('prepareInvocation returns correct messages', async () => {
        const result = await tool.prepareInvocation(
            { input: { text: 'Hello world', like: 'yoda' } } as vscode.LanguageModelToolInvocationPrepareOptions<{ text: string; like: string }>,
            new vscode.CancellationTokenSource().token
        );

        assert.strictEqual(result.invocationMessage, 'Parroting "Hello world" like yoda...');
        assert.strictEqual(result.confirmationMessages.title, 'Parrot Like');
        assert.strictEqual(result.confirmationMessages.message.value, 'Would you like me to parrot "Hello world" in the style of yoda?');
    });
});
