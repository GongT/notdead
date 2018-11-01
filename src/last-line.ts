import { Transform, TransformCallback } from 'stream';

const nl = Buffer.from('\n');

export class LastLineStream extends Transform {
	private lastLineCache: Buffer = Buffer.alloc(0);
	private prevLineCache: Buffer;
	private lastObject: any = false;

	_transform(chunk: Buffer, encoding: string, callback: TransformCallback): void {
		this.push(chunk, encoding);

		if (chunk.length === 0) {
			return;
		}

		const last = chunk.lastIndexOf(nl);
		const prev = chunk.slice(0, chunk.length - 1).lastIndexOf(nl);
		if (last === -1) { // prev === -1: no any \n
			this.lastLineCache = Buffer.concat([this.lastLineCache, chunk]);
		} else if (prev === -1) { // only 1 \n
			this.prevLineCache = Buffer.concat([this.lastLineCache, chunk.slice(0, last)]);
			this.lastLineCache = Buffer.from(chunk.slice(last + 1));
		} else { // both not -1
			this.prevLineCache = Buffer.from(chunk.slice(prev + 1, last));
			this.lastLineCache = Buffer.from(chunk.slice(last + 1));
		}

		this.doEmitLine();
		return callback();
	}

	private doEmitLine() {
		const buff = this.lastLineCache.length? this.lastLineCache : this.prevLineCache;
		if (buff !== this.lastObject) {
			this.emit('switchLine');
			this.lastObject = buff;
		}
		this.emit('lastLine', buff || Buffer.alloc(0));
	}

	public forget() {
		this.lastLineCache = Buffer.alloc(0);
		delete this.prevLineCache;
		this.lastObject = false;
	}
}
