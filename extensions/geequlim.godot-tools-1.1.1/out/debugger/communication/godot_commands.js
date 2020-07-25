"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GodotCommands {
    constructor(builder, parser, connection) {
        this.can_write = false;
        this.command_buffer = [];
        this.builder = builder;
        this.parser = parser;
        this.connection = connection;
    }
    send_break_command() {
        let buffer = this.builder.create_buffered_command("break", this.parser);
        this.add_and_send(buffer);
    }
    send_continue_Command() {
        let buffer = this.builder.create_buffered_command("continue", this.parser);
        this.add_and_send(buffer);
    }
    send_inspect_object_command(object_id) {
        let buffer = this.builder.create_buffered_command("inspect_object", this.parser, [object_id]);
        this.add_and_send(buffer);
    }
    send_next_command() {
        let buffer = this.builder.create_buffered_command("next", this.parser);
        this.add_and_send(buffer);
    }
    send_remove_breakpoint_command(file, line) {
        this.send_breakpoint_command(false, file, line);
    }
    send_set_breakpoint_command(file, line) {
        this.send_breakpoint_command(true, file, line);
    }
    send_skip_breakpoints_command(skip_breakpoints) {
        let buffer = this.builder.create_buffered_command("set_skip_breakpoints", this.parser, [skip_breakpoints]);
        this.add_and_send(buffer);
    }
    send_stack_dump_command() {
        let buffer = this.builder.create_buffered_command("get_stack_dump", this.parser);
        this.add_and_send(buffer);
    }
    send_stack_frame_vars_command(level) {
        let buffer = this.builder.create_buffered_command("get_stack_frame_vars", this.parser, [level]);
        this.add_and_send(buffer);
    }
    send_step_command() {
        let buffer = this.builder.create_buffered_command("step", this.parser);
        this.add_and_send(buffer);
    }
    set_can_write(value) {
        this.can_write = value;
        if (this.can_write) {
            this.send_buffer();
        }
    }
    set_connection(connection) {
        this.connection = connection;
        this.can_write = true;
    }
    add_and_send(buffer) {
        this.command_buffer.push(buffer);
        this.send_buffer();
    }
    send_breakpoint_command(set, file, line) {
        let buffer = this.builder.create_buffered_command("breakpoint", this.parser, [file, line, set]);
        this.add_and_send(buffer);
    }
    send_buffer() {
        if (!this.connection) {
            return;
        }
        while (this.can_write && this.command_buffer.length > 0) {
            this.can_write = this.connection.write(this.command_buffer.shift());
        }
    }
}
exports.GodotCommands = GodotCommands;
//# sourceMappingURL=godot_commands.js.map