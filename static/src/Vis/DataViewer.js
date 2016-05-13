DataViewer = function(){



};

DataViewer.prototype.showData = function() {

	var tweets = _.values(DataCenter.instance().tweets);

	/*****************************************Filter Tweets*********************************************/
	tweets.sort(function(a, b) {
		if(a.created_at < b.created_at)
			return 1;
		else if(b.created_at < a.created_at)
			return -1;
		else
			return 0;
	});

	/*****************************************Construct Table************************************************/
	
	var html = "<table id=\"em_table\" class=\"gradient-style\" style=\"opacity:0.8;\"><tr>"
					+"<td style=\"white-space:nowrap;\"><b>Date<b></td><td><b>Content<b></td>"
					+"</tr>";

	for(var t = 0; t < tweets.length; t++){
		
		var tweet = tweets[t];

		var id = tweet.tweet_id;
		var date = new XDate(tweet.created_at);
		date = date.toString("MM-dd HH:mm");

		var lemmed_text = tweet.lemmed_text.split(" ");
		var text = tweet.text.split(" ");

		var tokens = tweet.tokens;
		var keywords = Object.keys(tokens);

		//check whether containing the keys:
		// var visFlag = false;
		// keywords.forEach(function(entry){

		// 	var cate = intersect_arrays(categories, tokens[entry]);
		// 	var index = lemmed_text.indexOf(entry);

		// 	if(cate.length > 0 && index >= 0){
		// 		c = color(categories.indexOf(cate[0]));

		// 		rgb = hexToRgb(c);
		// 		//background color;
		// 		rgba = rgb.r + "," + rgb.g + "," + rgb.b + "," + 0.5;
		// 		text[index] = "<span style=\"background-color:rgba(" + rgba + ")\">" + text[index] + "</span>";
		// 		//font color
		// 		//text[index] = "<font color=\"" + c + ")\">" + text[index] + "</font>";
		// 		//assign color to the background of text;
		// 		visFlag = true;
		// 	}

		// });

		html += "<tr><td >" + date + "</td><td >" + text.join(" ") + "</td></tr>";
		//html += "<tr><td style=\"cursor:pointer;\">" + id + "</td><td >" + date + "</td><td >" + text + "</td></tr>";
	}
	
	html += "</table>";

	$("#dataEdit").html(null);
	$("#dataEdit").html(html);

};