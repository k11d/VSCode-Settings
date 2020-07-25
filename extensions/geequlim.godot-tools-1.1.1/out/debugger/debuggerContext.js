"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const godotDebug_1 = require("./godotDebug");
const fs = require("fs");
function registerDebugger(context) {
    const provider = new GodotConfigurationProvider();
    context.subscriptions.push(vscode_1.debug.registerDebugConfigurationProvider("godot", provider));
    let factory = new GodotDebugAdapterFactory();
    context.subscriptions.push(vscode_1.debug.registerDebugAdapterDescriptorFactory("godot", factory));
    context.subscriptions.push(factory);
}
exports.registerDebugger = registerDebugger;
class GodotConfigurationProvider {
    resolveDebugConfiguration(folder, config, token) {
        if (!config.type && !config.request && !config.name) {
            const editor = vscode_1.window.activeTextEditor;
            if (editor && fs.existsSync(`${folder}/project.godot`)) {
                config.type = "godot";
                config.name = "Debug Godot";
                config.request = "launch";
                config.project = "${workspaceFolder}";
                config.port = 6007;
                config.address = "127.0.0.1";
                config.launchGameInstance = true;
            }
        }
        if (!config.project) {
            return vscode_1.window
                .showInformationMessage("Cannot find a project.godot in active workspace.")
                .then(() => {
                return undefined;
            });
        }
        return config;
    }
}
class GodotDebugAdapterFactory {
    createDebugAdapterDescriptor(session) {
        this.session = new godotDebug_1.GodotDebugSession();
        return new vscode_1.DebugAdapterInlineImplementation(this.session);
    }
    dispose() {
        this.session = undefined;
    }
}
//# sourceMappingURL=debuggerContext.js.map