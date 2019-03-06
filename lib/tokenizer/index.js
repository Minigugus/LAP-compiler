'use strict';

class LAPTokenError extends Error {
	constructor(token, filename, position) {
		super(`${filename}:${position.line}:${position.column}: Jeton « ${token} » non reconnu.`);
		this.token = token;
		this.filename = filename;
		this.position = position;
	}
}

class SourceCursor {
	constructor(source) {
		this._internalIterator = source[Symbol.iterator]();
		this.value = null;
		this.done = false;
		this.read = 0;
		this.line = 1;
		this.column = 0;
	}

	get position() {
		return ({
			line: this.line,
			column: this.column
		});
	}

	get seekRange() {
		return ({
			from: this._seekStart,
			to: this._seekEnd
		});
	}

	get current() {
		return this.value;
	}

	_forward() {
		if (/\n/.test(this.current))
		{
			this.line++;
			this.column = 0;
		}
		this.column++;
		this.read++;
	}

	next() {
		if (!this.done)
		{
			const state = (this._seek ? this._seek : this._internalIterator.next());
			if (this._seek)
				this._seek = null;
			else
				this._forward();
			this._seekStart = this.position;
			this.value = state.value || null;
			if (this.value)
				this.previous = this.value;
			this.done = state.done;
		}
		return this;
	}

	seek() {
		if (!this.done)
		{
			const state = this._internalIterator.next();
			if (!state.done)
				this._forward();
			this._seek = state;
			this._seekEnd = this.position;
			this.value = state.value || null;
			if (this.value)
				this.previous = this.value;
			this.done = state.done;
		}
		return this;
	}

	consume(criteria) {
		this.seek();
		let token = '';
		while (!this.done && criteria.test(this.current))
		{
			token += this.current;
			this.seek();
		}
		return token;
	}

	[Symbol.iterator]() {
		return this;
	}

}

const RESERVED_KEYWORDS = new Set([
	'ACTION',
	'PROCEDURE',
	'FONCTION',
	'VAR',
	'DEBUT',
	'FINPROCEDURE',
	'FINFONCTION',
	'DEBUT',
	'FINACTION'
]);

function* tokenizer(source, filename) {
	const cursor = new SourceCursor(source);
	const token = (type, props) =>
		Object.assign(
			{ type, position: ((props && props.value && props.value.length > 1) ? cursor.seekRange : cursor.position) },
			props);
	while (!cursor.next().done)
		switch (cursor.current)
		{
			case '\n':
				yield token('nouvelle_ligne');
				break;

			case '%':
				let escape = false, comment = '';
				cursor.seek();
				while (!cursor.done && (escape || cursor.current !== '%'))
				{
					if (!escape && cursor.current === '\\')
						escape = true;
					else
						comment += cursor.current;
					cursor.seek();
				}
				cursor.seek();
				yield token('commentaire', { value: comment });
				break;

			case ',':
				yield token('virgule');
				break;

			case ':':
				yield token('double_point');
				break;

			case '(':
			case ')':
				yield token('parenthèse', { openning: (cursor.current === '(') });
				break;

			case '=':
			case '+':
			case '-':
			case '*':
			case '/':
				yield token('operateur', { value: cursor.current });
				break;

			case '<':
				this.seek();
				if (this.current === '>')
				{
					this.next();
					yield token('operateur', { value: '<>' });
				}
				else
					yield token('operateur', { value: '<' });
				break;
			case '>':
				yield token('operateur', { value: cursor.current });
				break;

			default:
				if (/\s/.test(cursor.current));
				else if (/[0-9]/.test(cursor.current))
					yield token('nombre', { value: parseInt(cursor.current + cursor.consume(/[0-9]/)) })
				else if (/[\wéèêà]/i.test(cursor.current))
				{
					const word = cursor.current + cursor.consume(/[\wéèêà]/i);
					if (RESERVED_KEYWORDS.has(word.toUpperCase()))
						yield token('mot_cle', { value: word.toUpperCase() });
					else
						yield token('mot', { value: word });
				}
				else
					throw new LAPTokenError(cursor.current, filename, cursor.position);
				break;
		}
}

module.exports = tokenizer;
module.exports.RESERVED_KEYWORDS = RESERVED_KEYWORDS;
