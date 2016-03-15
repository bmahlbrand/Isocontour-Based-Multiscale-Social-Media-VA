Time_series_chart = function(div_name, p){

//parent: ts manager, responsible for interaction with other windows;
  this.p = p;

//data is initialized later;
  this.data = null;
  this.start_time = null;
  this.end_time = null;

  var VIZ = {};
  this.VIZ = VIZ;

  var margin = {top: 20, right: 0, bottom: 30, left: 60},
      width  = 650 - margin.left - margin.right,
      height = 120  - margin.top  - margin.bottom;

  this.width = width;
  this.height = height;

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width]);

  this.x = x;

  var that = this;
  this.brush = d3.svg.brush()
    .x(x)
    .on("brushend", brushended);

  var y = d3.scale.linear()
      .rangeRound([height, 0]);

  this.y = y;

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  this.xAxis = xAxis;

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  this.yAxis = yAxis;

  var color = ["#001c9c","#101b4d","#475003","#9c8305","#d3c47c"];
  // var color_arr = ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f"];
  // var color_arr1 = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928"];
  // var color_arr2 = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628"];

  var color = d3.scale.ordinal()
      .range(color);

  this.color = color;

  var svg = d3.select("#"+div_name).append("svg")
      .attr("id", "Svg"+div_name)
      .attr("width",  width  + margin.left + margin.right)
      .attr("height", height + margin.top  + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  this.svg = svg;

  var that = this;
  /*****************************************/
  /****************stack  chart**************/
  /*****************************************/

  VIZ.stackChart = function (data, start_time, end_time, offset) {

    that.data = data;
    that.start_time = start_time;
    that.end_time = end_time;


    VIZ.clearAll();

    var stack = d3.layout.stack()
        .values(function (d) { return d.values; })
        .x(function (d) { return x(d.label) + x.rangeBand() / 2; })
        .y(function (d) { return d.value; });

    var area = d3.svg.area()
        .interpolate("cardinal")
        .x(function (d) { return x(d.label) + x.rangeBand() / 2; })
        .y0(function (d) { return y(d.y0); })
        .y1(function (d) { return y(d.y0 + d.y); });

    var labelVar = 'datetime';
    var varNames = d3.keys(data[0])
        .filter(function (key) { return key !== labelVar;});
    color.domain(varNames);

    var seriesArr = [], series = {};
    varNames.forEach(function (name) {
      series[name] = {name: name, values:[]};
      seriesArr.push(series[name]);
    });

    data.forEach(function (d) {
      varNames.map(function (name) {
        series[name].values.push({name: name, label: d[labelVar], value: +d[name]});
      });
    });

    x.domain(data.map(function (d) { return d.datetime; }));

    stack.offset(offset)
    stack(seriesArr);

    y.domain([0, d3.max(seriesArr, function (c) {
        return d3.max(c.values, function (d) { return d.y0 + d.y; });
      })]);

    var selection = svg.selectAll(".series")
      .data(seriesArr)
      .enter().append("g")
        .attr("class", "series");

    selection.append("path")
      .attr("class", "streamPath")
      .attr("d", function (d) { return area(d.values); })
      .style("fill", function (d) { return color(d.name); })
      .style("stroke", "grey");

    var points = svg.selectAll(".seriesPoints")
      .data(seriesArr)
      .enter().append("g")
        .attr("class", "seriesPoints");

    // points.selectAll(".point")
    //   .data(function (d) { return d.values; })
    //   .enter().append("circle")
    //    .attr("class", "point")
    //    .attr("cx", function (d) { return x(d.label) + x.rangeBand() / 2; })
    //    .attr("cy", function (d) { return y(d.y0 + d.y); })
    //    .attr("r", "10px")
    //    .style("fill",function (d) { return color(d.name); });
       // .on("mouseover", function (d) { showPopover.call(this, d); })
       // .on("mouseout",  function (d) { removePopovers(); })

    that.drawAxis(data.length);
    //that.drawLegend(varNames);

    var gBrush = svg.append("g")
      .attr("class", "brush")
      .call(that.brush)
      .call(that.brush.event);

    gBrush.selectAll("rect")
      .attr("height", height);

  }


  /*****************************************/
  /*****************line chart**************/
  /*****************************************/

  VIZ.lineChart = function (data, start_time, end_time) {

    that.data = data;
    that.start_time = start_time;
    that.end_time = end_time;

    VIZ.clearAll();

    var line = d3.svg.line()
        .interpolate("cardinal")
        .x(function (d) { return x(d.label) + x.rangeBand() / 2; })
        .y(function (d) { return y(d.value); });

    var labelVar = 'datetime';
    var varNames = d3.keys(data[0]).filter(function (key) { return key !== labelVar;});
    color.domain(varNames);

    var seriesData = varNames.map(function (name) {
      return {
        name: name,
        values: data.map(function (d) {
          return {name: name, label: d[labelVar], value: +d[name]};
        })
      };
    });

    x.domain(data.map(function (d) { return d.datetime; }));
    y.domain([
      d3.min(seriesData, function (c) { 
        return d3.min(c.values, function (d) { return d.value; });
      }),
      d3.max(seriesData, function (c) { 
        return d3.max(c.values, function (d) { return d.value; });
      })
    ]);

    // svg.append("g")
    //     .attr("class", "x axis")
    //     .attr("transform", "translate(0," + height + ")")
    //     .call(xAxis);

    // svg.append("g")
    //     .attr("class", "y axis")
    //     .call(yAxis)
    //   .append("text")
    //     .attr("transform", "rotate(-90)")
    //     .attr("y", 6)
    //     .attr("dy", ".71em")
    //     .style("text-anchor", "end");

    var series = svg.selectAll(".series")
        .data(seriesData)
      .enter().append("g")
        .attr("class", "series");

    series.append("path")
      .attr("class", "line")
      .attr("d", function (d) { return line(d.values); })
      .style("stroke", function (d) { return color(d.name); })
      .style("stroke-width", "2px")
      .style("fill", "none");

    // series.selectAll(".linePoint")
    //   .data(function (d) { return d.values; })
    //   .enter().append("circle")
    //    .attr("class", "linePoint")
    //    .attr("cx", function (d) { return x(d.label) + x.rangeBand()/2; })
    //    .attr("cy", function (d) { return y(d.value); })
    //    .attr("r", "5px")
    //    .style("fill", function (d) { return color(d.name); })
    //    .style("stroke", "grey")
    //    .style("stroke-width", "1px")
    //    .on("mouseover", function (d) { showPopover.call(this, d); })
    //    .on("mouseout",  function (d) { removePopovers(); })

    that.drawAxis(data.length);
    //that.drawLegend(varNames);
    var gBrush = svg.append("g")
      .attr("class", "brush")
      .call(that.brush)
      .call(that.brush.event);

    gBrush.selectAll("rect")
      .attr("height", height);

  }

  /*****************************************/
  /**************stack bar chart************/
  /*****************************************/

  VIZ.stackBarChart = function (data, start_time, end_time) {

    that.data = data;
    that.start_time = start_time;
    that.end_time = end_time;


    VIZ.clearAll();

    var labelVar = 'datetime';
    var varNames = d3.keys(data[0]).filter(function (key) { return key !== labelVar;});
    color.domain(varNames);

    data.forEach(function (d) {
      var y0 = 0;
      d.mapping = varNames.map(function (name) { 
        return {
          name: name,
          label: d[labelVar],
          y0: y0,
          y1: y0 += +d[name]
        };
      });
      d.total = d.mapping[d.mapping.length - 1].y1;
    });

    x.domain(data.map(function (d) { return d.datetime; }));
    y.domain([0, d3.max(data, function (d) { return d.total; })]);

    // svg.append("g")
    //     .attr("class", "x axis")
    //     .attr("transform", "translate(0," + height + ")")
    //     .call(xAxis);

    // svg.append("g")
    //     .attr("class", "y axis")
    //     .call(yAxis)
    //   .append("text")
    //     .attr("transform", "rotate(-90)")
    //     .attr("y", 6)
    //     .attr("dy", ".71em")
    //     .style("text-anchor", "end");

    var selection = svg.selectAll(".series")
        .data(data)
      .enter().append("g")
        .attr("class", "series")
        .attr("transform", function (d) { return "translate(" + x(d.datetime) + ",0)"; });

    selection.selectAll("rect")
      .data(function (d) { return d.mapping; })
    .enter().append("rect")
      .attr("width", x.rangeBand())
      .attr("y", function (d) { return y(d.y1); })
      .attr("height", function (d) { return y(d.y0) - y(d.y1); })
      .style("fill", function (d) { return color(d.name); })
      .style("stroke", function (d) { return color(d.name); })
      .on("mouseover", function (d) { showPopover.call(this, d); })
      .on("mouseout",  function (d) { removePopovers(); })

    that.drawAxis(data.length);
    //that.drawLegend(varNames);

    var gBrush = svg.append("g")
      .attr("class", "brush")
      .call(that.brush)
      .call(that.brush.event);

    gBrush.selectAll("rect")
      .attr("height", height);


  }

  VIZ.clearAll = function () {
    svg.selectAll("*").remove();
  }

  // function removePopovers () {
  //   $('.popover').each(function() {
  //     $(this).remove();
  //   }); 
  // }

  // function showPopover (d) {
  //   $(this).popover({
  //     title: d.name,
  //     placement: 'auto top',
  //     container: 'body',
  //     trigger: 'manual',
  //     html : true,
  //     content: function() { 
  //       return "datetime: " + d.label + 
  //              "<br/>Rounds: " + d3.format(",")(d.value ? d.value: d.y1 - d.y0); }
  //   });
  //   $(this).popover('show')
  // }


  /*****************************************/
  /**************brush   begin  ************/
  /*****************************************/


  function brushended() {
    
    if (!d3.event.sourceEvent) return; // only transition after input
    var extent = that.brush.extent();
    var s = extent[0], e = extent[1];

    if( that.width <= 0 || s < 0 || s >= that.width || e < 0 || e >= that.width || s >= e ){
      console.log("time series error");
      return;
    }

    var t_interval = that.end_time.getTime() - that.start_time.getTime();
    var d_interval = that.width;
    //var d_interval = that.data.length*1.0;
    var start = s / d_interval * t_interval + that.start_time.getTime();
    var end = e / d_interval * t_interval + that.start_time.getTime();

    var s_time = new Date(start);
    var e_time = new Date(end);

    console.log(s_time+" "+e_time);

    that.p.update_time_range(s_time, e_time);

  };

  /*****************************************/
  /**************   brush  end  ************/
  /*****************************************/

}

Time_series_chart.prototype.drawAxis = function(data_len) {
    
    var that = this;
    var period_x = parseInt(data_len / 8);
    that.xAxis.tickValues(that.x.domain().filter(function(d, i) { return !(i % period_x); }))

    // var period_y = parseInt(data_len / 3);
    // that.yAxis.tickValues(that.y.domain().filter(function(d, i) { return !(i % period_y); }))

    this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + that.height + ")")
        .call(that.xAxis);

    this.svg.append("g")
        .attr("class", "y axis")
        .call(that.yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Volume");

    this.svg.selectAll(".tick > text")
      .style("font-size", '14px');
}

Time_series_chart.prototype.drawLegend = function(varNames) {

    var legend = this.svg.selectAll(".legend")
        .data(varNames.slice().reverse())
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) { 
          return "translate(" + (-600 + i*100) + ", 400)";
        });

    legend.append("rect")
        .attr("x", this.width - 10)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", this.color)
        .style("stroke", "grey");

    legend.append("text")
        .attr("x", this.width - 12)
        .attr("y", 6)
        .attr("dy", ".35em")
        .attr("font-size", "14px")
        .style("text-anchor", "end")
        .text(function (d) { return d; });
}

Time_series_chart.prototype.draw_stackChart = function(data, start_time, end_time, param) {
  this.VIZ.stackChart(data, start_time, end_time, param);
}

Time_series_chart.prototype.draw_lineChart = function(data, start_time, end_time) {
  this.VIZ.lineChart(data, start_time, end_time);
}

Time_series_chart.prototype.draw_stackBarChart = function(data, start_time, end_time) {
  this.VIZ.stackBarChart($.extend(true, [], data), start_time, end_time);
}

Time_series_chart.prototype.set_data = function(data, start_time, end_time) {
  this.VIZ.lineChart(data, start_time, end_time);
}
