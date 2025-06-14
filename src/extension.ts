import * as vscode from 'vscode';
import { handleFeedback } from './feedbackhandler';
import { generateFollowups } from './followup';
import { handleParrotChatHandler } from './parrotchathandler';
import { parrotCommandHandler } from './commandhandler';
import { parrotSayNameTool } from './saynametool';

// The code was initially generated with https://www.npmjs.com/package/generator-code
// More information at https://code.visualstudio.com/api/get-started/your-first-extension and https://code.visualstudio.com/api/extension-guides/chat-tutorial

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(extensionContext: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	console.log('extension "tspascoal-vscode-parrot-copilot" is now active!');

	// Registers the parrot chat participant and it's handler
	const participant = vscode.chat.createChatParticipant('tspascoal.copilot.parrot', handleParrotChatHandler);

	// Add followups to the answer. Followups are a list of potentially (hopefully relevant)
	// queries the user might want to ask next based on their prompt/answer.
	// https://code.visualstudio.com/api/extension-guides/chat#register-followup-requests
	participant.followupProvider = { provideFollowups: generateFollowups };

	// If you want to handle feedback from the user, you can do so by subscribing to the onDidReceiveFeedback event.
	// In this case we are just open an informational message but you might want to sent it somewhere for analytics.
	participant.onDidReceiveFeedback(handleFeedback); // Handle thumbs up and down feedback

	// set the icon for the chat participant
	participant.iconPath = vscode.Uri.joinPath(extensionContext.extensionUri, 'images', 'parrot_1747903.png');


	// Register the language model tools
	const sayNameTool = vscode.lm.registerTool('tspascoal-copilot-chat-parrot-say_name', new parrotSayNameTool());
	
	// The command has been defined in the package.json file
	// The commandId parameter must match the command field in package.json
	// This is not handled in the chat window, but in the command palette with the name `parrot`
	const disposable = vscode.commands.registerCommand('tspascoal-copilot-chat-parrot.parrot', parrotCommandHandler);
	extensionContext.subscriptions.push(disposable);
	extensionContext.subscriptions.push(participant);
	extensionContext.subscriptions.push(sayNameTool);
}

// This method is called when your extension is deactivated
export function deactivate() { }
