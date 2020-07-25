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
const godotDebugRuntime_1 = require("./godotDebugRuntime");
const { Subject } = require("await-notify");
const fs = require("fs");
const VariableScope_1 = require("./VariableScope");
class GodotDebugSession extends vscode_debugadapter_1.LoggingDebugSession {
    constructor() {
        super();
        this.configurationDone = new Subject();
        this.inspectCount = 0;
        this.lastFrames = [];
        this.scopeId = 1;
        this.scopes = new Map();
        this.excepted = false;
        this.setDebuggerLinesStartAt1(false);
        this.setDebuggerColumnsStartAt1(false);
        this.runtime = new godotDebugRuntime_1.GodotDebugRuntime();
        this.runtime.on("stopOnBreakpoint", frames => {
            this.lastFrames = frames;
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent("breakpoint", GodotDebugSession.THREAD_ID));
        });
        this.runtime.on("stopOnException", (frames, exception) => {
            this.lastFrames = frames;
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent("exception", GodotDebugSession.THREAD_ID, exception));
        });
        this.runtime.on("terminated", () => {
            this.sendEvent(new vscode_debugadapter_1.TerminatedEvent(false));
        });
    }
    configurationDoneRequest(response, args) {
        super.configurationDoneRequest(response, args);
        this.configurationDone.notify();
    }
    continueRequest(response, args) {
        if (this.excepted) {
            return;
        }
        response.body = {
            allThreadsContinued: true
        };
        this.runtime.continue();
        this.sendResponse(response);
    }
    initializeRequest(response, args) {
        response.body = response.body || {};
        response.body.supportsConfigurationDoneRequest = true;
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
        response.body.supportsTerminateRequest = true;
        this.sendResponse(response);
        this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
    }
    launchRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.configurationDone.wait(1000);
            this.runtime.start(args.project, args.address, args.port, args.launchGameInstance);
            this.sendResponse(response);
        });
    }
    nextRequest(response, args) {
        if (this.excepted) {
            return;
        }
        this.runtime.step();
        this.sendResponse(response);
    }
    pauseRequest(response, args, request) {
        if (this.excepted) {
            return;
        }
        this.runtime.break();
        this.sendResponse(response);
    }
    scopesRequest(response, args) {
        this.runtime.getScope(args.frameId, (stackLevel, stackFiles, scopes) => {
            let file = stackFiles[stackLevel];
            let fileScopes = this.scopes.get(file);
            fileScopes = [];
            let localScope = new VariableScope_1.VariableScope(this.scopeId++);
            let memberScope = new VariableScope_1.VariableScope(this.scopeId++);
            let globalScope = new VariableScope_1.VariableScope(this.scopeId++);
            fileScopes.push(localScope);
            fileScopes.push(memberScope);
            fileScopes.push(globalScope);
            this.scopes.set(file, fileScopes);
            let outLocalScope = {
                name: "Locals",
                namedVariables: scopes.locals.length / 2,
                presentationHint: "locals",
                expensive: false,
                variablesReference: localScope.id
            };
            for (let i = 0; i < scopes.locals.length; i += 2) {
                const name = scopes.locals[i];
                const value = scopes.locals[i + 1];
                this.drillScope(localScope, { name: name, value: value });
            }
            let outMemberScope = {
                name: "Members",
                namedVariables: scopes.members.length / 2,
                presentationHint: "locals",
                expensive: false,
                variablesReference: memberScope.id
            };
            for (let i = 0; i < scopes.members.length; i += 2) {
                const name = scopes.members[i];
                const value = scopes.members[i + 1];
                this.drillScope(memberScope, { name: name, value: value });
            }
            let outGlobalScope = {
                name: "Globals",
                namedVariables: scopes.globals.length / 2,
                presentationHint: "locals",
                expensive: false,
                variablesReference: globalScope.id
            };
            for (let i = 0; i < scopes.globals.length; i += 2) {
                const name = scopes.globals[i];
                const value = scopes.globals[i + 1];
                this.drillScope(globalScope, { name: name, value: value });
            }
            response.body = {
                scopes: [outLocalScope, outMemberScope, outGlobalScope]
            };
            if (this.inspectCount === 0) {
                this.sendResponse(response);
            }
            else {
                this.inspectCallback = () => {
                    this.sendResponse(response);
                };
            }
        });
    }
    setExceptionBreakPointsRequest(response, args) {
        this.excepted = true;
        this.sendResponse(response);
    }
    setBreakPointsRequest(response, args) {
        const path = args.source.path.replace(/\\/g, "/");
        const clientLines = args.lines || [];
        if (fs.existsSync(path)) {
            let bps = this.runtime.getBreakPoints(path);
            let bpLines = bps.map(bp => bp.line);
            bps.forEach(bp => {
                if (clientLines.indexOf(bp.line) === -1) {
                    this.runtime.removeBreakpoint(path, bp.line);
                }
            });
            clientLines.forEach(l => {
                if (bpLines.indexOf(l) === -1) {
                    this.runtime.setBreakPoint(path, l);
                }
            });
            bps = this.runtime.getBreakPoints(path);
            response.body = {
                breakpoints: bps.map(bp => {
                    return new vscode_debugadapter_1.Breakpoint(true, bp.line, 1, new vscode_debugadapter_1.Source(bp.file.split("/").reverse()[0], bp.file, bp.id));
                })
            };
            this.sendResponse(response);
        }
    }
    stackTraceRequest(response, args) {
        if (this.lastFrames) {
            response.body = {
                totalFrames: this.lastFrames.length,
                stackFrames: this.lastFrames.map(sf => {
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
        this.runtime.step();
        this.sendResponse(response);
    }
    stepOutRequest(response, args) { }
    terminateRequest(response, args) {
        this.runtime.terminate();
        this.sendResponse(response);
    }
    threadsRequest(response) {
        response.body = {
            threads: [new vscode_debugadapter_1.Thread(GodotDebugSession.THREAD_ID, "thread_1")]
        };
        this.sendResponse(response);
    }
    variablesRequest(response, args, request) {
        return __awaiter(this, void 0, void 0, function* () {
            let outId = args.variablesReference;
            let files = Array.from(this.scopes.keys());
            let outScopeObject = this.getVariableScope(files, outId);
            let isScope = outScopeObject.isScope;
            let outScope = outScopeObject.scope;
            if (outScope) {
                if (isScope) {
                    let varIds = outScope.getVariableIds();
                    response.body = {
                        variables: this.parseScope(varIds, outScope)
                    };
                }
                else {
                    let variable = outScope.getVariable(outId);
                    if (variable) {
                        let subVariables = outScope.getSubVariablesFor(outId);
                        if (subVariables) {
                            let ids = outScope.getVariableIds();
                            let pathTo = variable.name;
                            response.body = {
                                variables: []
                            };
                            if (args.filter === "indexed") {
                                let count = args.count || 0;
                                for (let i = 0; i < count; i++) {
                                    let name = `${pathTo}.${i}`;
                                    let idIndex = ids.findIndex(id => {
                                        var _a;
                                        let variable = (_a = outScope) === null || _a === void 0 ? void 0 : _a.getVariable(id);
                                        return variable && name === variable.name;
                                    });
                                    response.body.variables.push(this.getVariableResponse(name, variable.value[i], ids[idIndex]));
                                }
                            }
                            else {
                                subVariables.forEach(sv => {
                                    let name = sv.name;
                                    let idIndex = ids.findIndex(id => {
                                        var _a;
                                        let variable = (_a = outScope) === null || _a === void 0 ? void 0 : _a.getVariable(id);
                                        return variable && name === variable.name;
                                    });
                                    response.body.variables.push(this.getVariableResponse(name, sv.value, ids[idIndex]));
                                });
                            }
                        }
                        else {
                            response.body = {
                                variables: [
                                    this.getVariableResponse(variable.name, variable.value, 0, true)
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
    drillScope(scope, variable) {
        let id = scope.getIdFor(variable.name);
        if (id === -1) {
            id = this.scopeId++;
        }
        scope.setVariable(variable.name, variable.value, id);
        if (Array.isArray(variable.value)) {
            for (let i = 0; i < variable.value.length; i++) {
                let name = `${variable.name}.${i}`;
                scope.setSubVariableFor(id, name, variable.value[i]);
                this.drillScope(scope, {
                    name: name,
                    value: variable.value[i]
                });
            }
        }
        else if (typeof variable.value === "object") {
            if (variable.value.__type__ && variable.value.__type__ === "Object") {
                this.inspectCount++;
                this.runtime.inspectObject(variable.value.id, (className, properties) => {
                    variable.value.__type__ = className;
                    let startIndex = properties.findIndex(p => {
                        return p[0] === className;
                    });
                    variable.value.__render__ = () => `${className}`;
                    let relevantProperties = properties
                        .slice(startIndex + 1)
                        .filter(p => {
                        if (!p[5]) {
                            return Number.isInteger(p[5]);
                        }
                        return true;
                    });
                    relevantProperties.forEach(p => {
                        let subName = `${variable.name}.${p[0]}`;
                        scope.setSubVariableFor(id, subName, p[5]);
                        this.drillScope(scope, { name: subName, value: p[5] });
                    });
                    this.inspectCount--;
                    if (this.inspectCount === 0 && this.inspectCallback) {
                        this.inspectCallback();
                    }
                });
            }
            else {
                for (const property in variable.value) {
                    if (property !== "__type__" && property !== "__render__") {
                        let name = `${variable.name}.${property}`;
                        scope.setSubVariableFor(id, name, variable.value[property]);
                        this.drillScope(scope, {
                            name: name,
                            value: variable.value[property]
                        });
                    }
                }
            }
        }
    }
    getVariableResponse(varName, varValue, id, skipSubVar) {
        let value = "";
        let refId = 0;
        let arrayCount = 0;
        let type = "";
        if (!skipSubVar) {
            if (typeof varValue === "number" && !Number.isInteger(varValue)) {
                value = String(+Number.parseFloat(noExponents(varValue)).toFixed(4));
                type = "Float";
            }
            else if (Array.isArray(varValue)) {
                value = "Array";
                refId = id;
                arrayCount = varValue.length;
                type = "array";
            }
            else if (typeof varValue === "object") {
                refId = id;
                if (varValue.__type__) {
                    if (varValue.__type__ === "Object") {
                        refId = 0;
                    }
                    if (varValue.__render__) {
                        value = varValue.__render__();
                    }
                    else {
                        value = varValue.__type__;
                    }
                    type = varValue.__type__;
                }
                else {
                    value = "Object";
                }
            }
            else {
                if (varValue) {
                    if (Number.isInteger(varValue)) {
                        type = "Int";
                        value = `${varValue}`;
                    }
                    else if (typeof varValue === "string") {
                        type = "String";
                        value = String(varValue);
                    }
                    else {
                        type = "unknown";
                        value = `${varValue}`;
                    }
                }
                else {
                    if (Number.isInteger(varValue)) {
                        type = "Int";
                        value = "0";
                    }
                    else {
                        type = "unknown";
                        value = "null";
                    }
                }
            }
        }
        return {
            name: varName.replace(/([a-zA-Z0-9_]+?\.)*/g, ""),
            value: value,
            variablesReference: refId,
            indexedVariables: arrayCount,
            type: type
        };
    }
    getVariableScope(files, scopeId) {
        let outScope;
        let isScope = false;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            let scopes = this.scopes.get(file);
            if (scopes) {
                let index = scopes.findIndex(s => {
                    return s.id === scopeId;
                });
                if (index !== -1) {
                    outScope = scopes[index];
                    isScope = true;
                    break;
                }
                else {
                    for (let l = 0; l < scopes.length; l++) {
                        const scope = scopes[l];
                        let ids = scope.getVariableIds();
                        for (let k = 0; k < ids.length; k++) {
                            const id = ids[k];
                            if (scopeId === id) {
                                outScope = scope;
                                isScope = false;
                                break;
                            }
                        }
                    }
                }
            }
        }
        return { isScope: isScope, scope: outScope };
    }
    parseScope(varIds, outScope) {
        let output = [];
        varIds.forEach(id => {
            var _a;
            let variable = (_a = outScope) === null || _a === void 0 ? void 0 : _a.getVariable(id);
            if (variable && variable.name.indexOf(".") === -1) {
                output.push(this.getVariableResponse(variable.name, variable.value, id));
            }
        });
        return output;
    }
}
exports.GodotDebugSession = GodotDebugSession;
GodotDebugSession.THREAD_ID = 1;
function noExponents(value) {
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
//# sourceMappingURL=godotDebug.js.map