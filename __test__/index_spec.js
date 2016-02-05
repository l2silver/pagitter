import {expect} from 'chai';
import {
	run
	, splitFile
	, splitCode
	, splitContent
	, cleanRawVariable
	, updateGlobalVariables
	, convertRawVariableToObject
	, getRawVariables
	, getRawVariableKey
	, getRawVariableValue
} from './../lib/index';
import {fromJS, List, Map} from 'immutable';
import {promisify} from 'bluebird';
import fs from 'fs';
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const simpleJsonFile = "/*eTr ex1.js eTr*/a/*eTr ex2.js eTr*/b/*eTr ex3.js eTr*/c"
const jsonFile = "/*eTr <!base=example!> <!pasta=spagetti!> example.js eTr*/\n\nfunction(){\n\treturn '$eTr{pasta}';\n}\n\n/*eTr base=example pasta=noodles example2.js eTr*/\n\nfunction(){\n\treturn '$eTr{pasta}';\n}\n\n/*eTr base=example pasta=kimchi example3.js eTr*/\n\nfunction(){\n\treturn '$eTr{pasta}';\n}\n;"

describe('index', ()=>{
	
	it('splitContent', ()=>{
		const contents = splitContent(simpleJsonFile);
		expect(contents).to.equal(List(['a', 'b', 'c']));
	});
	it('splitCode', ()=>{
		const contents = splitCode(simpleJsonFile);
		expect(contents).to.equal(List(['/*eTr ex1.js eTr*/', '/*eTr ex2.js eTr*/', '/*eTr ex3.js eTr*/']));
	});
	it('splitFile', ()=>{
		const contentAndCode = splitFile(simpleJsonFile);
		expect(contentAndCode).to.equal(
			fromJS({
				codes: ['/*eTr ex1.js eTr*/', '/*eTr ex2.js eTr*/', '/*eTr ex3.js eTr*/'],
				contents: ['a', 'b', 'c']
			})
		);
	});
	it('convertRawVariableToObject', ()=>{
		const object = convertRawVariableToObject('<!example=variable!>');
		expect(object).to.equal(Map({example: 'variable'}));
	});
	it('getRawVariables', ()=>{
		const rawVariables = getRawVariables('/*eTr <!example=variable!> ex1.js eTr*/');
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
	it('updateGlobalVariables', ()=>{
		const updatedGlobalVariables = updateGlobalVariables(List(['<!example=variable!>']), Map());
		expect(updatedGlobalVariables).to.equal(Map({example: 'variable'}));
	});
});