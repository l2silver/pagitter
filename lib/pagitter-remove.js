import Promise, {promisify} from 'bluebird';
import fs from 'fs';
const deleteFile = promisify(fs.unlink);

export default Promise.method((state)=>{
	return state;
})

export function remove(state){
	if(state.get('filename')){
		const fullFilename = location(state);
    	return deleteFile(fullFilename)
    	.then(()=>{
    		return state;
    	})
    	.catch((err)=>{
    		if(err.code == 'ENOENT'){
    			return state;
    		}
    		throw err;
    	})
	}else{
		return Promise.method((state)=>{
			return state;
		});
	}  	
}

export function location(state){
	const filename = state.get('filename');
	const fullFilename = process.cwd()+'/'+basename(state.get('globalVariables'))+filename;
	return fullFilename;
	
}

export function basename(globalVariables){
	if(globalVariables.has('base')){
		return globalVariables.get('base')+'/';
	}else{
		return '';
	}
}