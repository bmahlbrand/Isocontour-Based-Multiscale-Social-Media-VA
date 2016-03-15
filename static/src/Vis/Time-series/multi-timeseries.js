Time_series_chart = function(parent){

  this.p = parent;

  this.dataset = null;
  this.data_len = null;

  var VIZ = {};
  this.VIZ = VIZ;

  var margin = {top: 20, right: 55, bottom: 30, left: 60},
      width  = 800 - margin.left - margin.right,
      height = 300  - margin.top  - margin.bottom;

  this.width = width;
  this.height = height;

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

  this.x = x;

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

  var svg = d3.select("#ts_container").append("svg")
      .attr("id", "thesvg")
      .attr("width",  width  + margin.left + margin.right)
      .attr("height", height + margin.top  + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  this.svg = svg;

  var that = this;

  /*****************************************/
  /****************stack  chart**************/
  /*****************************************/

  VIZ.stackChart = function (offset) {

    color = $('[ng-controller="map_controller"]').scope().get_color_scheme();
    that.color = color;

    var data = that.dataset;

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
    color.domain(varNames);

    x.domain(data.map(function (d) { return d.datetime; }));

    stack.offset(offset);
    stack(seriesArr);

    var y_max = d3.max(seriesArr, function (c) {
        return d3.max(c.values, function (d) { return d.y0 + d.y; });
      });

    if(y_max < 10)
      y_max = 10;

    y.domain([0, y_max]);

    var selection = svg.selectAll(".series")
      .data(seriesArr)
      .enter().append("g")
        .attr("class", "series");

    selection.append("path")
      .attr("class", "streamPath")
      .attr("d", function (d) { return area(d.values); })
      .style("fill", function (d) { return color(d.name); })
      .style("stroke", function (d) { return color(d.name); });

    // var points = svg.selectAll(".seriesPoints")
    //   .data(seriesArr)
    //   .enter().append("g")
    //     .attr("class", "seriesPoints");

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

    that.drawAxis();
    that.drawLegend(varNames);

     //add brush;
  var gBrush = svg.append("g")
      .attr("class", "brush")
      .call(that.brush);
      //.call(that.brush.event);

  gBrush.selectAll("rect")
      .attr("height", height);

  }

  /*****************************************/
  /*****************line chart**************/
  /*****************************************/

  VIZ.lineChart = function () {

    color = $('[ng-controller="map_controller"]').scope().get_color_scheme();
    that.color = color;

    var data = that.dataset;

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
    // y.domain([
    //   d3.min(seriesData, function (c) { 
    //     return d3.min(c.values, function (d) { return d.value; });
    //   }),
    //   d3.max(seriesData, function (c) { 
    //     return d3.max(c.values, function (d) { return d.value; });
    //   })
    // ]);

    var y_max = d3.max(seriesData, function (c) { 
                  return d3.max(c.values, function (d) { return d.value; });
                });

    if(y_max < 10)
      y_max = 10

    y.domain([0, y_max]);

    xAxis.tickValues(x.domain().filter(function(d, i) { return !(i % 6); }))
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
      .style("fill", "none")

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

    that.drawAxis();
    that.drawLegend(varNames);

    var gBrush = svg.append("g")
      .attr("class", "brush")
      .call(that.brush);
      //.call(that.brush.event);

    gBrush.selectAll("rect")
      .attr("height", height);
  }

  // /*****************************************/
  // /**************stack bar chart************/
  // /*****************************************/

  VIZ.stackBarChart = function () {

    color = $('[ng-controller="map_controller"]').scope().get_color_scheme();
    that.color = color;
    
    var data = that.dataset;

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
      .style("stroke", "grey");
      // .on("mouseover", function (d) { showPopover.call(this, d); })
      // .on("mouseout",  function (d) { removePopovers(); })

    that.drawAxis();
    that.drawLegend(varNames);

    var gBrush = svg.append("g")
      .attr("class", "brush")
      .call(that.brush);
      //.call(that.brush.event);

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
    
    //if ( !(d3.event.sourceEvent.altKey != undefined) && d3.event.sourceEvent != null ) return; // only transition after input

    if( d3.event.sourceEvent == null || d3.event.sourceEvent.altKey != undefined ){
      ;
    }else{
        return;
    }


    var extent = that.brush.extent();
    var s = extent[0], e = extent[1];

    if(s == 0 && e == 0)
      return;

    var domain_min = -1, domain_max = -1;

    if( that.width <= 0 || s < 0 || s >= that.width || e < 0 || e >= that.width || s >= e ){
    
      domain_min = that.x.domain()[0];
      domain_max = that.x.domain()[that.x.domain().length-1];
      
    }else{

      for(var i = 0; i < that.x.domain().length; i++){

        var domain_local = that.x.domain()[i];
        if(that.x(domain_local) <= s)
          domain_min = domain_local;
      
        if(that.x(domain_local) <= e)
          domain_max = domain_local;
      }

      if(domain_min == -1 && domain_max != -1)
        domain_min = that.x.domain()[0];
      if(domain_min != -1 && domain_max == -1)
        domain_max = that.x.domain()[that.x.domain().length-1];

    }

    if(domain_min != -1 && domain_max != -1 && domain_min != undefined && domain_max != undefined ){

      console.log("domain range: " + domain_min + " " + domain_max);
      that.p.update_time_range(domain_min, domain_max);

    }else{
      alert("error");
    }

  };

  /*****************************************/
  /**************   brush  end  ************/
  /*****************************************/

}

Time_series_chart.prototype.set_data = function(data){
  this.dataset = data;
  this.data_len = data.length;

}

Time_series_chart.prototype.drawAxis = function() {

  var that = this;
  var period_x = parseInt(that.data_len / 8);
  
  that.xAxis.tickValues(that.x.domain().filter(function(d, i) { return !(i % period_x); }))

  this.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + that.height + ")")
      .call(that.xAxis)
      .append("text")
      .attr("transform", "translate(" + that.width + ", 20)")
      .style("text-anchor", "end")
      .style("font-size", '14px')
      .text("time");

  this.svg.append("g")
      .attr("class", "y axis")
      .call(that.yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .style("font-size", '14px')
      .text("volume");

  this.svg.selectAll(".tick > text")
      .style("font-size", '14px');
}

Time_series_chart.prototype.drawLegend = function(varNames) {

    var legend = this.svg.selectAll(".legend")
        .data(varNames.slice().reverse())
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) { return "translate(55," + i * 20 + ")"; })
        .style("font-size","18px")

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
        .attr("fill", this.color)
        .style("text-anchor", "end")
        .text(function (d) { 
          return EMTerms.instance().get_term2name()[d];
        });
}

Time_series_chart.prototype.draw_stackChart = function(param) {
  this.VIZ.stackChart(param);
}

Time_series_chart.prototype.draw_lineChart = function() {
  this.VIZ.lineChart();
}

Time_series_chart.prototype.draw_stackBarChart = function() {
    this.VIZ.stackBarChart($.extend(true, [], this.cached_data));
}


Time_series_chart.prototype.set_time_range_manually = function(start_time, end_time){

    var that = this;

    s = start_time.toString("d HH:mm");
    e = end_time.toString("d HH:mm");

    console.log("set time range manually" + s + " " + e);

    var s_index = -1, e_index = -1;

    var domains = this.x.domain();

    domains.forEach(function(entry, idx){

      if( domains[idx] <= s && s <= domains[idx+1]){
        s_index = domains[idx];
      }
      if( domains[idx] <= e && e <= domains[idx+1]){
        e_index = domains[idx+1];
      }
    });

    if(s_index == -1 || e_index == -1)
      return;

    this.brush.extent([that.x(s_index), that.x(e_index)]);

    // now draw the brush to match our extent
    // use transition to slow it down so we can see what is happening
    // remove transition so just d3.select(".brush") to just draw
    this.brush(d3.select(".brush").transition());

    // now fire the brushstart, brushmove, and brushend events
    // remove transition so just d3.select(".brush") to just draw
    this.brush.event(d3.select(".brush").transition().delay(500));
}