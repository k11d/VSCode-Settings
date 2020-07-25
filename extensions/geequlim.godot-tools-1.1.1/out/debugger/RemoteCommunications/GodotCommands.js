"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GodotCommands {
    constructor(builder, parser, connection) {
        this.canWrite = false;
        this.commandBuffer = [];
        this.builder = builder;
        this.parser = parser;
        this.connection = connection;
    }
    sendBreakCommand() {
        let buffer = this.builder.createBufferedCommand("break", this.parser);
        this.addAndSend(buffer);
    }
    sendContinueCommand() {
        let buffer = this.builder.createBufferedCommand("continue", this.parser);
        this.addAndSend(buffer);
    }
    sendInspectObjectCommand(objectId) {
        let buffer = this.builder.createBufferedCommand("inspect_object", this.parser, [objectId]);
        this.addAndSend(buffer);
    }
    sendNextCommand() {
        let buffer = this.builder.createBufferedCommand("next", this.parser);
        this.addAndSend(buffer);
    }
    sendRemoveBreakpointCommand(file, line) {
        this.sendBreakpointCommand(false, file, line);
    }
    sendSetBreakpointCommand(file, line) {
        this.sendBreakpointCommand(true, file, line);
    }
    sendSkipBreakpointsCommand(skipBreakpoints) {
        let buffer = this.builder.createBufferedCommand("set_skip_breakpoints", this.parser, [skipBreakpoints]);
        this.addAndSend(buffer);
    }
    sendStackDumpCommand() {
        let buffer = this.builder.createBufferedCommand("get_stack_dump", this.parser);
        this.addAndSend(buffer);
    }
    sendStackFrameVarsCommand(level) {
        let buffer = this.builder.createBufferedCommand("get_stack_frame_vars", this.parser, [level]);
        this.addAndSend(buffer);
    }
    sendStepCommand() {
        let buffer = this.builder.createBufferedCommand("step", this.parser);
        this.addAndSend(buffer);
    }
    setCanWrite(value) {
        this.canWrite = value;
        if (this.canWrite) {
            this.sendBuffer();
        }
    }
    setConnection(connection) {
        this.connection = connection;
        this.canWrite = true;
    }
    addAndSend(buffer) {
        this.commandBuffer.push(buffer);
        this.sendBuffer();
    }
    sendBreakpointCommand(set, file, line) {
        let buffer = this.builder.createBufferedCommand("breakpoint", this.parser, [file, line, set]);
        this.addAndSend(buffer);
    }
    sendBuffer() {
        if (!this.connection) {
            return;
        }
        while (this.canWrite && this.commandBuffer.length > 0) {
            this.canWrite = this.connection.write(this.commandBuffer.shift());
        }
    }
}
exports.GodotCommands = GodotCommands;
//# sourceMappingURL=GodotCommands.js.map