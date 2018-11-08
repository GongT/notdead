import { TransformCallback } from 'stream';
import { OutputStreamBridge } from './index';
import { OutputStreamControlInner } from './createMultiplex.inner';
import { ensureNotExists, removeExists } from './singleton';

/** @internal */
export const symbol = Symbol('OutputStreamMethods');
export const symbolInstead = '__OutputStreamMethods';

export class OutputStreamControl extends OutputStreamControlInner {
	public readonly noEnd: boolean = true;
	private pipingMode: boolean = false;
	
	public readonly screen: OutputStreamControlInner;
	
	constructor(
		bridge: OutputStreamBridge,
	) {
		super(bridge);
		
		this.screen = new OutputStreamControlInner(bridge);
		this.pipe(this.screen, { end: true });
		
		ensureNotExists();
		this.endHandle = this.endHandle.bind(this);
		this.onOutputChange = this.onOutputChange.bind(this);
		
		this.on('end', this.endHandle);
		this.on('finish', this.endHandle);
		
		this.on('newListener', this.onOutputChange);
		this.on('removeListener', this.onOutputChange);
		
		Object.assign(this, {
			[symbol]: true,
		});
	}
	
	protected pipeNext(s: string, action: boolean): string {
		if (action) {
			this.write(`--------------------------\n${s}\n--------------------------\n\n`);
		} else {
			this.write(s + '\n');
		}
		return s || ' ';
	}
	
	private endHandle() {
		this.removeListener('end', this.endHandle);
		this.removeListener('finish', this.endHandle);
		removeExists();
	}
	
	private onOutputChange() {
		this.pipingMode = this.listenerCount('data') !== 0;
	}
	
	_transform(chunk: any, encoding: string, callback: TransformCallback): void {
		if (this.pipingMode) {
			this.push(chunk, encoding);
		}
		callback();
	}
	
	static [Symbol.hasInstance](instance: any) {
		return instance && instance[symbol];
	}
}
