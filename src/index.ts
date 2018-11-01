///<reference types="node"/>
///<reference path="./ora-types.d.ts"/>

import ora = require('ora');
import { limitWidth } from 'cjke-strings';
import { platform } from 'os';
import { Duplex } from 'stream';
import { LastLineStream } from './last-line';

const isWinTty = platform() === 'win32' && process.stderr.isTTY;

export interface DuplexControl extends Duplex {
	success(message: string): void;
	fail(message: string): void;
	continue(): void;
	nextLine(): void;
}

export function startWorking(opts: LimitedOptions = {}): DuplexControl {
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
		const limit = limitWidth(str, process.stderr.columns - 2, isWinTty);
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
		spinner.stop();
	});

	return Object.assign(stream, {
		success(message: string): void {
			stream.forget();
			spinner.succeed(message);
		},
		fail(message: string): void {
			stream.forget();
			spinner.fail(message);
		},
		continue(): void {
			stream.forget();
			spinner.start('');
		},
		nextLine(): void {
			stream.forget();
			spinner.stopAndPersist();
			spinner.start('');
		},
	});
}
