// var case_study = [
// 				//purdue shooting;
// 				{
// 				//-90.2519886509532 -82.21935229143006 36.62551026359655 42.797662119712825
// 				//purdue:
// 				//40.544227, -87.064214, 40.357167, -86.744237
// 					// min_x: -90.251,
// 					// max_x: -82.219,
// 					// min_y: 36.625,
// 					// max_y: 42.797,
// 					min_x: -87.03,
// 					max_x: -86.77,
// 					min_y: 40.38,
// 					max_y: 40.48,
// 					start_time: "2014-01-21T12:00:00Z",
// 					end_time: "2014-01-22T12:00:00Z",
// 					zoom: 12,
// 					time_offset:5
// 				},
// 				//boston bombing;
// 				{
// 				//-71.17906821476228 -70.94563118709418 42.27683502184295 42.44931906979257
// 					min_x: -71.179,
// 					max_x: -70.945,
// 					min_y: 42.276,
// 					max_y: 42.449,
// 					start_time: "2013-04-15T15:00:00Z",
// 					end_time: "2013-04-16T16:00:00Z",
// 					zoom: 10,
// 					time_offset:4,
// 					startLevel:0,
// 					endLevel:6
// 				},
// 				//hurricane sandy;
// 				{
// 				//-74.50433987903104 -73.52413759899315 40.36069307339776 41.10344727457124
// 					min_x: -74.504,
// 					max_x: -73.524,
// 					min_y: 40.360,
// 					max_y: 41.103,
// 					start_time: "2012-10-28T00:00:00Z",
// 					end_time: "2012-11-01T00:00:00Z",
// 					zoom: 10,
// 					time_offset:5
// 				},
// 				//purdue football;
// 				{
// 				//-74.50433987903104 -73.52413759899315 40.36069307339776 41.10344727457124
// 					min_x: -87.0642,
// 					max_x: -86.744,
// 					min_y: 40.35,
// 					max_y: 40.544,
// 					start_time: "2015-09-01T00:00:00Z",
// 					end_time: "2015-10-01T00:00:00Z",
// 					zoom: 12,
// 					time_offset:5
// 				},
// 				//keene;
// 				{
// 				//-74.50433987903104 -73.52413759899315 40.36069307339776 41.10344727457124
// 					min_x: -72.414831,
// 					max_x: -72.202883,
// 					min_y: 42.881841,
// 					max_y: 43.014614,
// 					start_time: "2014-10-18T19:00:00Z",
// 					end_time: "2014-10-19T09:30:00Z",
// 					zoom: 12,
// 					time_offset:5
// 				}
// ];

// var default_case = 1;

//var ip_address = "128.46.137.79:9006";

var dir = 'data/'
var globalName = 'boston';
var tweetDataFile = dir + globalName + "/" + globalName +".json";

var clusterTreeFile = dir + globalName + "/" + globalName +"_clustertree.json";
var profileFile = dir + globalName + "/" + globalName +"_profile.json";
var cateCluster = dir + globalName + "/" + globalName +"_catecluster.json";

var profile;

//load profile;
$.ajax({
	method: "GET",
	dataType: "json",
	url: profileFile,
	headers : { 'Content-Type': 'application/json' },
	async: false
})
.done(function( msg ) {
	profile = msg;
});

var treeRootId = profile.zoom + "_0";
