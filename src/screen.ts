import * as OraProxy from 'ora';
import { LastLineStream } from './last-line';
import { LimitedOptions } from './ora-types';
import { OutputStreamBridge } from './index';
import { symbol, symbolInstead } from './createMultiplex';

const ora: typeof OraProxy = (<any>OraProxy).default || OraProxy;

export interface LineCutter {
	(str: string): string;
}

export function createLastLineAndSpinner(opts: LimitedOptions, cutLine: LineCutter): OutputStreamBridge {
	const lastLine = new LastLineStream();
	
	let overflow = false;
	
	const spinner = ora({
		...opts,
		hideCursor: true,
	});
	
	lastLine.on('lastLine', (data: Buffer) => {
		if (overflow) {
			return;
		}
		
		const input = data.toString('utf8');
		const output = cutLine(input);
		spinner.text = output;
		
		if (output.length < input.length) {
			overflow = true;
		}
	});
	lastLine.on('switchLine', () => {
		overflow = false;
	});
	lastLine.on('finish', () => {
		spinner.stop();
	});
	
	const ret: OutputStreamBridge = {
		noEnd: false,
		stream: lastLine,
		stopNext(icon: string, message: string) {
			lastLine.forget();
			if (icon) {
				spinner.stopAndPersist({
					symbol: icon,
					text: message,
				});
			} else if (message) {
				spinner.stopAndPersist(message);
			} else {
				spinner.stopAndPersist();
			}
		},
		enable(v: boolean) {
			if (v) {
				spinner.start();
			} else {
				spinner.stop();
			}
		},
	};
	
	Object.defineProperty(ret, symbol, { value: true });
	Object.defineProperty(ret, symbolInstead, { value: true });
	return ret;
}
