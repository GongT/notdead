import { Writable } from 'stream';
import { NodeTransformCallback } from './node-stream';

const nl = Buffer.from('\n');

export class LastLineStream extends Writable {
	private lastLineCache: Buffer = Buffer.alloc(0);
	
	constructor() {
		super();
	}
	
	_write(chunk: Buffer, encoding: string, callback: NodeTransformCallback): void {
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
		this.emit('lastLine', this.lastLineCache);
	}
	
	public forget() {
		this.lastLineCache = Buffer.alloc(0);
	}
}
