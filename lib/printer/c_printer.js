'use strict';

const visit = require('./visit.js');

const printer = visit({
	action(node) {
		const lines = [];
		lines.push('#include <stdio.h>');
		lines.push('');
		for (let callable of node.callables)
		{
			lines.push(...printer(callable));
			lines.push('');
		}
		lines.push(...this.procedure_definition(Object.assign({}, node, { name: 'main', parameters: [] })));
		return lines.join('\n');
	},
	variable(node) {
		const LAPType2CType = {
			'BOOLÉEN': 'int',
			'NUMÉRIQUE': 'int',
			'CHAINE DE CARACTÈRES': 'char*'
		};
		if (node.runtime_type.type === 'array_type')
			return `${LAPType2CType[node.runtime_type.value]} ${node.name}[${node.runtime_type.size}];`;
		return `${LAPType2CType[node.runtime_type.value]} ${node.name};`;
	},
	parametre_definition(node) {
		const LAPType2CType = {
			'BOOLÉEN': 'int',
			'NUMÉRIQUE': 'int',
			'CHAINE DE CARACTÈRES': 'char*'
		};
		return `${LAPType2CType[node.runtime_type]}${node.byRef ? '*' : ''} ${node.name}`;
	},
	procedure_definition(node) {
		let lines = [];
		if (node.parameters.length)
			lines.push(...(node.parameters.map(p => printer(p))));
		lines = [ `void ${node.name}(${lines.join(', ')})` ];
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
			'BOOLÉEN': 'int',
			'NUMÉRIQUE': 'int',
			'CHAINE DE CARACTÈRES': 'char*'
		};
		let lines = [];
		if (node.parameters.length)
			lines.push(...(node.parameters.map(p => printer(p))));
		lines = [ `${LAPType2CType[node.return_type]} ${node.name}(${lines.join(', ')})` ];
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
	bloc_instructions(node) {
		let lines = [];
		for (let instruction of node.instructions)
		{
			let newLines = printer(instruction);
			if (!Array.isArray(newLines))
				newLines = [ newLines ];
			lines.push(...(newLines.map(i => '  ' + i)));
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
		lines.push(`for (int ${node.variable} = ${printer(node.start)}; ${node.variable} < ${printer(node.end)}; ${node.variable} += ${node.step})`);
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
						lines.push(`printf("${printer(arg)} = %d", ${printer(arg)});`);
				return lines;
			},
			ENTRER(...args) {
				const lines = [];
				for (let arg of args)
					if (arg)
						lines.push(`scanf("%d", &${printer(arg)});`);
				return lines;
			}
		}
		if (node.name.toUpperCase() in BuiltinFunctions)
			return BuiltinFunctions[node.name.toUpperCase()](...node.args);
		return `${node.name}(${node.args.map(a => printer(a)).join(', ')});`;
	}
});

module.exports = printer;
