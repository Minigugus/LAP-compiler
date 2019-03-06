'use strict';

const visit = require('./visit.js');

const printer = visit({
	action(node) {
		const lines = [];
		for (let callable of node.callables)
		{
			lines.push(...printer(callable));
			lines.push('');
		}
		lines.push('// DÉCLARATION DES VARIABLES //');
		for (let variable of node.variables)
			lines.push(printer(variable));
		lines.push('');
		lines.push('// INSTRUCTIONS //');
		lines.push(...printer(node.body, 0));
		return lines.join('\n');
	},
	variable(node) {
		const LAPType2CType = {
			'BOOLÉEN': 'let',
			'NUMÉRIQUE': 'let',
			'CHAINE DE CARACTÈRES': 'let'
		};
		return `let ${node.name};`;
	},
	parametre_definition(node) {
		const LAPType2CType = {
			'BOOLÉEN': 'let',
			'NUMÉRIQUE': 'let',
			'CHAINE DE CARACTÈRES': 'let'
		};
		return `${node.name}`;
	},
	procedure_definition(node) {
		let lines = [];
		if (node.parameters.length)
			lines.push(...(node.parameters.map(p => printer(p))));
		lines = [ `function ${node.name}(${lines.join(', ')})` ];
		lines.push('{');
		lines.push('  // DÉCLARATION DES VARIABLES //');
		for (let variable of node.variables)
			lines.push('  ' + printer(variable));
		lines.push('');
		lines.push('  // INSTRUCTIONS //');
		lines.push(...printer(node.body));
		lines.push('}');
		return lines;
	},
	fonction_definition(node) {
		const LAPType2CType = {
			'BOOLÉEN': 'let',
			'NUMÉRIQUE': 'let',
			'CHAINE DE CARACTÈRES': 'let'
		};
		let lines = [];
		if (node.parameters.length)
			lines.push(...(node.parameters.map(p => printer(p))));
		lines = [ `function ${node.name}(${lines.join(', ')})` ];
		lines.push('{');
		lines.push('  // DÉCLARATION DES VARIABLES //');
		for (let variable of node.variables)
			lines.push('  ' + printer(variable));
		lines.push('');
		lines.push('  // INSTRUCTIONS //');
		lines.push(...printer(node.body));
		lines.push('}');
		return lines;
	},
	bloc_instructions(node, indentSize = 1) {
		let lines = [];
		const indent = '  '.repeat(indentSize);
		for (let instruction of node.instructions)
		{
			let newLines = printer(instruction);
			if (!Array.isArray(newLines))
				newLines = [ newLines ];
			lines.push(...(newLines.map(i => indent + i)));
		}
		return lines;
	},
	expression(node) {
		return `${node.litteral}`;
	},
	retourner(node) {
		return `return ${printer(node.expression)};`;
	},
	affectation(node) {
		return `${node.variable} = ${printer(node.expression)};`;
	},
	condition(node) {
		const lines = [];
		for (let clause of node.clauses)
			lines.push(...printer(clause, lines.length));
		if (node.elseClause)
			lines.push(...printer(node.elseClause));
		return lines;
	},
	si_clause(node, isElseIf) {
		const lines = [];
		lines.push(`${isElseIf ? 'else ' : ''}if (${printer(node.condition)})`);
		lines.push('{');
		lines.push(...printer(node.body));
		lines.push('}');
		return lines;
	},
	sinon_clause(node) {
		const lines = [];
		lines.push(`else`);
		lines.push('{');
		lines.push(...printer(node.body));
		lines.push('}');
		return lines;
	},
	boucle_simple(node) {
		const lines = [];
		lines.push(`while (${printer(node.condition)})`);
		lines.push('{');
		lines.push(...printer(node.body));
		lines.push('}');
		return lines;
	},
	boucle_avec_compteur(node) {
		const lines = [];
		lines.push(`for (let ${node.variable} = ${printer(node.start)}; ${node.variable} < ${printer(node.end)}; ${node.variable} += ${node.step})`);
		lines.push('{');
		lines.push(...printer(node.body));
		lines.push('}');
		return lines;
	},
	appel_fonction(node) {
		const BuiltinFunctions = {
			SORTIR(...args) {
				const lines = [];
				for (let arg of args)
					if (arg)
						lines.push(`console.log("${printer(arg)} = ", ${printer(arg)});`);
				return lines;
			},
			ENTRER(...args) {
				const lines = [];
				for (let arg of args)
					if (arg)
						lines.push(`/* TODO : Lecture depuis le clavier. [${node.name}(${node.args.map(a => printer(a)).join(', ')})] */`);
				return lines;
			}
		}
		if (node.name.toUpperCase() in BuiltinFunctions)
			return BuiltinFunctions[node.name.toUpperCase()](...node.args);
		return `${node.name}(${node.args.map(a => printer(a)).join(', ')});`;
	}
});

module.exports = printer;
