import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { parrotCommandHandler } from '../commandhandler';

suite('Parrot Command Handler Test Suite', () => {
    let showInputBoxStub: sinon.SinonStub;
    let showInformationMessageStub: sinon.SinonStub;

    setup(() => {
        // Create stubs before each test
        showInputBoxStub = sinon.stub(vscode.window, 'showInputBox');
        showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage');
    });

    teardown(() => {
        // Restore stubs after each test
        sinon.restore();
    });

    test('Shows entered message when user inputs text', async () => {
        const testInput = 'Hello Polly!';
        showInputBoxStub.resolves(testInput);

        await parrotCommandHandler();

        assert.strictEqual(showInputBoxStub.calledOnce, true);
        assert.deepStrictEqual(showInputBoxStub.firstCall.args[0], {
            placeHolder: 'Tell me something to repeat'
        });
        
        assert.strictEqual(showInformationMessageStub.calledOnce, true);
        assert.strictEqual(showInformationMessageStub.firstCall.args[0], testInput);
    });

    test('Shows default message when user input is undefined', async () => {
        showInputBoxStub.resolves(undefined);

        await parrotCommandHandler();

        assert.strictEqual(showInputBoxStub.calledOnce, true);
        assert.strictEqual(showInformationMessageStub.calledOnce, true);
        assert.strictEqual(
            showInformationMessageStub.firstCall.args[0],
            '🦜 polly wants something to repeat... 🦜'
        );
    });

    test('Shows default message when user cancels input', async () => {
        showInputBoxStub.resolves(null);

        await parrotCommandHandler();

        assert.strictEqual(showInputBoxStub.calledOnce, true);
        assert.strictEqual(showInformationMessageStub.calledOnce, true);
        assert.strictEqual(
            showInformationMessageStub.firstCall.args[0],
            '🦜 polly wants something to repeat... 🦜'
        );
    });
});