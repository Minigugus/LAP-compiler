'use strict';

const visit = require('./visit.js');

const pointerValidators = {
	'type'(node) {
		return node.value.toUpperCase() === 'CHAINE DE CARACTÈRES';
	},
	'array_type'() {
		return true;
	},
	'variable'(node) {
		return isPointer(node.runtime_type);
	},
	'parametre_definition'(node) {
		return node.byRef || isPointer(node.runtime_type);
	}
};
function isPointer(node) {
	return node && pointerValidators[node.type] && pointerValidators[node.type].call(pointerValidators, node);
}

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
			'CHAINE DE CARACTÈRES': 'char'
		};
		if (node.runtime_type.type === 'array_type')
			return `${LAPType2CType[node.runtime_type.value]} ${node.name}[${node.runtime_type.size}];`;
		return `${LAPType2CType[node.runtime_type.value]}${isPointer(node) ? '*' : ''} ${node.name};`;
	},
	parametre_definition(node) {
		const LAPType2CType = {
			'BOOLÉEN': 'int',
			'NUMÉRIQUE': 'int',
			'CHAINE DE CARACTÈRES': 'char'
		};
		return `${LAPType2CType[node.runtime_type]}${isPointer(node) ? '*' : ''} ${node.name}`;
	},
	procedure_definition(node, variables = new Map()) {
		let lines = [];
		if (node.parameters.length)
			lines.push(...(node.parameters.map(p => printer(p))));
		lines = [ `void ${node.name}(${lines.join(', ')})` ];
		lines.push('{');
		const accessibleVariables = variables;
		if (!node.variables.length)
			lines.push('  /* (Pas de variables locales) */');
		else
		{
			lines.push('  // DÉCLARATION DES VARIABLES //');
			for (let variable of node.variables)
			{
				accessibleVariables.set(variable.name, variable);
				lines.push('  ' + printer(variable));
			}
			lines.push('');
		}
		lines.push('  // INSTRUCTIONS //');
		lines.push(...printer(node.body, accessibleVariables));
		lines.push('}');
		return lines;
	},
	fonction_definition(node, variables) {
		const LAPType2CType = {
			'BOOLÉEN': 'int',
			'NUMÉRIQUE': 'int',
			'CHAINE DE CARACTÈRES': 'char'
		};
		let lines = [];
		if (node.parameters.length)
			lines.push(...(node.parameters.map(p => printer(p))));
		lines = [ `${LAPType2CType[node.return_type]}${isPointer(node.return_type) ? '*' : ''} ${node.name}(${lines.join(', ')})` ];
		lines.push('{');
		const accessibleVariables = variables;
		if (!node.variables.length)
			lines.push('  /* (Pas de variables locales) */', '');
		else
		{
			lines.push('  // DÉCLARATION DES VARIABLES //');
			for (let variable of node.variables)
			{
				accessibleVariables.set(variable.name, variable);
				lines.push('  ' + printer(variable));
			}
			lines.push('');
		}
		lines.push('  // INSTRUCTIONS //');
		lines.push(...printer(node.body, accessibleVariables));
		lines.push('}');
		return lines;
	},
	bloc_instructions(node, variables) {
		let lines = [];
		for (let instruction of node.instructions)
		{
			let newLines = printer(instruction, variables);
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
	affectation(node, variables) {
		return `${node.variable} = ${printer(node.expression, variables)};`;
	},
	condition(node, variables) {
		const lines = [];
		for (let clause of node.clauses)
			lines.push(...printer(clause, lines.length, variables));
		if (node.elseClause)
			lines.push(...printer(node.elseClause, variables));
		return lines;
	},
	si_clause(node, isElseIf, variables) {
		const lines = [];
		lines.push(`${isElseIf ? 'else ' : ''}if (${printer(node.condition, variables)})`);
		lines.push('{');
		lines.push(...printer(node.body, variables));
		lines.push('}');
		return lines;
	},
	sinon_clause(node, variables) {
		const lines = [];
		lines.push(`else`);
		lines.push('{');
		lines.push(...printer(node.body, variables));
		lines.push('}');
		return lines;
	},
	boucle_simple(node, variables) {
		const lines = [];
		lines.push(`while (${printer(node.condition, variables)})`);
		lines.push('{');
		lines.push(...printer(node.body, variables));
		lines.push('}');
		return lines;
	},
	boucle_avec_compteur(node, variables) {
		const lines = [];
		lines.push(`for (int ${node.variable} = ${printer(node.start, variables)}; ${node.variable} < ${printer(node.end, variables)}; ${node.variable} += ${printer(node.step, variables)})`);
		lines.push('{');
		lines.push(...printer(node.body, variables));
		lines.push('}');
		return lines;
	},
	appel_fonction(node, variables) {
		const BuiltinFunctions = {
			SORTIR(...args) {
				const lines = [];
				for (let arg of args)
					if (arg)
						lines.push(`printf("${printer(arg, variables)} = %d", ${printer(arg, variables)});`);
				return lines;
			},
			ENTRER(...args) {
				const lines = [];
				for (let arg of args)
					if (arg)
						lines.push(`printf("${printer(arg, variables)} : "); scanf("%d", ${isPointer(variables.get(arg.litteral)) ? '' : '&'}${printer(arg, variables)});`);
				return lines;
			}
		}
		if (node.name.toUpperCase() in BuiltinFunctions)
			return BuiltinFunctions[node.name.toUpperCase()](...node.args);
		return `${node.name}(${node.args.map(a => printer(a, variables)).join(', ')});`;
	}
});

module.exports = printer;
