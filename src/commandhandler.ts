import * as vscode from 'vscode';

export function parrotCommandHandler() {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInputBox({
        placeHolder: 'Tell me something to repeat',
    }).then((value) => {
        vscode.window.showInformationMessage(value || '🦜 polly wants something to repeat... 🦜');
    });
}