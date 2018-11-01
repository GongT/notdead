///<reference types="node"/>

import ora = require('ora');
import { allSupport, limitWidth, SupportInfo, windowsConsole } from 'cjke-strings';
import { platform } from 'os';
import { Duplex } from 'stream';
import { BlackHole, LastLineStream } from './last-line';

const isWinCon = platform() === 'win32' && process.stderr.isTTY;
const defSupportType = isWinCon? windowsConsole : allSupport;

export interface DuplexControl extends Duplex {
	success(message?: string): void;
	
	fail(message?: string): void;
	
	continue(): void;
	
	nextLine(): void;
}

export interface MyOptions {
	supportType?: SupportInfo;
	forceTTY?: boolean;
}

let working: Error = null;

function mockWorking() {
	const stream = new BlackHole();
	stream.on('end', () => {
		working = null;
	});
	
	return Object.assign(stream, {
		success(message?: string): void {
		},
		fail(message?: string): void {
		},
		continue(): void {
		},
		nextLine(): void {
		},
	});
}

export function startWorking(opts: MyOptions&LimitedOptions = {}): DuplexControl {
	if (working) {
		throw new Error('spinner is already started by: ' + working.stack.split('\n').slice(1).join('\n'));
	}
	if (!process.stderr.isTTY && !opts.forceTTY) {
		console.warn('output is not tty, progress will not show.');
		return mockWorking();
	}
	
	const stream = new LastLineStream();
	const spinner = ora({
		...opts,
		hideCursor: true,
	});
	
	let overflow = false;
	
	stream.on('lastLine', (data) => {
		if (overflow) {
			return;
		}
		
		const str = data.toString('utf8');
		const limit = limitWidth(str, process.stderr.columns - 2, opts.supportType || defSupportType);
		spinner.text = limit.result;
		
		if (limit.result.length < str.length) {
			overflow = true;
		}
	});
	
	stream.on('switchLine', () => {
		overflow = false;
	});
	
	spinner.start();
	
	stream.on('end', () => {
		working = null;
		spinner.stop();
	});
	
	function handleNext(message: string|Buffer = stream.LastLine || Buffer.alloc(0)) {
		if (Buffer.isBuffer(message)) {
			message = message.toString('utf8');
		}
		const limit = limitWidth(message, process.stderr.columns - 2, opts.supportType || defSupportType);
		return limit.result;
	}
	
	return Object.assign(stream, {
		success(message?: string|Buffer): void {
			spinner.succeed(handleNext(message));
		},
		fail(message: string|Buffer = stream.LastLine || Buffer.alloc(0)): void {
			spinner.fail(handleNext(message));
		},
		continue(): void {
			stream.forget();
			spinner.start('\r');
		},
		nextLine(): void {
			stream.forget();
			spinner.stopAndPersist();
			spinner.start('\r');
		},
	});
}
