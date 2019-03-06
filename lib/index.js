'use strict';

const path = require('path');
const { promises: fs } = require('fs');

const tokenizer = require('./tokenizer');
const parser = require('./parser');
const printers = require('./printer');

module.exports = async (sourcePath) => {
	const source = await fs.readFile(sourcePath, 'utf8');
	const ast = module.exports.fromSource(source, path.basename(sourcePath))
	const printer = language => {
		if (!printers[language.toUpperCase()])
			throw new Error(`Langage de sortie « ${language} » non pris en charge.`);
		return printers[language.toUpperCase()](ast);
	};
	return printer;
};

module.exports.fromSource = (source, filename = '(stdin)') => {
	return parser([ ...(tokenizer(source, filename)) ], filename);
};
