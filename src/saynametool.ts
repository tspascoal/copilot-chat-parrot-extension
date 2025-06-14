import * as vscode from 'vscode';

/**
 * A language model tool that says the name of the parrot.
 * 
 * The parrot is not very constant, so it will randomly select a name from a predefined list.
 * 
 * This tool can be referenced in prompts using #say_parrot_name or being called by the agent.
 */
export class parrotSayNameTool implements vscode.LanguageModelTool<void> {

    /**
     * Prepares the invocation for the tool by providing an invocation message and confirmation messages.
     * 
     * This will be shown to the user before the tool is invoked, allowing them to confirm the action.
     * 
     * @param options - The options for preparing the invocation, specific to the language model tool.
     * @param token - A cancellation token that can be used to cancel the operation.
     * @returns An object containing the invocation message and confirmation messages.
     *          - `invocationMessage`: A string message indicating the action being prepared.
     *          - `confirmationMessages`: An object containing the title and message for user confirmation.
     */
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<void>, 
        token: vscode.CancellationToken) {
     
        return {
            invocationMessage: 'Getting the parrot\'s name...',
            confirmationMessages: {
                title: "Parrot",
                message: new vscode.MarkdownString("Would you like to know the name of the parrot? 🦜 I will say it"),
            }
        };
    }

    /**
     * Invokes the tool to generate a random parrot name and returns the result.
     *
     * @param options - The invocation options for the language model tool. 
     *                  This parameter is not used in this implementation.
     * @param token - A cancellation token that can be used to signal cancellation of the operation.
     * @returns A promise that resolves to a `LanguageModelToolResult` containing the randomly selected parrot name.
     */
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<void>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const parrotNames = [
            "Polly", 
            "Captain Feathers", 
            "Ruby", 
            "Emerald", 
            "Echo", 
            "Mango",
            "Kiwi",
            "Pepper",
            "Storm"
        ];
        
        // Select a random parrot name
        const randomName = parrotNames[Math.floor(Math.random() * parrotNames.length)];
        
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(`🦜 My name is ${randomName}`)
        ]);
    }
}
