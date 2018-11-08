let working: Error = null;

export function ensureNotExists() {
	if (working) {
		throw new Error('spinner is already started by: ' + working.stack.split('\n').slice(1).join('\n'));
	}
	working = new Error();
}

export function removeExists() {
	working = null;
}
