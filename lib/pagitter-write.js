import {List} from 'immutable';
import Promise, {promisify} from 'bluebird';
import mkdirpCB from 'mkdirp'
import fs from 'fs';
const mkdirp = promisify(mkdirpCB);
const writeFile = promisify(fs.writeFile);

export default (state)=>{
	return Promise.method((state)=>{
		if(state.get('filename')){
			return location(state)
	    	.then((fullLocation)=>{
	    		return writeFilePromise(fullLocation, state);
	    	});	
		}
		return state;
	})(state);
}

export const writeFilePromise = Promise.method((fullLocation, state)=>{
	return writeFile(fullLocation, state.get('content')).then(()=>{
		return state.set('filename', false);
	})
	
});

export function location(state){
			const filename = state.get('filename');
			const fullFilename = process.cwd()+'/'+filename;
			return generateFolders(fullFilename).then(()=>{
				return fullFilename;
			});
}

export function generateFolders(filename){
			const foldersAndFilename = List(filename.split('/'));
			const folders = foldersAndFilename.pop();
			const foldersConc = folders.join('/');
			return mkdirp(foldersConc);
		}

