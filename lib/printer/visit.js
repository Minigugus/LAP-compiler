'use strict';

module.exports = visitor => (ast, ...args) => {
	if (Array.isArray(ast))
		return ast.map(x => {
			const fn = visitor[x.type];
			if (fn)
				return fn.call(visitor, x, ...args);
			return x;
		});
	const fn = visitor[ast.type];
	if (fn)
		return fn.call(visitor, ast, ...args);
	return ast;
};
