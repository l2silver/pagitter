import {expect} from 'chai';
import {promisify} from 'bluebird';
import {Map} from 'immutable';
import fs from 'fs';
import rimraf from 'rimraf'
import {
	generatePromise
	, location
	, basename
	, generateFolders
} from './../lib/pagitter-write';

const readFile = promisify(fs.readFile);

before(()=>{
	rimraf.sync('example');
});

after(()=>{
	rimraf.sync('example');
});

describe('pagitter-write', ()=>{
	it('generatePromise', (done)=>{
		const promise = generatePromise(Map({base: 'example', eTrFilenameETr: 'example.js', eTrcontentETr: 'hello'}));
		return promise().then(()=>{
			readFile('example/example.js', 'utf8').then((content)=>{
				expect(content).to.equal('hello');
				done();
			});
		});
	});
	it('location without base', ()=>{
		const fullLocation = location(Map({eTrFilenameETr: 'example.js'}));
		expect(fullLocation).to.eventually.equal(process.cwd() + '/example.js');
	});

	it('location with base', ()=>{
		const fullLocation = location(Map({base: 'example', eTrFilenameETr: 'example.js'}));
		expect(fullLocation).to.eventually.equal(process.cwd() + '/example/example.js');
	});
	it('basename', ()=>{
		const folders = basename(Map({base: 'example'}));
		expect(folders).to.equal('example/');
	});
	it('generateFolders', (done)=>{
		const filename = process.cwd() + '/example/example.js'
		generateFolders(filename).then(()=>{
			expect(process.cwd() + '/example').to.be.a.directory();
			done();
		})
		
	});
});