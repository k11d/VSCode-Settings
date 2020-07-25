"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CommandBuilder {
    constructor() {
        this.commands = new Map();
    }
    createBufferedCommand(command, parser, parameters) {
        var _a;
        let commandArray = [command];
        if (parameters) {
            (_a = parameters) === null || _a === void 0 ? void 0 : _a.forEach(param => {
                commandArray.push(param);
            });
        }
        let buffer = parser.encodeVariant(commandArray);
        return buffer;
    }
    parseData(dataset) {
        while (dataset && dataset.length > 0) {
            if (this.currentCommand) {
                let nextCommand = this.currentCommand.chain();
                if (nextCommand === this.currentCommand) {
                    this.currentCommand.appendParameter(dataset.shift());
                }
                else {
                    this.currentCommand = nextCommand;
                }
            }
            else {
                let data = dataset.shift();
                let command = this.commands.get(data);
                if (command) {
                    this.currentCommand = command;
                }
                else {
                    console.error(`Unsupported command: ${data}`);
                }
            }
        }
    }
    registerCommand(command) {
        let name = command.name;
        this.commands.set(name, command);
    }
}
exports.CommandBuilder = CommandBuilder;
//# sourceMappingURL=CommandBuilder.js.map