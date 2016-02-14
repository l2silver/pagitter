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
		, reverseTransformContent
		, reverseGlobalVariables
		, reverse
		, writePagitter
} from './../lib/pagitter-store';
const fsExists = promisify(fs.exists);
const readFile = promisify(fs.readFile);

describe('pagitter-store', ()=>{

	describe('reverse', ()=>{
		before(()=>{
			mkdirp.sync('example');
		});
		after(()=>{
			rimraf.sync('example');
		});
		it('on Last Writes New File', (done)=>{
			const globalVariables = Map({
					flavour: 'delicious'
				})
			const content = '';
			const code = '';
			const state = Map({
				last: true,
				pagitterFilepath: 'example/examplePagitter.js',
				globalVariables,
				code,
				content,
				reverseContent: '/*_ <!base=example!> example.js _*/\n\nfunction(){\n\treturn "delicious"\n}'
			});
			reverse(state).then(()=>{
				return readFile('example/examplePagitter.js','utf8')
			})
			.then((content)=>{
				expect(content).to.equal('/*_ <!base=example!> example.js _*/\n\nfunction(){\n\treturn "delicious"\n}');
				done()
			});
		})
	});
	
	describe('writePagitter', ()=>{
		before(()=>{
			mkdirp.sync('example');
		});
		after(()=>{
			rimraf.sync('example');
		});

		it('writePagitter', (done)=>{

			const state = Map({
				pagitterFilepath: 'example/examplePagitter.js',
				reverseContent: '/*_ <!base=example!> example.js _*/\n\nfunction(){\n\treturn "delicious"\n}'
			});
			return writePagitter(state)
			.then(()=>{
				return readFile('example/examplePagitter.js','utf8')
			})
			.then((contents)=>{
				expect(contents).to.equal('/*_ <!base=example!> example.js _*/\n\nfunction(){\n\treturn "delicious"\n}');
				return done()
			})
		})
	})
	

	it('reverseGlobalVariables', ()=>{
		const state = Map({
			globalVariables: Map({
				flavour: 'delicious'
			})
		})
		expect(reverseGlobalVariables(state)).to.equal(
			Map({
				globalVariables: Map({
					flavour: 'delicious'
				}),
				reverseGlobalVariables: Map({
					delicious: 'flavour'
				})
			})
		);
	});
	it('reverseTransform', ()=>{
		const content = '\nIt is delicious';
		const code = '/*_ _*/';
		const globalVariables = Map({flavour: 'delicious'});
		const state = Map({
			globalVariables,
			code,
			content, 
			reverseContent: ''
		})
		const nextState = Map({
								globalVariables,
								code,
								content,
								reverseContent: '/*_ _*/\nIt is <!flavour!>',
								reverseGlobalVariables: Map({
									delicious: 'flavour'
								})
							});
		reverseTransformContent(state).then((tState)=>{
			expect(tState).to.equal(
				nextState
			);	
		})
		
	})

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