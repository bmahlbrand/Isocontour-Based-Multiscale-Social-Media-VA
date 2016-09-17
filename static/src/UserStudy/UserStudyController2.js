UserStudyController2 = function(){

};

UserStudyController2.prototype.genMapCenter = function(){
	var region = us_regions[Math.floor(Math.random()*us_regions.length)];
	var lon = (region.maxlon - region.minlon)*Math.random() + region.minlon;
	var lat = (region.maxlat - region.minlat)*Math.random() + region.minlat;
	
	var lon = (region.maxlon + region.minlon)*0.5;
	var lat = (region.maxlat + region.minlat)*0.5;

	return [lon, lat];

};

UserStudyController2.prototype.genZoom = function(){
	return Math.floor(Math.random()*5+8);
};


var globalIndex = 0;

UserStudyController2.prototype.us2Generator = function(){

	var type = [ContourVis.OUTLINEMODE.STRIP, ContourVis.OUTLINEMODE.DASH, ContourVis.OUTLINEMODE.STACKLINE];
	var difficulty = [UserStudyController2.DIFFMODE.EASY, UserStudyController2.DIFFMODE.HARD, UserStudyController2.DIFFMODE.HARD];
	var numOfCate = [2,4];
	UserStudyController2.numOfCluster = 2;

	var instances = [];
	for(var i=0;i<type.length; i++)
		for(var j=0;j<difficulty.length; j++)
			for(var k=0;k<numOfCate.length; k++){

				var t = type[i];
				var d = difficulty[j];
				var n = numOfCate[k];
				instances.push([t,d,n]);
			}

	var that = this;
	//set time out;
	setInterval(function(){

		ContourVis.OUTLINE = instances[globalIndex][0];
		UserStudyController2.numOfCate = instances[globalIndex][2];
		UserStudyController2.difficulty = instances[globalIndex][1];

		console.log("instance "+globalIndex+" : "
						+"; numOfCate "+UserStudyController2.numOfCate
						+"; numOfCluster "+UserStudyController2.numOfCluster
						+"; OUTLINE "+ContourVis.OUTLINE
						+"; difficulty "+UserStudyController2.difficulty);

		that.getStudy2Image(UserStudyController2.numOfCate,
							UserStudyController2.numOfCluster,
							UserStudyController2.difficulty);

		globalIndex++;

	}, 5000);

}


//difficulty is only for two clusters;
UserStudyController2.prototype.getStudy2ImageWrapper = function(){

	this.getStudy2Image();

};

UserStudyController2.prototype.getStudy2Image = function(){

	var question = "";
	var answer = "";

	//ContourVis.CONTOUR = ContourVis.CONTOURMODE.BOUND;
	//ContourVis.CONTOUR = ContourVis.CONTOURMODE.FILLSEQUENTIAL;
	ContourVis.CONTOUR = ContourVis.CONTOURMODE.DIVERGENT;
	//ContourVis.CONTOUR = ContourVis.CONTOURMODE.QUANT;

	var map = $('[ng-controller="map_controller"]').scope().getMap();
	var center = this.genMapCenter();
	var zoom = this.genZoom();
	map.moveTo(center[0], center[1], zoom);
	OlMapView.zoomLevel = zoom;

	// var tree = [[[],[]],[],[]];
	// var tree = [[[[]],[]],[[]],[[],[]]];
	// var tree = [[[],[]],[[],[]],[[]]];
	UserStudyController2.tree = [
									[
										[
											[
												[
													[
													[]
												],
												[
													[
														[
															[],[]
														],
														[
															[]
														]
													],
													[
														[
															[],[]
														],
														[
															[]
														]
													]
												],
												[
													[]
												],
												[]


												],
												[],
												[],
												[]
											],
											[
												[],[]
											],
											[
												[]
											],
											[]
										],
										[
											[
												[],[]
											],
											[
												[],[],[]
											],
											[]
										],
										[
											[]
										],
										[
											[],
											[]
										],
										[
											[
												[
													[
														[
															[
																[],[]
															],
															[
																[]
															]
														]


													],[]
												],
												[
													[],[]
												],
												[
													[]
												],
												[]
											]
										],
										[],
										[]
									],
									[
										[
											[
												[
													[
													[]
												],
												[
													[],[]
												],
												[
													[]
												],
												[]


												],
												[],
												[],
												[]
											],
											[
												[],[]
											],
											[
												[]
											],
											[]
										],
										[
											[
												[

													[
														[
															[
																[
																	[],[]
																],
																[
																	[]
																]
															]
														],
														[
															[]
														]
													]


												]
											],
											[
												[]
											],
											[]
										],
										[
											[]
										],
										[
											[],
											[]
										],
										[
											[
												[
													[],[]
												],
												[
													[],[]
												],
												[
													[]
												],
												[]
											]
										],
										[],
										[]
									]
								];

	UserStudyController2.vol = getNumOfChildren(UserStudyController2.tree) + 1;

	var totalDepth = getDepth(UserStudyController2.tree);
	alert("number of depth:" + totalDepth);

	profile.zoom = zoom;
	profile.startLevel = 0;
	profile.endLevel = totalDepth - 1;

	DataCenter.instance().reInit1(zoom +"_0", UserStudyController2.tree, totalDepth, zoom);

	$('[ng-controller="app_controller"]').scope().masterUpdate();

	//setTimeout(function(){ UserStudyController2.downloadImg(answer); }, 3000);

};

UserStudyController2.cateDiffForOne = function(cates, difficulty){

	var values = Object.keys(cates).map(function(key){return cates[key]});
	values.sort(function(a,b){ return b-a; });

	var diff = Math.abs(values[1]/values[0]);

	if(difficulty == UserStudyController2.DIFFMODE.EASY && diff >= 5/6 )
		return null;

	if(difficulty == UserStudyController2.DIFFMODE.HARD && diff < 5/6 )
		return null;

	for(var key in cates)
		if(cates[key] == values[0]){
			console.log("answer:"+key);
			return key;
		}

};

UserStudyController2.cateDiffForTwo = function(cate1, cate2, numOfCate, difficulty){

	var sum1 = Object.keys(cate1).map(function(key){return cate1[key]}).reduce(function(a,b){ return a+b; });
	var sum2 = Object.keys(cate2).map(function(key){return cate2[key]}).reduce(function(a,b){ return a+b; });

	var diff = {};
	var larger = {};
	for(var i=0;i<numOfCate;i++){

		por1 = cate1["c"+i] / sum1;
		por2 = cate2["c"+i] / sum2;

		diff["c"+i] = Math.abs(por1-por2);
		larger["c"+i] = por1 > por2 ? "A" : "B";
	}

	if(difficulty == UserStudyController2.DIFFMODE.EASY){
		for(var cate in diff){
			if(diff[cate] >= 0.1 && diff[cate] <= 0.3){
				return [cate, larger[cate]];
			}
		}
	}
	if(difficulty == UserStudyController2.DIFFMODE.HARD){
		for(var cate in diff){
			if(diff[cate] <= 0.09 && diff[cate] >= 0.02){

				return [cate, larger[cate]];
			}
		}
	}

	return null;

}

UserStudyController2.downloadImgWrapper = function(){

	var idx = 0;
	var interval;

	var type = [ContourVis.CONTOURMODE.BOUND,
				ContourVis.CONTOURMODE.FILLSEQUENTIAL,
				ContourVis.CONTOURMODE.DIVERGENT,
				ContourVis.CONTOURMODE.QUANT];

	interval = setInterval(function(){

		ContourVis.CONTOUR = type[idx++];
		$('[ng-controller="app_controller"]').scope().masterUpdate();

		setTimeout(function(){ UserStudyController2.downloadImg(); }, 2000);

		if(idx >= 4)
			clearInterval(interval);
	}, 4000);


}

UserStudyController2.downloadImg = function(){

	var type = "";
	if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.BOUND)
		type = "nul";
	if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.FILLSEQUENTIAL)
		type = "seq";
	if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.DIVERGENT)
		type = "div";
	if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.QUANT)
		type = "qua";

	var element = $("#mapView"); // global variable
	var getCanvas; // global variable
 
    html2canvas(element, {
	    onrendered: function (canvas) {
	    	
	    	getCanvas = canvas;

	    	var imgageData = getCanvas.toDataURL("image/png");
		    // Now browser starts downloading it instead of just showing it
		    var newData = imgageData.replace(/^data:image\/png/, "data:application/octet-stream");
		    $("#btn-Convert-Html2Image").attr("download", "your_pic_name.png").attr("href", newData);

		    var doc = document.createElement('a');
			doc.setAttribute('href', newData);
			doc.setAttribute('download', 'us1_' + type +"_" + getTime() + '.png');
			doc.click();

        }
    });


};


Helper = function(){
	this.polyCoords = [];
};

Helper.prototype.addCoords = function(poly){
	this.polyCoords.push(poly);
};

var helper = new Helper();

UserStudyController2.cate2 = [{"c0":8, "c1":2},
							{"c0":7, "c1":3},
							{"c0":5, "c1":6},
							{"c0":5, "c1":4},
							{"c0":8, "c1":9},
							{"c0":9, "c1":10},
							{"c0":9, "c1":6},
							{"c0":3, "c1":6},
							{"c0":4, "c1":7},
							{"c0":6, "c1":7},
							];


UserStudyController2.cate4 = [{"c0":2, "c1":4, "c2":6,"c3":8},
							{"c0":5, "c1":5, "c2":1,"c3":8},
							{"c0":5, "c1":6, "c2":7,"c3":4},
							{"c0":4, "c1":4, "c2":7,"c3":1},
							{"c0":6, "c1":4, "c2":5,"c3":3},
							{"c0":7, "c1":8, "c2":6,"c3":5},
							{"c0":6, "c1":8, "c2":9,"c3":7},
							];


UserStudyController2.difficulty = null;
UserStudyController2.DIFFMODE = {EASY:0, HARD:1};

UserStudyController2.getCateDist = function(cate){

	var arr = cate == 2 ? UserStudyController2.cate2 : UserStudyController2.cate4;

	var engine = Random.engines.mt19937().autoSeed();
	var distribution = Random.integer(0, arr.length-1);
	function generateNaturalLessThanCates(){
  		return distribution(engine);
	}

	generateNaturalLessThanCates();
	generateNaturalLessThanCates();

	var rst = arr[generateNaturalLessThanCates()];
	return rst;
}

UserStudyController.downloadImg = function(answer){

	var type = "";
	if(ContourVis.OUTLINE == ContourVis.OUTLINEMODE.STRIP)
		type = "strip";
	if(ContourVis.OUTLINE == ContourVis.OUTLINEMODE.DASH)
		type = "dash";
	if(ContourVis.OUTLINE == ContourVis.OUTLINEMODE.STACKLINE)
		type = "stack";


	var element = $("#mapView"); // global variable
	var getCanvas; // global variable
 
    html2canvas(element, {
	    onrendered: function (canvas) {
	    	
	    	getCanvas = canvas;

	    	var imgageData = getCanvas.toDataURL("image/png");
		    // Now browser starts downloading it instead of just showing it
		    var newData = imgageData.replace(/^data:image\/png/, "data:application/octet-stream");
		    $("#btn-Convert-Html2Image").attr("download", "your_pic_name.png").attr("href", newData);

		    var doc = document.createElement('a');
			doc.setAttribute('href', newData);
			doc.setAttribute('download', 'us2_' + globalIndex + "_" + answer + "_" + type +"_" + difficulty + "_" + UserStudyController.numOfCate + "_" + UserStudyController.numOfCluster + '.png');
			doc.click();

        }
    });


};

function getTime() {
	var date = new Date();
	thedate = date.getUTCFullYear() + "/" + date.getUTCMonth() + 1 + "/" + date.getUTCDate() + "_" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

	return thedate;
}

UserStudyController2.numOfCate = -1;


// var userStudyController = new UserStudyController2();
var userStudyController = null;