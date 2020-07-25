"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("./command");
class CommandBuilder {
    constructor() {
        this.commands = new Map();
        this.dummy_command = new command_1.Command("---");
    }
    create_buffered_command(command, parser, parameters) {
        var _a;
        let command_array = [command];
        if (parameters) {
            (_a = parameters) === null || _a === void 0 ? void 0 : _a.forEach(param => {
                command_array.push(param);
            });
        }
        let buffer = parser.encode_variant(command_array);
        return buffer;
    }
    parse_data(dataset) {
        while (dataset && dataset.length > 0) {
            if (this.current_command) {
                let next_command = this.current_command.chain();
                if (next_command === this.current_command) {
                    this.current_command.append_parameters(dataset.shift());
                }
                else {
                    this.current_command = next_command;
                }
            }
            else {
                let data = dataset.shift();
                let command = this.commands.get(data);
                if (command) {
                    this.current_command = command;
                }
                else {
                    console.log(`Unsupported command: ${data}. Skipping.`);
                    this.current_command = this.dummy_command;
                }
            }
        }
    }
    register_command(command) {
        let name = command.name;
        this.commands.set(name, command);
    }
}
exports.CommandBuilder = CommandBuilder;
//# sourceMappingURL=command_builder.js.map