///<reference types="node"/>

import { allSupport, limitWidth, SupportInfo, windowsConsole } from 'cjke-strings';
import { LimitedOptions } from './ora-types';
import { createLastLineAndSpinner } from './screen';
import { OutputStreamControl } from './createMultiplex';
import { makeLog } from './not-screen';
import { platform } from 'os';

const isWinCon = platform() === 'win32' && process.stderr.isTTY;
const defSupportType = isWinCon ? windowsConsole : allSupport;

export interface OutputStreamBridge {
	stream: NodeJS.WritableStream;
	stopNext(icon: string, message: string): void;
	enable(v: boolean): void;
}

/** @extern */
export interface MyOptions {
	supportType?: SupportInfo;
	forceTTY?: boolean;
	noEnd?: boolean;
}

/** @extern */
export function startWorking(opts: MyOptions & LimitedOptions = {}): OutputStreamControl {
	if (process.stderr.isTTY || opts.forceTTY) {
		const { supportType } = opts;
		const bundle = createLastLineAndSpinner(opts, (message: string) => {
			return limitWidth(message, process.stderr.columns - 2, supportType || defSupportType).result;
		});
		return new OutputStreamControl(bundle);
	} else {
		console.warn('output is not tty, progress will not show.');
		return new OutputStreamControl(makeLog(process.stderr, opts.noEnd));
	}
}
