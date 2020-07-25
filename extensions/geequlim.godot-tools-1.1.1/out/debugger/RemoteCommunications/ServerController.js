"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const terminate = require("terminate");
const net = require("net");
const cp = require("child_process");
const path = require("path");
const VariantParser_1 = require("../VariantParser");
const commands = require("./Commands");
const GodotCommands_1 = require("./GodotCommands");
const CommandBuilder_1 = require("./CommandBuilder");
class ServerController {
    constructor(eventEmitter, outputChannel) {
        this.inspectedCallbacks = new Map();
        this.scopeCallbacks = [];
        this.stackFiles = [];
        this.stackLevel = 0;
        this.exception = "";
        this.emitter = eventEmitter;
        this.outputChannel = outputChannel;
    }
    break() {
        var _a;
        (_a = this.godotCommands) === null || _a === void 0 ? void 0 : _a.sendBreakCommand();
    }
    continue() {
        var _a;
        (_a = this.godotCommands) === null || _a === void 0 ? void 0 : _a.sendContinueCommand();
    }
    getScope(level, callback) {
        var _a;
        (_a = this.godotCommands) === null || _a === void 0 ? void 0 : _a.sendStackFrameVarsCommand(level);
        this.stackLevel = level;
        if (callback) {
            this.scopeCallbacks.push(callback);
        }
    }
    inspectObject(id, inspected) {
        var _a;
        this.inspectedCallbacks.set(id, inspected);
        (_a = this.godotCommands) === null || _a === void 0 ? void 0 : _a.sendInspectObjectCommand(id);
    }
    next() {
        var _a;
        (_a = this.godotCommands) === null || _a === void 0 ? void 0 : _a.sendNextCommand();
    }
    removeBreakpoint(pathTo, line) {
        var _a;
        (_a = this.godotCommands) === null || _a === void 0 ? void 0 : _a.sendRemoveBreakpointCommand(pathTo, line);
    }
    setBreakpoint(pathTo, line) {
        var _a;
        (_a = this.godotCommands) === null || _a === void 0 ? void 0 : _a.sendSetBreakpointCommand(pathTo, line);
    }
    start(projectPath, port, address, launchGameInstance, breakpoints) {
        var _a;
        this.builder = new CommandBuilder_1.CommandBuilder();
        this.parser = new VariantParser_1.VariantParser();
        this.godotCommands = new GodotCommands_1.GodotCommands(this.builder, this.parser);
        this.builder.registerCommand(new commands.Command("debug_exit", params => {
            this.stop();
        }));
        this.builder.registerCommand(new commands.Command("debug_enter", params => {
            var _a;
            let reason = params[1];
            if (reason !== "Breakpoint") {
                this.exception = params[1];
            }
            else {
                this.exception = "";
            }
            (_a = this.godotCommands) === null || _a === void 0 ? void 0 : _a.sendStackDumpCommand();
        }));
        this.builder.registerCommand(new commands.Command("stack_dump", params => {
            let frames = params;
            this.triggerBreakpoint(frames.map(sf => {
                return {
                    id: sf.get("id"),
                    file: sf.get("file"),
                    function: sf.get("function"),
                    line: sf.get("line")
                };
            }));
        }));
        this.builder.registerCommand(new commands.Command("output", params => {
            params.forEach(line => {
                var _a;
                (_a = this.outputChannel) === null || _a === void 0 ? void 0 : _a.appendLine(line);
            });
        }));
        this.builder.registerCommand(new commands.Command("error", params => {
            params.forEach(param => { });
        }));
        this.builder.registerCommand(new commands.Command("performance", params => { }));
        this.builder.registerCommand(new commands.Command("message:inspect_object", params => {
            let id = params[0];
            let className = params[1];
            let properties = params[2];
            let cb = this.inspectedCallbacks.get(id);
            if (cb) {
                cb(className, properties);
                this.inspectedCallbacks.delete(id);
            }
        }));
        this.builder.registerCommand(new commands.Command("stack_frame_vars", params => {
            let locals = [];
            let members = [];
            let globals = [];
            let localCount = params[0] * 2;
            let memberCount = params[1 + localCount] * 2;
            let globalCount = params[2 + localCount + memberCount] * 2;
            if (localCount > 0) {
                locals = params.slice(1, 1 + localCount);
            }
            if (memberCount > 0) {
                members = params.slice(2 + localCount, 2 + localCount + memberCount);
            }
            if (globalCount > 0) {
                globals = params.slice(3 + localCount + memberCount, 3 + localCount + memberCount + globalCount);
            }
            this.pumpScope({
                locals: locals,
                members: members,
                globals: globals
            }, projectPath);
        }));
        this.server = net.createServer(connection => {
            var _a;
            this.connection = connection;
            (_a = this.godotCommands) === null || _a === void 0 ? void 0 : _a.setConnection(connection);
            connection.on("data", buffer => {
                if (!this.parser || !this.builder) {
                    return;
                }
                let len = buffer.byteLength;
                let offset = 0;
                do {
                    let data = this.parser.getBufferDataSet(buffer, offset);
                    let dataOffset = data[0];
                    offset += dataOffset;
                    len -= dataOffset;
                    this.builder.parseData(data.slice(1));
                } while (len > 0);
            });
            connection.on("close", hadError => {
                if (hadError) {
                    this.sendEvent("terminated");
                }
            });
            connection.on("end", () => {
                this.sendEvent("terminated");
            });
            connection.on("error", error => {
                console.error(error);
            });
            connection.on("drain", () => {
                var _a;
                connection.resume();
                (_a = this.godotCommands) === null || _a === void 0 ? void 0 : _a.setCanWrite(true);
            });
        });
        (_a = this.server) === null || _a === void 0 ? void 0 : _a.listen(port, address);
        if (launchGameInstance) {
            let execLine = `godot --path ${projectPath} --remote-debug ${address}:${port}`;
            execLine += this.buildBreakpointString(breakpoints, projectPath);
            let godotExec = cp.exec(execLine);
            this.godotPid = godotExec.pid;
        }
    }
    step() {
        var _a;
        (_a = this.godotCommands) === null || _a === void 0 ? void 0 : _a.sendStepCommand();
    }
    stop() {
        var _a;
        (_a = this.connection) === null || _a === void 0 ? void 0 : _a.end(() => {
            var _a;
            (_a = this.server) === null || _a === void 0 ? void 0 : _a.close();
            if (this.godotPid) {
                terminate(this.godotPid, (error) => {
                    if (error) {
                        console.error(error);
                    }
                });
            }
        });
        this.sendEvent("terminated");
    }
    buildBreakpointString(breakpoints, project) {
        let output = "";
        if (breakpoints.length > 0) {
            output += " --breakpoints ";
            breakpoints.forEach(bp => {
                let relativePath = path.relative(project, bp.file).replace(/\\/g, "/");
                if (relativePath.length !== 0) {
                    output += `res://${relativePath}:${bp.line},`;
                }
            });
            output = output.slice(0, -1);
        }
        return output;
    }
    pumpScope(scopes, projectPath) {
        if (this.scopeCallbacks.length > 0) {
            let cb = this.scopeCallbacks.shift();
            if (cb) {
                let stackFiles = this.stackFiles.map(sf => {
                    return sf.replace("res://", `${projectPath}/`);
                });
                cb(this.stackLevel, stackFiles, scopes);
            }
        }
    }
    sendEvent(event, ...args) {
        setImmediate(_ => {
            this.emitter.emit(event, ...args);
        });
    }
    triggerBreakpoint(stackFrames) {
        this.stackFiles = stackFrames.map(sf => {
            return sf.file;
        });
        if (this.exception.length === 0) {
            this.sendEvent("stopOnBreakpoint", stackFrames);
        }
        else {
            this.sendEvent("stopOnException", stackFrames, this.exception);
        }
    }
}
exports.ServerController = ServerController;
//# sourceMappingURL=ServerController.js.map