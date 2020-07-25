"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TERMINATE = require("terminate");
const net = require("net");
const cp = require("child_process");
const path = require("path");
const variant_parser_1 = require("../variant_parser");
const command_1 = require("./command");
const godot_commands_1 = require("./godot_commands");
const command_builder_1 = require("./command_builder");
const utils = require("../../utils");
class ServerController {
    constructor(event_emitter, output_channel) {
        this.breakpoints = [];
        this.exception = "";
        this.inspected_callbacks = [];
        this.scope_callbacks = [];
        this.stack_count = 0;
        this.stack_files = [];
        this.stack_level = 0;
        this.stepping_out = false;
        this.emitter = event_emitter;
        this.output_channel = output_channel;
    }
    break() {
        var _a;
        (_a = this.godot_commands) === null || _a === void 0 ? void 0 : _a.send_break_command();
    }
    continue() {
        var _a;
        (_a = this.godot_commands) === null || _a === void 0 ? void 0 : _a.send_continue_Command();
    }
    get_scope(level, callback) {
        var _a;
        (_a = this.godot_commands) === null || _a === void 0 ? void 0 : _a.send_stack_frame_vars_command(level);
        this.stack_level = level;
        if (callback) {
            this.scope_callbacks.push(callback);
        }
    }
    inspect_object(id, inspected) {
        var _a;
        this.inspected_callbacks.push(inspected);
        (_a = this.godot_commands) === null || _a === void 0 ? void 0 : _a.send_inspect_object_command(id);
    }
    next() {
        var _a;
        (_a = this.godot_commands) === null || _a === void 0 ? void 0 : _a.send_next_command();
    }
    remove_breakpoint(path_to, line) {
        var _a;
        this.breakpoints.splice(this.breakpoints.findIndex(bp => bp.file === path_to && bp.line === line), 1);
        (_a = this.godot_commands) === null || _a === void 0 ? void 0 : _a.send_remove_breakpoint_command(path_to, line);
    }
    set_breakpoint(path_to, line) {
        var _a;
        this.breakpoints.push({ file: path_to, line: line });
        (_a = this.godot_commands) === null || _a === void 0 ? void 0 : _a.send_set_breakpoint_command(path_to, line);
    }
    start(project_path, port, address, launch_game_instance, breakpoints) {
        var _a;
        this.builder = new command_builder_1.CommandBuilder();
        this.parser = new variant_parser_1.VariantParser();
        this.project_path = project_path.replace(/\\/g, "/");
        if (this.project_path.match(/^[A-Z]:\//)) {
            this.project_path =
                this.project_path[0].toLowerCase() + this.project_path.slice(1);
        }
        this.godot_commands = new godot_commands_1.GodotCommands(this.builder, this.parser);
        if (breakpoints) {
            this.breakpoints = breakpoints.map(bp => {
                return { file: bp.file, line: bp.line };
            });
        }
        this.builder.register_command(new command_1.Command("debug_exit", params => { }));
        this.builder.register_command(new command_1.Command("debug_enter", params => {
            var _a;
            let reason = params[1];
            if (reason !== "Breakpoint") {
                this.exception = params[1];
            }
            else {
                this.exception = "";
            }
            (_a = this.godot_commands) === null || _a === void 0 ? void 0 : _a.send_stack_dump_command();
        }));
        this.builder.register_command(new command_1.Command("stack_dump", params => {
            let frames = params;
            this.trigger_breakpoint(frames.map((sf, i) => {
                return {
                    id: i,
                    thread_id: sf.get("id"),
                    file: sf.get("file"),
                    function: sf.get("function"),
                    line: sf.get("line")
                };
            }));
        }));
        this.builder.register_command(new command_1.Command("output", params => {
            params.forEach(line => {
                var _a;
                (_a = this.output_channel) === null || _a === void 0 ? void 0 : _a.appendLine(line);
            });
        }));
        this.builder.register_command(new command_1.Command("error", params => {
            params.forEach(param => { });
        }));
        this.builder.register_command(new command_1.Command("performance", params => { }));
        this.builder.register_command(new command_1.Command("message:inspect_object", params => {
            let id = params[0];
            let class_name = params[1];
            let properties = params[2];
            let callback = this.inspected_callbacks.shift();
            if (callback) {
                callback(class_name, properties);
            }
        }));
        this.builder.register_command(new command_1.Command("stack_frame_vars", params => {
            let locals = [];
            let members = [];
            let globals = [];
            let local_count = params[0] * 2;
            let member_count = params[1 + local_count] * 2;
            let global_count = params[2 + local_count + member_count] * 2;
            if (local_count > 0) {
                locals = params.slice(1, 1 + local_count);
            }
            if (member_count > 0) {
                members = params.slice(2 + local_count, 2 + local_count + member_count);
            }
            if (global_count > 0) {
                globals = params.slice(3 + local_count + member_count, 3 + local_count + member_count + global_count);
            }
            this.pumpScope({
                locals: locals,
                members: members,
                globals: globals
            }, project_path);
        }));
        this.server = net.createServer(connection => {
            var _a;
            this.connection = connection;
            (_a = this.godot_commands) === null || _a === void 0 ? void 0 : _a.set_connection(connection);
            if (!launch_game_instance) {
                this.breakpoints.forEach(bp => {
                    var _a;
                    let path_to = path
                        .relative(this.project_path, bp.file)
                        .replace(/\\/g, "/");
                    (_a = this.godot_commands) === null || _a === void 0 ? void 0 : _a.send_set_breakpoint_command(`res://${path_to}`, bp.line);
                });
            }
            connection.on("data", buffer => {
                if (!this.parser || !this.builder) {
                    return;
                }
                let len = buffer.byteLength;
                let offset = 0;
                do {
                    let data = this.parser.get_buffer_dataset(buffer, offset);
                    let data_offset = data[0];
                    offset += data_offset;
                    len -= data_offset;
                    this.builder.parse_data(data.slice(1));
                } while (len > 0);
            });
            connection.on("close", hadError => {
                if (hadError) {
                    this.send_event("terminated");
                }
            });
            connection.on("end", () => {
                this.send_event("terminated");
            });
            connection.on("error", error => {
                console.error(error);
            });
            connection.on("drain", () => {
                var _a;
                connection.resume();
                (_a = this.godot_commands) === null || _a === void 0 ? void 0 : _a.set_can_write(true);
            });
        });
        (_a = this.server) === null || _a === void 0 ? void 0 : _a.listen(port, address);
        if (launch_game_instance) {
            let godot_path = utils.get_configuration("editor_path", "godot");
            let executable_line = `${godot_path} --path ${project_path} --remote-debug ${address}:${port}`;
            executable_line += this.build_breakpoint_string(breakpoints, project_path);
            let godot_exec = cp.exec(executable_line);
            this.godot_pid = godot_exec.pid;
        }
    }
    step() {
        var _a;
        (_a = this.godot_commands) === null || _a === void 0 ? void 0 : _a.send_step_command();
    }
    step_out() {
        this.stepping_out = true;
        this.next();
    }
    stop() {
        var _a;
        (_a = this.connection) === null || _a === void 0 ? void 0 : _a.end(() => {
            var _a;
            (_a = this.server) === null || _a === void 0 ? void 0 : _a.close();
            if (this.godot_pid) {
                TERMINATE(this.godot_pid, (error) => {
                    if (error) {
                        console.error(error);
                    }
                });
            }
        });
        this.send_event("terminated");
    }
    build_breakpoint_string(breakpoints, project) {
        let output = "";
        if (breakpoints.length > 0) {
            output += " --breakpoints ";
            breakpoints.forEach(bp => {
                let relative_path = path.relative(project, bp.file).replace(/\\/g, "/");
                if (relative_path.length !== 0) {
                    output += `res://${relative_path}:${bp.line},`;
                }
            });
            output = output.slice(0, -1);
        }
        return output;
    }
    pumpScope(scopes, projectPath) {
        if (this.scope_callbacks.length > 0) {
            let cb = this.scope_callbacks.shift();
            if (cb) {
                let stack_files = this.stack_files.map(sf => {
                    return sf.replace("res://", `${projectPath}/`);
                });
                cb(this.stack_level, stack_files, scopes);
            }
        }
    }
    send_event(event, ...args) {
        setImmediate(_ => {
            this.emitter.emit(event, ...args);
        });
    }
    trigger_breakpoint(stack_frames) {
        let continue_stepping = false;
        let stack_count = stack_frames.length;
        let file = stack_frames[0].file.replace("res://", `${this.project_path}/`);
        let line = stack_frames[0].line;
        if (this.stepping_out) {
            let breakpoint = this.breakpoints.find(k => k.file === file && k.line === line);
            if (!breakpoint) {
                if (this.stack_count > 1) {
                    continue_stepping = this.stack_count === stack_count;
                }
                else {
                    let file_same = stack_frames[0].file === this.last_frame.file;
                    let func_same = stack_frames[0].function === this.last_frame.function;
                    let line_greater = stack_frames[0].line >= this.last_frame.line;
                    continue_stepping = file_same && func_same && line_greater;
                }
            }
        }
        this.stack_count = stack_count;
        this.last_frame = stack_frames[0];
        if (continue_stepping) {
            this.next();
            return;
        }
        this.stepping_out = false;
        this.stack_files = stack_frames.map(sf => {
            return sf.file;
        });
        if (this.exception.length === 0) {
            this.send_event("stopOnBreakpoint", stack_frames);
        }
        else {
            this.send_event("stopOnException", stack_frames, this.exception);
        }
    }
}
exports.ServerController = ServerController;
//# sourceMappingURL=server_controller.js.map