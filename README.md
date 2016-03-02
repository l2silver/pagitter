# Pagitter

The lightweight file generator designed to facilitate application development.

### Examples

*home/yourProject/pagitter.js*
````
/*_ example.js _*/
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
/*_ example.js _*/
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
/*_ <!callWhat=variable!> example.js _*/
()=>{
console.log('Call <!callWhat!>s declared in the code section')
}
/*_ example2.js _*/
()=>{
console.log('Once a <!callWhat!> is declared, 
all codes downstream in the pagitter file will have access to it, 
unless it is overwritten')
}
/*_ @callWhat@/example.js _*/
()=>{
console.log('Variables can also be called in the 
code section by wrapping them in @ symbols')
}
/*_ <!3=^^1 + 1 + 1!> example@3@.js _*/
()=>{
console.log('variables will be evaluated if they start with ^^')
}
````