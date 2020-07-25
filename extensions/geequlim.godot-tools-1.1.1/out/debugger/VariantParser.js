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
    decodeVariant(model) {
        let type = this.decodeUInt32(model);
        switch (type & 0xff) {
            case GDScriptTypes.BOOL:
                return this.decodeUInt32(model) !== 0;
            case GDScriptTypes.INT:
                if (type & (1 << 16)) {
                    return this.decodeInt64(model);
                }
                else {
                    return this.decodeInt32(model);
                }
            case GDScriptTypes.REAL:
                if (type & (1 << 16)) {
                    return this.decodeDouble(model);
                }
                else {
                    return this.decodeFloat(model);
                }
            case GDScriptTypes.STRING:
                return this.decodeString(model);
            case GDScriptTypes.VECTOR2:
                return this.decodeVector2(model);
            case GDScriptTypes.RECT2:
                return this.decodeRect2(model);
            case GDScriptTypes.VECTOR3:
                return this.decodeVector3(model);
            case GDScriptTypes.TRANSFORM2D:
                return this.decodeTransform2(model);
            case GDScriptTypes.PLANE:
                return this.decodePlane(model);
            case GDScriptTypes.QUAT:
                return this.decodeQuat(model);
            case GDScriptTypes.AABB:
                return this.decodeAABB(model);
            case GDScriptTypes.BASIS:
                return this.decodeBasis(model);
            case GDScriptTypes.TRANSFORM:
                return this.decodeTransform(model);
            case GDScriptTypes.COLOR:
                return this.decodeColor(model);
            case GDScriptTypes.NODE_PATH:
                return this.decodeNodePath(model);
            case GDScriptTypes.OBJECT:
                if (type & (1 << 16)) {
                    return this.decodeObjectId(model);
                }
                else {
                    return this.decodeObject(model);
                }
            case GDScriptTypes.DICTIONARY:
                return this.decodeDictionary(model);
            case GDScriptTypes.ARRAY:
                return this.decodeArray(model);
            case GDScriptTypes.POOL_BYTE_ARRAY:
                return this.decodePoolByteArray(model);
            case GDScriptTypes.POOL_INT_ARRAY:
                return this.decodePoolIntArray(model);
            case GDScriptTypes.POOL_REAL_ARRAY:
                return this.decodePoolFloatArray(model);
            case GDScriptTypes.POOL_STRING_ARRAY:
                return this.decodePoolStringArray(model);
            case GDScriptTypes.POOL_VECTOR2_ARRAY:
                return this.decodePoolVector2Array(model);
            case GDScriptTypes.POOL_VECTOR3_ARRAY:
                return this.decodePoolVector3Array(model);
            case GDScriptTypes.POOL_COLOR_ARRAY:
                return this.decodePoolColorArray(model);
            default:
                return undefined;
        }
    }
    encodeVariant(value, model) {
        if (!model) {
            let size = this.sizeVariant(value);
            let buffer = Buffer.alloc(size + 4);
            model = {
                buffer: buffer,
                offset: 0,
                len: 0
            };
            this.encodeUInt32(size, model);
        }
        switch (typeof value) {
            case "number":
                this.encodeUInt32(GDScriptTypes.INT, model);
                this.encodeUInt32(value, model);
                break;
            case "boolean":
                this.encodeUInt32(GDScriptTypes.BOOL, model);
                this.encodeBool(value, model);
                break;
            case "string":
                this.encodeUInt32(GDScriptTypes.STRING, model);
                this.encodeString(value, model);
                break;
            case "undefined":
                break;
            default:
                if (Array.isArray(value)) {
                    this.encodeUInt32(GDScriptTypes.ARRAY, model);
                    this.encodeArray(value, model);
                }
                else {
                    this.encodeUInt32(GDScriptTypes.DICTIONARY, model);
                    this.encodeDictionary(value, model);
                }
        }
        return model.buffer;
    }
    getBufferDataSet(buffer, offset) {
        let len = buffer.readUInt32LE(offset);
        let model = {
            buffer: buffer,
            offset: offset + 4,
            len: len
        };
        let output = [];
        output.push(len + 4);
        do {
            let value = this.decodeVariant(model);
            output.push(value);
        } while (model.len > 0);
        return output;
    }
    clean(value) {
        return +Number.parseFloat(String(value)).toFixed(1);
    }
    decodeAABB(model) {
        let px = this.decodeFloat(model);
        let py = this.decodeFloat(model);
        let pz = this.decodeFloat(model);
        let sx = this.decodeFloat(model);
        let sy = this.decodeFloat(model);
        let sz = this.decodeFloat(model);
        return {
            __type__: "AABB",
            position: this.makeVector3(px, py, pz),
            size: this.makeVector3(sx, sy, sz),
            __render__: () => `AABB (${this.clean(px)}, ${this.clean(py)}, ${this.clean(pz)} - ${this.clean(sx)}, ${this.clean(sy)}, ${this.clean(sz)})`
        };
    }
    decodeArray(model) {
        let output = [];
        let count = this.decodeUInt32(model);
        for (let i = 0; i < count; i++) {
            let value = this.decodeVariant(model);
            output.push(value);
        }
        return output;
    }
    decodeBasis(model) {
        let x = this.decodeVector3(model);
        let y = this.decodeVector3(model);
        let z = this.decodeVector3(model);
        return this.makeBasis([x.x, x.y, z.z], [y.x, y.y, y.z], [z.x, z.y, z.z]);
    }
    decodeColor(model) {
        let r = this.decodeFloat(model);
        let g = this.decodeFloat(model);
        let b = this.decodeFloat(model);
        let a = this.decodeFloat(model);
        return {
            __type__: "Color",
            r: r,
            g: g,
            b: b,
            a: a,
            __render__: () => `Color (${this.clean(r)}, ${this.clean(g)}, ${this.clean(b)}, ${this.clean(a)})`
        };
    }
    decodeDictionary(model) {
        let output = new Map();
        let count = this.decodeUInt32(model);
        for (let i = 0; i < count; i++) {
            let key = this.decodeVariant(model);
            let value = this.decodeVariant(model);
            output.set(key, value);
        }
        return output;
    }
    decodeDouble(model) {
        let view = new DataView(model.buffer.buffer, model.offset, 8);
        let d = view.getFloat64(0, true);
        model.offset += 8;
        model.len -= 8;
        return d + 0.00000000001;
    }
    decodeFloat(model) {
        let view = new DataView(model.buffer.buffer, model.offset, 4);
        let f = view.getFloat32(0, true);
        model.offset += 4;
        model.len -= 4;
        return f + 0.00000000001;
    }
    decodeInt32(model) {
        let u = model.buffer.readInt32LE(model.offset);
        model.len -= 4;
        model.offset += 4;
        return u;
    }
    decodeInt64(model) {
        let view = new DataView(model.buffer.buffer, model.offset, 8);
        let u = view.getBigInt64(0, true);
        model.len -= 8;
        model.offset += 8;
        return Number(u);
    }
    decodeNodePath(model) {
        let nameCount = this.decodeUInt32(model) & 0x7fffffff;
        let subNameCount = this.decodeUInt32(model);
        let flags = this.decodeUInt32(model);
        let isAbsolute = (flags & 1) === 1;
        if (flags & 2) {
            //Obsolete format with property separate from subPath
            subNameCount++;
        }
        let total = nameCount + subNameCount;
        let names = [];
        let subNames = [];
        for (let i = 0; i < total; i++) {
            let str = this.decodeString(model);
            if (i < nameCount) {
                names.push(str);
            }
            else {
                subNames.push(str);
            }
        }
        return {
            __type__: "NodePath",
            path: names,
            subpath: subNames,
            absolute: isAbsolute,
            __render__: () => `NodePath (${names.join(".")}:${subNames.join(":")})`
        };
    }
    decodeObject(model) {
        let className = this.decodeString(model);
        let propCount = this.decodeUInt32(model);
        let props = [];
        for (let i = 0; i < propCount; i++) {
            let name = this.decodeString(model);
            let value = this.decodeVariant(model);
            props.push({ name: name, value: value });
        }
        return { __type__: className, properties: props };
    }
    decodeObjectId(model) {
        let id = this.decodeUInt64(model);
        return {
            __type__: "Object",
            id: id,
            __render__: () => `Object<${id}>`
        };
    }
    decodePlane(model) {
        let x = this.decodeFloat(model);
        let y = this.decodeFloat(model);
        let z = this.decodeFloat(model);
        let d = this.decodeFloat(model);
        return {
            __type__: "Plane",
            x: x,
            y: y,
            z: z,
            d: d,
            __render__: () => `Plane (${this.clean(x)}, ${this.clean(y)}, ${this.clean(z)}, ${this.clean(d)})`
        };
    }
    decodePoolByteArray(model) {
        let count = this.decodeUInt32(model);
        let output = [];
        for (let i = 0; i < count; i++) {
            output.push(model.buffer.readUInt8(model.offset));
            model.offset++;
            model.len--;
        }
        return output;
    }
    decodePoolColorArray(model) {
        let count = this.decodeUInt32(model);
        let output = [];
        for (let i = 0; i < count; i++) {
            output.push(this.decodeColor(model));
        }
        return output;
    }
    decodePoolFloatArray(model) {
        let count = this.decodeUInt32(model);
        let output = [];
        for (let i = 0; i < count; i++) {
            output.push(this.decodeFloat(model));
        }
        return output;
    }
    decodePoolIntArray(model) {
        let count = this.decodeUInt32(model);
        let output = [];
        for (let i = 0; i < count; i++) {
            output.push(this.decodeInt32(model));
        }
        return output;
    }
    decodePoolStringArray(model) {
        let count = this.decodeUInt32(model);
        let output = [];
        for (let i = 0; i < count; i++) {
            output.push(this.decodeString(model));
        }
        return output;
    }
    decodePoolVector2Array(model) {
        let count = this.decodeUInt32(model);
        let output = [];
        for (let i = 0; i < count; i++) {
            output.push(this.decodeVector2(model));
        }
        return output;
    }
    decodePoolVector3Array(model) {
        let count = this.decodeUInt32(model);
        let output = [];
        for (let i = 0; i < count; i++) {
            output.push(this.decodeVector3(model));
        }
        return output;
    }
    decodeQuat(model) {
        let x = this.decodeFloat(model);
        let y = this.decodeFloat(model);
        let z = this.decodeFloat(model);
        let w = this.decodeFloat(model);
        return {
            __type__: "Quat",
            x: x,
            y: y,
            z: z,
            w: w,
            __render__: () => `Quat (${this.clean(x)}, ${this.clean(y)}, ${this.clean(z)}, ${this.clean(w)})`
        };
    }
    decodeRect2(model) {
        let x = this.decodeFloat(model);
        let y = this.decodeFloat(model);
        let sizeX = this.decodeFloat(model);
        let sizeY = this.decodeFloat(model);
        return {
            __type__: "Rect2",
            position: this.makeVector2(x, y),
            size: this.makeVector2(sizeX, sizeY),
            __render__: () => `Rect2 (${this.clean(x)}, ${this.clean(y)} - ${this.clean(sizeX)}, ${this.clean(sizeY)})`
        };
    }
    decodeString(model) {
        let len = this.decodeUInt32(model);
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
    decodeTransform(model) {
        let b = this.decodeBasis(model);
        let o = this.decodeVector3(model);
        return {
            __type__: "Transform",
            basis: this.makeBasis([b.x.x, b.x.y, b.x.z], [b.y.x, b.y.y, b.y.z], [b.z.x, b.z.y, b.z.z]),
            origin: this.makeVector3(o.x, o.y, o.z),
            __render__: () => `Transform ((${this.clean(b.x.x)}, ${this.clean(b.x.y)}, ${this.clean(b.x.z)}), (${this.clean(b.y.x)}, ${this.clean(b.y.y)}, ${this.clean(b.y.z)}), (${this.clean(b.z.x)}, ${this.clean(b.z.y)}, ${this.clean(b.z.z)}) - (${this.clean(o.x)}, ${this.clean(o.y)}, ${this.clean(o.z)}))`
        };
    }
    decodeTransform2(model) {
        let origin = this.decodeVector2(model);
        let x = this.decodeVector2(model);
        let y = this.decodeVector2(model);
        return {
            __type__: "Transform2D",
            origin: this.makeVector2(origin.x, origin.y),
            x: this.makeVector2(x.x, x.y),
            y: this.makeVector2(y.x, y.y),
            __render__: () => `Transform2D ((${this.clean(origin.x)}, ${this.clean(origin.y)}) - (${this.clean(x.x)}, ${this.clean(x.y)}), (${this.clean(y.x)}, ${this.clean(y.x)}))`
        };
    }
    decodeUInt32(model) {
        let u = model.buffer.readUInt32LE(model.offset);
        model.len -= 4;
        model.offset += 4;
        return u;
    }
    decodeUInt64(model) {
        let view = new DataView(model.buffer.buffer, model.offset, 8);
        let u = view.getBigUint64(0, true);
        model.len -= 8;
        model.offset += 8;
        return Number(u);
    }
    decodeVector2(model) {
        let x = this.decodeFloat(model);
        let y = this.decodeFloat(model);
        return this.makeVector2(x, y);
    }
    decodeVector3(model) {
        let x = this.decodeFloat(model);
        let y = this.decodeFloat(model);
        let z = this.decodeFloat(model);
        return this.makeVector3(x, y, z);
    }
    encodeArray(arr, model) {
        let size = arr.length;
        this.encodeUInt32(size, model);
        arr.forEach(e => {
            this.encodeVariant(e, model);
        });
    }
    encodeBool(bool, model) {
        this.encodeUInt32(bool ? 1 : 0, model);
    }
    encodeDictionary(dict, model) {
        let size = dict.size;
        this.encodeUInt32(size, model);
        let keys = Array.from(dict.keys());
        keys.forEach(key => {
            let value = dict.get(key);
            this.encodeVariant(key, model);
            this.encodeVariant(value, model);
        });
    }
    encodeString(str, model) {
        let strLen = str.length;
        this.encodeUInt32(strLen, model);
        model.buffer.write(str, model.offset, strLen, "utf8");
        model.offset += strLen;
        strLen += 4;
        while (strLen % 4) {
            strLen++;
            model.buffer.writeUInt8(0, model.offset);
            model.offset++;
        }
    }
    encodeUInt32(int, model) {
        model.buffer.writeUInt32LE(int, model.offset);
        model.offset += 4;
    }
    makeBasis(x, y, z) {
        return {
            __type__: "Basis",
            x: this.makeVector3(x[0], x[1], x[2]),
            y: this.makeVector3(y[0], y[1], y[2]),
            z: this.makeVector3(z[0], z[1], z[2]),
            __render__: () => `Basis ((${this.clean(x[0])}, ${this.clean(x[1])}, ${this.clean(x[2])}), (${this.clean(y[0])}, ${this.clean(y[1])}, ${this.clean(y[2])}), (${this.clean(z[0])}, ${this.clean(z[1])}, ${this.clean(z[2])}))`
        };
    }
    makeVector2(x, y) {
        return {
            __type__: `Vector2`,
            x: x,
            y: y,
            __render__: () => `Vector2 (${this.clean(x)}, ${this.clean(y)})`
        };
    }
    makeVector3(x, y, z) {
        return {
            __type__: `Vector3`,
            x: x,
            y: y,
            z: z,
            __render__: () => `Vector3 (${this.clean(x)}, ${this.clean(y)}, ${this.clean(z)})`
        };
    }
    sizeArray(arr) {
        let size = this.sizeUint32();
        arr.forEach(e => {
            size += this.sizeVariant(e);
        });
        return size;
    }
    sizeBool() {
        return this.sizeUint32();
    }
    sizeDictionary(dict) {
        let size = this.sizeUint32();
        let keys = Array.from(dict.keys());
        keys.forEach(key => {
            let value = dict.get(key);
            size += this.sizeVariant(key);
            size += this.sizeVariant(value);
        });
        return size;
    }
    sizeString(str) {
        let size = this.sizeUint32() + str.length;
        while (size % 4) {
            size++;
        }
        return size;
    }
    sizeUint32() {
        return 4;
    }
    sizeVariant(value) {
        let size = 4;
        switch (typeof value) {
            case "number":
                size += this.sizeUint32();
                break;
            case "boolean":
                size += this.sizeBool();
                break;
            case "string":
                size += this.sizeString(value);
                break;
            case "undefined":
                break;
            default:
                if (Array.isArray(value)) {
                    size += this.sizeArray(value);
                    break;
                }
                else {
                    size += this.sizeDictionary(value);
                    break;
                }
        }
        return size;
    }
}
exports.VariantParser = VariantParser;
//# sourceMappingURL=VariantParser.js.map