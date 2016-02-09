import {expect} from 'chai';
import {promisify} from 'bluebird';
import {Map, fromJS} from 'immutable';
import fs from 'fs';
import rimraf from 'rimraf'
import generatePromise
	,{
		addNewStores
		, newStoresCreate
		, addContent
} from './../lib/pagitter-store';
const fsExists = promisify(fs.exists);
const readFile = promisify(fs.readFile);



describe('pagitter-store', ()=>{

	before(()=>{
		rimraf.sync('example');
	});

	after(()=>{
		rimraf.sync('example');
	});

	it('addNewStores', ()=>{
		const state = fromJS({
			globalVariables: {
				pagitterStoresCreate: 'signup'
			}
		});
		const nextState = addNewStores(state);
		expect(nextState).to.equal(
			fromJS({
			  globalVariables: {}
			, pagitterStores: {signup: ''}
			})
		);	
	});
	it('newStoresCreate', ()=>{
		expect(newStoresCreate('signup')).to.equal(
			Map({ signup: ''})
		);	
	});
	it('addContent', ()=>{
		const pagitterStores = Map({signup: ''});
		const state = Map({
			pagitterStores,
			code: '\ncode',
			content: '\ncontent'
		})
		expect(addContent(state)).to.equal(
			fromJS({
				pagitterStores: {
					signup: '\ncode\ncontent'
				},
				code: '\ncode',
				content: '\ncontent'})
		);	
	});
});