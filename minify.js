const fs = require('fs');
const minify = require('@node-minify/core');
const terser = require('@node-minify/terser');
const noCompress = require('@node-minify/no-compress');

let version = "v1.0.0";
let output = `dist/HabiticaMagic-${version}.js`;
let minOutput = `dist/HabiticaMagic-${version}.min.js`;
let files = [
	'src/header.js',
	'src/HabiticaUserTasksManager.js',
	'src/HabiticaUser.js',
	'src/HabiticaAPIManager.js'
];

let preamble = fs.readFileSync('src/header.js', 'utf8');

// combine all the files
minify({
  compressor: noCompress,
  input: files,
  output: output
})
// Run the minifier
.then(function(min) {
	minify({
		compressor: terser,
		input: output,
		output: minOutput,
		options: {
			output: {
				preamble: preamble
			}
		}
	});
});
