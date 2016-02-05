module.exports = {
	globals: function(commandLine){
		var result = commandLine.match(/[a-z]+\=[^ ]+(?= )/ig);
		if(result){
			return result;
		}
		return false
	}
	, fileName: function(commandLine){
		var result = commandLine.match(/ (([^ \=])+)(?= )/);
		if(result){
			return result[1];
		}
		return false
	}
	, transformMatch: function(global){
		return '\\$eTr\\{'+global+'\\}'
	}
	, stripETrTags: function(){
		return '(?!(\\$eTr\\{))[a-z]+(?=\\})'
	}
	, eTrCode: function(){
		return new RegExp(/\/\*eTr.+eTr\*\/(\\n)*/g);
	}
}