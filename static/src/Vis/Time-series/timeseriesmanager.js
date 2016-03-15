Time_series_manager = function(){

	this.cached_data = [];

	this.time_series = new Time_series_chart(this);

	//DEFAULT MODE
	this.mode = Time_series_manager.MODE.AREA;
	this.start_time = null;
	this.end_time = null;

	this.time_mapping = {};

};

Time_series_manager.prototype.set_data = function(data, start_time, end_time){
	this.cached_data = data;
	this.start_time = start_time;
	this.end_time = end_time;

	this.draw_chart();
}

Time_series_manager.prototype.draw_chart = function(){

	//$("#ts_container").empty();

	if(this.cached_data.length <= 0)
	 	return;

	// this.time_series = [];

	// for(var i=0;i<len;i++){
	// 	var $div = $("<div>", {id: "timeseries_chart_"+i});
	// 	$("#ts_container").append($div);

	// 	//$("#ts_container").append("<div id='timeseries_chart_" + i + " ' style='border:2px solid #999;'></div>");
	// 	var ts = new Time_series_chart("timeseries_chart_"+i, this);
	// 	this.time_series.push(ts);

	// 	if(this.mode == Time_series_manager.MODE.BAR)
	// 		ts.draw_stackBarChart(this.cached_data[i], this.start_time, this.end_time);
	// 	else if(this.mode == Time_series_manager.MODE.LINE)
	// 		ts.draw_lineChart(this.cached_data[i], this.start_time, this.end_time);
	// 	else if(this.mode == Time_series_manager.MODE.AREA)
	// 		ts.draw_stackChart(this.cached_data[i], this.start_time, this.end_time, 'zero');
	// 	else if(this.mode == Time_series_manager.MODE.STREAM)
	// 		ts.draw_stackChart(this.cached_data[i], this.start_time, this.end_time, 'wiggle');
        
 //        //ts.draw_lineChart(this.cached_data[i]);
	// }


    // var date = new XDate();
    // var data = [];

    // for(var i=0;i<100; i++)
    //   data.push({});

    // data.forEach(function(d){
    //   d.datetime = date.toString('yyyy');
    //   date.addYears(1);
    //   d.T01 = Math.floor(Math.random()*1000);
    //   d.T02 = Math.floor(Math.random()*1000);
    // });

	//extract real time datetime_epoch:

	this.time_mapping = {};

	for(var i=0;i<this.cached_data.length;i++){
		this.time_mapping[this.cached_data[i].datetime] = this.cached_data[i].datetime_epoch;
		delete this.cached_data[i].datetime_epoch;
	}

    this.time_series.set_data(this.cached_data);
    this.time_series.draw_stackChart('zero');
    //this.time_series.draw_lineChart();

    //this.time_series.draw_stackBarChart();

    // $( ".btn" ).click(function() {
    //   if (this.id == 'sbar') {
    //     time_series.draw_stackBarChart($.extend(true, [], data));
    //   } else if (this.id == 'line') {
    //     time_series.draw_lineChart(data);
    //   } else if (this.id == 'area') {
    //     time_series.draw_stackChart(data, 'zero');
    //   } else {
    //     time_series.draw_stackChart(data, 'wiggle');
    //   }
    // });

}

Time_series_manager.prototype.update_time_range = function(start_time, end_time){
	var that = this;
	$('[ng-controller="map_controller"]').scope().update_time_range(that.time_mapping[start_time], that.time_mapping[end_time]);
}

//start_time, end_time: Xdate type;
Time_series_manager.prototype.set_time_range_manually = function(start_time, end_time){
	this.time_series.set_time_range_manually(start_time, end_time);
}

Time_series_manager.prototype.set_mode = function(mode){
	this.mode = mode;
	this.draw_chart();
}

Time_series_manager.MODE = { "BAR":0, "LINE":1, "AREA":2, "STREAM":3 };