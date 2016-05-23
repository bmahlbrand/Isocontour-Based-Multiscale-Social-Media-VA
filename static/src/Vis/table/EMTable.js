EMTable = function(){
};

EMTable.prototype.display = function(tweets){

	// var categories = DataCenter.instance().categories;
	var focusCates = DataCenter.instance().focusCates;

	var html = "<table id=\"em_table\" class=\"gradient-style\" style=\"opacity:0.8;\"><tr>"
					+"<td style=\"white-space:nowrap;\"><b>Date<b></td><td><b>Content<b></td>"
					+"</tr>";

	tweets.sort(function(a, b) {
		if(a.created_at < b.created_at)
			return 1;
		else if(b.created_at < a.created_at)
			return -1;
		else
			return 0;
	});

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
		var visFlag = false;
		keywords.forEach(function(entry){

			var cate = intersect_arrays(focusCates, tokens[entry]);
			var index = lemmed_text.indexOf(entry);

			if(cate.length > 0 && index >= 0){
				c = divergentColorList()[focusCates.indexOf(cate[0])];

				rgb = hexToRgb(c);
				//background color;
				rgba = rgb.r + "," + rgb.g + "," + rgb.b + "," + 0.9;
				text[index] = "<span style=\"background-color:rgba(" + rgba + ")\">" + text[index] + "</span>";
				//font color
				//text[index] = "<font color=\"" + c + ")\">" + text[index] + "</font>";
				//assign color to the background of text;
				visFlag = true;
			}

		});

		if(visFlag)
			html += "<tr><td>" + date + "</td><td>" + text.join(" ") + "</td></tr>";
		// else
		// 	html += "<tr><td>" + date + "</td><td>" + text.join(" ") + "</td></tr>";
		//html += "<tr><td style=\"cursor:pointer;\">" + id + "</td><td >" + date + "</td><td >" + text + "</td></tr>";
	}
	
	html += "</table>";

	$("#msgTable").html(null);
	$("#msgTable").html(html);

};

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}