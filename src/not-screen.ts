import { OutputStreamBridge } from './index';
import { symbol, symbolInstead } from './createMultiplex';

export function makeLog(target: NodeJS.WritableStream, noEnd: boolean): OutputStreamBridge {
	const ret: OutputStreamBridge = {
		stream: target,
		stopNext(icon: string, message: string) {
			if (icon) {
				target.write(`${icon} ${message}\n\n`);
			} else if (message) {
				target.write(`${message}\n\n`);
			} else {
				target.write('\n\n');
			}
		},
		enable(v: boolean) {
		},
	};
	
	Object.defineProperty(ret, symbol, { value: true });
	Object.defineProperty(ret, symbolInstead, { value: true });
	
	return ret;
}
