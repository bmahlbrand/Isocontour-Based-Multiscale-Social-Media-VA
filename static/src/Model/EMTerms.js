//intialize emterms, which contains the tree structure as well as the terminology of each category.
EMTerms = function(){
	this.em_terms = null;
	this.em_cate_term = null;
	this.em_term_cate = null;
	this.em_term_name = {};

	this.default_cates = ["C07", "O02", "T02", "T04"];

	this.init();
};

EMTerms.prototype.get_default_cates = function(){
	return this.default_cates;
};

EMTerms.prototype.get_terms = function(){
	return this.em_terms;
};

EMTerms.prototype.get_cate2term = function(){
	return this.em_cate_term;
};

EMTerms.prototype.get_term2cate = function(){
	return this.em_term_cate;
};

EMTerms.prototype.get_term2name = function(){
	return this.em_term_name;
};

EMTerms.prototype.from_term_get_cate = function(term){
	if(term in this.em_term_cate)
		return this.em_term_cate[term];
	
	return [];
};

EMTerms.prototype.init = function(){

	var that = this;

	$.ajax({
	  url: 'EMTree.json',
	  async: false,
	  dataType: 'json',
	  success: function (response) {
	    that.em_terms = response;

	    for(var idx in that.em_terms.children){
	    	for(var idxx in that.em_terms.children[idx].children){
	    		var cate = that.em_terms.children[idx].children[idxx].cate;
	    		var name = that.em_terms.children[idx].children[idxx].name;
	    		
	    		that.em_term_name[cate] = name;
	    	}
	    }

	  }
	});

	that.em_cate_term = {};
	that.em_term_cate = {};

	$.ajax({
	  url: 'EMTerms.txt',
	  async: false,
	  dataType: 'text',
	  success: function (text) {
	    var words = d3.csv.parseRows(text);
			words.forEach(function(entry){

				entry[0] = entry[0].toLowerCase();

				if(entry[1] in that.em_cate_term)
					that.em_cate_term[entry[1]].push(entry[0]);
				else{
					that.em_cate_term[entry[1]] = [entry[0]];
				}

				if(entry[0] in that.em_term_cate)
					that.em_term_cate[entry[0]].push(entry[1]);
				else{
					that.em_term_cate[entry[0]] = [entry[1]];
				}

			});
	  }
	});

};

EMTerms.the_instace = null;

EMTerms.instance = function(){

	if(EMTerms.the_instace == null)
		EMTerms.the_instace = new EMTerms();
	return EMTerms.the_instace;

};