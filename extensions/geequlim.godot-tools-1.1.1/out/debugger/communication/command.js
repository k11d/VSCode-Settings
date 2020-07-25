"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Command {
    constructor(name, parameters_fulfilled, modify_param_count) {
        this.param_count = -1;
        this.parameters = [];
        this.name = name;
        this.callback = parameters_fulfilled;
        this.param_count_callback = modify_param_count;
    }
    append_parameters(parameter) {
        if (this.param_count <= 0) {
            this.param_count = parameter;
            if (this.param_count === 0) {
                if (this.callback) {
                    this.callback([]);
                }
            }
            return;
        }
        this.parameters.push(parameter);
        if (this.parameters.length === this.get_param_count()) {
            if (this.callback) {
                this.callback(this.parameters);
            }
        }
    }
    chain() {
        if (this.parameters.length === this.get_param_count()) {
            this.parameters.length = 0;
            this.param_count = -1;
            return undefined;
        }
        else {
            return this;
        }
    }
    get_param_count() {
        return this.param_count_callback
            ? this.param_count_callback(this.param_count)
            : this.param_count;
    }
}
exports.Command = Command;
//# sourceMappingURL=command.js.map