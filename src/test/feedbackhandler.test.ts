import * as assert from 'assert';
import * as vscode from 'vscode';
import { handleFeedback } from '../feedbackhandler';

suite('Feedback Handler Test Suite', () => {
    test('Handles helpful feedback correctly', () => {
        const feedback: vscode.ChatResultFeedback = { kind: vscode.ChatResultFeedbackKind.Helpful, result: {} as any };
        let messageShown = '';

        const originalShowInformationMessage = vscode.window.showInformationMessage;
        vscode.window.showInformationMessage = (message: string) => {
            messageShown = message;
            return Promise.resolve();
        };

        handleFeedback(feedback);

        assert.strictEqual(messageShown, '🚀 Happy that you liked it.');

        vscode.window.showInformationMessage = originalShowInformationMessage;
    });

    test('Handles unhelpful feedback correctly', () => {
        const feedback: vscode.ChatResultFeedback = { kind: vscode.ChatResultFeedbackKind.Unhelpful, result: {} as any };
        let messageShown = '';

        const originalShowWarningMessage = vscode.window.showWarningMessage;
        vscode.window.showWarningMessage = (message: string) => {
            messageShown = message;
            return Promise.resolve();
        };

        handleFeedback(feedback);

        assert.strictEqual(messageShown, '😢 Sorry that you didn\'t like our response.');

        vscode.window.showWarningMessage = originalShowWarningMessage;
    });

    test('Handles unknown feedback correctly', () => {
        const feedback: vscode.ChatResultFeedback = { kind: 666 as vscode.ChatResultFeedbackKind, result: {} as any };
        let messageShown = '';

        const originalShowInformationMessage = vscode.window.showInformationMessage;
        vscode.window.showInformationMessage = (message: string) => {
            messageShown = message;
            return Promise.resolve();
        };

        handleFeedback(feedback);

        assert.strictEqual(messageShown, 'Don\'t know what to do with this feedback type.');

        vscode.window.showInformationMessage = originalShowInformationMessage;
    });
});