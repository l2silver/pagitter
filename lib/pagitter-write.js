import {List} from 'immutable';
import Promise, {promisify} from 'bluebird';
import mkdirpCB from 'mkdirp'
import fs from 'fs';
const mkdirp = promisify(mkdirpCB);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

export default function(state){
		    	return location(state)
		    	.then((fullLocation)=>{
		    		return writeFilePromise(fullLocation, state);
		    	});
}

export const writeFilePromise = Promise.method((fullLocation, state)=>{
	return writeFile(fullLocation, state.get('content')).then(()=>{
		return state;
	})
	
});

export function location(state){
			const filename = state.get('filename');
			const fullFilename = process.cwd()+'/'+basename(state.get('globalVariables'))+filename;
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
