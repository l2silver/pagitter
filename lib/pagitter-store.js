import {List, fromJS, Map} from 'immutable';
import Promise, {promisify} from 'bluebird';
import mkdirpCB from 'mkdirp'
import fs from 'fs';
const mkdirp = promisify(mkdirpCB);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
export default (state)=>{
	const promise = [checkNewStores, addContent, checkEndStores].reduce(
		(chainedFunctions, fn)=>{
			return (state)=>{
				return chainedFunctions(state)
				.then((nextState)=>{
					return fn(nextState);
				});
			}
		}, 
		Promise.method((state)=>{return state;})
	);
	return promise(state);
}

export const checkNewStores = Promise.method((state)=>{
	if(state.hasIn(['globalVariables', 'pagitterStoresCreate'])){
		return addNewStores(state);
	}
	return state;
});

export const addNewStores = (state)=>{
	const newStores = newStoresCreate(
		state.getIn(['globalVariables', 'pagitterStoresCreate'])
	);
	const nextState = state.merge(Map({pagitterStores: newStores}));
	const globalVariables = state.get('globalVariables').delete('pagitterStoresCreate')
	return nextState.set('globalVariables', globalVariables);
};

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


export function checkEndStores(state){
	if(state.hasIn(['globalVariables', 'pagitterStoresEnd']) || (state.has('last') && state.has('pagitterStores'))){
		const stateWithEndStores = setEndStoreNames(state);
		const stateWithoutGlobalVariablesEndStores = stateWithEndStores.deleteIn(['globalVariables', 'pagitterStoresEnd']);
		return writeStores(stateWithoutGlobalVariablesEndStores);
	}
	return state;
}

export function setEndStoreNames(state){
	if(state.has('last') && state.has('pagitterStores')){
		return state.set('pagitterStoresEnd', 
			List(
				state.get('pagitterStores').keySeq().toArray()
			)
		);
	}

	const pagitterStoresEnd = state.getIn(['globalVariables', 'pagitterStoresEnd']);
	if(pagitterStoresEnd){
		if(pagitterStoresEnd.match(/\[.+\]/)){
			return state.set('pagitterStoresEnd',
				List(
					eval(pagitterStoresCreate)
				)
			);
		}else if(pagitterStoresEnd.match(/^ALL$/)){
			return state.set('pagitterStoresEnd', 
				List(
					state.get('pagitterStores').keySeq().toArray()
				)
			);
		}else{
			return state.set('pagitterStoresEnd', List([pagitterStoresEnd]));
		}	
	}
	return state;
}

const writeStores = Promise.method(function (state){
	const store = state.get('pagitterStoresEnd').last();
	const storeContent = state.getIn(['pagitterStores', store]);
	const stateWithOneLessStore = state.update('pagitterStores', 
		stores=>{
			return stores.delete(store);
		}
	);
	const nextState = stateWithOneLessStore.update('pagitterStoresEnd', 
		list=>{
			return list.pop()
		}
	);
	return checkPagitterStoresExist(state)
	.then(()=>{
		return writeFile(process.cwd()+'/.pagitterStores/'+store+'.js', storeContent)
	})
 	.then(()=>{
 		if(nextState.get('pagitterStoresEnd').count() > 0){
 			return writeStores(nextState);
 		}else{
 			return nextState.delete('pagitterStoresEnd');
 		}
 	});
});

export const checkPagitterStoresExist = Promise.method((state)=>{
	return stat('.pagitterStores')
		.then(()=>{
			return state;
		})
		.catch(()=>{
		return mkdirp('.pagitterStores')
		.then(()=>{
			return state;
		});
	})
})

export const reverse = Promise.method((state)=>{
	return reverseTransformContent(state).then((nextState)=>{
		if(nextState.has('last')){
			return writePagitter(nextState);
		}else{
			return nextState;	
		}
		
	})
});

export function writePagitter(state){
	return writeFile('pagitter.js', state.get('reverseContent'));
}

export const getContent = Promise.method((state)=>{
	const filename = checkFilenameExists(state);
	console.log('filename', filename);
	if(filename){
		return readFile(filename, 'utf8')
		.then((content)=>{
			return state.set('pagitterStoresExternalContent', content)
		})
		.catch(()=>{
			return state.set('pagitterStoresExternalContent', '')
		});
	}else{
		return state.set('pagitterStoresExternalContent', '')
	}
	
});

export function checkFilenameExists(state){
	if(state.get('filename')){
		return state.get('globalVariables').has('base') ? './'+state.get('globalVariables').get('base')+'/'+state.get('filename') : './'+state.get('filename');
	}
	return false
}

export const reverseTransformContent = Promise.method((state)=>{
	const nextState = reverseGlobalVariables(state);
	return getContent(nextState)
	.then((nextNextState)=>{
		const newContent = findReplaceGlobalVariables(nextNextState);
		return nextNextState.updateIn(['reverseContent'], 
		(content)=>{
			return content ? content+'\n'+nextNextState.get('code')+'\n'+newContent : nextNextState.get('code')+'\n'+newContent
		});
	});
});

export function findReplaceGlobalVariables(state){
	if(state.get('globalVariables').toList().size > 0){
		return state.get('pagitterStoresExternalContent')
		.replace(reverseTransformRegExp(state.get('reverseGlobalVariables')), (matched)=>{
			const switchedMatch = state.getIn(['reverseGlobalVariables', matched]);
			return '@'+switchedMatch+'@';
		});
	}else{
		return state.get('pagitterStoresExternalContent');
	}
}

export function reverseTransformRegExp(reverseGlobalVariables){
	const pattern = List(reverseGlobalVariables.keySeq().toArray()).reduce((prev, current)=>{
		return prev+current+'|';
	}, '')
	return new RegExp(pattern.slice(0, -1), 'g');
}

export function reverseGlobalVariables(state){
	const globalVariables = state.get('globalVariables');
	return state.set('reverseGlobalVariables', flipMap(globalVariables))
}

export function flipMap(object){
	return object.toSeq().flip().toMap();
}