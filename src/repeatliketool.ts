import * as vscode from 'vscode';

/**
 * Interface for the repeat like tool parameters
 */
interface RepeatLikeParameters {
    /**
     * The text to repeat/transform
     */
    text: string;
    
    /**
     * The style to repeat the text like (e.g., "yoda", "parrot", "shakespeare", etc.)
     */
    like: string;
}

/**
 * A language model tool that repeats text in different styles.
 * 
 * This tool can transform text to sound like different characters or styles,
 * with special handling for "yoda" and "parrot" styles, and fallback to LLM for others.
 * 
 * This tool can be referenced in prompts using #repeat_like or being called by the agent.
 */
export class parrotRepeatLikeTool implements vscode.LanguageModelTool<RepeatLikeParameters> {

    /**
     * Prepares the invocation for the tool by providing an invocation message and confirmation messages.
     * 
     * @param options - The options for preparing the invocation, specific to the language model tool.
     * @param token - A cancellation token that can be used to cancel the operation.
     * @returns An object containing the invocation message and confirmation messages.
     */
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<RepeatLikeParameters>, 
        token: vscode.CancellationToken) {
     
        const { text, like } = options.input;

        if (!text || !like) {
            throw new Error("Both 'text' and 'like' parameters are required.");
        }        
        
        return {
            invocationMessage: `Parroting "${text}" like ${like}...`,
            confirmationMessages: {
                title: "Parrot Like",
                message: new vscode.MarkdownString(`Would you like me to parrot "${text}" in the style of ${like}?`),
            }
        };
    }

    /**
     * Invokes the tool to repeat text in the specified style.
     *
     * @param options - The invocation options containing the text and style parameters.
     * @param token - A cancellation token that can be used to signal cancellation of the operation.
     * @returns A promise that resolves to a `LanguageModelToolResult` containing the transformed text.
     */
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<RepeatLikeParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const { text, like } = options.input;       
        
        if( !text || !like) {
            throw new Error("Both 'text' and 'like' parameters are required.");
        }

        if( like.toLowerCase() === 'parrot' ) {
            // Special case for parrot, use a simple transformation
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(text)
            ]);
        }

        const transformedText = await this.transformWithLLM(text, like, token);
        
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(transformedText)
        ]);
    }

    /**
     * Transforms text using the Language Model with specialized prompts for different styles.
     * 
     * @param text - The original text to transform
     * @param style - The style to transform to
     * @param token - Cancellation token
     * @returns The transformed text
     */
    private async transformWithLLM(text: string, style: string, token: vscode.CancellationToken): Promise<string> {

        try {
            // Get available language models
            const models = await vscode.lm.selectChatModels();
            if (models.length === 0) {
                return `🎭 I would repeat "${text}" like ${style}, but no language model is available.`;
            }

            const model = models[0];
            const systemPrompt = this.generateSystemPrompt(style);
            const messages = [
                systemPrompt,
                vscode.LanguageModelChatMessage.User(text)
            ];

            const response = await model.sendRequest(messages, {}, token);
            let result = '';
            
            for await (const part of response.text) {
                result += part;
                if (token.isCancellationRequested) {
                    break;
                }
            }

            return result.trim() || `🎭 "${text}" (in the style of ${style})`;
        } catch (error) {
            // Fallback if LLM fails
            return `🎭 "${text}" (as ${style} would say it)`;
        }
    }

    /**
     * Generates a specialized system prompt based on the style.
     * 
     * @param style - The style to generate a prompt for
     * @returns A language model chat message with the appropriate system prompt
     */
    private generateSystemPrompt(style: string): vscode.LanguageModelChatMessage {
        const normalizedStyle = style.toLowerCase();
        
        switch (normalizedStyle) {
            case 'yoda':
                return vscode.LanguageModelChatMessage.User(
                    'Repeat what I will say below, but make it sound like a coding yoda parrot. ' +
                    'Use Yoda\'s distinctive speech patterns with inverted sentence structure, ' +
                    'wisdom-focused language, and characteristic phrases. Return the text in plaintext.'
                );
            case 'pirate':
                return vscode.LanguageModelChatMessage.User(
                    'Repeat what I will say below, but make it sound like a coding pirate parrot. ' +
                    'Use pirate vocabulary, "Arr!", "Ahoy!", ship terminology, and seafaring expressions. ' +
                    'Return the text in plaintext.'
                );
            default:
                return vscode.LanguageModelChatMessage.User(
                    `Repeat what I will say below, but make it sound like a coding ${style}. ` +
                    'Adopt the characteristic speech patterns, vocabulary, and mannerisms of this style. ' +
                    'Return the text in plaintext.'
                );
        }
    }
}
