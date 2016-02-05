var promisify = require('bluebird').promisify;
var mkdirp = promisify(require('mkdirp'));
var naetorpWrites = {
	rootLocation: process.cwd(),
	location: function(globalVariables, rootLocation){
		var fileName = globalVariables.fileName
		if(globalVariables.base){
			fileName = globalVariables.base +'/'+fileName
		}
		return naetorpWrites.generateFolders(fileName).then(function(){
			return rootLocation+'/'+fileName;	
		});
		

	},
	generateFolders: function(filename){
		var folders = filename.split('/');
		folders.pop();
		var foldersConc = folders.join('/');
		return mkdirp(naetorpWrites.rootLocation+'/'+foldersConc);
	}
}

module.exports = naetorpWrites;