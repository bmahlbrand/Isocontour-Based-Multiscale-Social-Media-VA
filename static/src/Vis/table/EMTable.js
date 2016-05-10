EMTable = function(){
};

EMTable.prototype.display = function(tweets){

	var color = {"T02":"#aa0000", "T03":"#aa0000" ,"O02":"#aaaa00", "T09":"#aa00aa", "T04":"#0000aa"};
	var keys = Object.keys(color);

	var html = "<table id=\"em_table\" class=\"gradient-style\" style=\"opacity:0.8;\"><tr>"
					+"<td style=\"white-space:nowrap;\"><b>Date<b></td><td><b>Content<b></td>"
					+"</tr>";

	tweets.sort(function(a, b) { return a.created_at - b.created_at; });


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

			var cate = intersect_arrays(keys, tokens[entry]);
			var index = lemmed_text.indexOf(entry);

			if(cate.length > 0 && index >= 0){
				c = color[cate[0]];
				rgb = hexToRgb(c);
				rgba = rgb.r + "," + rgb.g + "," + rgb.b + "," + 0.5;
				text[index] = "<span style=\"background-color:rgba(" + rgba + ")\">" + text[index] + "</span>";
				//assign color to the background of text;
				visFlag = true;
			}

		});

		if(visFlag)
			html += "<tr><td >" + date + "</td><td >" + text.join(" ") + "</td></tr>";
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