"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const server_controller_1 = require("./communication/server_controller");
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
    getProject() {
        return this.project;
    }
    getScope(level, callback) {
        var _a;
        (_a = this.serverController) === null || _a === void 0 ? void 0 : _a.get_scope(level, callback);
    }
    get_breakpoints(path) {
        let bps = this.breakpoints.get(path);
        return bps ? bps : [];
    }
    inspect_object(objectId, inspected) {
        var _a;
        (_a = this.serverController) === null || _a === void 0 ? void 0 : _a.inspect_object(objectId, inspected);
    }
    next() {
        var _a;
        (_a = this.serverController) === null || _a === void 0 ? void 0 : _a.next();
    }
    remove_breakpoint(pathTo, line) {
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
                (_a = this.serverController) === null || _a === void 0 ? void 0 : _a.remove_breakpoint(bp.file.replace(new RegExp(`${this.project}/`), "res://"), bp.line);
            }
        }
    }
    set_breakpoint(pathTo, line) {
        var _a;
        const BP = {
            file: pathTo.replace(/\\/g, "/"),
            line: line,
            id: this.breakpointId++
        };
        let bps = this.breakpoints.get(BP.file);
        if (!bps) {
            bps = new Array();
            this.breakpoints.set(BP.file, bps);
        }
        bps.push(BP);
        (_a = this.serverController) === null || _a === void 0 ? void 0 : _a.set_breakpoint(BP.file.replace(new RegExp(`${this.project}/`), "res://"), line);
        return BP;
    }
    start(project, address, port, launchGameInstance, out) {
        this.out = out;
        this.out.show();
        this.project = project.replace(/\\/g, "/");
        if (this.project.match(/^[A-Z]:\//)) {
            this.project = this.project[0].toLowerCase() + this.project.slice(1);
        }
        this.serverController = new server_controller_1.ServerController(this, this.out);
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
    step_out() {
        var _a;
        (_a = this.serverController) === null || _a === void 0 ? void 0 : _a.step_out();
    }
}
exports.GodotDebugRuntime = GodotDebugRuntime;
//# sourceMappingURL=godot_debug_runtime.js.map