Geometry = function(){};

//this version can also return the intersection point;
//http://jsfiddle.net/justin_c_rounds/Gd2S2/
function checkLineIntersection(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
    var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        onLine1: false,
        onLine2: false
    };
    denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
    if (denominator == 0) {
        return result;
    }
    a = line1StartY - line2StartY;
    b = line1StartX - line2StartX;
    numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
    numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1StartX + (a * (line1EndX - line1StartX));
    result.y = line1StartY + (a * (line1EndY - line1StartY));
/*
        // it is worth noting that this should be the same as:
        x = line2StartX + (b * (line2EndX - line2StartX));
        y = line2StartX + (b * (line2EndY - line2StartY));
        */
    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a >= 0 && a <= 1) {
        result.onLine1 = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b >= 0 && b <= 1) {
        result.onLine2 = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    return result;
};

//this version also check if the point intersets or not;
//adapt code from http://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/
// Geometry.interset = function(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y){

// 	// Find the four orientations needed for general and
//     // special cases
//     var o1 = Geometry.orientation(p1x, p1y, q1x, q1y, p2x, p2y);
//     var o2 = Geometry.orientation(p1x, p1y, q1x, q1y, q2x, q2y);
//     var o3 = Geometry.orientation(p2x, p2y, q2x, q2y, p1x, p1y);
//     var o4 = Geometry.orientation(p2x, p2y, q2x, q2y, q1x, q1y);
 
//     // General case
//     if (o1 != o2 && o3 != o4)
//         return true;
 
//     // Special Cases
//     // p1, q1 and p2 are colinear and p2 lies on segment p1q1
//     if (o1 == 0 && Geometry.onSegment(p1x, p1y, p2x, p2y, q1x, q1y)) return true;
 
//     // p1, q1 and p2 are colinear and q2 lies on segment p1q1
//     if (o2 == 0 && Geometry.onSegment(p1x, p1y, q2x, q2y, q1x, q1y)) return true;
 
//     // p2, q2 and p1 are colinear and p1 lies on segment p2q2
//     if (o3 == 0 && Geometry.onSegment(p2x, p2y, p1x, p1y, q2x, q2y)) return true;
 
//      // p2, q2 and q1 are colinear and q1 lies on segment p2q2
//     if (o4 == 0 && Geometry.onSegment(p2x, p2y, q1x, q1y, q2x, q2y)) return true;
 
//     return false; // Doesn't fall in any of the above cases

// };

// // Given three colinear points p, q, r, the function checks if
// // point q lies on line segment 'pr'
// Geometry.onSegment = function(px, py, qx, qy, rx, ry){
//     if (qx <= Math.max(px, rx) && qx >= Math.min(px, rx) &&
//         qy <= Math.max(py, ry) && qy >= Math.min(py, ry))
//        return true;
 
//     return false;
// };

// Geometry.orientation = function(px, py, qx, qy, rx, ry){
//     // See http://www.geeksforgeeks.org/orientation-3-ordered-points/
//     // for details of below formula.
//     var val = (qy - py) * (rx - qx) -
//               (qx - px) * (ry - qy);
 
//     if (val == 0) return 0;  // colinear
 
//     return (val > 0)? 1: 2; // clock or counterclock wise
// };