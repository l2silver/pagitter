import {List, fromJS, Map} from 'immutable';
import Promise, {promisify} from 'bluebird';
import mkdirpCB from 'mkdirp'
import fs from 'fs';
const mkdirp = promisify(mkdirpCB);
const writeFile = promisify(fs.writeFile);

/*
//Function

Lay a store
Lay Multiple Stores
At the end, write all the stores
globalVariable=

pagitterCreateStore=

pagitterStoreHouse=[{name: name, content: content}, {}]

pagitterStoreEnd=all



Take that global variable, and it to 



*/




export default function(state){
	return [checkNewStores, addContent, endStores].reduce((state, fn)=>{
		return fn(state);
	}, state);
}

export function checkNewStores(state){
	if(state.hasIn(['globalVariables', 'pagitterStoresCreate'])){
		return addNewStores(state);
	}
	return state;
}

export function addNewStores(state){
	const newStores = newStoresCreate(
		state.getIn(['globalVariables', 'pagitterStoresCreate'])
	);
	const nextState = state.merge(Map({pagitterStores: newStores}));
	const globalVariables = state.get('globalVariables').delete('pagitterStoresCreate')
	return nextState.set('globalVariables', globalVariables);
}

export function newStoresCreate(pagitterStoresCreate){
	if(pagitterStoresCreate.match(/\[.+\]/)){
		const storeNames = eval(pagitterStoresCreate);
		return storeNames.reduce((stores, name)=>{
			return stores.set(name, '');
		}, Map());
	}else{
		return Map().set(pagitterStoresCreate, '');
	}
}

export function addContent(state){
	if(state.has('pagitterStores')){
		
		return state.get('pagitterStores').keySeq().toArray().reduce((state, storeName)=>{
			return state.updateIn(
				['pagitterStores', storeName], 
				content => {
					return content + state.get('code') + state.get('content')
				}
			)
		}, state);
	}
	return state;
}

export function endStores(){
	
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

