#!/usr/bin/env node
var pagitter = require('../dist/index.js');
var program = require('commander');
var fs = require('fs');
var Promise = require('bluebird');
var readFile = Promise.promisify(fs.readFile);
var pagitterStore = require('./../dist/pagitter-store');
var pagitterWrite = require('./../dist/pagitter-write');
var pagitterDelete = require('./../dist/pagitter-remove');

readFile('pgt.config.js', 'utf8')
.then((json)=>{
	var pagitterConfig = JSON.parse(json);
	var cliPluginList = pagitterConfig.cliPlugins
	var pluginList = pagitterConfig.plugins
	if(pluginList){
		pluginList.map(function(pluginName){});
	}
	var defaultPluginList = [];
	pluginList.map(function(pluginName){
		if(pluginName == 'pagitter-store'){
			return defaultPluginList.push(pagitterStore.default);
		}
		if(pluginName == 'pagitter-write'){
			return defaultPluginList.push(pagitterWrite.default);
		}
		defaultPluginList.push(require(pluginName).default);
	})

	

	program
	  .version(JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8')).version)
	  .option('-w, --watch', 'Watch pagitter.js for changes')
	  .option('-r, --reverse [value]', 'Run get store command [value]')
	  .option('-d, --delete', 'delete filenames')
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

	if(program.reverse){
		var reversePluginList = [pagitterStore.reverse];
		pluginList.map(function(pluginName){
			if(pluginName != 'pagitter-store' && pluginName != 'pagitter-write'){
				var plugin = require(pluginName)
				if(plugin.reverse){
					reversePluginList.push(plugin.reverse);
				}
			}
		})
		return pagitter.run('./.pagitterStores/'+program.reverse+'.js', reversePluginList)	
	}
	if(program.delete){
		var deletePluginList = [pagitterDelete.remove];
		pluginList.map(function(pluginName){
			if(pluginName != 'pagitter-store' && pluginName != 'pagitter-write'){
				var plugin = require(pluginName)
				if(plugin.delete){
					deletePluginList.push(plugin.reverse);
				}
			}
		})
		return pagitter.run(process.cwd()+'/pagitter.js', deletePluginList);
	}
	console.log(process.cwd()+'/pagitter.js')
	pagitter.run(process.cwd()+'/pagitter.js', defaultPluginList);
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

});