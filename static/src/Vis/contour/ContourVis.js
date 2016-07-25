ContourVis = function(map_svg){

	this.map_svg = map_svg;

};

ContourVis.prototype.clear = function(){
	this.map_svg.selectAll("*").remove();
};

ContourVis.prototype.updateGeoBbox = function(){

	//perform minimizing overlapping algorithm;
	var tree = DataCenter.instance().getTree().getNodeById(DataCenter.instance().focusID);
	tree.resetFlags();
	tree.getPixelCoords();
	tree.samplePoints();
	tree.filterNodesForMinOlp();
	tree.minOlp();

	//update activenode list;
	//for the concept of activenode, please find it in the app_controller file;
	tree.filterNodesForVis();

	var clist = tree.toList();

	clist = clist.filter(function(val){
		return val.cluster['visFlag'];
	});

	var activeNodes = clist.map(function(val){ return val.cluster['clusterId']; });

	//acNode list;
	$('[ng-controller="app_controller"]').scope().setAcNodes(activeNodes);

};

ContourVis.prototype.update = function(){

	var that = this;

	this.clear();

	this.initHalo();

	var acNodes = $('[ng-controller="app_controller"]').scope().getAcNodes();

	var tree = DataCenter.instance().getTree().getNodeById(DataCenter.instance().focusID);

	//showing all levels;
	var levelForFilter = 20;

	acNodes = acNodes.filter(function(id){

		var level = parseInt(id.split("_")[0]);
		return level <= levelForFilter;
	});

	tree.drawContour(acNodes);

	//hover hull
	//var hlNodes = $('[ng-controller="app_controller"]').scope().getHlNodes();
	//this.hoverHull(hlNodes);

};


//if clusterIdlist is empty, reset;
// ContourVis.prototype.hoverHull = function(clusterIdlist){

// 	if(clusterIdlist.length <= 0){
// 		d3.selectAll(".concaveHull")
// 			.attr("opacity", 1);
// 		return;
// 	}

// 	d3.selectAll(".concaveHull")
// 		.attr("opacity", 0);

// 	clusterIdlist.forEach(function(val){

// 		d3.selectAll(".hull_"+val)
// 			.attr("opacity", 1);
// 	});

// };

ContourVis.prototype.createLineFunc = function(pts){

	pts = HullLayout.odArrTo2dArr(pts);

	var lineFunction = null;

	if(ContourVis.MODE == ContourVis.INTERMODE.BASIS){
		lineFunction = d3.svg.line()
						.x(function(d) { return d[0]; })
                        .y(function(d) { return d[1]; })
                        .interpolate("basis-closed");
	}else if(ContourVis.MODE == ContourVis.INTERMODE.CARDINAL){
		lineFunction = d3.svg.line()
						.x(function(d) { return d[0]; })
                        .y(function(d) { return d[1]; })
                        .interpolate("cardinal-closed")
                        .tension(ContourVis.tension);
	}else{
		lineFunction = d3.svg.line()
				.x(function(d) { return d[0]; })
                .y(function(d) { return d[1]; })
                .interpolate("linear-closed");

	}

	return lineFunction(pts);

}

// ContourVis.prototype.createLineFuncLinear = function(pts){

// 	pts = HullLayout.odArrTo2dArr(pts);

// 	var lineFunction = null;

// 	lineFunction = d3.svg.line()
// 					.x(function(d) { return d[0]; })
//                     .y(function(d) { return d[1]; })
//                     .interpolate("linear-closed");

// 	return lineFunction(pts);

// }


ContourVis.prototype.initHalo = function(){

	var svg = this.map_svg;

	var defs = svg.append("defs");

	// create filter with id #drop-shadow
	// height=130% so that the shadow is not clipped
	var filter = defs.append("filter")
	    .attr("id", "halo")
	    .attr("x", "-50%")
		.attr("y", "-50%")
	    .attr("height", "200%")
		.attr("width", "200%");

	// SourceAlpha refers to opacity of graphic that this filter will be applied to
	// convolve that with a Gaussian with standard deviation 3 and store result
	// in blur
	filter.append("feGaussianBlur")
	    .attr("in", "SourceAlpha")
	    .attr("stdDeviation", 5)
	    .attr("result", "blur");

	// translate output of Gaussian blur to the right and downwards with 2px
	// store result in offsetBlur
	filter.append("feOffset")
	    .attr("in", "blur")
	    .attr("dx", 0)
	    .attr("dy", 0)
	    .attr("result", "offsetBlur");
		
	// <feFlood flood-color="rgb(100, 100, 0)" result="color"/>
	//filter.append("feFlood")
	//    .attr("flood-color", "rgb(255, 0, 0)")
	//    .attr("result", "color");
		
	// overlay original SourceGraphic over translated blurred opacity by using
	// feMerge filter. Order of specifying inputs is important!
	var feMerge = filter.append("feMerge");

	feMerge.append("feMergeNode")
	    .attr("in", "offsetBlur")
	feMerge.append("feMergeNode")
	    .attr("in", "SourceGraphic");
}

//use mask to exlude children hull area when rendering the current hull;
//only draw hulls which ['visFlag'] == true;
ContourVis.prototype.drawHull = function(id, zoom, curLineFunc, ChildsLineFuncArr, isChild){

	var that = this;
	var svg = this.map_svg;

	var node = DataCenter.instance().getTree().getNodeById(id);

	var _fillColor = contourColorFill()(zoom)

	/*******************************************create mask for children area*******************************************/
	// create mask function:
	var mask_id = 'lense_mask_' + id;
	svg.append('defs')
		.call(function (defs){

	    defs.append('mask')
	        .attr('id', mask_id)
	        .call(function(mask){
		          
		        mask.append('rect')
	          		.attr('width', svg.attr("width"))
	  				.attr('height', svg.attr("height"))
	  				.attr('x', 0)
	  				.attr('y', 0)
	  				.attr('fill', '#ffffff');

				ChildsLineFuncArr.forEach(function(c){

					mask.append('path')
						.attr("d", c)
	            		.attr('fill', '#000000');
				});
	        
	        });
    	});


	var that = this;
	/*******************************************render area inside the hull*******************************************/
    var hull = svg.append("path")
    				.attr("id", "hull_" + id)
			    	.attr("class", "concaveHull")
			    	.attr("d", curLineFunc)
			    	.attr("fill", _fillColor)
			    	.attr("fill-opacity", 0.7)
			    	.attr('mask', 'url(#' +mask_id+ ')')
			    	// .on("mouseover", function(){
			    	// 	var id = this.id.substring(5,this.id.length);
			    	// 	that.hoverCluster(id);
			    	// })
			    	// .on("mouseout", function(){
			    	// 	that.hoverCluster();
			    	// })
			    	.on("mouseover", function(){

			    		
			    		var cluster_id = this.id.substring(5, this.id.length);
			    		/*************************************draw optimized dots************************************/
			    		
			    		var dots = DataCenter.instance().getTree().getNodeById(cluster_id).cluster['hulls'];
			    		for(var i=0; i<dots.length/2; i++){
			    			svg.append("circle")
			    				.attr('class', 'control_point')
			    				.attr('cx', dots[2*i])
			    				.attr('cy', dots[2*i+1])
			    				.attr('r', 2)
			    				.attr('fill', 'red');
			    		}

			    		/*************************************draw actual tweet dots************************************/
			    		// //tweets inside the hull;
			    		// var cluster_id = this.id.substring(5, this.id.length);
			    		// console.log(cluster_id);

			    		// var ids = DataCenter.instance().getTree().getNodeById(cluster_id).cluster['ids'];
			    		// var tweets = DataCenter.instance().getTweetsByIds(ids);
			    		
			    		// $('[ng-controller="map_controller"]').scope().render_dots(tweets, "red");

			    		// //cate distribution
			    		// console.log(DataCenter.instance().distOfCate(tweets));

			    		//tweets on the boundary:
			    		// var ids = [];
			    		// DataCenter.instance().getTree().getNodeById(cluster_id).cluster['ids'].forEach(function(idlist){
			    		// 	ids = ids.concat(idlist);
			    		// });

			    		// var tweets = DataCenter.instance().getTweetsByIds(ids);
			    		
			    		// $('[ng-controller="map_controller"]').scope().render_dots(tweets, "red");

		  			}).on("mouseout", function(){

		  				/*************************************draw optimized dots************************************/
			    		svg.selectAll(".control_point").remove();

			    		/*************************************draw actual tweet dots************************************/

		  				// $('[ng-controller="map_controller"]').scope().clear_dots();

		  			})
		  			.on('contextmenu', d3.contextMenu(that.get_menu(id)) );

	/***************************************************render the boundary*************************************************/
	var selectedCate = DataCenter.instance().focusCates;
	var threshold = Math.min( 1 / selectedCate.length / 2, 0.1) || 0; 
	var dist = node.stat.calCateDist(selectedCate, threshold);
	var cateVol = selectedCate.map(function(val){ return dist[val]; });
	var cateColor = selectedCate.map(function(val, idx){ return divergentColorList()[idx] });

	this.drawOutLine(id, curLineFunc, selectedCate, cateVol, cateColor, isChild);

};

ContourVis.prototype.drawHalo = function(id, lineFunc){

	var svg = this.map_svg;
	var that = this;

	svg.append('defs')
		.call(function (defs){

	    defs.append('mask')
	        .attr('id', 'halo_mask'+id)
	        .call(function(mask){
		          
		        mask.append('rect')
	          		.attr('width', svg.attr("width"))
	  				.attr('height', svg.attr("height"))
	  				.attr('x', 0)
	  				.attr('y', 0)
	  				.attr('fill', '#ffffff');
				mask.append('path')
					.attr("d", lineFunc)
            		.attr('fill', '#000');
	        });
    	});

	svg.append("path")
			.attr("id", "haloline_" + id)
			.attr("d", lineFunc)
	    	.attr("stroke", "#aaa")
	    	.attr("stroke-width", 0)
	    	.attr("fill", "white")
	    	.style("filter", "url(#halo)")
	    	.attr('mask', 'url(#halo_mask'+id+')')
	    	.style("cursor", "hand")
			.on("mouseover", function(){
	    		var id = this.id.substring(9, this.id.length);
	    		that.hoverCluster(id);
	    	})
	    	.on("mouseout", function(){
	    		that.hoverCluster();
	    	})
	    	.on('contextmenu', d3.contextMenu(that.get_menu(id)) );


};

ContourVis.prototype.hoverCluster = function(id){

	return;

	// var highlightColor = "#fee0b6";
	var highlightColor = "#af8dc3";
	//reset all
	if(id == null || id == undefined){
		
		d3.selectAll(".concaveHull").attr("fill", function(){
			var id = this.id;
			id = id.substring(5, id.length);
			var zoom = parseInt(id.split("_")[0]);
			return contourColorFill()(zoom);
		});

		return;
	}

	var curId = id;
	var curLevel = id.split("_")[0];

	//highlight only this cluster;
	//d3.select("#hull_"+id).attr("fill", "#fee0b6");
	d3.selectAll(".concaveHull").attr("fill", function(){
		var id = this.id;
		id = id.substring(5, id.length);
		var zoom = parseInt(id.split("_")[0]);
		
		// if(id == curId)
		// 	return "#fee0b6";
		//highlight clusters of the same scale;
		if(zoom == curLevel)
			return highlightColor;
		else
			return contourColorFill()(zoom);

	});

};


ContourVis.prototype.drawOutLine = function(id, lineFunc, selectedCate, cateVol, cateColor, isChild){

	var svg = this.map_svg;
	var lineWidth = 6;

	try{

		//draw halo first;
		if(ContourVis.enableHalo)
			this.drawHalo(id, lineFunc);

		//calculate category distribution;
		if(cateVol.length <= 0)
			throw "error code [1]; no cates selected";

		//remove 0 entry;
		selectedCate = selectedCate.filter(function(val, i){ return cateVol[i] > 0 ? true : false; });
		cateColor = cateColor.filter(function(val, i){ return cateVol[i] > 0 ? true : false; });
		cateVol = cateVol.filter(function(val){ return val > 0 ? true : false; });

		if(cateVol.length <= 0)
			throw "error code [2]; no non-zero data for the selected cates;";

		var min = cateVol.min();
		//normalize the array based on the non-zero min value;
		cateVol = cateVol.map(function(val){ return Math.round(val / min); });

		//up to this point, the cateVol has been normalized already;
		//draw contour
		if(ContourVis.OUTLINE == ContourVis.OUTLINEMODE.DEFAULT)
			throw "error code [3]; default contour";
		else if(ContourVis.OUTLINE == ContourVis.OUTLINEMODE.STRIP)
			this.drawStripLine(id, lineFunc, cateVol.slice(), cateColor, lineWidth);
		else if(ContourVis.OUTLINE == ContourVis.OUTLINEMODE.CIRCLE)
			this.drawCircleLine(id, lineFunc, cateVol.slice(), cateColor, lineWidth);
		else if(ContourVis.OUTLINE == ContourVis.OUTLINEMODE.TEXT)
			this.drawTextLine(id, lineFunc, cateVol.slice(), cateColor, lineWidth, selectedCate);
		else if(ContourVis.OUTLINE == ContourVis.OUTLINEMODE.TEXT_FILL){
			if(!isChild)
				this.drawTextLine(id, lineFunc, cateVol.slice(), cateColor, lineWidth, selectedCate);
			else
				this.drawTextArea(id, lineFunc, cateVol.slice(), cateColor, lineWidth, selectedCate);
		}

	}catch(err){

		if(err.toString().indexOf("error code") == -1){
			console.error(err.stack);
			throw err;
		}

		console.error(err);
		//just draw regular line, do not add strip

		var defaultColor = "#2b8cbe";
		var grey = "#777";

		var color = err.indexOf("[3]") > -1 ? defaultColor : grey;
		var defaultWidth = 2;

		svg.append("path")
				.attr("class", "nativeline_" + id + "_0")
				.attr("d", lineFunc)
		    	.attr("stroke", color)
		    	.attr("stroke-width", defaultWidth)
		    	.attr("fill", "none");
	}

};

ContourVis.prototype.drawStripLine = function(id, lineFunc, cateVol, cateColor, lineWidth){

	var svg = this.map_svg;
	var unitLength = 10;

	//multiply by unit length;
	cateVol = cateVol.map(function(val){ return val*unitLength; });
	var sum = cateVol.reduce(function(a, b){return a+b;});

	var offset = 0;
	cateVol.forEach(function(cate, idx){

		var dashArray = cate + ", " + (sum-cate);
		var dashOffset = offset;
		offset += cate;

		svg.append("path")
			.attr("class", "stripline_" + id + "_" + idx)
			.attr("d", lineFunc)
	    	.attr("stroke", cateColor[idx])
	    	.attr("stroke-width", lineWidth)
	    	.style("stroke-dasharray", dashArray)
	    	//the offset is the reverse direction of the common thinking.
	    	.style("stroke-dashoffset", dashOffset*(-1))
	    	.attr("fill", "none");
	});

};

ContourVis.prototype.drawCircleLine = function(id, lineFunc, cateVol, cateColor, lineWidth){

	var svg = this.map_svg;
	var unitLength = lineWidth;
	var margin = 1;
	var circleR = ( unitLength - margin*2 ) * 0.7;

	//generate path;
	var curPath = svg.append("path")
					// .attr("class", "stripline_" + id + "_" + idx)
					.attr("d", lineFunc)
			    	.attr("stroke", "none")
			    	.attr("fill", "none");

	curPath = curPath[0][0];

	//multiply by unit length;
	var sum = cateVol.reduce(function(a, b){return a+b;});

	var numOfCircle = Math.ceil(curPath.getTotalLength() / unitLength);

	var localCount = 0;
	var curIdx = 0;
	var renderArr = [];

	for(var i=0; i<numOfCircle; i++){

		if(localCount>= cateVol[curIdx]){
			localCount = 0;
			curIdx = (curIdx + 1) % cateVol.length;
		}
		renderArr.push(curIdx);
		localCount++;
	}

	// console.log(renderArr);
	renderArr.forEach(function(val, idx){

		//val here is the index of the cateVol;
		var pos = curPath.getPointAtLength(idx*unitLength);

		//only render points that are inside the viewport
		if(ContourVis.inViewPort(pos.x, pos.y)){

			svg.append("circle")
				.attr('class', 'outlintpoint_'+id)
				.attr('cx', pos.x)
				.attr('cy', pos.y)
				.attr('r', circleR)
				.attr('stroke', "#aaa")
				.attr('stroke-width', "1")
				.attr('fill', cateColor[val]);
		}

	});

}

ContourVis.prototype.drawTextLine = function(id, lineFunc, cateVol, cateColor, lineWidth, selectedCate){

	var that = this;
	var svg = this.map_svg;
	
	//generate path;
	var curPath = svg.append("path")
					// .attr("class", "stripline_" + id + "_" + idx)
					.attr("id", "pathfortext"+id)
					.attr("d", lineFunc)
			    	.attr("stroke", "none")
			    	.attr("fill", "none");

	curPath = curPath[0][0];

	var step = 5;
	var segs = Math.floor(curPath.getTotalLength() / step);

	/*******************************discrete path into a series of points************************************/
	var pts = [];
	for(var i=0; i<segs; i++){
		var pos = curPath.getPointAtLength(i*step);
		pts.push([pos.x, pos.y]);
	}

	/**********************************construct directionay flag array****************************************/
	var flags = [];
	for(var i=0; i<segs; i++){
		var flag = pts[(i+1)%segs][0] - pts[i][0] > 0.5;
		flags.push(flag);
	}

	/***********************extract subpath that have the same direction************************************/
	var subpaths = [];
	var subpathDir = [];
	var start = 0;
	for(var i=1; i<segs; i++){
		
		//dir of current point and next point;
		var dir = flags[i];
		var preDir = flags[(i-1+segs)%segs];

		if(dir != preDir){
			subpaths.push([start, i]);
			subpathDir.push(preDir);
			start = i;
		}
		if(i == segs-1){
			//handle the case where the last element is different from the last but one;
			if(dir != preDir){
				subpaths.push([i-1, i]);
				subpathDir.push(dir);
			}
			else{
				subpaths.push([start, i]);
				subpathDir.push(dir);
			}
		}
	}

	/***************************************connect tail to head*******************************************/
	if( flags[0] == flags[segs-1] ){
		var end = subpaths.pop();
		subpaths[0][0] = end[0];
		subpathDir.pop();
	}
	/**************************************remove small segments*******************************************/
	var iter = 10;
	var smallLen = 10;
	var maxFac = 5;
	for(var i=0; i<iter; i++){

		var j;
		for(j=0; j<subpaths.length; j++){
			var length = subpaths[j][0] < subpaths[j][1] ? 
							subpaths[j][1] - subpaths[j][0] : 
							(pts.length-subpaths[j][0])+subpaths[j][1];
			
			if(length < smallLen){

				var left = (j-1+subpaths.length)%subpaths.length;
				var right = (j+1+subpaths.length)%subpaths.length;

				var leftLen = subpaths[left][0] < subpaths[left][1] ? 
								subpaths[left][1] - subpaths[left][0] : 
								(pts.length-subpaths[left][0])+subpaths[left][1];

				var rightLen = subpaths[right][0] < subpaths[right][1] ? 
								subpaths[right][1] - subpaths[right][0] : 
								(pts.length-subpaths[right][0])+subpaths[right][1];
				
				var mLen = Math.max(leftLen, rightLen);

				if( subpathDir[left] == subpathDir[right] && subpathDir[left] != subpathDir[j] && mLen > length*maxFac ){
					var leftIdx = subpaths[left][0];
					var rightIdx = subpaths[right][1];
					
					//actual remove;
					subpaths[left][1] = rightIdx;

					if(j == subpaths.length-1){
						//remove the last and next(which is the head)
						subpathDir.splice(j, 1);
						subpaths.splice(j, 1);
						subpathDir.splice(0, 1);
						subpaths.splice(0, 1);

					}else{
						//remove the consecutive two elements;
						subpathDir.splice(j, 2);
						subpaths.splice(j, 2);
					}
				}

				break;
			}
		}
		if(j>=subpaths.length)
			break;
	}
	/**********************************************render text line****************************************/

	subpaths.forEach(function(val, i){

		var subarray = val[0] < val[1] ? pts.slice(val[0], val[1]) : pts.slice(val[0], pts.length).concat(pts.slice(0, val[1]));
		
		//if the array is too short, then do not render text;
		if(subarray.length <= 5)
			return;

		//reverse the path that goes left direction
		if(subpathDir[i] == false)
			subarray.reverse();

		//test subpath in viewport
		// var i;
		// for(i=0; i<subarray.length; i++){
		// 	if(ContourVis.inViewPort(subarray[i][0], subarray[i][1]))
		// 		break;
		// }
		// //not in viewport
		// if(i >= subarray.length)
		// 	return;


		var lineFunc = d3.svg.line()
							.x(function(d) { return d[0]; })
							.y(function(d) { return d[1]; })
							.interpolate("cardinal");

		var curPath = svg.append("path")
						.attr("id", "textline_"+id+"_"+i)
						.attr("d", lineFunc(subarray))
				    	//.attr("stroke", subpathDir[i] == true ? '#a00' : "#00a" )
				    	.attr("stroke", "none")
				    	.attr("stroke-width", 3)
				    	.attr("stroke-opacity", 0.5)
				    	.attr("fill", "none");
		
		/***************************************construct text string***********************************/

		var baseline = subpathDir[i] == true ? 'text-after-edge' : 'text-before-edge';
		var baseline = 'central';
		//how to align vertically the text along a textpath;
		//http://bl.ocks.org/eweitnauer/7325338

		var pathLen = curPath[0][0].getTotalLength();
		var fontSize = 16;
		var letterW = fontSize*0.55;
		
		//get keywords from the tree node;
		var keywords = DataCenter.instance().getTree().getNodeById(id).getKeywords(selectedCate, 10);
		var str = keywords.join("*");

		//generate string of enough length for textpath;
		var repeat = Math.ceil(pathLen / (str.length*letterW));
		var entireStr = Array(repeat).fill(str).join("*");
		//split by *, but keep * in the array;
		var words = entireStr.split(/(\*)/g);

		/**********************************calculate startoffset for each word******************************/
		//add an extra delimiter in the end of words depending on the directionality of line;
		if(subpathDir[i])
			words.unshift("*");

		var startOffs = [];
		var start = 0;
		var spaceBetWords = 2;
		for(var j=0; j<words.length; j++){
			startOffs.push({word:words[j], start:start});
			start = start + words[j].length*letterW;
			if(start >= pathLen)
				break;
		}

		//add an extra delimiter in the end of words depending on the directionality of line;
		if(!subpathDir[i])
			startOffs.push({word:"*", start:start});
		
		/********************************************draw text string***************************************/

		startOffs.forEach(function(val, j){

			var c;
			if(val.word == "*"){
				c = "#000";
			}
			else{
				var tCates = Object.keys(DataCenter.instance().keywordCate[val.word]);
				var inter = intersect_arrays(selectedCate, tCates);
				if(inter.length > 0)
					c = cateColor[selectedCate.indexOf(inter[0])];
				else
					c = "#555";
			}

			svg.append("text")
				//.attr("id", "text_"+id+"_"+i+"_"+j)
				.attr("class", val.word == "*"?"keyword":"keyword keyword_" + val.word )
			    .attr("x", 0)
			    .attr("dy", 0)
			    .style("font-size", fontSize+"px")
			    .style("font-family", "consolas")
			    .attr("dominant-baseline", baseline)
				.style("fill", c)
				.on("mouseover", function(){
					//get the keyword of this text element;
					var cls = d3.select(this).attr("class");
					var keyword = cls.split("_")[1];

					//hover the same keyword;
					that.hoverKeywords(keyword);
			    })
			    .on("mouseout", function(){
			    	that.hoverKeywords();
			    })
			    .attr("pointer-events", val.word == "*"?"none":"visiblePainted")
			  	.append("textPath")
			    .attr("class", "textpath")
			    .attr("startOffset", val.start+"px")
			    .attr("xlink:href", "#"+"textline_"+id+"_"+i)
			    .text(val.word);
		});

	});

}

//packing algorithm:
//https://en.wikipedia.org/wiki/Packing_problems
//http://www.codeproject.com/Articles/210979/Fast-optimizing-rectangle-packing-algorithm-for-bu
ContourVis.prototype.drawTextArea = function(id, lineFunc, cateVol, cateColor, lineWidth, selectedCate){

	var svg = this.map_svg;
	
	//generate path;
	var curPath = svg.append("path")
					// .attr("class", "stripline_" + id + "_" + idx)
					.attr("id", "pathfortext"+id)
					.attr("d", lineFunc)
			    	.attr("stroke", "none")
			    	.attr("fill", "none");

	curPath = curPath[0][0];

	var step = 10;
	var segs = Math.floor(curPath.getTotalLength() / step);

	/*******************************discrete path into a series of points************************************/
	var pts = [];
	for(var i=0; i<segs; i++){
		var pos = curPath.getPointAtLength(i*step);
		pts.push([pos.x, pos.y]);
	}

	/***********************************calculate transformed polygon **************************************/
	var longestAxis = longestAxisOfPolygon(pts);
	var cosine = numeric.dot(longestAxis, [1,0]);

	var angle;
	if(longestAxis[1] <= 0)
		//clockwise
		angle = Math.acos(cosine);
	else
		//anti-clockwise
		angle = -Math.acos(cosine);

	// var rotatedPoly = rotatePolygon(pts, pts[0][0], pts[0][1], angle);
	//overwrite the previous polygon;
	pts = rotatePolygon(pts, pts[0][0], pts[0][1], angle);

	/*****************************************get bounding box************************************************/
	var aabb = PolyK.GetAABB(HullLayout.tdArrTo1dArr(pts));
	
	// var aabbVis = svg.append("rect")
	//                    .attr("x", aabb.x)
	//                    .attr("y", aabb.y)
	//                    .attr("width", aabb.width)
	//                    .attr("height", aabb.height)
	//                    .attr("fill", "green");

	var fontSize = 14;
	//the scale factor is set differently for text line vs area filling according to the experiment
	var letterW = fontSize*0.49;
	
	/***********************************************fill rect with text****************************************/

	var newLineFunc = this.createLineFunc(HullLayout.tdArrTo1dArr(pts));

	var clip = svg.append("clipPath")
					.attr("id", "textclip_"+id)
				  .append("path")
				  	.attr("d", newLineFunc)
			    	.attr("stroke", "none")
			    	.attr("fill", "none");

	/**********************************************line segments of the polygon*********************************************/
	var lineSegs = [];
	for(var i=0; i<pts.length; i++){
		lineSegs.push([pts[i], pts[(i+1)%segs]]);
	}

	//get keywords from the tree node;
	var keywords = DataCenter.instance().getTree().getNodeById(id).getKeywords(selectedCate, 10);
	var globalWordIdx = 0;

	//render individual text;
	for(var i=0; i<=Math.ceil(aabb.height/fontSize); i++){

		//dy is fixed
		var dy = i*fontSize - 0.5*fontSize;

		/********calculate intersection points of the sweep line and polygon*********/
		var interPts = [];
		lineSegs.forEach(function(val){
			var rst = intersetLines(val[0][0]-aabb.x, val[0][1]-aabb.y, val[1][0]-aabb.x, val[1][1]-aabb.y,
									0, dy, aabb.width, dy);
			if(rst != null)
				interPts.push(rst);
		});

		/****************************order intersection points by x value*********************************/
		interPts = interPts.sort(function(a,b){
									if (a[0] < b[0]) return -1;
									if (a[0] > b[0]) return 1;
								   	return 0;
								});
		/*************for simplification, we assume there are only two intersetion points, i.e., convex polygon**************/
		//skip the case when more than 2 intersection points or the intersetion length is too short
		if(interPts.length != 2 || Math.abs(interPts[0][0]-interPts[1][0]) < 2 )
			continue;

		//dx is determined by intersection
		var dx = interPts[0][0];
		var starFlag = false;

		do{
			//get word
			var word;
			if(starFlag){
				word = "*";
			}else{
				word = keywords[globalWordIdx];
				globalWordIdx = (globalWordIdx + 1)%keywords.length;
			}
			starFlag = !starFlag;

			//get color;
			var c;
			if(word == "*"){
				c = "#000";
				word = "\u00A0" + word + "\u00A0";
			}
			else{
				var tCates = Object.keys(DataCenter.instance().keywordCate[word]);
				var inter = intersect_arrays(selectedCate, tCates);
				if(inter.length > 0)
					c = cateColor[selectedCate.indexOf(inter[0])];
				else
					c = "#555";
			}

			//render text;
			var that = this;
			var textEle = svg.append("text")
								.attr("class", word == "*"?"keyword":"keyword keyword_" + word)
								.attr("x", aabb.x + dx)
								.attr("y", aabb.y + dy)
								.attr("font-size", fontSize+"px")
								.attr("font-family", "consolas")
								.attr("fill", c)
								.attr("pointer-events", word == "*"?"none":"visiblePainted")
								.attr("alignment-baseline", "middle")
								.attr("transform", "rotate(" + (-angle*180/Math.PI) + "," + pts[0][0] + "," + pts[0][1] + ")")
								.attr("clip-path", "url(#textclip_" +id+ ")")
								.text(word)
								.on("mouseover", function(){
									
									//get the keyword of this text element;
									var cls = d3.select(this).attr("class");
									var keyword = cls.split("_")[1];

									//hover the same keyword;
									that.hoverKeywords(keyword);
								});

			// dx += word.length*letterW;
			dx += textEle.node().getComputedTextLength();

		}while(dx < interPts[1][0]);
		// }while(dx < aabb.width);

	}

}

ContourVis.prototype.hoverKeywords = function(word){

	//reset if no word
	if(word == null || word == undefined || word.indexOf("*") != -1){

		d3.selectAll(".keyword")
			.style("font-weight", 'normal')
			.style("opacity", 1);
	}
	else{

		d3.selectAll(".keyword")
			.style("font-weight", function(){
				var cls = d3.select(this).attr("class");
				var keyword = cls.split("_")[1];
				if(keyword == word)
					return 'bolder';
				else
					return 'normal';
			})
			.style("opacity", function(){
				var cls = d3.select(this).attr("class");
				var keyword = cls.split("_")[1];
				if(keyword == word)
					return 1;
				else
					return 0.3;
			});
	}

};

// the difference between hullInViewport(O) and hullOverlapViewport(V) is:
// O require that part of the poly should be inside the viewport
// V require that the poly should overlap with the viewport rectangle
// O's requirement is stronger
//return value [0]: is valid or not; [1]: hull coords: [2]:whether force extended;
ContourVis.hullInViewport = function(hull){

	//no points;
	if(hull.length <= 0)
		return [false, hull, false];
	
	//one or two points not draw for now;
	if(hull.length < 6)
		return [false, hull, true];
		//return [true, ContourVis.extendHull(hull), true];

	//too small not draw for now;
	var aabb = PolyK.GetAABB(hull);
	if(aabb.width < 10 || aabb.height < 10 )
		return [false, hull, true];
		//return [true, ContourVis.extendHull(hull), true];

	//area too small not draw for now;
	var area = PolyK.GetArea(hull);
	if( Math.abs(area) <= 100 )
		return [false, hull, true];
		//return [true, ContourVis.extendHull(hull), true];

	//check vertices in the viewport
	for(var i=0; i<hull.length/2; i++){

		var x = hull[2*i];
		var y = hull[2*i+1];
		if( (x > 0 && x < ContourVis.DIMENSION) && (y > 0 && y < ContourVis.DIMENSION) ){

			if(hull.length < 8)
				console.log(hull.length);
			return [true, hull, false];
		}
	}

	return [false, hull, false];
};

// enlarge the area of hull if it is too small;
ContourVis.extendHull = function(hull){

	var xs = [], ys = [];
	for(var i=0; i<hull.length/2; i++){
		xs.push(hull[2*i]);
		ys.push(hull[2*i+1]);
	}
	xs = arrAvg(xs);
	ys = arrAvg(ys);

	var r = 5;

	return [ xs+r, ys+r, xs+r, ys-r, xs-r, ys-r, xs-r, ys+r ];

};

ContourVis.hullOverlapViewport = function(hull, flagForMinOlp){

	//not valid hull
	if(hull.length < 6)
		return false;

	//too small
	var aabb = PolyK.GetAABB(hull);
	if(aabb.width < 10 || aabb.height < 10 )
		return false;

	//area two small
	var area = PolyK.GetArea(hull);
	if( Math.abs(area) <= 100 )
		return false;

	//check overlapping [dirty codes, need improvement later;]
	var s = ContourVis.DIMENSION;
	var viewports = [0,0,0,s,s,0,s,s];

	for(var i=0; i<viewports.length/2; i++){

		var x = viewports[2*i];
		var y = viewports[2*i+1];
		
		if(PolyK.ContainsPoint(hull,x,y))
			return true;
	}

	for(var i=0; i<hull.length/2; i++){

		var x = hull[2*i];
		var y = hull[2*i+1];
		if( (x > 0 && x < ContourVis.DIMENSION) && (y > 0 && y < ContourVis.DIMENSION) )
			return true && flagForMinOlp;
	}

	return false;
};

//if not valid, return [];
ContourVis.getPixelCoords = function(ids){

	// get hull using js function. input: poly.
	// if(poly.length < 3)
	// 	return [];

	// // 1->concave; Infinity->convex.
	// var poly = hull(poly, 100);
	// return ContourVis.smoothPoly(poly);

	// get hull from json file;
	var tweets = DataCenter.instance().getTweets();
	var pts = [];
	ids.forEach(function(id){
		var pt = Canvas_manager.instance().geo_p_to_pixel_p({x:tweets[id].lon, y:tweets[id].lat});	
		pts.push(pt.x);
		pts.push(pt.y)
	});

	if(pts.length > 2)
		pts = pts.slice(0, pts.length-2);
	
	return pts;
};

// not called in the current version
// ContourVis.smoothPoly = function(poly){

// 	if(poly.length <= 0)
// 		return [];

// 	//relax poly --> if two adjacent points are near each other, remove them;
// 	var len = poly.length;
// 	var i = 1;
// 	var thres = 10;

// 	while(i<len){

// 		var p0 = poly[i-1];
// 		var p1 = poly[i];

// 		//remove points;
// 		if( Math.abs(p0[0]-p1[0])<=thres && Math.abs(p0[1]-p1[1])<=thres ){
// 			poly.splice(i,1);
// 			len--;
// 		}
// 		else{
// 			i++;
// 		}
// 	}

// 	//remove the last point, since it is the same as the first point;
// 	if(poly.length > 0)
// 		poly.splice(poly.length-1, 1);

// 	return poly;
// };


/*********************************************context menu**************************************************/

ContourVis.prototype.get_menu = function(id){

	var that = this;

	var menu = [
		{
			title: 'Show Dots',
			action: function() {

				var ids = [];
				DataCenter.instance().getTree().getNodeById(id).cluster['ids'].forEach(function(idlist){
	    			ids = ids.concat(idlist);
	    		});

	    		var tweets = DataCenter.instance().getTweetsByIds(ids);
	    		
	    		$('[ng-controller="map_controller"]').scope().render_dots(tweets, "red");
			}
		},
		{
			title: 'Clear Dots',
			action: function() {
				$('[ng-controller="map_controller"]').scope().clear_dots();
			}
		},
		{
			title: 'Show Messages',
			action: function() {
				$('[ng-controller="table_controller"]').scope().displayMsgByClusterId(id);
			}
		},
		{
			title: 'null',
			action: function() {
			}
		},
		{
			title: 'Cancel',
			action: function() {
			}
		}
	];

	return menu;

};





/******************  parameter setup  **********************/
ContourVis.tension = 0.7;
ContourVis.INTERMODE = { BASIS:0, CARDINAL:1, POLY:2 };
ContourVis.MODE = ContourVis.INTERMODE.BASIS;
ContourVis.DIMENSION = 1024;

ContourVis.CONTOURMODE = { BOUND:0, FILLSINGLE:1, FILLSEQUENTIAL:2, DIVERGENT:3 };
ContourVis.CONTOUR = ContourVis.CONTOURMODE.DIVERGENT;

ContourVis.OUTLINEMODE = { DEFAULT:0, STRIP:1, CIRCLE:2, TEXT:3, TEXT_FILL:4 }
ContourVis.OUTLINE = ContourVis.OUTLINEMODE.DEFAULT;
ContourVis.enableHalo = true;

/******************  parameter setup  **********************/
ContourVis.prototype.createDummyLine = function(pts){

	pts = HullLayout.odArrTo2dArr(pts);

	// lineFunction = d3.svg.line()
	// 					.x(function(d) { return d[0]; })
	// 		            .y(function(d) { return d[1]; })
	// 		            .interpolate("linear-closed");

	var lineFunction = null;


	lineFunction = d3.svg.line()
				.x(function(d) { return d[0]; })
                .y(function(d) { return d[1]; })
                .interpolate("linear-closed");
	
	// if(ContourVis.MODE == ContourVis.INTERMODE.BASIS){
	// 	lineFunction = d3.svg.line()
	// 					.x(function(d) { return d[0]; })
 //                        .y(function(d) { return d[1]; })
 //                        .interpolate("basis-closed");
	// } else {
	// 	lineFunction = d3.svg.line()
	// 					.x(function(d) { return d[0]; })
 //                        .y(function(d) { return d[1]; })
 //                        .interpolate("cardinal-closed")
 //                        .tension(ContourVis.tension);
	// }

	return lineFunction;

};

ContourVis.prototype.createDummyPath = function(pts){

	pts = HullLayout.odArrTo2dArr(pts);

	var that = this;
	var svg = this.map_svg;

	var lineFunction = this.createDummyLine(pts);

    var hull = svg.append("path")
			    	.attr("class", "dummyPath")
			    	.attr("d", lineFunction(pts))
			    	.attr("stroke", "#FFF")
			    	.attr("opacity", 0);
	return hull;

};

ContourVis.inViewPort = function(x,y){

	if( 0 <= x && x <= ContourVis.DIMENSION && 0 <= y && y <= ContourVis.DIMENSION )
		return true;
	return false;
}