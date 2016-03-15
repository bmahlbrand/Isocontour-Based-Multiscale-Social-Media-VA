EMTree = function(emterms){

  this.selected_list = EMTerms.instance().get_default_cates();


  /********color scheme*********/

  this.highlight_node_stroke = 3.5;
  this.node_stroke = 1.5;

  this.highlight_font_size = "22px";
  this.font_size = "16px";

  this.diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });
  /*******************************************/
  /*************tree initialization***********/
  /*******************************************/

  this.m = [20, 80, 20, 100];
  this.w = 640 - this.m[1] - this.m[3];
  this.h = 400 - this.m[0] - this.m[2];
  this.root;

  var that = this;
  this.tree = d3.layout.tree()
      .size([this.h, this.w])
      .separation(function separation(a, b) {
        if( that.selected_list.indexOf(a.cate) != -1 ||  that.selected_list.indexOf(b.cate) != -1  )
          return 1.5;
        else
          return 1;
      })
  ;


  this.vis = d3.select("#EM_Tree").append("svg:svg")
      .attr("width", this.w + this.m[1] + this.m[3])
      .attr("height", this.h + this.m[0] + this.m[2])
    .append("svg:g")
      .attr("transform", "translate(" + this.m[3] + "," + this.m[0] + ")");

  this.root = emterms;
  this.root.x0 = this.h / 2;
  this.root.y0 = 0;
  this.update(this.root);

  this.tree_vol = null;

};

EMTree.prototype.update = function(source){

  var diagonal = this.diagonal;

  var that = this;
  var i = 0;
  var duration = d3.event && d3.event.altKey ? 5000 : 1000;

  // Compute the new tree layout.
  var nodes = this.tree.nodes(this.root).reverse();

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 70; });

  // Update the nodes…
  var node = this.vis.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .on("click", function(d) {
      
        //toggle(d);
        //update(d);
        that.toggle(d);
        that.update_vis();
        $('[ng-controller="EMTree_controller"]').scope().send_tree_interaction_to_map();

      });

  nodeEnter.append("svg:circle")
      .attr("r", 1e-6)
      .attr("id", function(d){ return "cate_node" + d.cate; })
      .attr("class", "cate_node")
      .attr("stroke-width", function(d){
        if( that.selected_list.indexOf(d.cate) != -1)
          return that.highlight_node_stroke;
        else
          return that.node_stroke;
      });

  nodeEnter.append("svg:text")
      .attr("id", function(d){ return "cate_text_" + d.cate; })
      .attr("class", "cate_text")
      .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
      .attr("dy", function(d) { return d.children || d._children ? "1.00em" : "0.4em" ; })
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .attr("font-weight", function(d){

        if( that.selected_list.indexOf(d.cate) != -1)
          return "bold";
        else
          return "normal";

      }).style("font-size", function(d){

        if( that.selected_list.indexOf(d.cate) != -1)
          return that.highlight_font_size;
        else
          return that.font_size;

      })
      .text(function(d) { return d.name; })
      .style("fill-opacity", 1e-6)
      .attr("fill", function(d){

        return "#000";
        try{
          return $('[ng-controller="map_controller"]').scope().get_color_mapping(d.cate);
        }catch(err){
          return "#000";
        }
      });

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeUpdate.select("circle")
      //.attr("r", 7);
      .attr("r", function(d){

        if( that.selected_list.indexOf(d.cate) != -1)
          return 7;
        else
          return 3;

      });

      //.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
      //.style("fill", "#fff" );

  nodeUpdate.select("text")
      .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .remove();

  nodeExit.select("circle")
      .attr("r", 1e-6);

  nodeExit.select("text")
      .style("fill-opacity", 1e-6);

  // Update the links…
  var link = this.vis.selectAll("path.link")
      .data(this.tree.links(nodes), function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("svg:path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      })
    .transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}


EMTree.prototype.update_vis = function(){

  var that = this;
  //change circle stroke width;
  d3.selectAll(".cate_node").attr("stroke-width", function(d){
    if( that.selected_list.indexOf(d.cate) != -1)
      return that.highlight_node_stroke;
    else
      return that.node_stroke;
  }).attr("r", function(d){
    if( that.selected_list.indexOf(d.cate) != -1)
      return 7;
    else
      return 3;
  });
  //change text weight;
  d3.selectAll(".cate_text").attr("font-weight", function(d){
    if( that.selected_list.indexOf(d.cate) != -1)
      return "bold";
    else
      return "normal";
  }).style("font-size", function(d){

        if( that.selected_list.indexOf(d.cate) != -1)
          return that.highlight_font_size;
        else
          return that.font_size;

  }).attr("fill", function(d){

    return "#000";

    try{
      var mapping = $('[ng-controller="map_controller"]').scope().get_color_scheme();
      if( mapping.domain().indexOf(d.cate) != -1)
        return mapping(d.cate);
      else
        throw "err";
    }catch(err){
      return "#000";
    }
  });

  // this.tree.separation(function separation(a, b) {
  //      return a.parent == b.parent ? 2 : 1;
  // });



}
EMTree.prototype.collapse = function(node){
  if (node.children) {
      node._children = node.children;
      node.children = null;
  }else{
      node.children = node._children;
      node._children = null;
  }
  this.update(this.root);
  this.update_vol(this.tree_vol);

}

EMTree.prototype.toggle = function(node){

  var cate = node.cate;

  if(node.children != null || node._children != null){
    //not leaf:
    this.collapse(node);
  }
  else{
    //leaf;
    if(this.selected_list.indexOf(cate) != -1){
      //in the list;
      this.delete_from_selected_list(cate);
    }
    else{
      //not in the list;
      this.add_to_selected_list(cate);
    }
  }

};

EMTree.prototype.add_to_selected_list = function(cate){
  this.selected_list.push(cate);
};

EMTree.prototype.delete_from_selected_list = function(cate){
  var idx = this.selected_list.indexOf(cate);
  this.selected_list.splice(idx, 1);
};

EMTree.prototype.get_selected_list = function(){
  return this.selected_list;
};

EMTree.prototype.update_vol = function(tree_vol){

  if(tree_vol == null)
    return;

  this.tree_vol = tree_vol;

  var arr = Object.keys(tree_vol).map(function(k){return tree_vol[k]});
  var max = parseFloat(Math.max.apply(null, arr));
  if(max <= 0)
    max = 1;

  //change domain to exlude 0;
  var linear_scale = d3.scale.linear()
                  .domain([0,1])
                  .range([1, 100]);

  var log_scale = d3.scale.log()
                    .domain([1,100])
                    .range([0,10]);

  var color = d3.scale.linear()
              .domain([0, 2.5, 5, 7.5, 10])
              .range(["#ffffff", "#fef0d9", "#fdcc8a", "#fc8d59", "#d7301f"]);

  d3.selectAll(".cate_node")
    .style("fill", function(d){
      if(d.cate in tree_vol)
        return color(log_scale(linear_scale(tree_vol[d.cate]/max)));
      else
        return color(0);
    });

  d3.selectAll(".cate_text")
  .text(function(d){

    //parent node;
    if( 'children' in d )
      return d.name;

    //children node;
    var name = EMTerms.instance().get_term2name()[d.cate];

    if(d.cate in tree_vol)
      return name + ": " +  tree_vol[d.cate];
    else
      return name + ": " + "0";
  });

};