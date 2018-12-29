import { openSync, read } from 'fs';
import 'source-map-support/register';
import { PassThrough, Transform } from 'stream';
import { promisify } from 'util';
import { startWorking } from './index';

const chars = ['i', 'W', '啊', '깦', 'あ', '😂', '👍🏽', '😂\u0300', 'X\u0300', 'Y\u0300', '\uD834\uDD1E'];

function getRandom() {
	return chars[Math.floor(Math.random() * Math.floor(chars.length))];
}

export function test_displayEveyCharFullLine() {
	const split = Buffer.alloc(process.stdout.columns, '-');
	chars.forEach((v, i) => {
		let s = '';
		for (let i = 0; i < 100; i++) {
			s += v;
		}
		split.write(s.toString(), 0);
		console.log(split.toString());
	});
	console.log(split.fill('=').toString());
}

export function test_longRunning() {
	const output = startWorking();
	
	let i = 0;
	const pad = Buffer.alloc(process.stdout.columns, '-').toString();
	
	function next() {
		i++;
		output.write(`~~${i}~~${pad}\n`);
		setTimeout(next, Math.ceil(10 + Math.random() * 40));
	}
	
	next();
}

export function test_readRandomInput() {
	const output = startWorking();
	const input = new PassThrough();
	input.pipe(output);
	
	let pt = 0, tos: NodeJS.Timer[] = [];
	tos.push(setInterval(() => {
		output.success('success:' + pt);
		pt++;
		if (pt === 5) {
			tos.forEach(clearInterval);
			output.end();
			return;
		}
	}, 1200));
	tos.push(setInterval(() => {
		let s = '[';
		for (let i = 0; i < 15; i++) {
			s += getRandom();
		}
		s += ']';
		input.write(s);
	}, 200));
}

class RandomDelay extends Transform {
	_transform(d: Buffer, e: string, cb: Function) {
		this.push(d, e);
		setTimeout(() => {
			cb();
		}, Math.ceil(10 + Math.random() * 40));
	}
}

export async function test_fileInput(f: string) {
	const output = startWorking();
	
	const delay = new RandomDelay();
	delay.pipe(output);
	
	output.on('end', () => {
		output.success('file complete.');
	});
	
	const fd = openSync(f, 'r');
	const pread = promisify(read);
	while (true) {
		const buff = Buffer.alloc(1 + Math.random() * 100);
		const { bytesRead } = await pread(fd, buff, 0, buff.length, null);
		if (bytesRead === 0) {
			break;
		}
		delay.write(buff);
	}
}

// test_displayEveyCharFullLine();
// test_longRunning();
// test_readRandomInput();
// test_fileInput();
