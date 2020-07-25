"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const events_1 = require("events");
const ServerController_1 = require("./RemoteCommunications/ServerController");
class GodotDebugRuntime extends events_1.EventEmitter {
    constructor() {
        super();
        this.breakpointId = 0;
        this.breakpoints = new Map();
        this.paused = false;
        this.project = "";
    }
    break() {
        var _a, _b;
        if (this.paused) {
            (_a = this.serverController) === null || _a === void 0 ? void 0 : _a.continue();
        }
        else {
            (_b = this.serverController) === null || _b === void 0 ? void 0 : _b.break();
        }
    }
    continue() {
        var _a;
        (_a = this.serverController) === null || _a === void 0 ? void 0 : _a.continue();
    }
    getBreakPoints(path) {
        let bps = this.breakpoints.get(path);
        return bps ? bps : [];
    }
    getProject() {
        return this.project;
    }
    getScope(level, callback) {
        var _a;
        (_a = this.serverController) === null || _a === void 0 ? void 0 : _a.getScope(level, callback);
    }
    inspectObject(objectId, inspected) {
        var _a;
        (_a = this.serverController) === null || _a === void 0 ? void 0 : _a.inspectObject(objectId, inspected);
    }
    next() {
        var _a;
        (_a = this.serverController) === null || _a === void 0 ? void 0 : _a.next();
    }
    removeBreakpoint(pathTo, line) {
        var _a;
        let bps = this.breakpoints.get(pathTo);
        if (bps) {
            let index = bps.findIndex(bp => {
                return bp.line === line;
            });
            if (index !== -1) {
                let bp = bps[index];
                bps.splice(index, 1);
                this.breakpoints.set(pathTo, bps);
                (_a = this.serverController) === null || _a === void 0 ? void 0 : _a.removeBreakpoint(bp.file.replace(new RegExp(`${this.project}/`), "res://"), bp.line);
            }
        }
    }
    setBreakPoint(pathTo, line) {
        var _a;
        const bp = {
            file: pathTo.replace(/\\/g, "/"),
            line: line,
            id: this.breakpointId++
        };
        let bps = this.breakpoints.get(bp.file);
        if (!bps) {
            bps = new Array();
            this.breakpoints.set(bp.file, bps);
        }
        bps.push(bp);
        (_a = this.serverController) === null || _a === void 0 ? void 0 : _a.setBreakpoint(bp.file.replace(new RegExp(`${this.project}/`), "res://"), line);
        return bp;
    }
    start(project, address, port, launchGameInstance) {
        this.out = vscode.window.createOutputChannel("Godot");
        this.out.show();
        this.project = project.replace(/\\/g, "/");
        if (this.project.match(/^[a-zA-Z]:\//)) {
            this.project =
                this.project[0].toLowerCase() + this.project.slice(1);
        }
        this.serverController = new ServerController_1.ServerController(this, this.out);
        let breakpointList = [];
        Array.from(this.breakpoints.values()).forEach(fbp => {
            breakpointList = breakpointList.concat(fbp);
        });
        this.serverController.start(project, port, address, launchGameInstance, breakpointList);
    }
    step() {
        var _a;
        (_a = this.serverController) === null || _a === void 0 ? void 0 : _a.step();
    }
    terminate() {
        var _a;
        (_a = this.serverController) === null || _a === void 0 ? void 0 : _a.stop();
    }
    sendEvent(event, ...args) {
        setImmediate(_ => {
            this.emit(event, ...args);
        });
    }
}
exports.GodotDebugRuntime = GodotDebugRuntime;
//# sourceMappingURL=godotDebugRuntime.js.map