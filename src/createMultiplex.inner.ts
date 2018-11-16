import { PassThrough } from 'stream';
import { format } from 'util';
import * as logSymbolsRaw from 'log-symbols';
import { OutputStreamBridge, OutputStreamMethods } from './index';

const logSymbols = logSymbolsRaw as any;

export class OutputStreamControlInner extends PassThrough implements OutputStreamMethods, NodeJS.ReadableStream {
	public readonly noEnd: boolean = true;
	constructor(
		private readonly bridge: OutputStreamBridge,
	) {
		super();
		this.noEnd = true;
		this.pipe(bridge.stream, { end: !(bridge as any).noEnd });
	}
	
	protected pipeNext(s: string, action: boolean): string {
		return s || '';
	}
	
	success(message?: string) {
		this.bridge.stopNext(logSymbols.success, this.pipeNext(message, true));
		return this;
	}
	
	warn(message?: string) {
		this.bridge.stopNext(logSymbols.warning, this.pipeNext(message, true));
		return this;
	}
	
	info(message?: string) {
		this.bridge.stopNext(logSymbols.info, this.pipeNext(message, true));
		return this;
	}
	
	fail(message?: string) {
		this.bridge.stopNext(logSymbols.error, this.pipeNext(message, true));
		return this;
	}
	
	empty(message?: string) {
		this.bridge.stopNext(undefined, this.pipeNext(message, true));
		return this;
	}
	
	nextLine() {
		this.pipeNext('', true);
		this.bridge.stopNext(undefined, undefined);
		return this;
	}
	
	pause() {
		this.bridge.enable(false);
		return this;
	}
	
	continue() {
		this.bridge.enable(true);
		return this;
	}
	
	writeln(txt: string) {
		this.pipeNext(txt + '\n', false);
		this.bridge.stream.write(txt + '\n');
		return this;
	}
	
	log(txt: any, ...args: any[]) {
		const msg = format(txt, ...args) + '\n';
		this.pipeNext(msg, false);
		this.bridge.stream.write(msg);
		return this;
	}
}

