# Pagitter

The lightweight file generator designed to facilitate application development.

[![Build Status](https://travis-ci.org/l2silver/pagitter.svg?branch=master)](https://travis-ci.org/l2silver/pagitter)

### Examples

*home/yourProject/pagitter.js*
````
/*_ example.js */
()=>{
console.log('hello')
}
````
````
$ pgt
````
--->
*home/yourProject/example.js*
````
()=>{
console.log('hello')
}
````
````
$ pgt --watch
````
*home/yourProject/pagitter.js*
````
/*_ example.js */
()=>{
console.log('After running pgt with a watch option, 
anytime the pagitter file is saved, the files will be regenerated')
}
````
--->
*home/yourProject/example.js*
````
()=>{
console.log('After running pgt with a watch option, 
anytime the pagitter file is saved, the files will be regenerated')
}
````
*home/yourProject/pagitter.js*
````
/*_ <!callWhat=variable!> example.js */
()=>{
console.log('Call <!callWhat!>s declared in the code section')
}
/*_ example2.js */
()=>{
console.log('Once a <!callWhat!> is declared, 
all codes downstream in the pagitter file will have access to it, 
unless it is overwritten')
}
/*_ @callWhat@/example.js */
()=>{
console.log('Variables can also be called in the 
code section by wrapping them in @ symbols')
}
/*_ <!3=^^1 + 1 + 1!> example@3@.js */
()=>{
console.log('variables will be evaluated if they start with ^^')
}
````
### Setup
Create a config file called `pgt.config.js`
This file will hold the plugins to be used with pagitter.

*Example pgt.config.js*
````
{
	"plugins": [
		"pagitter-write"
		, "pagitter-store"
	]
}
````
Then create your first pagitter.js file in the root directory
````
/*_ example.js */
````
And run `$ pgt` to output the file
### Stores
Pagitter comes with the store plugin which allows you to create stores

*home/yourProject/pagitter.js*
````
/*_ <!pagitterStoresCreate=storeName!> example.js */
()=>{
console.log('this creates a store file in the .pagitter folder in the root directory')
console.log('starting from when the store is created
, all of the following code and content will be saves to the store')
}
````
After you save a store, you can access it by running the following command
````
$pgt --reverse storeName
````
We use the reverse option because before the store is thrown into the pagitter file, because it looks through all of the wouldbe files in the store, and records their content. That way, a user can make regular changes to the content, and still use pagitter to update files without worrying about overwriting new content.
### Delete Files
Pagitter comes with a delete plugin that allows users to delete all of the filenames in the pagitter.js document. This is useful for quickly changing the names of a group of files that share a similar name component.

*For Example*
Suppose you had:  
userController.js
userModel.js
userView.js

which you wanted to change to:  
personController.js
personModel.js
personView.js

*home/yourProject/pagitter.js*
````
/*_ <!baseName=user!> @baseName@Controller.js */
...
/*_  @baseName@Model.js */
...
/*_  @baseName@View.js */
...
````
````
$pgt --d
````
--->Deletes userController.js, userModel.js, userView.js
*home/yourProject/pagitter.js*
````
/*_ <!baseName=person!> @baseName@Controller.js */
...
/*_  @baseName@Model.js */
...
/*_  @baseName@View.js */
...
````
--->Writes personController.js, personModel.js, personView.js