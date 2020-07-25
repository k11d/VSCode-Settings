"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("../command");
const mediator_1 = require("../../mediator");
class CommandOutput extends command_1.Command {
    trigger(parameters) {
        let lines = parameters;
        mediator_1.Mediator.notify("output", lines);
    }
}
exports.CommandOutput = CommandOutput;
//# sourceMappingURL=command_output.js.map