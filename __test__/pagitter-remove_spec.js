import {expect} from 'chai';
import {promisify} from 'bluebird';
import {Map} from 'immutable';
import fs from 'fs';
import rimraf from 'rimraf'
import mkdirp from 'mkdirp';
import 
	{
	remove,
	  location
	, basename
} from './../lib/pagitter-remove';
const fsExists = promisify(fs.stat);
const readFile = promisify(fs.readFile);



describe('pagitter-remove', ()=>{
	
	describe('remove', ()=>{
		beforeEach(()=>{
			mkdirp.sync('example');
			fs.writeFileSync('example/example.js', 'hello');
		});
		afterEach(()=>{
			rimraf.sync('example');
		});	
		it('remove fileExists', (done)=>{
			const state = Map({
					filename: 'example.js'
					, content: 'hello'
					, globalVariables: Map({
						base: 'example'
					})
				})
			const promise = remove(state);
			return promise.then((newState)=>{
				return fsExists('example/example.js')
				.catch((err)=>{
					expect(err.code).to.equal('ENOENT');
					return done();
				});
			});
		});
		it('remove fileDoesNotExists', (done)=>{
			const state = Map({
					filename: 'example2.js'
					, content: 'hello'
					, globalVariables: Map({
						base: 'example'
					})
				})
			const promise = remove(state);
			return promise.then((newState)=>{
				return fsExists('example/example.js')
				.then(()=>{
					return done();
				});
			});
		});
	})
	
	it('location without base', ()=>{
		const fullLocation = location(
			Map({
				filename: 'example.js'
				, globalVariables: Map()
			})
		);
		expect(fullLocation).to.equal(process.cwd() + '/example.js');
	});
	it('location with base', ()=>{
		const state = Map({
				filename: 'example.js'
				, globalVariables: Map({
					base: 'example'
				})
			})
		const fullLocation = location(state);
		expect(fullLocation).to.equal(process.cwd() + '/example/example.js');
	});
	it('basename', ()=>{
		const folders = basename(Map({base: 'example'}));
		expect(folders).to.equal('example/');
	});
});