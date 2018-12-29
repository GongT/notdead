import { OutputStreamBridge } from './index';
import { OutputStreamControlInner } from './createMultiplex.inner';
import { ensureNotExists, removeExists } from './singleton';
import { NodeTransformCallback } from './node-stream';

/** @internal */
export const symbol = Symbol('OutputStreamMethods');
export const symbolInstead = '__OutputStreamMethods';

export class OutputStreamControl extends OutputStreamControlInner {
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
	
	_transform(chunk: any, encoding: string, callback: NodeTransformCallback): void {
		if (this.pipingMode) {
			this.push(chunk, encoding);
		}
		callback();
	}
	
	static [Symbol.hasInstance](instance: any) {
		return instance && instance[symbol];
	}
}
