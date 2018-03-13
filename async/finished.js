// @flow

// global promise to cleanup long living resources that prevents node from closing

export let stop: () => void;

export default (new Promise(function(resolve: () => void) {
    stop = resolve;
}): Promise<void>);
