import { Transform } from 'stream';
import { startWorking } from './index';
import { limitWidth } from 'cjke-strings';

const chars = ['i', 'W', '啊', '깦', 'あ', '😂', '👍🏽', '😂\u0300', 'X\u0300', 'Y\u0300', '\uD834\uDD1E'];

chars.forEach((v) => {
	let s = '';
	for (let i = 0; i < 100; i++) {
		s += v;
	}
	console.log(Buffer.alloc(process.stdout.columns, '-').toString());
	console.log(limitWidth(s, process.stdout.columns).result);
	console.log(Buffer.alloc(process.stdout.columns, '-').toString());
	console.log('');
});

/*function getRandom() {
	return chars[Math.floor(Math.random() * Math.floor(chars.length))];
}*/

const input = new Transform({
	transform(b: Buffer, e: string, cb: Function) {
		this.push(b, e);
		cb();
	},
});

const output = startWorking();

input.pipe(output);

let pt = 0;
setInterval(() => {
	output.nextLine();
	pt++;
	if (pt === chars.length) {
		process.exit(0);
	}
}, 1200);
setInterval(() => {
	let s = '[';
	for (let i = 0; i < 15; i++) {
		s += chars[pt];
	}
	s += ']';
	input.write(s);
}, 200);
