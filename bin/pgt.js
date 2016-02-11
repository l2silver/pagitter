#!/usr/bin/env node
var pagitter = require('../dist/index.js');
var program = require('commander');
var fs = require('fs');

program
  .version(JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8')).version)
  .option('-w, --watch', 'Watch neatorp.js for changes')
  .parse(process.argv);

if(program.watch){

	console.log();
	hideCursor();
	process.on('SIGINT', function(){
		showCursor();
		console.log('\n');
		process.exit();
	});
	console.log('Start Pagitter Watch');
	var time = Math.floor(Date.now() / 1000);
	fs.watch(process.cwd()+'/pagitter.js', () => {
		if(time != Math.floor(Date.now() / 1000)){
			pagitter.run().then(function(){
				console.log('Files Processed');
				
			});
			time = Math.floor(Date.now() / 1000)
		}
	});
}
     
/**
 * Hide the cursor.
 */

function hideCursor(){
  process.stdout.write('\u001b[?25l');
}

/**
 * Show the cursor.
 */

function showCursor(){
  process.stdout.write('\u001b[?25h');
}

