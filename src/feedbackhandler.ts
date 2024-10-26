import * as vscode from 'vscode';

/**
 * Handles the feedback received from a chat result.
 *
 * @param feedback - The feedback object containing the kind of feedback.
 * @returns void
 *
 * Logs the feedback to the console and shows an information message based on the kind of feedback.
 * - If the feedback is helpful, it shows a message indicating that the user liked it.
 * - If the feedback is unhelpful, it shows a message apologizing for the unsatisfactory response.
 * - For any other feedback kind, it shows a message indicating an unknown feedback type.
 */
export function handleFeedback(feedback: vscode.ChatResultFeedback) {
    console.log('Feedback received:', feedback);

    switch (feedback.kind) {
        case vscode.ChatResultFeedbackKind.Helpful:
            vscode.window.showInformationMessage('🚀 Happy that you liked it.');
            break;
        case vscode.ChatResultFeedbackKind.Unhelpful:
            vscode.window.showWarningMessage('😢 Sorry that you didn\'t like our response.');
            break;
        default:
            vscode.window.showInformationMessage('Don\'t know what to do with this feedback type.');
            break;
    }
}