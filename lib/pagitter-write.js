import {List} from 'immutable';
import Promise, {promisify} from 'bluebird';
import mkdirpCB from 'mkdirp'
import fs from 'fs';
const mkdirp = promisify(mkdirpCB);
const writeFile = promisify(fs.writeFile);

export default (state)=>{
	if(state.get('filename')){
		return location(state)
    	.then((fullLocation)=>{
    		return writeFilePromise(fullLocation, state);
    	});	
	}else{
		return Promise.method((state)=>{
			return state;
		});
	}
		    	
}

export const writeFilePromise = Promise.method((fullLocation, state)=>{
	return writeFile(fullLocation, state.get('content')).then(()=>{
		return state.set('filename', false);
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

