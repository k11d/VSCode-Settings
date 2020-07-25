"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class VariableScope {
    constructor(id) {
        this.subVariables = new Map();
        this.variables = new Map();
        this.id = id;
    }
    getIdFor(name) {
        let ids = Array.from(this.variables.keys());
        return ids.findIndex(v => {
            var _a;
            return ((_a = this.variables.get(v)) === null || _a === void 0 ? void 0 : _a.name) === name;
        });
    }
    getSubVariableFor(name, id) {
        let subVariables = this.subVariables.get(id);
        if (subVariables) {
            let index = subVariables.findIndex(sv => {
                return sv.name === name;
            });
            if (index !== -1) {
                return subVariables[index];
            }
        }
        return undefined;
    }
    getSubVariablesFor(id) {
        return this.subVariables.get(id);
    }
    getVariable(id) {
        return this.variables.get(id);
    }
    getVariableIds() {
        return Array.from(this.variables.keys());
    }
    setSubVariableFor(variableId, name, value) {
        let subVariables = this.subVariables.get(variableId);
        if (!subVariables) {
            subVariables = [];
            this.subVariables.set(variableId, subVariables);
        }
        let index = subVariables.findIndex(sv => {
            return sv.name === name;
        });
        if (index === -1) {
            subVariables.push({ name: name, value: value });
        }
    }
    setVariable(name, value, id) {
        let variable = { name: name, value: value };
        this.variables.set(id, variable);
    }
}
exports.VariableScope = VariableScope;
//# sourceMappingURL=VariableScope.js.map