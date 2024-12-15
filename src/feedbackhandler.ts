import * as vscode from 'vscode';

/**
 * Handles the feedback received from a chat result.
 *
 * @param feedback - The feedback object containing the kind of feedback.
 * @remarks
 * This function processes the feedback based on its kind and displays an appropriate message to the user.
 * 
 * - If the feedback is of kind `Helpful`, an information message is shown.
 * - If the feedback is of kind `Unhelpful`, a warning message is shown. If the feedback object contains an `unhelpfulReason` property, it is included in the message.
 * - For any other kind of feedback, a default information message is shown.
 *
 * @example
 * ```typescript
 * const feedback: vscode.ChatResultFeedback = { kind: vscode.ChatResultFeedbackKind.Helpful };
 * handleFeedback(feedback);
 * ```
 */
export function handleFeedback(feedback: vscode.ChatResultFeedback) {
    console.log('Feedback received:', feedback);

    switch (feedback.kind) {
        case vscode.ChatResultFeedbackKind.Helpful:
            vscode.window.showInformationMessage('🚀 Happy that you liked it.');
            break;
        case vscode.ChatResultFeedbackKind.Unhelpful:
            let extraMessage = '';
            // This isn't part of ChatResultFeedback nor it's documented, but it's a property of the feedback object. It might disappear in the future
            if ((feedback as any).unhelpfulReason) {
                extraMessage = ` With Reason: ${(feedback as any).unhelpfulReason}`;
            }
            vscode.window.showWarningMessage(`😢 Sorry that you didn\'t like our response.${extraMessage}`);
            break;
        default:
            vscode.window.showInformationMessage('Don\'t know what to do with this feedback type.');
            break;
    }
}