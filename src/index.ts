///<reference types="node"/>

import { LimitedOptions } from './ora-types';
import { createLastLineAndSpinner } from './screen';
import { OutputStreamControl } from './createMultiplex';
import { makeLog } from './not-screen';
import WritableStream = NodeJS.WritableStream;

export interface OutputStreamBridge {
	stream: WritableStream;
	stopNext(icon: string, message: string): void;
	enable(v: boolean): void;
}

export interface OutputStreamMethods {
	/** next line, with a success icon */
	success(message?: string): this;
	/** next line, with a warn icon */
	warn(message?: string): this;
	/** next line, with a info icon */
	info(message?: string): this;
	/** next line, with a fail icon */
	fail(message?: string): this;
	/** next line, without a icon */
	empty(message?: string): this;
	
	/** next line, leave current content unchange */
	nextLine(): this;
	
	/** stop */
	pause(): this;
	/** to continue after pause/success/fail... */
	continue(): this;
	
	/** fast method to write(msg + \n) */
	writeln(txt: string): this;
	/** fast method to write(util.format(msg) + \n) */
	log(txt: any, ...args: any[]): this;
}

export interface MyOptions {
	forceTTY?: boolean;
	noEnd?: boolean;
}

export function startWorking(opts: MyOptions & LimitedOptions = {}): OutputStreamControl {
	if (process.stderr.isTTY || opts.forceTTY) {
		const bundle = createLastLineAndSpinner(opts);
		return new OutputStreamControl(bundle);
	} else {
		console.warn('output is not tty, progress will not show.');
		return new OutputStreamControl(makeLog(process.stderr, opts.noEnd));
	}
}
