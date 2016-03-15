EMTable = function(){
	this.cached_data = { 'time_desc': null, 'summarized': null };
};

EMTable.prototype.display = function(db){

	// var html = "<table id=\"em_table\" style=\"opacity:0.8;\"><tr>"
	// 				+"<td><b>User id<b></td><td style=\"white-space:nowrap;\"><b>Date<b></td><td><b>Content<b></td>"
	// 				+"</tr>";

	var keys = $('[ng-controller="map_controller"]').scope().get_current_key();
	var color = $('[ng-controller="map_controller"]').scope().get_color_scheme();

	var html = "<table id=\"em_table\" class=\"gradient-style\" style=\"opacity:0.8;\"><tr>"
					+"<td style=\"white-space:nowrap;\"><b>Date<b></td><td><b>Content<b></td>"
					+"</tr>";

	//tmp test;
	var tweetsArray = this.cached_data['time_desc'] = db.order("created_at desc").start(0).limit(100).select("user_id", "created_at", "lemmed_text", "tokens", "text");

	//text =
	var tmp = this.cached_data['time_desc'].map(function(element) { return element[4]; });
	this.cached_data['summarized'] = this.summarize(tmp);

	//var tweetsArray = db.order("created_at desc").start(0).limit(20).select("user_id", "created_at", "lemmed_text", "tokens", "text");

	for(var t = 0; t < tweetsArray.length; t++){
		
		var tweet = tweetsArray[t];

		var id = tweet[0];
		var date = new XDate(tweet[1]);
		date = date.toString("MM-dd HH:mm");

		var lemmed_text = tweet[2].split(" ");
		var text = tweet[4].split(" ");

		var tokens = tweet[3];
		var keywords = Object.keys(tokens);

		keywords.forEach(function(entry){

			var cate = intersect_arrays(keys, tokens[entry]);
			var index = lemmed_text.indexOf(entry);

			if(cate.length > 0 && index >= 0){
				c = color(cate[0]);
				rgb = hexToRgb(c);
				rgba = rgb.r + "," + rgb.g + "," + rgb.b + "," + 0.5;
				text[index] = "<span style=\"background-color:rgba(" + rgba + ")\">" + text[index] + "</span>";
				//assign color to the background of text;
			}

		});

		html += "<tr><td >" + date + "</td><td >" + text.join(" ") + "</td></tr>";
		//html += "<tr><td style=\"cursor:pointer;\">" + id + "</td><td >" + date + "</td><td >" + text + "</td></tr>";
	}
	
	html += "</table>";
	$("#EM_Table").html(null);
	$("#EM_Table").html(html);

};

EMTable.prototype.displayByMode = function(mode){

	// var html = "<table id=\"em_table\" style=\"opacity:0.8;\"><tr>"
	// 				+"<td><b>User id<b></td><td style=\"white-space:nowrap;\"><b>Date<b></td><td><b>Content<b></td>"
	// 				+"</tr>";

	var keys = $('[ng-controller="map_controller"]').scope().get_current_key();
	var color = $('[ng-controller="map_controller"]').scope().get_color_scheme();

	var html = "<table id=\"em_table\" class=\"gradient-style\" style=\"opacity:0.8;\"><tr>";

	//tmp test;
	//this.cached_data = db.start(0).limit(100).select("text");

	var tweetsArray = null;

	switch (mode) {

	case 'time_desc':
		tweetsArray = this.cached_data[mode];
		html += "<td style=\"white-space:nowrap;\"><b>Date<b></td><td><b>Content<b></td>"+"</tr>";
		break;

	case 'summarized':
		tweetsArray = this.cached_data[mode]; //db.order("created_at desc").start(0).limit(20).select("user_id", "created_at", "lemmed_text", "tokens", "text");
		html += "<td><b>Content<b></td>"+"</tr>";
		break;
	}

	for(var t = 0; t < tweetsArray.length; t++){
		var tweet = tweetsArray[t];
		switch (mode) {
			case 'time_desc':
				var id = tweet[0];
				var date = new XDate(tweet[1]);
				date = date.toString("MM-dd HH:mm");

				var lemmed_text = tweet[2].split(" ");
				var text = tweet[4].split(" ");

				var tokens = tweet[3];
				var keywords = Object.keys(tokens);

				keywords.forEach(function(entry){

					var cate = intersect_arrays(keys, tokens[entry]);
					var index = lemmed_text.indexOf(entry);

					if(cate.length > 0 && index >= 0){
						c = color(cate[0]);
						rgb = hexToRgb(c);
						rgba = rgb.r + "," + rgb.g + "," + rgb.b + "," + 0.5;
						text[index] = "<span style=\"background-color:rgba(" + rgba + ")\">" + text[index] + "</span>";
						//assign color to the background of text;
					}
				});

				html += "<tr><td >" + date + "</td><td >" + text.join(" ") + "</td></tr>";
				//html += "<tr><td style=\"cursor:pointer;\">" + id + "</td><td >" + date + "</td><td >" + text + "</td></tr>";
				break;

			case 'summarized':
				html += "<tr><td >" + tweet + "</td></tr>";
				break;
		}
	}

	html += "</table>";

	$("#EM_Table").html(html);

};

EMTable.prototype.setData = function(data) {
	this.cached_data = data;
}

EMTable.prototype.summarize = function(data){

	//console.log(data);
	var localdata = null;

	return null;

	$.ajax({
		  url: 'http://128.46.137.77:8080/input',
		  type: "POST",
		  data: {"Tweets": JSON.stringify(data)},
		  async: false,
		  success: function (response) {
				console.log("response:");
				localdata = JSON.parse(response);

				//$rootScope.em_table.displayRep(response);
		  },
		  error: function() {
		  function error() { return null;}

		  },
		  headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
	});

	return localdata;
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}