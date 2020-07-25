"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Command {
    constructor(name, parametersFulfilled, modifyParamCount) {
        this.paramCount = -1;
        this.parameters = [];
        this.name = name;
        this.callback = parametersFulfilled;
        this.paramCountCallback = modifyParamCount;
    }
    appendParameter(parameter) {
        if (this.paramCount <= 0) {
            this.paramCount = parameter;
            return;
        }
        this.parameters.push(parameter);
        if (this.parameters.length === this.getParamCount()) {
            if (this.callback) {
                this.callback(this.parameters);
            }
        }
    }
    chain() {
        if (this.parameters.length === this.getParamCount()) {
            this.parameters.length = 0;
            this.paramCount = -1;
            return undefined;
        }
        else {
            return this;
        }
    }
    getParamCount() {
        return this.paramCountCallback
            ? this.paramCountCallback(this.paramCount)
            : this.paramCount;
    }
}
exports.Command = Command;
//# sourceMappingURL=Command.js.map