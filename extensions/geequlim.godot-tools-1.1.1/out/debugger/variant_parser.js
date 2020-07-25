"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GDScriptTypes;
(function (GDScriptTypes) {
    GDScriptTypes[GDScriptTypes["NIL"] = 0] = "NIL";
    // atomic types
    GDScriptTypes[GDScriptTypes["BOOL"] = 1] = "BOOL";
    GDScriptTypes[GDScriptTypes["INT"] = 2] = "INT";
    GDScriptTypes[GDScriptTypes["REAL"] = 3] = "REAL";
    GDScriptTypes[GDScriptTypes["STRING"] = 4] = "STRING";
    // math types
    GDScriptTypes[GDScriptTypes["VECTOR2"] = 5] = "VECTOR2";
    GDScriptTypes[GDScriptTypes["RECT2"] = 6] = "RECT2";
    GDScriptTypes[GDScriptTypes["VECTOR3"] = 7] = "VECTOR3";
    GDScriptTypes[GDScriptTypes["TRANSFORM2D"] = 8] = "TRANSFORM2D";
    GDScriptTypes[GDScriptTypes["PLANE"] = 9] = "PLANE";
    GDScriptTypes[GDScriptTypes["QUAT"] = 10] = "QUAT";
    GDScriptTypes[GDScriptTypes["AABB"] = 11] = "AABB";
    GDScriptTypes[GDScriptTypes["BASIS"] = 12] = "BASIS";
    GDScriptTypes[GDScriptTypes["TRANSFORM"] = 13] = "TRANSFORM";
    // misc types
    GDScriptTypes[GDScriptTypes["COLOR"] = 14] = "COLOR";
    GDScriptTypes[GDScriptTypes["NODE_PATH"] = 15] = "NODE_PATH";
    GDScriptTypes[GDScriptTypes["_RID"] = 16] = "_RID";
    GDScriptTypes[GDScriptTypes["OBJECT"] = 17] = "OBJECT";
    GDScriptTypes[GDScriptTypes["DICTIONARY"] = 18] = "DICTIONARY";
    GDScriptTypes[GDScriptTypes["ARRAY"] = 19] = "ARRAY";
    // arrays
    GDScriptTypes[GDScriptTypes["POOL_BYTE_ARRAY"] = 20] = "POOL_BYTE_ARRAY";
    GDScriptTypes[GDScriptTypes["POOL_INT_ARRAY"] = 21] = "POOL_INT_ARRAY";
    GDScriptTypes[GDScriptTypes["POOL_REAL_ARRAY"] = 22] = "POOL_REAL_ARRAY";
    GDScriptTypes[GDScriptTypes["POOL_STRING_ARRAY"] = 23] = "POOL_STRING_ARRAY";
    GDScriptTypes[GDScriptTypes["POOL_VECTOR2_ARRAY"] = 24] = "POOL_VECTOR2_ARRAY";
    GDScriptTypes[GDScriptTypes["POOL_VECTOR3_ARRAY"] = 25] = "POOL_VECTOR3_ARRAY";
    GDScriptTypes[GDScriptTypes["POOL_COLOR_ARRAY"] = 26] = "POOL_COLOR_ARRAY";
    GDScriptTypes[GDScriptTypes["VARIANT_MAX"] = 27] = "VARIANT_MAX";
})(GDScriptTypes || (GDScriptTypes = {}));
class VariantParser {
    decode_variant(model) {
        let type = this.decode_UInt32(model);
        switch (type & 0xff) {
            case GDScriptTypes.BOOL:
                return this.decode_UInt32(model) !== 0;
            case GDScriptTypes.INT:
                if (type & (1 << 16)) {
                    return this.decode_Int64(model);
                }
                else {
                    return this.decode_Int32(model);
                }
            case GDScriptTypes.REAL:
                if (type & (1 << 16)) {
                    return this.decode_Double(model);
                }
                else {
                    return this.decode_Float(model);
                }
            case GDScriptTypes.STRING:
                return this.decode_String(model);
            case GDScriptTypes.VECTOR2:
                return this.decode_Vector2(model);
            case GDScriptTypes.RECT2:
                return this.decode_Rect2(model);
            case GDScriptTypes.VECTOR3:
                return this.decode_Vector3(model);
            case GDScriptTypes.TRANSFORM2D:
                return this.decode_Transform2D(model);
            case GDScriptTypes.PLANE:
                return this.decode_Plane(model);
            case GDScriptTypes.QUAT:
                return this.decode_Quat(model);
            case GDScriptTypes.AABB:
                return this.decode_AABB(model);
            case GDScriptTypes.BASIS:
                return this.decode_Basis(model);
            case GDScriptTypes.TRANSFORM:
                return this.decode_Transform(model);
            case GDScriptTypes.COLOR:
                return this.decode_Color(model);
            case GDScriptTypes.NODE_PATH:
                return this.decode_NodePath(model);
            case GDScriptTypes.OBJECT:
                if (type & (1 << 16)) {
                    return this.decode_Object_id(model);
                }
                else {
                    return this.decode_Object(model);
                }
            case GDScriptTypes.DICTIONARY:
                return this.decode_Dictionary(model);
            case GDScriptTypes.ARRAY:
                return this.decode_Array(model);
            case GDScriptTypes.POOL_BYTE_ARRAY:
                return this.decode_PoolByteArray(model);
            case GDScriptTypes.POOL_INT_ARRAY:
                return this.decode_PoolIntArray(model);
            case GDScriptTypes.POOL_REAL_ARRAY:
                return this.decode_PoolFloatArray(model);
            case GDScriptTypes.POOL_STRING_ARRAY:
                return this.decode_PoolStringArray(model);
            case GDScriptTypes.POOL_VECTOR2_ARRAY:
                return this.decode_PoolVector2Array(model);
            case GDScriptTypes.POOL_VECTOR3_ARRAY:
                return this.decode_PoolVector3Array(model);
            case GDScriptTypes.POOL_COLOR_ARRAY:
                return this.decode_PoolColorArray(model);
            default:
                return undefined;
        }
    }
    encode_variant(value, model) {
        if (!model) {
            let size = this.size_variant(value);
            let buffer = Buffer.alloc(size + 4);
            model = {
                buffer: buffer,
                offset: 0,
                len: 0
            };
            this.encode_UInt32(size, model);
        }
        switch (typeof value) {
            case "number":
                this.encode_UInt32(GDScriptTypes.INT, model);
                this.encode_UInt32(value, model);
                break;
            case "boolean":
                this.encode_UInt32(GDScriptTypes.BOOL, model);
                this.encode_Bool(value, model);
                break;
            case "string":
                this.encode_UInt32(GDScriptTypes.STRING, model);
                this.encode_String(value, model);
                break;
            case "undefined":
                break;
            default:
                if (Array.isArray(value)) {
                    this.encode_UInt32(GDScriptTypes.ARRAY, model);
                    this.encode_Array(value, model);
                }
                else {
                    this.encode_UInt32(GDScriptTypes.DICTIONARY, model);
                    this.encode_Dictionary(value, model);
                }
        }
        return model.buffer;
    }
    get_buffer_dataset(buffer, offset) {
        let len = buffer.readUInt32LE(offset);
        let model = {
            buffer: buffer,
            offset: offset + 4,
            len: len
        };
        let output = [];
        output.push(len + 4);
        do {
            let value = this.decode_variant(model);
            output.push(value);
        } while (model.len > 0);
        return output;
    }
    clean(value) {
        return +Number.parseFloat(String(value)).toFixed(1);
    }
    decode_AABB(model) {
        let px = this.decode_Float(model);
        let py = this.decode_Float(model);
        let pz = this.decode_Float(model);
        let sx = this.decode_Float(model);
        let sy = this.decode_Float(model);
        let sz = this.decode_Float(model);
        return {
            __type__: "AABB",
            position: this.make_Vector3(px, py, pz),
            size: this.make_Vector3(sx, sy, sz),
            __render__: () => `AABB (${this.clean(px)}, ${this.clean(py)}, ${this.clean(pz)} - ${this.clean(sx)}, ${this.clean(sy)}, ${this.clean(sz)})`
        };
    }
    decode_Array(model) {
        let output = [];
        let count = this.decode_UInt32(model);
        for (let i = 0; i < count; i++) {
            let value = this.decode_variant(model);
            output.push(value);
        }
        return output;
    }
    decode_Basis(model) {
        let x = this.decode_Vector3(model);
        let y = this.decode_Vector3(model);
        let z = this.decode_Vector3(model);
        return this.make_Basis([x.x, x.y, z.z], [y.x, y.y, y.z], [z.x, z.y, z.z]);
    }
    decode_Color(model) {
        let r = this.decode_Float(model);
        let g = this.decode_Float(model);
        let b = this.decode_Float(model);
        let a = this.decode_Float(model);
        return {
            __type__: "Color",
            r: r,
            g: g,
            b: b,
            a: a,
            __render__: () => `Color (${this.clean(r)}, ${this.clean(g)}, ${this.clean(b)}, ${this.clean(a)})`
        };
    }
    decode_Dictionary(model) {
        let output = new Map();
        let count = this.decode_UInt32(model);
        for (let i = 0; i < count; i++) {
            let key = this.decode_variant(model);
            let value = this.decode_variant(model);
            output.set(key, value);
        }
        return output;
    }
    decode_Double(model) {
        let view = new DataView(model.buffer.buffer, model.offset, 8);
        let d = view.getFloat64(0, true);
        model.offset += 8;
        model.len -= 8;
        return d + 0.00000000001;
    }
    decode_Float(model) {
        let view = new DataView(model.buffer.buffer, model.offset, 4);
        let f = view.getFloat32(0, true);
        model.offset += 4;
        model.len -= 4;
        return f + 0.00000000001;
    }
    decode_Int32(model) {
        let u = model.buffer.readInt32LE(model.offset);
        model.len -= 4;
        model.offset += 4;
        return u;
    }
    decode_Int64(model) {
        let view = new DataView(model.buffer.buffer, model.offset, 8);
        let u = view.getBigInt64(0, true);
        model.len -= 8;
        model.offset += 8;
        return Number(u);
    }
    decode_NodePath(model) {
        let name_count = this.decode_UInt32(model) & 0x7fffffff;
        let subname_count = this.decode_UInt32(model);
        let flags = this.decode_UInt32(model);
        let is_absolute = (flags & 1) === 1;
        if (flags & 2) {
            //Obsolete format with property separate from subPath
            subname_count++;
        }
        let total = name_count + subname_count;
        let names = [];
        let sub_names = [];
        for (let i = 0; i < total; i++) {
            let str = this.decode_String(model);
            if (i < name_count) {
                names.push(str);
            }
            else {
                sub_names.push(str);
            }
        }
        return {
            __type__: "NodePath",
            path: names,
            subpath: sub_names,
            absolute: is_absolute,
            __render__: () => `NodePath (${names.join(".")}:${sub_names.join(":")})`
        };
    }
    decode_Object(model) {
        let class_name = this.decode_String(model);
        let prop_count = this.decode_UInt32(model);
        let props = [];
        for (let i = 0; i < prop_count; i++) {
            let name = this.decode_String(model);
            let value = this.decode_variant(model);
            props.push({ name: name, value: value });
        }
        return { __type__: class_name, properties: props };
    }
    decode_Object_id(model) {
        let id = this.decode_UInt64(model);
        return {
            __type__: "Object",
            id: id,
            __render__: () => `Object<${id}>`
        };
    }
    decode_Plane(model) {
        let x = this.decode_Float(model);
        let y = this.decode_Float(model);
        let z = this.decode_Float(model);
        let d = this.decode_Float(model);
        return {
            __type__: "Plane",
            x: x,
            y: y,
            z: z,
            d: d,
            __render__: () => `Plane (${this.clean(x)}, ${this.clean(y)}, ${this.clean(z)}, ${this.clean(d)})`
        };
    }
    decode_PoolByteArray(model) {
        let count = this.decode_UInt32(model);
        let output = [];
        for (let i = 0; i < count; i++) {
            output.push(model.buffer.readUInt8(model.offset));
            model.offset++;
            model.len--;
        }
        return output;
    }
    decode_PoolColorArray(model) {
        let count = this.decode_UInt32(model);
        let output = [];
        for (let i = 0; i < count; i++) {
            output.push(this.decode_Color(model));
        }
        return output;
    }
    decode_PoolFloatArray(model) {
        let count = this.decode_UInt32(model);
        let output = [];
        for (let i = 0; i < count; i++) {
            output.push(this.decode_Float(model));
        }
        return output;
    }
    decode_PoolIntArray(model) {
        let count = this.decode_UInt32(model);
        let output = [];
        for (let i = 0; i < count; i++) {
            output.push(this.decode_Int32(model));
        }
        return output;
    }
    decode_PoolStringArray(model) {
        let count = this.decode_UInt32(model);
        let output = [];
        for (let i = 0; i < count; i++) {
            output.push(this.decode_String(model));
        }
        return output;
    }
    decode_PoolVector2Array(model) {
        let count = this.decode_UInt32(model);
        let output = [];
        for (let i = 0; i < count; i++) {
            output.push(this.decode_Vector2(model));
        }
        return output;
    }
    decode_PoolVector3Array(model) {
        let count = this.decode_UInt32(model);
        let output = [];
        for (let i = 0; i < count; i++) {
            output.push(this.decode_Vector3(model));
        }
        return output;
    }
    decode_Quat(model) {
        let x = this.decode_Float(model);
        let y = this.decode_Float(model);
        let z = this.decode_Float(model);
        let w = this.decode_Float(model);
        return {
            __type__: "Quat",
            x: x,
            y: y,
            z: z,
            w: w,
            __render__: () => `Quat (${this.clean(x)}, ${this.clean(y)}, ${this.clean(z)}, ${this.clean(w)})`
        };
    }
    decode_Rect2(model) {
        let x = this.decode_Float(model);
        let y = this.decode_Float(model);
        let sizeX = this.decode_Float(model);
        let sizeY = this.decode_Float(model);
        return {
            __type__: "Rect2",
            position: this.make_Vector2(x, y),
            size: this.make_Vector2(sizeX, sizeY),
            __render__: () => `Rect2 (${this.clean(x)}, ${this.clean(y)} - ${this.clean(sizeX)}, ${this.clean(sizeY)})`
        };
    }
    decode_String(model) {
        let len = this.decode_UInt32(model);
        let pad = 0;
        if (len % 4 !== 0) {
            pad = 4 - (len % 4);
        }
        let str = model.buffer.toString("utf8", model.offset, model.offset + len);
        len += pad;
        model.offset += len;
        model.len -= len;
        return str;
    }
    decode_Transform(model) {
        let b = this.decode_Basis(model);
        let o = this.decode_Vector3(model);
        return {
            __type__: "Transform",
            basis: this.make_Basis([b.x.x, b.x.y, b.x.z], [b.y.x, b.y.y, b.y.z], [b.z.x, b.z.y, b.z.z]),
            origin: this.make_Vector3(o.x, o.y, o.z),
            __render__: () => `Transform ((${this.clean(b.x.x)}, ${this.clean(b.x.y)}, ${this.clean(b.x.z)}), (${this.clean(b.y.x)}, ${this.clean(b.y.y)}, ${this.clean(b.y.z)}), (${this.clean(b.z.x)}, ${this.clean(b.z.y)}, ${this.clean(b.z.z)}) - (${this.clean(o.x)}, ${this.clean(o.y)}, ${this.clean(o.z)}))`
        };
    }
    decode_Transform2D(model) {
        let origin = this.decode_Vector2(model);
        let x = this.decode_Vector2(model);
        let y = this.decode_Vector2(model);
        return {
            __type__: "Transform2D",
            origin: this.make_Vector2(origin.x, origin.y),
            x: this.make_Vector2(x.x, x.y),
            y: this.make_Vector2(y.x, y.y),
            __render__: () => `Transform2D ((${this.clean(origin.x)}, ${this.clean(origin.y)}) - (${this.clean(x.x)}, ${this.clean(x.y)}), (${this.clean(y.x)}, ${this.clean(y.x)}))`
        };
    }
    decode_UInt32(model) {
        let u = model.buffer.readUInt32LE(model.offset);
        model.len -= 4;
        model.offset += 4;
        return u;
    }
    decode_UInt64(model) {
        let view = new DataView(model.buffer.buffer, model.offset, 8);
        let u = view.getBigUint64(0, true);
        model.len -= 8;
        model.offset += 8;
        return Number(u);
    }
    decode_Vector2(model) {
        let x = this.decode_Float(model);
        let y = this.decode_Float(model);
        return this.make_Vector2(x, y);
    }
    decode_Vector3(model) {
        let x = this.decode_Float(model);
        let y = this.decode_Float(model);
        let z = this.decode_Float(model);
        return this.make_Vector3(x, y, z);
    }
    encode_Array(arr, model) {
        let size = arr.length;
        this.encode_UInt32(size, model);
        arr.forEach(e => {
            this.encode_variant(e, model);
        });
    }
    encode_Bool(bool, model) {
        this.encode_UInt32(bool ? 1 : 0, model);
    }
    encode_Dictionary(dict, model) {
        let size = dict.size;
        this.encode_UInt32(size, model);
        let keys = Array.from(dict.keys());
        keys.forEach(key => {
            let value = dict.get(key);
            this.encode_variant(key, model);
            this.encode_variant(value, model);
        });
    }
    encode_String(str, model) {
        let str_len = str.length;
        this.encode_UInt32(str_len, model);
        model.buffer.write(str, model.offset, str_len, "utf8");
        model.offset += str_len;
        str_len += 4;
        while (str_len % 4) {
            str_len++;
            model.buffer.writeUInt8(0, model.offset);
            model.offset++;
        }
    }
    encode_UInt32(int, model) {
        model.buffer.writeUInt32LE(int, model.offset);
        model.offset += 4;
    }
    make_Basis(x, y, z) {
        return {
            __type__: "Basis",
            x: this.make_Vector3(x[0], x[1], x[2]),
            y: this.make_Vector3(y[0], y[1], y[2]),
            z: this.make_Vector3(z[0], z[1], z[2]),
            __render__: () => `Basis ((${this.clean(x[0])}, ${this.clean(x[1])}, ${this.clean(x[2])}), (${this.clean(y[0])}, ${this.clean(y[1])}, ${this.clean(y[2])}), (${this.clean(z[0])}, ${this.clean(z[1])}, ${this.clean(z[2])}))`
        };
    }
    make_Vector2(x, y) {
        return {
            __type__: `Vector2`,
            x: x,
            y: y,
            __render__: () => `Vector2 (${this.clean(x)}, ${this.clean(y)})`
        };
    }
    make_Vector3(x, y, z) {
        return {
            __type__: `Vector3`,
            x: x,
            y: y,
            z: z,
            __render__: () => `Vector3 (${this.clean(x)}, ${this.clean(y)}, ${this.clean(z)})`
        };
    }
    size_Bool() {
        return this.size_UInt32();
    }
    size_Dictionary(dict) {
        let size = this.size_UInt32();
        let keys = Array.from(dict.keys());
        keys.forEach(key => {
            let value = dict.get(key);
            size += this.size_variant(key);
            size += this.size_variant(value);
        });
        return size;
    }
    size_String(str) {
        let size = this.size_UInt32() + str.length;
        while (size % 4) {
            size++;
        }
        return size;
    }
    size_UInt32() {
        return 4;
    }
    size_array(arr) {
        let size = this.size_UInt32();
        arr.forEach(e => {
            size += this.size_variant(e);
        });
        return size;
    }
    size_variant(value) {
        let size = 4;
        switch (typeof value) {
            case "number":
                size += this.size_UInt32();
                break;
            case "boolean":
                size += this.size_Bool();
                break;
            case "string":
                size += this.size_String(value);
                break;
            case "undefined":
                break;
            default:
                if (Array.isArray(value)) {
                    size += this.size_array(value);
                    break;
                }
                else {
                    size += this.size_Dictionary(value);
                    break;
                }
        }
        return size;
    }
}
exports.VariantParser = VariantParser;
//# sourceMappingURL=variant_parser.js.map