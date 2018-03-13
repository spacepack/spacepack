// @flow

// very basic cache, probably worth to replace it if it is not enough

const mapModuleIdToFilePath: {[key: string]: string} = /* :: {} || */ Object.create(null);
const fileMtime: {[key: string]: number} = /* :: {} || */ Object.create(null);

export function getModuleFileById(id: string): ?string {
    return mapModuleIdToFilePath[id];
}

export function haveModuleFileById(id: string, filePath: string): void {
    mapModuleIdToFilePath[id] = filePath;
}

export function getFileMtime(fileName: string): ?number {
    return fileMtime[fileName];
}

export function setFileMtime(fileName: string, mtime: number): void {
    fileMtime[fileName] = mtime;
}