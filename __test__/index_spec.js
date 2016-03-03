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
	, transformEvaluate
	, initialPluginPromise
	, pluginStream
	, generatePluginFunctions
	, trimContent
} from './../lib/index';
import {fromJS, List, Map} from 'immutable';
import {promisify} from 'bluebird';
import fs from 'fs';
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
import rimraf from 'rimraf';
const simpleJsonFile = "/*_ ex1.js */a/*_ ex2.js */b/*_ ex3.js */c"
const jsonFile = "/*_ <!base=example!> <!pasta=spagetti!> example.js _*/\n\nfunction(){\n\treturn '$_{pasta}';\n}\n\n/*_ base=example pasta=noodles example2.js _*/\n\nfunction(){\n\treturn '$_{pasta}';\n}\n\n/*_ base=example pasta=kimchi example3.js _*/\n\nfunction(){\n\treturn '$_{pasta}';\n}\n;"

describe('index', ()=>{
	before(()=>{
		rimraf.sync('example');
	});

	after(()=>{
		rimraf.sync('example');
	});
	it('trimContent', ()=>{
		expect(trimContent('\n\n\nhello\n\n\n')).to.equal('hello');
	});
	it('splitContent', ()=>{
		const contents = splitContent(simpleJsonFile);
		expect(contents).to.equal(List(['a','b','c']));
	});
	it('splitCode', ()=>{
		const contents = splitCode(simpleJsonFile);
		expect(contents).to.equal(List(['/*_ ex1.js */', '/*_ ex2.js */', '/*_ ex3.js */']));
	});
	it('convertRawVariableToObject', ()=>{
		const object = convertRawVariableToObject('<!example=variable!>', Map());
		expect(object).to.equal(Map({example: 'variable'}));
	});
	it('convertRawVariableToObject with globalVariables', ()=>{
		const object = convertRawVariableToObject('<!example=@name@!>', Map({name: 'variable'}));
		expect(object).to.equal(Map({example: 'variable'}));
	});
	it('getRawVariables', ()=>{
		const rawVariables = getRawVariables('/*_ <!example=variable!> <!base=example!> ex1.js _*/');
		expect(rawVariables).to.equal(List(['<!example=variable!>', '<!base=example!>']));
	});
	it('getRawVariableKey', ()=>{
		const rawVariableKey = getRawVariableKey('example=variable');
		expect(rawVariableKey).to.equal('example');
	});
	it('getRawVariableValue', ()=>{
		const rawVariableValue = getRawVariableValue('example=variable');
		expect(rawVariableValue).to.equal('variable');
	});
	it('getRawVariableValue multiline', ()=>{
		const rawVariableValue = getRawVariableValue('example=\nvariable');
		expect(rawVariableValue).to.equal('\nvariable');
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
	it('updateGlobalVariables multiline', (done)=>{
		const code = '/*_ <!example=\nvariable!> ex1.js _*/';
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
		const code = '/*_ <!example=variable!> ex1.js */';
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
		const filename = getFilename('/*_ <!example=variable!> ex1.js */', Map());
		expect(filename).to.equal('ex1.js');
	});
	it('getFilename variable', ()=>{
		const filename = getFilename('/*_ <!example=variable!> @example@ex1.js */', Map({example: 'variable'}));
		expect(filename).to.equal('variableex1.js');
	});
	it('transformRegExp', ()=>{
		const transformPattern = transformRegExp(Map({example: 'variable', example_2: 'variable_2'}));
		expect(transformPattern).to.eql(/(\@example\@)|(\@example_2\@)/g);
	});
	it('transformContent', (done)=>{
		const content = '@example@ @example_2@ ex1.js';
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
	it('transformEvaluate', ()=>{
		expect(transformEvaluate('^^1+1')).to.equal(2);
	})
	it('transformEvaluate function', ()=>{
		expect(transformEvaluate('^^function sayHello(){console.log("hello");return 2;}sayHello();')).to.equal(2);
	})
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
		
		const pluginList = [require("./../lib/pagitter-write").default];
		it('creates file with base variable', (done)=>{
			run('./__test__/pagitterTest1.js', pluginList)
			.then(()=>{
				return readFile('example/example3.js', 'utf8')
			})
			.then((content)=>{
				expect(content).to.equal('function(){\n\treturn \'spagetti\';\n}');
				return done();
			});
		});
		it('creates multiple files', (done)=>{
			run('./__test__/pagitterTest2.js', pluginList)
			.then(()=>{
				return readFile('example/example4.js', 'utf8')
			})
			.then((content)=>{
				expect(content).to.equal('function(){\n\treturn \'spagetti\';\n}');
				return done();
			});
		});
		it('creates files after multiple rows of code', (done)=>{
			run('./__test__/pagitterTest3.js', pluginList)
			.then(()=>{
				return readFile('example/example6.js', 'utf8')
			})
			.then((content)=>{
				expect(content).to.equal('function(){\n\treturn \'spagetti\';\n}');
				return done();
			});
		});
	});

	

});