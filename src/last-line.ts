import { TransformCallback, Writable } from 'stream';

const nl = Buffer.from('\n');

export class LastLineStream extends Writable {
	private lastLineCache: Buffer = Buffer.alloc(0);
	
	constructor() {
		super();
	}
	
	_write(chunk: Buffer, encoding: string, callback: TransformCallback): void {
		if (chunk.length === 0) {
			callback();
		}
		
		this.lastLineCache = Buffer.concat([chunk, nl]);
		this.doEmitLine();
		
		callback();
	}
	
	public get LastLine() {
		return this.lastLineCache;
	}
	
	private doEmitLine() {
		this.emit('lastLine');
	}
	
	public forget() {
		this.lastLineCache = Buffer.alloc(0);
	}
}
