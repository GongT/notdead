import { allSupport, limitWidth, windowsConsole } from 'cjke-strings';
import { platform } from 'os';
import 'source-map-support/register';
import { Transform } from 'stream';
import { startWorking } from './index';

const isWinCon = platform() === 'win32' && process.stderr.isTTY;
const supportType = isWinCon? windowsConsole : allSupport;
console.log('isWinCon=%s', isWinCon, supportType);

const chars = ['i', 'W', '啊', '깦', 'あ', '😂', '👍🏽', '😂\u0300', 'X\u0300', 'Y\u0300', '\uD834\uDD1E'];

const split = Buffer.alloc(process.stdout.columns, '-');
chars.forEach((v, i) => {
	let s = '';
	for (let i = 0; i < 100; i++) {
		s += v;
	}
	split.write(i.toString(), 0);
	console.log(split.toString());
	console.log(limitWidth(s, process.stdout.columns, supportType).result);
});
console.log(split.fill('=').toString());

function getRandom() {
	return chars[Math.floor(Math.random() * Math.floor(chars.length))];
}

const input = new Transform({
	transform(b: Buffer, e: string, cb: Function) {
		this.push(b, e);
		cb();
	},
});

const output = startWorking();

input.pipe(output);

let pt = 0, tos: NodeJS.Timer[] = [];
tos.push(setInterval(() => {
	output.success();
	pt++;
	if (pt === 5) {
		tos.forEach(clearInterval);
		return;
	}
	output.continue();
}, 1200));
tos.push(setInterval(() => {
	let s = '[';
	for (let i = 0; i < 15; i++) {
		s += getRandom();
	}
	s += ']';
	input.write(s);
}, 200));
