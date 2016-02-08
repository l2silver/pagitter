import {expect} from 'chai';
import {promisify} from 'bluebird';
import {Map} from 'immutable';
import fs from 'fs';
import rimraf from 'rimraf'
import generatePromise
	,{
	  location
	, basename
	, generateFolders
} from './../lib/pagitter-write';
const fsExists = promisify(fs.exists);
const readFile = promisify(fs.readFile);

before(()=>{
	rimraf.sync('example');
});

after(()=>{
	rimraf.sync('example');
});

describe('pagitter-write', ()=>{
	it('generatePromise', (done)=>{
		const state = Map({
				filename: 'example.js'
				, content: 'hello'
				, globalVariables: Map({
					base: 'example'
				})
			})
		const promise = generatePromise(state);
		return promise.then((newState)=>{
			readFile('example/example.js', 'utf8').then((content)=>{
				expect(content).to.equal('hello');
				expect(newState).to.equal(state);
				done();
			});
		});
	});
	it('location without base', ()=>{
		const fullLocation = location(
			Map({
				filename: 'example.js'
				, globalVariables: Map()
			})
		);
		expect(fullLocation).to.eventually.equal(process.cwd() + '/example.js');
	});
	it('location with base', ()=>{
		const state = Map({
				filename: 'example.js'
				, globalVariables: Map({
					base: 'example'
				})
			})
		const fullLocation = location(state);
		expect(fullLocation).to.eventually.equal(process.cwd() + '/example/example.js');
	});
	it('basename', ()=>{
		const folders = basename(Map({base: 'example'}));
		expect(folders).to.equal('example/');
	});
	it('generateFolders', (done)=>{
		const filename = process.cwd() + '/example/example.js'
		generateFolders(filename)
		.then(()=>{
			return fs.exists(process.cwd() + '/example', (result)=>{
				expect(result).to.be.true;
				done();
			});
		});	
	});
});