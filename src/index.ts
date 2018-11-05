///<reference types="node"/>

import { allSupport, limitWidth, SupportInfo, windowsConsole } from 'cjke-strings';
/**@internal*/
import * as OraProxy from 'ora';
import { platform } from 'os';
import { Duplex, PassThrough, Writable } from 'stream';
import { LastLineStream } from './last-line';
import { LimitedOptions } from './ora-types';

const ora: typeof OraProxy = (<any>OraProxy).default || OraProxy;

const isWinCon = platform() === 'win32' && process.stderr.isTTY;
const defSupportType = isWinCon? windowsConsole : allSupport;

export interface DuplexControl extends Duplex {
	success(message?: string): this;
	fail(message?: string): this;
	continue(): this;
	nextLine(): this;
}

export interface MyOptions {
	supportType?: SupportInfo;
	forceTTY?: boolean;
	pipeTo?: Writable;
}

let working: Error = null;

function mockWorking(target?: Writable): DuplexControl {
	const stream = new PassThrough();
	stream.on('end', () => {
		working = null;
		stream.unpipe();
	});
	stream.pipe(target || process.stderr);
	
	const ret = Object.assign(stream, {
		success(message?: string) {
			return ret;
		},
		fail(message?: string) {
			return ret;
		},
		continue() {
			return ret;
		},
		nextLine() {
			return ret;
		},
	});
	
	return ret;
}

export function startWorking(opts: MyOptions&LimitedOptions = {}): DuplexControl {
	if (working) {
		throw new Error('spinner is already started by: ' + working.stack.split('\n').slice(1).join('\n'));
	}
	if (!process.stderr.isTTY && !opts.forceTTY) {
		console.warn('output is not tty, progress will not show.');
		return mockWorking(opts.pipeTo);
	}
	
	const stream = new LastLineStream();
	const spinner = ora({
		...opts,
		hideCursor: true,
	});
	
	let overflow = false;
	
	stream.on('lastLine', (data: Buffer) => {
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
	
	const ret = Object.assign(stream, {
		success(message?: string|Buffer) {
			spinner.succeed(handleNext(message));
			return ret;
		},
		fail(message: string|Buffer = stream.LastLine || Buffer.alloc(0)) {
			spinner.fail(handleNext(message));
			return ret;
		},
		continue() {
			stream.forget();
			spinner.start('\r');
			return ret;
		},
		nextLine() {
			stream.forget();
			spinner.stopAndPersist();
			spinner.start('\r');
			return ret;
		},
	});
	
	return ret;
}
