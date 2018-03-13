// @flow

declare module 'chokidar' {
    declare interface Watcher {
        add(name: string): void;
        unwatch(name: string): void;
        close(): void;
        on(event: string, (path: string) => void): void;
    }

    declare module.exports: {
        watch(): Watcher;
    }
}