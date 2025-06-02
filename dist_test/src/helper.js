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
exports.mergeObject = void 0;
function mergeObject(...objArg) {
    return __awaiter(this, void 0, void 0, function* () {
        // create a new object
        let target = {};
        // deep merge the object into the target object
        // iterate through all objects and
        // deep merge them with target
        for (let i = 0; i < objArg.length; i++) {
            for (let prop in objArg[i]) {
                if (objArg[i].hasOwnProperty(prop)) {
                    if (Object.prototype.toString.call(objArg[i][prop]) === "[object Object]") {
                        // if the property is a nested object
                        target[prop] = yield mergeObject(target[prop], objArg[i][prop]);
                    }
                    else {
                        // for regular property
                        target[prop] = objArg[i][prop];
                    }
                }
            }
        }
        return target;
    });
}
exports.mergeObject = mergeObject;
