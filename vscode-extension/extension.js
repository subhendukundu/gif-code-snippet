const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
// stream the results as they are available into myanimated.gif

const {
	homedir
} = require('os');
const P_TITLE = 'Gif snippet 📸';

const writeSerializedBlobToFile = (serializeBlob, fileName) => {
	const bytes = new Uint8Array(serializeBlob.split(','));
	fs.writeFileSync(fileName, Buffer.from(bytes));
	vscode.window.showInformationMessage('File is saved');
};
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const htmlPath = path.resolve(context.extensionPath, 'webview/index.html');

	let lastUsedImageUri = vscode.Uri.file(path.resolve(homedir(), 'Desktop/code.png'));
	let lastUsedGifUri = vscode.Uri.file(path.resolve(homedir(), 'Desktop/code.gif'));
	let panel = void 0;

	vscode.window.registerWebviewPanelSerializer('gifExtension', {
		async deserializeWebviewPanel(_panel, state) {
			panel = _panel;
			panel.webview.html = getHtmlContent(htmlPath);
			panel.webview.postMessage({
				type: 'restore',
				innerHTML: state.innerHTML,
				bgColor: context.globalState.get('gifExtension.bgColor', '#2e3440')
			});
			const selectionListener = setupSelectionSync();
			panel.onDidDispose(() => {
				selectionListener.dispose();
			});
			setupMessageListeners();
		}
	});

	const disposable = vscode.commands.registerCommand('extension.getGif', () => {
		panel = vscode.window.createWebviewPanel('gifExtension', P_TITLE, 2, {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'webview'))]
		});
		panel.webview.html = getHtmlContent(htmlPath);

		const selectionListener = setupSelectionSync();
		panel.onDidDispose(() => {
			selectionListener.dispose();
		});

		setupMessageListeners();

		const fontFamily = vscode.workspace.getConfiguration('editor').fontFamily;
		const bgColor = context.globalState.get('extension.bgColor', '#2e3440');
		panel.webview.postMessage({
			type: 'init',
			fontFamily,
			bgColor
		});
		syncSettings();
	});

	context.subscriptions.push(disposable);

	function setupMessageListeners() {
		panel.webview.onDidReceiveMessage(({
			type,
			data
		}) => {
			switch (type) {
				case 'shoot':
					vscode.window
						.showSaveDialog({
							defaultUri: lastUsedImageUri,
							filters: {
								Images: ['png']
							}
						})
						.then(uri => {
							if (uri) {
								writeSerializedBlobToFile(data.serializedBlob, uri.fsPath);
								lastUsedImageUri = uri;
							}
						});
					break;
				case 'create':
					vscode.window
					.showSaveDialog({
						defaultUri: lastUsedGifUri,
						filters: {
							Images: ['gif']
						}
					})
					.then(uri => {
						if (uri) {
								const { image } = data;
								var base64Data = image.replace(/^data:image\/gif;base64,/, "");
								fs.writeFile(uri.fsPath, base64Data, 'base64', function(err) {
									if(err) {
										console.log(err);
									} else {
										vscode.window.showInformationMessage('File is saved');
									}
								});
								lastUsedGifUri = uri;
							}
						});
					break;
				case 'getAndUpdateCacheAndSettings':
					panel.webview.postMessage({
						type: 'restoreBgColor',
						bgColor: context.globalState.get('extension.bgColor', '#2e3440')
					});

					syncSettings();
					break;
				case 'updateBgColor':
					context.globalState.update('extension.bgColor', data.bgColor)
					break;
				case 'invalidPasteContent':
					vscode.window.showInformationMessage(
						'Pasted content is invalid. Only copy from VS Code and check if your shortcuts for copy/paste have conflicts.'
					);
					break;
				default :
					break;
			}
		});
	}

	function syncSettings() {
		const settings = vscode.workspace.getConfiguration('extension');
		const editorSettings = vscode.workspace.getConfiguration('editor', null);
		panel.webview.postMessage({
			type: 'updateSettings',
			shadow: settings.get('shadow'),
			transparentBackground: settings.get('transparentBackground'),
			backgroundColor: settings.get('backgroundColor'),
			target: settings.get('target'),
			ligature: editorSettings.get('fontLigatures')
		});
	}

	function setupSelectionSync() {
		return vscode.window.onDidChangeTextEditorSelection(e => {
			if (e.selections[0] && !e.selections[0].isEmpty) {
				vscode.commands.executeCommand('editor.action.clipboardCopyAction');
				panel.postMessage({
					type: 'update'
				});
			}
		});
	}

	function getHtmlContent(htmlPath) {
		const htmlContent = fs.readFileSync(htmlPath, 'utf-8')
		return htmlContent.replace(/script src="([^"]*)"/g, (match, src) => {
			const realSource = 'vscode-resource:' + path.resolve(htmlPath, '..', src);
			return `script src="${realSource}"`;
		});
	}
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
};