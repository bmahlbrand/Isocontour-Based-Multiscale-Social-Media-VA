//wrapper function; spacing: positive enlarge, negative. shrink;

/*********************************************************************************************************/
/*********************************************************************************************************/
/*********************************************************************************************************/
/*********************************************************************************************************/
//stable function adapted from https://cdnjs.cloudflare.com/ajax/libs/jsts/1.2.1/jsts.min.js;
function inflatePolyWrapper(poly1d, spacing){

    var poly = HullLayout.odArrTo2dArr(poly1d);
    var poly = poly.map(function(val){ return {x:val[0], y:val[1]}; });
    poly = inflatePolygon(poly, spacing);
    poly = poly.map(function(val){ return [val.x, val.y]});
    return HullLayout.tdArrTo1dArr(poly);

}

function inflatePolygon(poly, spacing)
{
  var geoInput = vectorCoordinates2JTS(poly);
  geoInput.push(geoInput[0]);

  var geometryFactory = new jsts.geom.GeometryFactory();

  var shell = geometryFactory.createPolygon(geoInput);
  var polygon = shell.buffer(spacing, jsts.operation.buffer.BufferParameters.CAP_FLAT);

  var inflatedCoordinates = [];
  var oCoordinates;
  oCoordinates = polygon.shell.points.coordinates;
  for (i = 0; i < oCoordinates.length; i++) {
    var oItem;
    oItem = oCoordinates[i];
    // inflatedCoordinates.push(new Vector2(Math.ceil(oItem.x), Math.ceil(oItem.y)));
    inflatedCoordinates.push({x:Math.ceil(oItem.x), y:Math.ceil(oItem.y)});
  }
  return inflatedCoordinates;
}

function vectorCoordinates2JTS (polygon) {
  var coordinates = [];

  for (var i = 0; i < polygon.length; i++) {
    coordinates.push(new jsts.geom.Coordinate(polygon[i].x, polygon[i].y));
  }
  return coordinates;
}

/*********************************************************************************************************/
/*********************************************************************************************************/
/*********************************************************************************************************/
/*********************************************************************************************************/

function enlargePolygon1D(poly1d, spacing){

    var poly = HullLayout.odArrTo2dArr(poly1d);
    var poly = poly.map(function(val){ return {x:val[0], y:val[1]}; });
    poly = straight_skeleton(poly, spacing);
    poly = poly.map(function(val){ return [val.x, val.y]});
    return HullLayout.tdArrTo1dArr(poly);
}

function enlargePolygon(poly, spacing){

    var poly = poly.map(function(val){ return {x:val[0], y:val[1]}; });
    poly = straight_skeleton(poly, spacing);
    return poly.map(function(val){ return [val.x, val.y]});
}


function straight_skeleton(poly, spacing)
{
	// http://stackoverflow.com/a/11970006/796832
	// Accompanying Fiddle: http://jsfiddle.net/vqKvM/35/

	var resulting_path = [];
	var N = poly.length;
	var mi, mi1, li, li1, ri, ri1, si, si1, Xi1, Yi1;
	for(var i = 0; i < N; i++)
	{
		mi = (poly[(i+1) % N].y - poly[i].y)/(poly[(i+1) % N].x - poly[i].x);
        mi1 = (poly[(i+2) % N].y - poly[(i+1) % N].y)/(poly[(i+2) % N].x - poly[(i+1) % N].x);
        li = Math.sqrt((poly[(i+1) % N].x - poly[i].x)*(poly[(i+1) % N].x - poly[i].x)+(poly[(i+1) % N].y - poly[i].y)*(poly[(i+1) % N].y - poly[i].y));
        li1 = Math.sqrt((poly[(i+2) % N].x - poly[(i+1) % N].x)*(poly[(i+2) % N].x - poly[(i+1) % N].x)+(poly[(i+2) % N].y - poly[(i+1) % N].y)*(poly[(i+2) % N].y - poly[(i+1) % N].y));
        ri = poly[i].x+spacing*(poly[(i+1) % N].y - poly[i].y)/li;
        ri1 = poly[(i+1) % N].x+spacing*(poly[(i+2) % N].y - poly[(i+1) % N].y)/li1;
        si = poly[i].y-spacing*(poly[(i+1) % N].x - poly[i].x)/li;
        si1 = poly[(i+1) % N].y-spacing*(poly[(i+2) % N].x - poly[(i+1) % N].x)/li1;
        Xi1 = (mi1*ri1-mi*ri+si-si1)/(mi1-mi);
        Yi1 = (mi*mi1*(ri1-ri)+mi1*si-mi*si1)/(mi1-mi);
        // Correction for vertical lines
        if(poly[(i+1) % N].x - poly[i % N].x==0)
        {
            Xi1 = poly[(i+1) % N].x + spacing*(poly[(i+1) % N].y - poly[i % N].y)/Math.abs(poly[(i+1) % N].y - poly[i % N].y);
            Yi1 = mi1*Xi1 - mi1*ri1 + si1;
        }
        if(poly[(i+2) % N].x - poly[(i+1) % N].x==0 )
        {
            Xi1 = poly[(i+2) % N].x + spacing*(poly[(i+2) % N].y - poly[(i+1) % N].y)/Math.abs(poly[(i+2) % N].y - poly[(i+1) % N].y);
            Yi1 = mi*Xi1 - mi*ri + si;
        }
        
        //console.log("mi:", mi, "mi1:", mi1, "li:", li, "li1:", li1);
        //console.log("ri:", ri, "ri1:", ri1, "si:", si, "si1:", si1, "Xi1:", Xi1, "Yi1:", Yi1);
        
		resulting_path.push({
            x: Xi1,
            y: Yi1
        });
	}

	return resulting_path;
}