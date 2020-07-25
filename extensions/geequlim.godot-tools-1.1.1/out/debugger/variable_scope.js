"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class VariableScope {
    constructor(id) {
        this.sub_variables = new Map();
        this.variables = new Map();
        this.id = id;
    }
    get_id_for(name) {
        let ids = Array.from(this.variables.keys());
        return ids.find(v => {
            let var_name = this.variables.get(v).name;
            return var_name === name;
        }) || -1;
    }
    get_sub_variable_for(name, id) {
        let sub_variables = this.sub_variables.get(id);
        if (sub_variables) {
            let index = sub_variables.findIndex(sv => {
                return sv.name === name;
            });
            if (index !== -1) {
                return sub_variables[index];
            }
        }
        return undefined;
    }
    get_sub_variables_for(id) {
        return this.sub_variables.get(id);
    }
    get_variable(id) {
        return this.variables.get(id);
    }
    get_variable_ids() {
        return Array.from(this.variables.keys());
    }
    set_sub_variable_for(variable_id, name, value) {
        let sub_variables = this.sub_variables.get(variable_id);
        if (!sub_variables) {
            sub_variables = [];
            this.sub_variables.set(variable_id, sub_variables);
        }
        let index = sub_variables.findIndex(sv => {
            return sv.name === name;
        });
        if (index === -1) {
            sub_variables.push({ name: name, value: value });
        }
    }
    set_variable(name, value, id) {
        let variable = { name: name, value: value };
        this.variables.set(id, variable);
    }
}
exports.VariableScope = VariableScope;
//# sourceMappingURL=variable_scope.js.map