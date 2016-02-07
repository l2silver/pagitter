import {List} from 'immutable';
import {promisify} from 'bluebird';
import mkdirpCB from 'mkdirp'
import fs from 'fs';
const mkdirp = promisify(mkdirpCB);
const writeFile = promisify(fs.writeFile);

export function generatePromise(globalVariables){
	return function(){
		    	return location(globalVariables)
		    	.then(function(fullLocation){
		    		return writeFile(fullLocation, globalVariables.get('eTrcontentETr'));
		    	})
	}
}

export function location(globalVariables){
			const filename = globalVariables.get('eTrFilenameETr');
			const fullFilename = process.cwd()+'/'+basename(globalVariables)+filename;
			return generateFolders(fullFilename).then(()=>{
				return fullFilename;
			});
}

export function basename(globalVariables){
	if(globalVariables.has('base')){
		return globalVariables.get('base')+'/';
	}else{
		return '';
	}
}

export function generateFolders(filename){
			const foldersAndFilename = List(filename.split('/'));
			const folders = foldersAndFilename.pop();
			const foldersConc = folders.join('/');
			return mkdirp(foldersConc);
		}
