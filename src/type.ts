/** @extern */
export interface OutputStream extends OutputStreamMethods, NodeJS.ReadWriteStream {
}

/** @extern */
export interface OutputStreamControl extends OutputStream {
	readonly screen: OutputStream
}

/** @extern */
export interface OutputStreamMethods {
	/** next line, with a success icon */
	success(message?: string): this;
	/** next line, with a warn icon */
	warn(message?: string): this;
	/** next line, with a info icon */
	info(message?: string): this;
	/** next line, with a fail icon */
	fail(message?: string): this;
	/** next line, without a icon */
	empty(message?: string): this;
	
	/** next line, leave current content unchange */
	nextLine(): this;
	
	/** stop */
	pause(): this;
	/** to continue after pause/success/fail... */
	continue(): this;
	
	/** fast method to write(msg + \n) */
	writeln(txt: string): this;
	/** fast method to write(util.format(msg) + \n) */
	log(txt: any, ...args: any[]): this;
}
