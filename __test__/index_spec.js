import {expect} from 'chai';
import {
	run
	, splitCode
	, splitContent
	, cleanRawVariable
	, updateGlobalVariables
	, convertRawVariableToObject
	, getRawVariables
	, getRawVariableKey
	, getRawVariableValue
	, updateFilename
	, getFilename
	, transformRegExp
	, transformContent
	, initialPluginPromise
	, pluginStream
	, generatePluginFunctions
} from './../lib/index';
import {fromJS, List, Map} from 'immutable';
import {promisify} from 'bluebird';
import fs from 'fs';
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
import rimraf from 'rimraf';
const simpleJsonFile = "/*_ ex1.js _*/a/*_ ex2.js _*/b/*_ ex3.js _*/c"
const jsonFile = "/*_ <!base=example!> <!pasta=spagetti!> example.js _*/\n\nfunction(){\n\treturn '$_{pasta}';\n}\n\n/*_ base=example pasta=noodles example2.js _*/\n\nfunction(){\n\treturn '$_{pasta}';\n}\n\n/*_ base=example pasta=kimchi example3.js _*/\n\nfunction(){\n\treturn '$_{pasta}';\n}\n;"

describe('index', ()=>{
	before(()=>{
		rimraf.sync('example');
	});

	after(()=>{
		rimraf.sync('example');
	});
	it('splitContent', ()=>{
		const contents = splitContent(simpleJsonFile);
		expect(contents).to.equal(List(['a', 'b', 'c']));
	});
	it('splitCode', ()=>{
		const contents = splitCode(simpleJsonFile);
		expect(contents).to.equal(List(['/*_ ex1.js _*/', '/*_ ex2.js _*/', '/*_ ex3.js _*/']));
	});
	it('convertRawVariableToObject', ()=>{
		const object = convertRawVariableToObject('<!example=variable!>');
		expect(object).to.equal(Map({example: 'variable'}));
	});
	it('getRawVariables', ()=>{
		const rawVariables = getRawVariables('/*_ <!example=variable!> ex1.js _*/');
		expect(rawVariables).to.equal(List(['<!example=variable!>']));
	});
	it('getRawVariableKey', ()=>{
		const rawVariableKey = getRawVariableKey('example=variable');
		expect(rawVariableKey).to.equal('example');
	});
	it('getRawVariableValue', ()=>{
		const rawVariableValue = getRawVariableValue('example=variable');
		expect(rawVariableValue).to.equal('variable');
	});
	it('updateGlobalVariables', (done)=>{
		const code = '/*_ <!example=variable!> ex1.js _*/';
		const globalVariables = Map();
		const updatedGlobalVariablesState = updateGlobalVariables(Map({
			globalVariables,
			code
			})
		);
		updatedGlobalVariablesState.then((state)=>{
			expect(state.get('globalVariables')).to.equal(Map({example: 'variable'}));
			return done();
		});
		
	});
	it('updateFilename', (done)=>{
		const code = '/*_ <!example=variable!> ex1.js _*/';
		const globalVariables = Map();

		const updatedFilenameState = updateFilename(
			Map({
				code,
				globalVariables
			})
		);
		updatedFilenameState.then((state)=>{
			expect(state.get('filename')).to.equal('ex1.js');	
			return done()
		});
		
	});
	it('getFilename', ()=>{
		const filename = getFilename('/*_ <!example=variable!> ex1.js _*/');
		expect(filename).to.equal('ex1.js');
	});
	it('transformRegExp', ()=>{
		const transformPattern = transformRegExp(Map({example: 'variable', example_2: 'variable_2'}));
		expect(transformPattern).to.eql(/\<\!example\!\>|\<\!example_2\!\>/g);
	});
	it('transformContent', (done)=>{
		const content = '<!example!> <!example_2!> ex1.js';
		const globalVariables = Map({
			example: 'variable'
			, example_2: 'variable_2'
		});
		const transformedContentState = transformContent(
			Map({
				content
				, globalVariables
			})
		);
		transformedContentState.then((state)=>{
			expect(state.get('content')).to.equal('variable variable_2 ex1.js');
			return done();
		});
		
	});
	it('initialPluginPromise', ()=>{
		const state = Map();
		expect(initialPluginPromise(state)).to.eventually.equal(Map());
	});
	
	it('pluginStream', (done)=>{
		const state = Map({
				filename: 'example.js'
				, content: 'hello'
				, globalVariables: Map({
					base: 'example'
				})
			})
		const plugins = List([require("./../dist/pagitter-write").default]);
		const generatePluginFunction = generatePluginFunctions(plugins)
		generatePluginFunction(state)
		.then(()=>{
			return readFile('example/example.js', 'utf8')
		})
		.then((content)=>{
				expect(content).to.equal('hello');
				return done();
		});
	});

	describe('run', ()=>{
		const pluginList = [require("./../dist/pagitter-write").default];
		it('creates file with base variable', (done)=>{
			run('./__test__/pagitterTest1.js', pluginList)
			.then(()=>{
				return readFile('example/example3.js', 'utf8')
			})
			.then((content)=>{
				expect(content).to.equal('\n\nfunction(){\n\treturn \'spagetti\';\n}\n');
				return done();
			});
		});
		it('creates multiple files', (done)=>{
			run('./__test__/pagitterTest2.js', pluginList)
			.then(()=>{
				return readFile('example/example4.js', 'utf8')
			})
			.then((content)=>{
				expect(content).to.equal('\n\nfunction(){\n\treturn \'spagetti\';\n}\n');
				return done();
			});
		});

	});

	

});