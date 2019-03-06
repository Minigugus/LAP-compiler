'use strict';

const path = require('path');
const compiler = require('../lib');

compiler(path.join(__dirname, '../exemple.lap'))
	.then(printer => {
		console.info('# C');
		console.info('```c');
		console.info(printer('c'));
		console.info('```');
		console.info();
		console.info('# JS');
		console.info('```js');
		console.info(printer('js'));
		console.info('```');
	});
