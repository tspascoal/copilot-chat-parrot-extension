import * as vscode from 'vscode';

const likeFeedbackList = [
    "How Can I write my own VS Code extension?",
    "I Love VS Code",
    "I Love GitHub Copilot",
    "GitHub Copilot Extensions are so cool"
];
/**
 * Generates follow-up prompts for the chat based on the configuration settings.
 * 
 * Only returns follow-up prompts if the configuration is enabled.
 * Only returns like follow-up prompts if the configuration is enabled. * 
 * 
 * @returns An array of follow-up prompts if enabled by the configuration.
 */
export function generateFollowups(): vscode.ChatFollowup[] | undefined {
    const config = vscode.workspace.getConfiguration('tspascoal.copilot.parrot');
    const provideFollowupsEnabled = config.get<boolean>('ProvideFollowups', true);

    if (!provideFollowupsEnabled) {
        console.log('Followups are not enabled');
        return;
    }

    const likeEnabled = config.get<boolean>('like.Enabled', true);

    // Get a random prompt from the list
    const randomPrompt = likeFeedbackList[Math.floor(Math.random() * likeFeedbackList.length)];

    const followups: vscode.ChatFollowup[] = [
        {
            label: `🦜Parrot '${randomPrompt}'`,
            prompt: randomPrompt,
            command: ""
        }
    ];
    
    if (likeEnabled) {
        followups.push(
            {
                label: `🦜Parrot '${randomPrompt}' like a pirate`,
                prompt: randomPrompt,
                command: "likeapirate"
            },            
            {
                label: `🦜 Parrot '${randomPrompt}' like Yoda`,
                prompt: randomPrompt,
                command: "likeyoda"
            }
        );
    }

    return followups;
}