"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_debugadapter_1 = require("vscode-debugadapter");
const vscode_1 = require("vscode");
const godot_debug_runtime_1 = require("./godot_debug_runtime");
const { Subject } = require("await-notify");
const fs = require("fs");
const variable_scope_1 = require("./variable_scope");
class GodotDebugSession extends vscode_debugadapter_1.LoggingDebugSession {
    constructor() {
        super();
        this.configuration_done = new Subject();
        this.excepted = false;
        this.inspected = [];
        this.last_frames = [];
        this.scope_id = 1;
        this.scopes = new Map();
        this.have_scopes = [];
        this.current_stack_level = 0;
        this.output_channel = vscode_1.window.createOutputChannel("Godot");
        this.setDebuggerLinesStartAt1(false);
        this.setDebuggerColumnsStartAt1(false);
        this.runtime = new godot_debug_runtime_1.GodotDebugRuntime();
        this.runtime.on("stopOnBreakpoint", frames => {
            this.last_frames = frames;
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent("breakpoint", GodotDebugSession.MAIN_THREAD_ID));
        });
        this.runtime.on("stopOnException", (frames, exception) => {
            this.last_frames = frames;
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent("exception", GodotDebugSession.MAIN_THREAD_ID, exception));
        });
        this.runtime.on("terminated", () => {
            this.sendEvent(new vscode_debugadapter_1.TerminatedEvent(false));
        });
    }
    dispose() {
        this.output_channel.dispose();
    }
    configurationDoneRequest(response, args) {
        super.configurationDoneRequest(response, args);
        this.configuration_done.notify();
    }
    continueRequest(response, args) {
        if (this.excepted) {
            return;
        }
        this.scopes.clear();
        response.body = {
            allThreadsContinued: true
        };
        this.runtime.continue();
        this.sendResponse(response);
    }
    evaluateRequest(response, args) {
        this.have_scopes.push(() => {
            if (args.expression.match(/[^a-zA-Z0-9_\[\]\.]/g)) {
                response.body = {
                    result: "not supported",
                    variablesReference: 0
                };
                this.sendResponse(response);
                return;
            }
            let is_self = args.expression.match(/^self\./);
            let expression = args.expression
                .replace(/[\[\]]/g, ".")
                .replace(/\.$/, "")
                .replace(/^self./, "");
            let variable;
            let scope_keys = Array.from(this.scopes.get(this.current_stack_level).keys());
            let variable_id = -1;
            for (let i = 0; i < scope_keys.length; ++i) {
                let scopes = this.scopes
                    .get(this.current_stack_level)
                    .get(scope_keys[i]);
                for (let l = is_self ? 1 : 0; l < 3; ++l) {
                    variable_id = scopes[l].get_id_for(expression);
                    if (variable_id !== -1) {
                        variable = scopes[l].get_variable(variable_id);
                        break;
                    }
                }
                if (variable) {
                    break;
                }
            }
            if (!variable) {
                response.body = {
                    result: "not available",
                    variablesReference: 0
                };
                this.sendResponse(response);
                return;
            }
            let value_type_pair = this.get_stringified_value_pair(variable.value);
            response.body = {
                result: value_type_pair.value,
                type: value_type_pair.type,
                variablesReference: variable_id
            };
            this.sendResponse(response);
        });
        if (this.scopes.size > 0 &&
            this.scopes.get(this.current_stack_level).size > 0) {
            this.have_scopes.shift()();
        }
    }
    initializeRequest(response, args) {
        response.body = response.body || {};
        response.body.supportsConfigurationDoneRequest = true;
        response.body.supportsTerminateRequest = true;
        response.body.supportsEvaluateForHovers = false;
        response.body.supportsStepBack = false;
        response.body.supportsGotoTargetsRequest = false;
        response.body.supportsCancelRequest = false;
        response.body.supportsCompletionsRequest = false;
        response.body.supportsFunctionBreakpoints = false;
        response.body.supportsDataBreakpoints = false;
        response.body.supportsBreakpointLocationsRequest = false;
        response.body.supportsConditionalBreakpoints = false;
        response.body.supportsHitConditionalBreakpoints = false;
        response.body.supportsLogPoints = false;
        response.body.supportsModulesRequest = false;
        response.body.supportsReadMemoryRequest = false;
        response.body.supportsRestartFrame = false;
        response.body.supportsRestartRequest = false;
        response.body.supportsSetExpression = false;
        response.body.supportsSetVariable = false;
        response.body.supportsStepInTargetsRequest = false;
        response.body.supportsTerminateThreadsRequest = false;
        this.sendResponse(response);
        this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
    }
    launchRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.configuration_done.wait(1000);
            this.excepted = false;
            this.runtime.start(args.project, args.address, args.port, args.launch_game_instance, this.output_channel);
            this.sendResponse(response);
        });
    }
    nextRequest(response, args) {
        if (this.excepted) {
            return;
        }
        this.scopes.clear();
        this.runtime.next();
        this.sendResponse(response);
    }
    pauseRequest(response, args) {
        if (this.excepted) {
            return;
        }
        this.runtime.break();
        this.sendResponse(response);
    }
    scopesRequest(response, args) {
        this.runtime.getScope(args.frameId, (stack_level, stack_files, scopes) => {
            this.scope_id = 1;
            this.current_stack_level = stack_level;
            let file = stack_files[stack_level];
            let file_scopes = [];
            let local_scope = new variable_scope_1.VariableScope(this.scope_id++);
            let member_scope = new variable_scope_1.VariableScope(this.scope_id++);
            let global_scope = new variable_scope_1.VariableScope(this.scope_id++);
            file_scopes.push(local_scope);
            file_scopes.push(member_scope);
            file_scopes.push(global_scope);
            this.scopes.clear();
            this.scopes.set(stack_level, new Map([[file, file_scopes]]));
            let out_local_scope = {
                name: "Locals",
                namedVariables: scopes.locals.length / 2,
                presentationHint: "locals",
                expensive: false,
                variablesReference: local_scope.id
            };
            for (let i = 0; i < scopes.locals.length; i += 2) {
                let name = scopes.locals[i];
                let value = scopes.locals[i + 1];
                this.drill_scope(local_scope, {
                    name: name,
                    value: value ? value : undefined
                }, !value && typeof value === "number");
            }
            let out_member_scope = {
                name: "Members",
                namedVariables: scopes.members.length / 2,
                presentationHint: "locals",
                expensive: false,
                variablesReference: member_scope.id
            };
            for (let i = 0; i < scopes.members.length; i += 2) {
                let name = scopes.members[i];
                let value = scopes.members[i + 1];
                this.drill_scope(member_scope, { name: name, value: value }, !value && typeof value === "number");
            }
            let out_global_scope = {
                name: "Globals",
                namedVariables: scopes.globals.length / 2,
                presentationHint: "locals",
                expensive: false,
                variablesReference: global_scope.id
            };
            for (let i = 0; i < scopes.globals.length; i += 2) {
                let name = scopes.globals[i];
                let value = scopes.globals[i + 1];
                this.drill_scope(global_scope, { name: name, value: value }, !value && typeof value === "number");
            }
            response.body = {
                scopes: [out_local_scope, out_member_scope, out_global_scope]
            };
            if (this.inspected.length === 0) {
                while (this.have_scopes.length > 0) {
                    this.have_scopes.shift()();
                }
                this.sendResponse(response);
            }
            else {
                this.inspect_callback = () => {
                    while (this.have_scopes.length > 0) {
                        this.have_scopes.shift()();
                    }
                    this.sendResponse(response);
                };
            }
        });
    }
    setBreakPointsRequest(response, args) {
        let path = args.source.path.replace(/\\/g, "/");
        let client_lines = args.lines || [];
        if (fs.existsSync(path)) {
            let bps = this.runtime.get_breakpoints(path);
            let bp_lines = bps.map(bp => bp.line);
            bps.forEach(bp => {
                if (client_lines.indexOf(bp.line) === -1) {
                    this.runtime.remove_breakpoint(path, bp.line);
                }
            });
            client_lines.forEach(l => {
                if (bp_lines.indexOf(l) === -1) {
                    this.runtime.set_breakpoint(path, l);
                }
            });
            bps = this.runtime.get_breakpoints(path);
            response.body = {
                breakpoints: bps.map(bp => {
                    return new vscode_debugadapter_1.Breakpoint(true, bp.line, 1, new vscode_debugadapter_1.Source(bp.file.split("/").reverse()[0], bp.file, bp.id));
                })
            };
            this.sendResponse(response);
        }
    }
    setExceptionBreakPointsRequest(response, args) {
        this.excepted = true;
        this.sendResponse(response);
    }
    stackTraceRequest(response, args) {
        if (this.last_frames) {
            response.body = {
                totalFrames: this.last_frames.length,
                stackFrames: this.last_frames.map(sf => {
                    return {
                        id: sf.id,
                        name: sf.function,
                        line: sf.line,
                        column: 1,
                        source: new vscode_debugadapter_1.Source(sf.file, `${this.runtime.getProject()}/${sf.file.replace("res://", "")}`)
                    };
                })
            };
        }
        this.sendResponse(response);
    }
    stepInRequest(response, args) {
        if (this.excepted) {
            return;
        }
        this.scopes.clear();
        this.runtime.step();
        this.sendResponse(response);
    }
    stepOutRequest(response, args) {
        if (this.excepted) {
            return;
        }
        this.runtime.step_out();
        this.sendResponse(response);
    }
    terminateRequest(response, args) {
        this.runtime.terminate();
        this.sendResponse(response);
    }
    threadsRequest(response) {
        response.body = {
            threads: [new vscode_debugadapter_1.Thread(GodotDebugSession.MAIN_THREAD_ID, "thread_1")]
        };
        this.sendResponse(response);
    }
    variablesRequest(response, args, request) {
        return __awaiter(this, void 0, void 0, function* () {
            let out_id = args.variablesReference;
            let files = Array.from(this.scopes.get(this.current_stack_level).keys());
            let out_scope_object = this.get_variable_scope(files, out_id);
            let is_scope = out_scope_object.isScope;
            let out_scope = out_scope_object.scope;
            if (out_scope) {
                if (is_scope) {
                    let var_ids = out_scope.get_variable_ids();
                    response.body = {
                        variables: this.parse_scope(var_ids, out_scope)
                    };
                }
                else {
                    let variable = out_scope.get_variable(out_id);
                    if (variable) {
                        let sub_variables = out_scope.get_sub_variables_for(out_id);
                        if (sub_variables) {
                            let ids = out_scope.get_variable_ids();
                            let path_to = variable.name;
                            response.body = {
                                variables: []
                            };
                            if (args.filter === "indexed") {
                                let count = args.count || 0;
                                for (let i = 0; i < count; i++) {
                                    let name = `${path_to}.${i}`;
                                    let id_index = ids.findIndex(id => {
                                        var _a;
                                        let variable = (_a = out_scope) === null || _a === void 0 ? void 0 : _a.get_variable(id);
                                        return variable && name === variable.name;
                                    });
                                    response.body.variables.push(this.get_variable_response(name, variable.value[i], ids[id_index]));
                                }
                            }
                            else {
                                sub_variables.forEach(sv => {
                                    let name = sv.name;
                                    let id_index = ids.findIndex(id => {
                                        var _a;
                                        let variable = (_a = out_scope) === null || _a === void 0 ? void 0 : _a.get_variable(id);
                                        return variable && name === variable.name;
                                    });
                                    response.body.variables.push(this.get_variable_response(name, sv.value, ids[id_index]));
                                });
                            }
                        }
                        else {
                            response.body = {
                                variables: [
                                    this.get_variable_response(variable.name, variable.value, 0, true)
                                ]
                            };
                        }
                    }
                    else {
                        response.body = { variables: [] };
                    }
                }
                this.sendResponse(response);
            }
        });
    }
    drill_scope(scope, variable, is_zero_number) {
        if (is_zero_number) {
            variable.value = 0;
        }
        let id = scope.get_id_for(variable.name);
        if (id === -1) {
            id = this.scope_id++;
        }
        scope.set_variable(variable.name, variable.value, id);
        if (Array.isArray(variable.value) || variable.value instanceof Map) {
            let length = 0;
            let values;
            if (variable.value instanceof Map) {
                length = variable.value.size;
                let keys = Array.from(variable.value.keys());
                values = keys.map(key => {
                    let value = variable.value.get(key);
                    let stringified_key = this.get_stringified_value_pair(key).value;
                    return {
                        __type__: "Pair",
                        key: key,
                        value: value,
                        __render__: () => stringified_key
                    };
                });
                variable.value = values;
            }
            else {
                length = variable.value.length;
                values = variable.value;
            }
            for (let i = 0; i < length; i++) {
                let name = `${variable.name}.${i}`;
                scope.set_sub_variable_for(id, name, values[i]);
                this.drill_scope(scope, {
                    name: name,
                    value: values[i]
                });
            }
        }
        else if (typeof variable.value === "object") {
            if (variable.value.__type__ && variable.value.__type__ === "Object") {
                if (this.inspected.indexOf(id) === -1) {
                    this.inspected.push(id);
                    this.runtime.inspect_object(variable.value.id, (class_name, properties) => {
                        variable.value.__type__ = class_name;
                        let start_index = properties.findIndex(p => {
                            return p[0] === class_name;
                        });
                        variable.value.__render__ = () => `${class_name}`;
                        let relevant_properties = properties
                            .slice(start_index + 1)
                            .filter(p => {
                            if (!p[5]) {
                                return Number.isInteger(p[5]);
                            }
                            return true;
                        });
                        relevant_properties.forEach(p => {
                            let sub_name = `${variable.name}.${p[0]}`;
                            scope.set_sub_variable_for(id, sub_name, p[5]);
                            this.drill_scope(scope, { name: sub_name, value: p[5] });
                        });
                        this.inspected.splice(this.inspected.indexOf(variable.value.id), 1);
                        if (this.inspected.length === 0 && this.inspect_callback) {
                            this.inspect_callback();
                        }
                    });
                }
            }
            else {
                for (const PROP in variable.value) {
                    if (PROP !== "__type__" && PROP !== "__render__") {
                        let name = `${variable.name}.${PROP}`;
                        scope.set_sub_variable_for(id, name, variable.value[PROP]);
                        this.drill_scope(scope, {
                            name: name,
                            value: variable.value[PROP]
                        });
                    }
                }
            }
        }
    }
    get_stringified_value_pair(var_value) {
        let type = "";
        let value = "";
        let skip_id = true;
        if (typeof var_value === "number" && !Number.isInteger(var_value)) {
            value = String(+Number.parseFloat(no_exponents(var_value)).toFixed(4));
            type = "Float";
        }
        else if (Array.isArray(var_value)) {
            value = "Array";
            type = "Array";
            skip_id = false;
        }
        else if (var_value instanceof Map) {
            value = "Dictionary";
            type = "Dictionary";
            skip_id = false;
        }
        else if (typeof var_value === "object") {
            skip_id = false;
            if (var_value.__type__) {
                if (var_value.__type__ === "Object") {
                    skip_id = true;
                }
                if (var_value.__render__) {
                    value = var_value.__render__();
                }
                else {
                    value = var_value.__type__;
                }
                type = var_value.__type__;
            }
            else {
                value = "Object";
            }
        }
        else {
            if (var_value) {
                if (Number.isInteger(var_value)) {
                    type = "Int";
                    value = `${var_value}`;
                }
                else if (typeof var_value === "string") {
                    type = "String";
                    value = String(var_value);
                }
                else {
                    type = "unknown";
                    value = `${var_value}`;
                }
            }
            else {
                if (Number.isInteger(var_value)) {
                    type = "Int";
                    value = "0";
                }
                else {
                    type = "unknown";
                    value = "null";
                }
            }
        }
        return { type: type, value: value, skip_id: skip_id };
    }
    get_variable_response(var_name, var_value, id, skip_sub_var) {
        let value = "";
        let ref_id = 0;
        let array_count = 0;
        let type = "";
        if (!skip_sub_var) {
            let output = this.get_stringified_value_pair(var_value);
            value = output.value;
            type = output.type;
            ref_id = output.skip_id ? 0 : id;
        }
        return {
            name: var_name.replace(/([a-zA-Z0-9_]+?\.)*/g, ""),
            value: value,
            variablesReference: ref_id,
            indexedVariables: array_count,
            type: type
        };
    }
    get_variable_scope(files, scope_id) {
        let out_scope;
        let is_scope = false;
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let scopes = this.scopes.get(this.current_stack_level).get(file);
            if (scopes) {
                let index = scopes.findIndex(s => {
                    return s.id === scope_id;
                });
                if (index !== -1) {
                    out_scope = scopes[index];
                    is_scope = true;
                    break;
                }
                else {
                    for (let l = 0; l < scopes.length; l++) {
                        let scope = scopes[l];
                        let ids = scope.get_variable_ids();
                        for (let k = 0; k < ids.length; k++) {
                            let id = ids[k];
                            if (scope_id === id) {
                                out_scope = scope;
                                is_scope = false;
                                break;
                            }
                        }
                    }
                }
            }
        }
        return { isScope: is_scope, scope: out_scope };
    }
    parse_scope(var_ids, out_scope) {
        let output = [];
        var_ids.forEach(id => {
            var _a;
            let variable = (_a = out_scope) === null || _a === void 0 ? void 0 : _a.get_variable(id);
            if (variable && variable.name.indexOf(".") === -1) {
                output.push(this.get_variable_response(variable.name, variable.value, id));
            }
        });
        return output;
    }
}
exports.GodotDebugSession = GodotDebugSession;
GodotDebugSession.MAIN_THREAD_ID = 0;
function no_exponents(value) {
    let data = String(value).split(/[eE]/);
    if (data.length === 1) {
        return data[0];
    }
    let z = "", sign = value < 0 ? "-" : "";
    let str = data[0].replace(".", "");
    let mag = Number(data[1]) + 1;
    if (mag < 0) {
        z = sign + "0.";
        while (mag++) {
            z += "0";
        }
        return z + str.replace(/^\-/, "");
    }
    mag -= str.length;
    while (mag--) {
        z += 0;
    }
    return str + z;
}
//# sourceMappingURL=godot_debug.js.map