import { TransformCallback, Writable } from 'stream';

const nl = Buffer.from('\n');

export class LastLineStream extends Writable {
	private lastLineCache: Buffer = Buffer.alloc(0);
	private prevLineCache: Buffer;
	private lastObject: any = false;
	
	_write(chunk: Buffer, encoding: string, callback: TransformCallback): void {
		if (chunk.length === 0) {
			callback();
			return;
		}
		
		try {
			const last = chunk.lastIndexOf(nl);
			const prev = chunk.slice(0, chunk.length - 1).lastIndexOf(nl);
			if (last === -1) { // prev === -1: no any \n
				this.lastLineCache = Buffer.concat([this.lastLineCache, chunk]);
			} else if (prev === -1) { // only 1 \n
				const newPrevLine = Buffer.concat([this.lastLineCache, chunk.slice(0, last)]);
				const newLastLine = copyBuffer(chunk.slice(last + 1));
				if (newLastLine.length + newPrevLine.length > 0) {
					this.prevLineCache = newPrevLine;
					this.lastLineCache = newLastLine;
				}
			} else { // both not -1
				const newPrevLine = copyBuffer(chunk.slice(prev + 1, last));
				const newLastLine = copyBuffer(chunk.slice(last + 1));
				if (newLastLine.length + newPrevLine.length > 0) {
					this.prevLineCache = newPrevLine;
					this.lastLineCache = newLastLine;
				}
			}
			
			this.doEmitLine();
		} catch (e) {
			debugger;
			this.emit('error', e);
		}
		callback();
	}
	
	public get LastLine() {
		return this.lastLineCache.length? this.lastLineCache : this.prevLineCache;
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

function copyBuffer(oldBuffer: Buffer) {
	const newBuff = Buffer.allocUnsafe(oldBuffer.length);
	oldBuffer.copy(newBuff);
	return newBuff;
}
