const vscode = require('vscode');

const BOILERPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title</title>
</head>
<body>
    <!-- Visible content goes here -->
    <h1>Hello, World!</h1>
    <p>This is a basic HTML page.</p>
</body>
</html>`;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('HTML Boilerplate (inline) extension active');

    // Register the inline completion provider
    const provider = vscode.languages.registerInlineCompletionItemProvider(
        { language: 'html' },
        {
            provideInlineCompletionItems(document, position) {
                if (position.line !== 0) return [];

                const fullText = document.getText().trim();
                const lineText = document.lineAt(0).text;

                // Only show suggestion when file is effectively empty
                // (empty, or just the single trigger char we inserted)
                const isEffectivelyEmpty = fullText === '' || fullText === '\u200B';
                const hasTriggerChar = lineText === '\u200B';

                if (!isEffectivelyEmpty && !hasTriggerChar) return [];

                const item = new vscode.InlineCompletionItem(
                    BOILERPLATE,
                    new vscode.Range(
                        new vscode.Position(0, 0),
                        new vscode.Position(0, lineText.length)
                    )
                );
                return [item];
            }
        }
    );

    context.subscriptions.push(provider);

    // When an HTML file opens, if it's empty, insert a zero-width space
    // then immediately delete it — this fires the inline completion trigger
    const onOpen = vscode.workspace.onDidOpenTextDocument(async (document) => {
        if (document.languageId !== 'html') return;
        if (document.getText().trim() !== '') return;

        // Wait for editor to be ready
        await new Promise(r => setTimeout(r, 150));

        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.uri.toString() !== document.uri.toString()) return;

        // Insert a zero-width space to wake up the inline completion engine
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), '\u200B');
        });

        // Tiny pause, then delete it — leaving the file "empty" but having triggered the provider
        await new Promise(r => setTimeout(r, 50));

        await editor.edit(editBuilder => {
            editBuilder.delete(new vscode.Range(
                new vscode.Position(0, 0),
                new vscode.Position(0, 1)
            ));
        });

        // Explicitly ask VS Code to re-evaluate inline completions
        await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
    });

    context.subscriptions.push(onOpen);
}

function deactivate() {}

module.exports = { activate, deactivate };
