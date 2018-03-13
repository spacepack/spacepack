// @flow

import Module from 'module';

var userStubs = {};
var firstRequiredModuleName: ?string;

function setFirstRequire(moduleName: string): void {
    if (firstRequiredModuleName === undefined) {
        firstRequiredModuleName = moduleName;
    }
}

function cleanup() {
    if (firstRequiredModuleName) {
        var matcher = new RegExp(firstRequiredModuleName);
        if (require && require.cache) {
            for (var _i = 0, _a = Object.getOwnPropertyNames(require.cache); _i < _a.length; _i++) {
                const item = _a[_i];
                if (item.match(matcher)) {
                    delete require.cache[item];
                }
            }
        }
    }
}

export default function proxy<T>(requireFunc: () => T, stubs: {[key: string]: any}): T {
    firstRequiredModuleName = undefined;
    userStubs = stubs;
    const module = requireFunc();
    cleanup();
    userStubs = {};
    return module;
}

if (Module && Module.prototype && Module.prototype.require) {
    var originalRequire = Module.prototype.require;
    Module.prototype.require = function (path: string) {
        var parts = path.split('/');
        var moduleName = parts[parts.length - 1];
        setFirstRequire(moduleName);
        return userStubs[path] || userStubs[moduleName] || originalRequire.apply(this, arguments);
    };
}
