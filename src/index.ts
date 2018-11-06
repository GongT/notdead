///<reference types="node"/>

import { allSupport, limitWidth, SupportInfo, windowsConsole } from 'cjke-strings';
/**@internal*/
import * as OraProxy from 'ora';
import { platform } from 'os';
import { Transform } from 'stream';
import { LastLineStream } from './last-line';
import { LimitedOptions } from './ora-types';
import ReadableStream = NodeJS.ReadableStream;
import WritableStream = NodeJS.WritableStream;

const ora: typeof OraProxy = (<any>OraProxy).default || OraProxy;

const isWinCon = platform() === 'win32' && process.stderr.isTTY;
const defSupportType = isWinCon? windowsConsole : allSupport;

export interface OutputStreamControl extends WritableStream, ReadableStream {
	success(message?: string): this;
	fail(message?: string): this;
	continue(): this;
	nextLine(): this;
	writeln(txt: string): boolean;
}

export interface MyOptions {
	supportType?: SupportInfo;
	forceTTY?: boolean;
}

let working: Error = null;

function mockWorking(target?: WritableStream&ReadableStream): OutputStreamControl {
	const ret = Object.assign(target || process.stderr, {
		success(message?: string) {
			process.stderr.write(`Success: ${message}\n`);
			return ret;
		},
		fail(message?: string) {
			process.stderr.write(`Fail: ${message}\n`);
			return ret;
		},
		continue() {
			return ret;
		},
		nextLine() {
			process.stderr.write('\n');
			return ret;
		},
		writeln(txt: string) {
			return process.stderr.write(txt + '\n');
		},
	});
	return ret;
}

export function startWorking(opts: MyOptions&LimitedOptions = {}): OutputStreamControl {
	if (working) {
		throw new Error('spinner is already started by: ' + working.stack.split('\n').slice(1).join('\n'));
	}
	if (!process.stderr.isTTY && !opts.forceTTY) {
		console.warn('output is not tty, progress will not show.');
		return mockWorking();
	}
	
	const stream = new Transform();
	const lastLine = new LastLineStream();
	stream.pipe(lastLine);
	
	const spinner = ora({
		...opts,
		hideCursor: true,
	});
	
	let overflow = false;
	
	lastLine.on('lastLine', (data: Buffer) => {
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
	
	lastLine.on('switchLine', () => {
		overflow = false;
	});
	
	spinner.start();
	
	stream.on('end', () => {
		working = null;
		spinner.stop();
	});
	
	function handleNext(message: string|Buffer = lastLine.LastLine || Buffer.alloc(0)) {
		if (Buffer.isBuffer(message)) {
			message = message.toString('utf8');
		}
		const limit = limitWidth(message, process.stderr.columns - 2, opts.supportType || defSupportType);
		return limit.result;
	}
	
	const ret = Object.assign(stream, {
		success(message?: string|Buffer) {
			stream.write(`--------------------\nSuccess: ${message}\n--------------------\n\n`);
			spinner.succeed(handleNext(message));
			return ret;
		},
		fail(message: string|Buffer = lastLine.LastLine || Buffer.alloc(0)) {
			stream.write(`--------------------\nFailed: ${message}\n--------------------\n\n`);
			spinner.fail(handleNext(message));
			return ret;
		},
		continue() {
			lastLine.forget();
			spinner.start('\r');
			return ret;
		},
		nextLine() {
			stream.write('\n----\n\n');
			lastLine.forget();
			spinner.stopAndPersist();
			spinner.start('\r');
			return ret;
		},
		writeln(txt: string) {
			return stream.write(txt + '\n');
		},
	});
	
	return ret;
}
