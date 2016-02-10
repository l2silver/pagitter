import {expect} from 'chai';
import {promisify} from 'bluebird';
import {Map, fromJS, List} from 'immutable';
import fs from 'fs';
import rimraf from 'rimraf'
import mkdirp from 'mkdirp';
import generatePromise
	,{
		  checkNewStores
		, addNewStores
		, newStoresCreate
		, addContent
		, checkEndStores
		, setEndStoreNames
} from './../lib/pagitter-store';
const fsExists = promisify(fs.exists);
const readFile = promisify(fs.readFile);



describe('pagitter-store', ()=>{
	it('checkNewStores', ()=>{
		const state = fromJS({
			globalVariables: {
				pagitterStoresCreate: 'signup'
			}
		});
		;
		expect(checkNewStores(state)).to.eventually.equal(
			fromJS({
			  globalVariables: {}
			, pagitterStores: {signup: ''}
			})
		);	
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
	it('newStoresCreate array', ()=>{
		expect(newStoresCreate('["signup", "logout"]')).to.equal(
			Map({ signup: '', logout: ''})
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
	describe('checkEndStores', ()=>{
		before(()=>{
			mkdirp.sync('.pagitterStores');
		});
		after(()=>{
			rimraf.sync('.pagitterStores');
		});

		it('returns state', ()=>{
			const pagitterStores = Map({signup: '\ncode\ncontent'});
			const globalVariables = Map({
				pagitterStoresEnd: 'signup'
			})
			const state = Map({
				pagitterStores,
				globalVariables
			})
			expect(checkEndStores(state)).to.eventually.equal(
				fromJS({
					pagitterStores: {
					},
					globalVariables: {}
				})
			);	
		});
		it('writes store', (done)=>{
			const pagitterStores = Map({signup: '\ncode\ncontent'});
			const globalVariables = Map({
				pagitterStoresEnd: 'signup'
			})
			const state = Map({
				pagitterStores,
				globalVariables
			})
			checkEndStores(state)
			.then(()=>{
				return readFile('.pagitterStores/signup.js','utf8')
			})
			.then((content)=>{
				expect(content).to.equal('\ncode\ncontent');
				done()
			})
		});	
	})
	
	it('setEndStoreNames', ()=>{
		const pagitterStores = Map({signup: '\ncode\ncontent'});
		const globalVariables = Map({
			pagitterStoresEnd: 'signup'
		});
		const state = Map({
			pagitterStores,
			globalVariables
		});
		expect(setEndStoreNames(state)).to.equal(
			Map({
				pagitterStores: Map({
					signup: '\ncode\ncontent'
				}),
				globalVariables,
				pagitterStoresEnd: List(['signup'])
			})
		);	
	});
	describe('generatePromise', ()=>{
		before(()=>{
			mkdirp.sync('.pagitterStores');
		});
		after(()=>{
			rimraf.sync('.pagitterStores');
		});
		const globalVariables = Map({
			pagitterStoresCreate: 'signup',
			pagitterStoresEnd: 'signup'
		});
		const state = Map({
			globalVariables,
			code: '\ncode',
			content: '\ncontent'
		})
		it('returns state', ()=>{
			expect(generatePromise(state)).to.eventually.equal(
				fromJS({
					pagitterStores: {},
					globalVariables: {},
					code: '\ncode',
					content: '\ncontent'
				})
			);
		});
		it('creates file', (done)=>{
			generatePromise(state)
			.then(()=>{
				return readFile('.pagitterStores/signup.js','utf8')
			})
			.then((content)=>{
				expect(content).to.equal('\ncode\ncontent');
				done()
			})
		});
	});
});