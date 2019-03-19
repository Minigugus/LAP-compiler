'use strict';

const ERROR_MESSAGES = {

};

class LAPSyntaxError extends Error {
	constructor(message, token, filename) {
		super(`${filename}:${token.position.line || token.position.from.line}:${token.position.column || token.position.from.column}: ${message}`);
		this.token = token;
		this.filename = filename;
	}
}

class LAPKeywordExpectedError extends LAPSyntaxError {
	constructor(token, expected, filename) {
		super(
			`Mot-clé « ${token.value} » reçu, ${expected.join(', ')} attendu(s).`,
			token,
			filename);
	}
}

class LAPUnexpectedTokenError extends LAPSyntaxError {
	constructor(token, expected, filename) {
		super(
			`Jeton « ${token.type} » inattendu. Les jetons attendus étaient : ${expected.join(', ')}.`,
			token,
			filename);
	}
}

class LAPUnexpectedEOFError extends LAPSyntaxError {
	constructor(token, expected, filename) {
		super(
			`Fin de fichier prématurée. Attendu : ${expected.join(', ')}.`,
			token,
			filename);
	}
}

class LAPUnexpectedCharacterError extends LAPSyntaxError {
	constructor(token, expected, filename) {
		super(
			`Caractère « ${token.value} » inattendu. « ${expected.join(', ')} » étai(en)t attendu(s).`,
			token,
			filename);
	}
}

class LAPUnexpectedSymbolError extends LAPSyntaxError {
	constructor(token, filename) {
		super(
			`« ${token.value} » était inattendu.`,
			token,
			filename);
	}
}

class TokenCursor {
	constructor(tokens, filename) {
		this._internalIterator = tokens instanceof Function ? tokens() : tokens[Symbol.iterator]();
		this.filename = filename;
		this.value = null;
		this.done = false;
	}

	get current() {
		return this.value;
	}

	_next() {
		let state;
		do
		{
			state = this._internalIterator.next();
		} while (!state.done && state.value.type === 'commentaire');
		return state;
	}

	next() {
		if (!this.done)
		{
			const state = (this._seek ? this._seek : this._next());
			if (this._seek)
				this._seek = null;
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
			const state = this._next();
			this._seek = state;
			this._seekEnd = this.position;
			this.previous = this.value;
			this.value = state.value || null;
			this.done = state.done;
		}
		return this;
	}

	consume(criteria) {
		this.seek();
		let tokens = [];
		while (!this.done && criteria(this.current))
		{
			tokens.push(this.current);
			this.seek();
		}
		return tokens;
	}

	expect(next, ...type) {
		if (next)
			this.next();
		if (this.done)
			throw new LAPUnexpectedEOFError(this.previous, type, this.filename);
		else if (!type.includes(this.current.type))
			throw new LAPUnexpectedTokenError(this.current, type, this.filename);
	}

	expectKeyword(next, ...name) {
		this.expect(next, 'mot_cle');
		if (name.includes(this.current.value.toUpperCase()))
			throw new LAPKeywordExpectedError(this.current, name, this.filename);
	}

	expectParenthesis(next, openning) {
		this.expect(next, 'parenthèse');
		if (!this.current.openning !== !openning)
			throw new LAPUnexpectedCharacterError(Object.assign({ value: this.current.openning ? '(' : ')' }, this.current), [ openning ? '(' : ')' ], this.filename);
	}

	expectName(next, value) {
		this.expect(next, 'mot');
		if (value && this.current.value.toUpperCase() !== value)
			throw new LAPKeywordExpectedError(this.current, [ value ], this.filename);
	}

	expectNumber(next) {
		this.expect(next, 'nombre');
	}

	getKeyword(next, ...name) {
		this.expectKeyword(next, ...name);
		return this.current.value;
	}

	getName(next) {
		this.expectName(next);
		return this.current.value;
	}

	getNumber(next) {
		this.expectNumber(next);
		return this.current.value;
	}

	getType(next) {
		const typeWords = [];
		do
		{
			typeWords.push(this.getName(next));
			if (next) next = false;
			// this.expect(true, 'mot', 'nouvelle_ligne');
			this.next();
		} while (this.current.type === 'mot');
		return typeWords.join(' ').toUpperCase();
	}

	[Symbol.iterator]() {
		return this;
	}
}

function walk(type, ...args) {
	const types = {
		'action'() {
			const name = this.getName(true);
			this.expect(true, 'nouvelle_ligne');
			const { variables, callables } = walk.call(this, 'portee_definition');
			this.expectKeyword(false, 'debut');
			this.expect(true, 'nouvelle_ligne');
			const body = walk.call(this, 'bloc_instructions', 'FINACTION');
			return ({
				type: 'action',
				name,
				variables,
				callables,
				body
			});
		},
		'portee_definition'() {
			const variables = [], callables = [];
			while (!this.done)
			{
				do
				{
					this.next();
				} while (this.current.type === 'nouvelle_ligne');
				if (!this.done && this.current.type === 'mot_cle' && this.current.value === 'DEBUT')
					break;
				switch (this.getKeyword(false, 'var', 'procedure', 'fonction', 'debut'))
				{
					case 'VAR':
						variables.push(...walk.call(this, 'variable_definition'));
						break;
					case 'PROCEDURE':
						callables.push(walk.call(this, 'procedure_definition'));
						break;
					case 'FONCTION':
						callables.push(walk.call(this, 'fonction_definition'));
						break;
				}
			}
			return ({
				variables,
				callables
			});
		},
		'variable_definition'() {
			this.expectKeyword(false, 'var');
			const names = [];
			do
			{
				const def = ({
					name: this.getName(true),
					array_size: null
				})
				this.expect(true, 'virgule', 'double_point', 'parenthèse');
				if (this.current.type === 'parenthèse')
				{
					this.expectParenthesis(false, true);
					def.array_size = this.getNumber(true);
					this.expectParenthesis(true, false);
					this.expect(true, 'virgule', 'double_point');
				}
				names.push(def);
			} while (this.current.type === 'virgule');
			const type = this.getType(true);
			return names.map(def => ({
				type: 'variable',
				name: def.name,
				runtime_type: (typeof def.array_size === 'number'
					? ({ type: 'array_type', value: type, size: def.array_size })
					: ({ type: 'type', value: type })
				)
			}));
		},
		'procedure_definition'() {
			this.expect(true, 'mot');
			const name = this.current.value;
			this.expectParenthesis(true, true);
			const parameters = walk.call(this, 'parametre_definition');
			this.expectParenthesis(false, false);
			this.expect(true, 'nouvelle_ligne');
			const { variables, callables } = walk.call(this, 'portee_definition');
			this.expectKeyword(false, 'debut');
			this.expect(true, 'nouvelle_ligne');
			const body = walk.call(this, 'bloc_instructions', 'FINPROCEDURE');
			return ({
				type: 'procedure_definition',
				name,
				parameters,
				variables,
				callables,
				body
			});
		},
		'fonction_definition'() {
			this.expect(true, 'mot');
			const name = this.current.value;
			this.expectParenthesis(true, true);
			const parameters = walk.call(this, 'parametre_definition');
			this.expectParenthesis(false, false);
			this.expect(true, 'double_point');
			const return_type = this.getType(true);
			this.expect(false, 'nouvelle_ligne');
			const { variables, callables } = walk.call(this, 'portee_definition');
			this.expectKeyword(false, 'debut');
			this.expect(true, 'nouvelle_ligne');
			const body = walk.call(this, 'bloc_instructions', 'FINFONCTION');
			return ({
				type: 'fonction_definition',
				name,
				return_type,
				parameters,
				variables,
				callables,
				body
			});
		},
		'parametre_definition'() {
			const parameters = [];
			while (this.current.type !== 'parenthèse' || this.current.openning)
			{
				this.next();
				const byRef = (this.current.type === 'mot_cle');
				if (byRef)
				{
					this.expectKeyword(false, 'var');
					this.next();
				}
				const name = this.getName(false);
				this.expect(true, 'double_point');
				const type = this.getType(true);
				this.expect(false, 'virgule', 'parenthèse');
				if (this.current.type !== 'virgule')
					this.expectParenthesis(false, false);
				parameters.push({
					type: 'parametre_definition',
					name,
					byRef,
					runtime_type: type
				});
			}
			return parameters;
		},
		'bloc_instructions'(...endWith) {
			endWith = new Set(endWith);
			let instructions = [];
			while (this.current.type === 'nouvelle_ligne')
				this.seek();
			do
			{
				instructions.push(walk.call(this, 'instruction'));
				do
				{
					this.seek();
				} while (this.current.type === 'nouvelle_ligne');
			} while (!this.done && (!/mot(?:_cle)?/.test(this.current.type) || !endWith.has(this.current.value)));
			return ({ type: 'bloc_instructions', instructions });
		},
		'instruction'() {
			let instruction = [];
			const firstToken = this.next().current.value;
			this.expectName(false);
			this.seek();
			// console.warn(firstToken, this.current);
			if (this.current.type === 'operateur' && this.current.value === '=')
			{
				// Affectation
				const variable = firstToken;
				this.expect(true, 'operateur');
				const expression = walk.call(this, 'expression', { 'nouvelle_ligne': v => true });
				return ({
					type: 'affectation',
					variable,
					expression
				})
			}
			else
				switch (firstToken)
				{
					// Condition
					case 'SI':
						const clauses = [];
						do
						{
							if (clauses.length)
							{
								this.next();
								this.expectName(false, 'SI');
							}
							const condition = walk.call(this, 'expression', { 'mot': n => n.value == 'ALORS' });
							this.expectName(false, 'ALORS');
							this.expect(true, 'nouvelle_ligne');
							const body = walk.call(this, 'bloc_instructions', 'SINON', 'FSI');
							if (this.current.value.toUpperCase() === 'SINON')
								this.seek();
							clauses.push({
								type: 'si_clause',
								condition,
								body
							});
						} while (this.current.type === 'mot' && this.current.value.toUpperCase() === 'SI');
						const hasElse = (this.current.type === 'nouvelle_ligne');
						let elseClause = null;
						if (hasElse)
						{
							elseClause = ({
								type: 'sinon_clause',
								body: walk.call(this, 'bloc_instructions', 'FSI')
							});
							this.expectName(true, 'FSI');
							this.expect(true, 'nouvelle_ligne');
						}
						// this.expect(true, 'nouvelle_ligne');
						return ({
							type: 'condition',
							elseClause,
							clauses
						});

					// Boucle POUR
					case 'POUR':
						const variable = this.getName(true);
						this.expectName(true, 'ALLANT');
						this.expectName(true, 'DE');
						const start = walk.call(this, 'expression', { 'mot': n => n.value == 'À' });
						this.expectName(false, 'À');
						const end = walk.call(this, 'expression', { 'mot': n => n.value == 'PAS' || n.value == 'FAIRE' });
						let step = 1;
						if (this.current.value === 'PAS')
						{
							step = this.getNumber(true);
							this.next();
						}
						this.expectName(false, 'FAIRE');
						this.expect(true, 'nouvelle_ligne');
						const forbody = walk.call(this, 'bloc_instructions', 'FINPOUR');
						return ({
							type: 'boucle_avec_compteur',
							variable,
							start,
							end,
							step,
							body: forbody
						});

					// Boucle TANT QUE
					case 'TANT':
						this.expectName(true, 'QUE');
						const condition = walk.call(this, 'expression', { 'mot': n => n.value == 'FAIRE' });
						this.expectName(false, 'FAIRE');
						this.expect(true, 'nouvelle_ligne');
						const whilebody = walk.call(this, 'bloc_instructions', 'FINTANTQUE');
						return ({
							type: 'boucle_simple',
							condition,
							body: whilebody
						});

					// Quitter la fontion/procédure
					case 'RETOURNER':
						const expression = walk.call(this, 'expression', { 'nouvelle_ligne': v => true });
						this.expect(false, 'nouvelle_ligne');
						return ({
							type: 'retourner',
							expression
						});
						break;

					default:
						if (this.current.type === 'parenthèse')
						{
							this.expectParenthesis(false, true);
							this.seek();
						}
						// this.next();
						const args = [];
						while (this.current.type !== 'parenthèse' && this.current.type !== 'nouvelle_ligne')
						{
							// this.seek();
							args.push(walk.call(this, 'expression', {
								'nouvelle_ligne': n => true,
								'virgule': n => true,
								'parenthèse': n => !n.openning,
							}));
							this.expect(false, 'nouvelle_ligne', 'virgule', 'parenthèse');
						}
						if (this.current.type === 'parenthèse')
						{
							this.expectParenthesis(false, false);
							this.next();
						}
						this.expect(false, 'nouvelle_ligne');
						return ({ type: 'appel_fonction', name: firstToken, args });
				}
		},
		'expression'(types) {
			const tokens = [];
			this.next();
			do
			{
				tokens.push(({
					mot(node) {
						switch (node.value)
						{
							case 'ET':
								return '&&';
							case 'OU':
								return '||';
							case 'MOD':
								return '%';
						}
						return node.value;
					},
					nombre(node) {
						return node.value;
					},
					operateur(node) {
						switch (node.value)
						{
							case '=':
								return '==';
						}
						return node.value;
					},
					parenthèse(node) {
						if (!node.openning)
							return ')';
						return '(' + walk.call(this, 'expression', { 'parenthèse': n => !n.openning }).litteral + ')';
					},
					virgule() {
						return ',';
					}
				})[this.current.type].call(this, this.current));
				this.next();
			} while (!this.done && (!types[this.current.type] || !types[this.current.type](this.current)));
			return ({ type: 'expression', litteral: tokens.join(' ') });
		}
	};
	const res = types[type].call(this, ...args);
	return res;
}

function parser(tokens, filename = '(input)') {
	const cursor = new TokenCursor(tokens, filename);
	cursor.expectKeyword(true, 'action');
	return walk.call(cursor, 'action');
}

module.exports = parser;
module.exports.LAPSyntaxError = LAPSyntaxError;
