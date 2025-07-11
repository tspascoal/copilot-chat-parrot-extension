import * as vscode from 'vscode';

/**
 * Handles the parrot chat request by either repeating the user's prompt or processing a command.
 * 
 * Adds references based on the command in the request.
 * 
 * @param request - The chat request containing the user's prompt and command.
 * @param context - The chat context providing additional information about the request.
 * @param response - The response stream to send messages back to the user.
 * @param token - The cancellation token to signal request cancellation.
 * @returns A promise that resolves to a chat result or void.
 */
export async function handleParrotChatHandler(request: vscode.ChatRequest, context: vscode.ChatContext, response: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void | vscode.ChatResult | null | undefined> {
    const command = request.command;

    response.progress('looking at something to parrot....');

    logContext(context);
    logRequest(request);

    if (command === 'listmodels') {
        return await listAvailableCopilotModels(response);
    }

    // TODO: call tools if needed?

    const { userPrompt, references } = await getUserPrompt(request);

    // Add references to the response based on the command. 
    // This is a nonsensical example just for illustration purposes, (some of the) references are not really used for anything :)
    addReferencesToResponse(request, response, references);

    if (userPrompt === '') {
        response.markdown('Polly wants a cracker, you need to tell me something to repeat');
    } else {
        if (command) {
            await handleLikeCommands(command, userPrompt, request, response, token);
        } else {
            // Just parrot what we were told
            response.markdown(`${userPrompt}`);
        }
    }
}

// ################################ HELPERS SHOULD BE MOVED TO THEIR OWN FILES

/**
 * Retrieves a chat model by its family name from the available Copilot chat models.
 *
 * @param family - The family name of the chat model to retrieve.
 * @returns A promise that resolves to the chat model matching the specified family name.
 * @throws An error if the specified model family is not found, including a list of available models.
 */
async function getChatModelByName(family: string): Promise<vscode.LanguageModelChat> {
    const chatModels = await vscode.lm.selectChatModels({ vendor: 'copilot' });

    const model = chatModels.find(model => model.family.toLowerCase() === family.toLowerCase());

    if (!model) {
        // throw error and include the list of available models
        throw new Error(`Model **${family}** not found. \n\nAvailable Copilot Models\n\n${chatModels.map(model => `- ${model.family} ${model.version} `).join('\n')} `);
    }

    return model;
}

/**
 * Generates a system prompt message for a language model chat based on the provided command.
 * The prompt message will instruct the model to repeat the user's input in the style of a specified character.
 * 
 * @param command - A string that may contain the keyword 'yoda' to determine the character style.
 * @returns A `vscode.LanguageModelChatMessage` object containing the system prompt message.
 * 
 * @remarks
 * If the command contains the keyword 'yoda', the prompt will instruct the model to respond like a "coding yoda parrot".
 * Otherwise, it will default to a "coding pirate parrot".
 * 
 */
export function generateLikeSystemPrompt(command: string): vscode.LanguageModelChatMessage {
    // I think System would be better suited, but currently the model doesn't support that
    // https://code.visualstudio.com/api/extension-guides/language-model#build-the-language-model-prompt
    // https://github.com/microsoft/vscode/issues/206265#issuecomment-2118488846

    if (command === '') {
        throw new Error("Command cannot be empty");
    }

    if (!command.startsWith('like')) {
        throw new Error("Command must start with 'like'");
    }

    let soundLike = 'pirate';
    if (command?.search('yoda') !== -1) {
        soundLike = 'yoda';
    }

    return vscode.LanguageModelChatMessage.User(`Repeat what I will say below, but make it sound like a coding ${soundLike} parrot. Return the text in plaintext`);
}

/**
 * Processes a chat request to generate a user prompt string.
 * 
 * This function trims the initial prompt from the request and then iterates over all references
 * in the request. Given a reference id
 * 
 * - 'copilot.selection', it replaces occurrences of  `#reference.name` in the prompt with the current selection text (fetches the current selection from the active editor).
 * - 'vscode.selection', it replaces occurrences of  `#file:NAME:RANGE` in the prompt with the current selection text (at time of selection expansion). 
 * - 'copilot.implicit.selection', it appends the current selection text to the prompt 
 *   - copilot automatically adds the current selection to the prompt if setting `chat.implicitContext.enabled` is true.
 * - 'vscode.file', it replaces occurrences of `#reference.name` in the prompt with the content of the specified file. (range is not supported)
 * 
 * Other types of references are ignored.
 * 
 * Note there are references (eg: #terminalSelection or #changes) not in request.references but in request.toolReferences that are not processed.
 * 
 * Note: copilot.selection is no longer used in newer versions of copilot, but is kept here for compatibility with older versions.
 * Newer versions automatically transform `#selection` to a `#file:FILENAME:23-45` format (file with a range) and send an id of vscode.selection
 * 
 * @param request - The chat request containing the prompt and references.
 * @returns The processed user prompt string.
 */
export async function getUserPrompt(request: vscode.ChatRequest): Promise<{ userPrompt: string; references: (vscode.Location | vscode.Uri)[]; }> {
    let userPrompt = request.prompt.trim();
    let references: (vscode.Location | vscode.Uri)[] = [];

        async function processDocumentReference(location: vscode.Location, refName: string, append = false): Promise<string> {
        let document = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === location.uri.toString());

        // If document is no longer open, then ignore it.
        if (!document) {
            return userPrompt;
        }
        const text = document.getText(location.range);
        
        references.push(location);
        
        if (append) {
            return userPrompt + " " + text;
        } else {
            return userPrompt.replaceAll(`#${refName}`, text);
        }
    }

    // iterate on all references and inline the ones we support directly into the user prompt
    for (const ref of request.references) {
        const reference = ref as any; // Cast to any to access the name property
        console.log(`processing ${reference.id} with name: ${reference.name}`);

        if (reference.id === 'copilot.selection') {
            const currentSelection = getCurrentSelectionText();
            console.log(`current selection: ${currentSelection}`);

            if (currentSelection) {
                userPrompt = userPrompt.replaceAll(`#${reference.name}`, currentSelection);
            }

            const location = getCurrentSelectionLocation();
            if (location) {
                references.push(location);
            }
        } else if (reference.id === 'vscode.selection') {
            userPrompt = await processDocumentReference(reference.value, reference.name);
        } else if (reference.id === 'copilot.implicit.selection') {
            userPrompt = await processDocumentReference(reference.value, reference.name, true);
        } else if (reference.id === 'vscode.file') {
            console.log(`processing ${reference.id} with name: ${reference.name}`);
            const fileUri = reference.value;
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            
            userPrompt = userPrompt.replaceAll(`#${reference.name}`, fileContent.toString());
            references.push(fileUri);
        } else {
            console.log(`will ignore reference of type: ${reference.id}`);
        }
    }

    return { userPrompt, references };
}

/**
 * Retrieves the currently selected text in the active text editor.
 * 
 * The selection is from the current active editor. If the user select and switches 
 * to another tab we get nothing.
 * 
 * The alternative is to parse the selected value from the reference value, but that's brittle.
 *
 * @returns {string | null} The selected text, or null if no editor is active.
 */
function getCurrentSelectionText(): string | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return null;
    }

    return editor.document.getText(editor.selection);
}

/**
 * Retrieves the current selection location in the active text editor.
 *
 * @returns {vscode.Location | null} The location of the current selection in the active text editor,
 * or null if there is no active text editor.
 */
export function getCurrentSelectionLocation(): vscode.Location | vscode.Uri | null {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        return new vscode.Location(editor.document.uri, editor.selection);
    }

    return null;
}

/**
 * Extracts the model name from the picker, otherwise uses the default model.
 *
 * @param request - The chat request object.
 * @param command - The command string which may or may not end with '-with-model'.
 * @param userPrompt - The user-provided prompt string.
 * @returns A tuple where the first element is the model name and the second element is the modified prompt.
 *
 */
export function getModelFamily(request: vscode.ChatRequest): string {
    if (request.model) {
        return request.model.family;
    } else {
        // This should only happen on old vscode versions that didn't 
        // supported the picker yet
        return 'gpt-4o-mini';
    }
}

/**
 * Adds references to the response based on the command in the request.
 *
 * @param request - The chat request containing the command.
 * @param response - The chat response stream to which references will be added.
 * @param references - An array of references to be added to the response.
 *
 * @remarks
 * This function adds a reference to a demo URL for all requests. Additionally, it adds specific references
 * based on the command in the request:
 * - If the command is 'likeyoda', it adds a reference to Yoda's Wikipedia page.
 * - If the command is 'likeapirate', it adds a reference to the International Talk Like a Pirate Day Wikipedia page.
 */
export function addReferencesToResponse(request: vscode.ChatRequest, response: vscode.ChatResponseStream, references: (vscode.Location | vscode.Uri)[]) {
    const command = request.command;

    // Nonsense reference just for demo purposes. It's not really a reference to the user's input
    response.reference(vscode.Uri.parse('https://pascoal.net/2024/10/22/gh-copilot-extensions'));

    // Like yoda add yoda reference if talking.  Yes, hmmm.
    if (command === 'likeyoda') {
        response.reference(vscode.Uri.parse('https://en.wikipedia.org/wiki/Yoda'));
    }
    // add a reference if blabberin' on like a pirate
    if (command === 'likeapirate') {
        response.reference(vscode.Uri.parse('https://en.wikipedia.org/wiki/International_Talk_Like_a_Pirate_Day'));
    }

    for (const reference of references) {
        response.reference(reference);
    }
}

/**
 * Lists available Copilot models and sends the information as a markdown response.
 * 
 * @param response - The response stream to send messages back to the user.
 * @returns A promise that resolves when the operation is complete.
 */
async function listAvailableCopilotModels(response: vscode.ChatResponseStream): Promise<void> {
    const chatModels = await vscode.lm.selectChatModels({ vendor: 'copilot' });

    response.markdown('Available Copilot Models\n');
    chatModels.forEach(model => {
        response.markdown(`- **${model.family}** (${model.version})\n`);
        response.markdown("\n");
    });
}

/**
 * Logs the provided chat context to the console in a formatted JSON string.
 *
 * @param context - The chat context to be logged.
 */
function logContext(context: vscode.ChatContext) {
    const contextJson = JSON.stringify(context, null, 2);
    console.log('Chat Context:', contextJson);
}

/**
 * Logs the details of a chat request to the console.
 *
 * @param request - The chat request object containing the command, prompt, and references.
 * @param request.command - The command associated with the chat request.
 * @param request.prompt - The prompt text of the chat request.
 * @param request.references - Any references included in the chat request.
 */
function logRequest(request: vscode.ChatRequest) {
    console.log('Chat Command:', JSON.stringify(request.command, null, 2));
    console.log('Chat Prompt:', JSON.stringify(request.prompt, null, 2));
    console.log('Chat References:', JSON.stringify(request.references, null, 2));
    console.log('Chat Model:', JSON.stringify(request.model, null, 2));
}


async function handleLikeCommands(command: string, userPrompt: string, request: vscode.ChatRequest, response: vscode.ChatResponseStream, token: vscode.CancellationToken) {

    try {
        const modelName = getModelFamily(request);
        const systemPrompt = generateLikeSystemPrompt(command);

        console.log('will use model: ', modelName);
        console.log('parroting: ', userPrompt);
        console.log('system prompt: ', systemPrompt.content);

        const messages = [
            systemPrompt,
            vscode.LanguageModelChatMessage.User(userPrompt)
        ];

        const chatModel = await getChatModelByName(modelName);

        console.time('call model');
        const chatResponse = await chatModel.sendRequest(messages, {}, token);

        // This can also throw exceptions. But let's keep it simple
        for await (const responseText of chatResponse.text) {
            response.markdown(responseText);
        }
        console.timeEnd('call model');
    } catch (error) {
        handleError(error, response);
    }
}

function handleError(error: any, stream: vscode.ChatResponseStream): void {
    console.log('Error processing chat request:', error);

    if (error instanceof vscode.LanguageModelError) {
        console.log(error.message, error.code, error.cause);
        if (error.cause instanceof Error && error.cause.message.includes('off_topic')) {
            stream.markdown('I am sorry, I can only parrot coding stuff');
        }
    } else {
        // re-throw other errors so they show up in the UI
        throw error;
    }
}


