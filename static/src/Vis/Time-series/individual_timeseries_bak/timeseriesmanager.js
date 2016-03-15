Time_series_manager = function(){

	this.cached_data = [];

	this.time_series = [];

	//DEFAULT MODE
	this.mode = Time_series_manager.MODE.AREA;
	this.start_time = null;
	this.end_time = null;

};

Time_series_manager.prototype.set_data = function(data, start_time, end_time){
	this.cached_data = data;
	this.start_time = start_time;
	this.end_time = end_time;

	this.draw_chart();
}

Time_series_manager.prototype.draw_chart = function(){

	if(this.cached_data.length <= 0)
		return;

	var len = this.cached_data.length;
	
	$("#ts_container").empty();

	this.time_series = [];

	for(var i=0;i<len;i++){
		var $div = $("<div>", {id: "timeseries_chart_"+i});
		$("#ts_container").append($div);

		//$("#ts_container").append("<div id='timeseries_chart_" + i + " ' style='border:2px solid #999;'></div>");
		var ts = new Time_series_chart("timeseries_chart_"+i, this);
		this.time_series.push(ts);

		if(this.mode == Time_series_manager.MODE.BAR)
			ts.draw_stackBarChart(this.cached_data[i], this.start_time, this.end_time);
		else if(this.mode == Time_series_manager.MODE.LINE)
			ts.draw_lineChart(this.cached_data[i], this.start_time, this.end_time);
		else if(this.mode == Time_series_manager.MODE.AREA)
			ts.draw_stackChart(this.cached_data[i], this.start_time, this.end_time, 'zero');
		else if(this.mode == Time_series_manager.MODE.STREAM)
			ts.draw_stackChart(this.cached_data[i], this.start_time, this.end_time, 'wiggle');
        
        //ts.draw_lineChart(this.cached_data[i]);

	}

}

Time_series_manager.prototype.update_time_range = function(start_time, end_time){
	$('[ng-controller="map_controller"]').scope().update_time_range(start_time, end_time);
}

Time_series_manager.prototype.set_mode = function(mode){
	this.mode = mode;
	this.draw_chart();
}

Time_series_manager.MODE = { "BAR":0, "LINE":1, "AREA":2, "STREAM":3 };