import * as OraProxy from 'ora';
import { LastLineStream } from './last-line';
import { LimitedOptions } from './ora-types';
import { OutputStreamBridge } from './index';
import { symbol, symbolInstead } from './createMultiplex';
import * as split2Proxy from 'split2';

const ora: typeof OraProxy = (<any>OraProxy).default || OraProxy;
const split2: typeof split2Proxy = (<any>split2Proxy).default || split2Proxy;

export function createLastLineAndSpinner(opts: LimitedOptions): OutputStreamBridge {
	const lastLine = split2().pipe(new LastLineStream());
	
	const spinner = ora({
		...opts,
		hideCursor: false,
	});
	
	let to: NodeJS.Timer;
	lastLine.on('lastLine', () => {
		if (to) {
			return;
		}
		to = setTimeout(() => {
			spinner.text = lastLine.LastLine.toString();
			to = null;
		}, 100);
	});
	lastLine.on('finish', () => {
		spinner.stop();
	});
	
	const ret: OutputStreamBridge = {
		stream: lastLine,
		stopNext(icon: string, message: string) {
			lastLine.forget();
			if (icon) {
				spinner.stopAndPersist({
					symbol: icon,
					text: message,
				});
			} else if (message) {
				spinner.stopAndPersist({ text: message });
			} else {
				if (typeof message === 'string') {
					spinner.clear();
				}
				spinner.stopAndPersist();
			}
			spinner.start();
		},
		enable(v: boolean) {
			if (v) {
				spinner.start();
			} else {
				spinner.stop();
			}
		},
	};
	
	spinner.start();
	
	Object.defineProperty(ret, symbol, { value: true });
	Object.defineProperty(ret, symbolInstead, { value: true });
	return ret;
}
