KeywordAnalyzer = function(){
	this.db = {};
};

KeywordAnalyzer.prototype.addKeyword = function(keyword, cates){

	var that = this;

	if(!that.db.hasOwnProperty(keyword))
		that.db[keyword] = {};

	cates.forEach(function(cate){

		if(!that.db[keyword].hasOwnProperty(cate))
			that.db[keyword][cate] = 0;

		that.db[keyword][cate] += 1;
	});

};

KeywordAnalyzer.prototype.hasKeyword = function(keyword){

	return this.db.hasOwnProperty(keyword);
};

//only return the most probable cate;
KeywordAnalyzer.prototype.getCates = function(keyword){

	var that = this;
	var cates = Object.keys(this.db[keyword]);
	var rankedCates = cates.sort(function(a,b){return that.db[keyword][b]-that.db[keyword][a]; });
	return [rankedCates[0]];

};