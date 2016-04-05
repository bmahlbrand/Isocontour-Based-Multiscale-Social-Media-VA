Vector2 = function(x, y) { 

	if( x === undefined || y === undefined ){
          this.x = 0; this.y = 0; 
    }else{
    	this.x = x; this.y = y; 
    }

};

Vector2.prototype = {
	set: function(x,y){ this.x = x; this.y = y},
    length : function() { return Math.sqrt(this.x * this.x + this.y * this.y); },
    sqrLength : function() { return this.x * this.x + this.y * this.y; },
    normalize : function() { var inv = 1/this.length(); this.x *= inv; this.y *= inv; },
    normalizePara : function(length) { var inv = Math.sqrt(this.x*this.x+this.y*this.y)/length; if(inv != 0 ) {this.x /= inv; this.y /= inv;} },
    negate : function() { this.x = -this.x; this.y = -this.y; },
    scale: function(scale) { this.x *= scale; this.y *= scale; return this},
    setVect : function(v) { this.x = v.x; this.y = v.y; },
    set : function(x,y) {this.x = x; this.y = y; },
    add : function(v) { this.x += v.x; this.y += v.y; },
	sub : function(v) { this.x -= v.x; this.y -= v.y; },
    multiply : function(f) { this.x *= f, this.y *= f; },
    rotateLeft : function() { var tmpx = this.x ; var tmpy = this.y ; this.x = 0.707*tmpx + 0.707*tmpy ; this.y = 0.707*tmpx - 0.707*tmpy ;},
    rotateRight : function() { var tmpx = this.x ; var tmpy = this.y ; this.x = 0.707*tmpx - 0.707*tmpy ; this.y = 0.707*tmpx + 0.707*tmpy ;},
    get_x : function() {return this.x; },
    get_y : function() {return this.y; }, 
    divide : function(f) { var invf = 1/f; this.x *= invf; this.y *= invf; },
    dot : function(v) { return this.x * v.x + this.y * v.y; },
    toString: function() { return this.x+","+this.y; },
    toString_reverse: function() { return this.y+","+this.x; },
    dist: function(v) { var tx = v.x - this.x ; var ty = v.y - this.y ; return Math.sqrt(tx * tx + ty * ty)  },
    abs: function(){ this.x = Math.abs(this.x); this.y = Math.abs(this.y); }
};

BBox = function(cx, cy, ex, ey){
	if( cx === undefined || cy === undefined || ex === undefined || ey === undefined ){
		this.center = new Vector2();
		this.extents = new Vector2(); 
    }else{
    	this.center = new Vector2(cx, cy);
		this.extents = new Vector2(ex, ey);
    }
};

BBox.prototype = {
	set: function(center,extents) { this.center = center; this.extents = extents; this.force_set_extents(); },
	setSep: function(cx,cy,ex,ey) { this.center.x = cx; this.center.y = cy; this.extents.x = ex; this.extents.y = ey; this.force_set_extents(); },
	setCenter: function(cx,cy) { this.center.x = cx; this.center.y = cy;},
	setExtents: function(ex,ey){ 
		this.extents.x = ex; 
		this.extents.y = ey; 
		//this.force_set_extents(); 
	},

	//extents cannot be zero
	force_set_extents: function(){
		var zero = 0.000000001;
		if(this.extents.x <= zero)
			this.extents.x = zero;
		if(this.extents.y <= zero)
			this.extents.y = zero;
	},

	get_center: function(){
		return this.center;
	},
	get_extent: function(){
		return this.extents;
	},

	set_by_minmax: function(x1, x2, y1, y2) {

		var cx = (x1 + x2)*0.5;
		var cy = (y1 + y2)*0.5;
		var ex = Math.abs(x1 - x2)*0.5;
		var ey = Math.abs(y1 - y2)*0.5;
		this.setSep(cx,cy,ex,ey);
	},

	setBox: function(bbox) {
		this.center = new Vector2(bbox.center.x, bbox.center.y);
		this.extents = new Vector2(bbox.extents.x, bbox.extents.y);
	},
	intersects: function(box) {
		var retVar = false;
		tmpVect = new Vector2();
		tmpVect.setVect(box.center);
		tmpVect.sub(this.center);
		retVar = ( Math.abs( tmpVect.x ) <= ( this.extents.x + box.extents.x ) ) && ( Math.abs( tmpVect.y ) <= ( this.extents.y + box.extents.y ) );
		return retVar;
	},
	
	intersects_by_circle: function(box) {

		tmpVect = new Vector2();
		tmpVect.setVect(box.center);
		tmpVect.sub(this.center);
		return tmpVect.length() < box.get_radius() + this.get_radius();
	},

	contains: function(point){
		var retVar = false;

		tmpVect = new Vector2();
		tmpVect.setVect(point);
		tmpVect.sub(this.center);
		tmpVect.x = Math.abs( tmpVect.x );
		tmpVect.y = Math.abs( tmpVect.y );
		if( tmpVect.x < this.extents.x && tmpVect.y < this.extents.y ) {
			retVar = true;
		}
		return retVar;
	},
	contains: function(x,y){
		var retVar = false;

		tmpVect = new Vector2();
		tmpVect.set(x,y);
		tmpVect.sub(this.center);
		tmpVect.x = Math.abs( tmpVect.x );
		tmpVect.y = Math.abs( tmpVect.y );
		if( tmpVect.x < this.extents.x && tmpVect.y < this.extents.y ) {
			retVar = true;
		}
		return retVar;
	},
	contains_in_circle: function(point, pixel_tolerance){
		
		tmpVect = new Vector2();
		tmpVect.setVect(point);
		tmpVect.sub(this.center);

		return tmpVect.length() + pixel_tolerance < this.get_radius();

	},
	toString: function(){
		var output = "box[ Center" + this.center.toString() + ", Extents" + this.extents.toString() + " ]";
		return output;
	},

	to_plain_string: function(){
		return (this.center.x-this.extents.x)+" "+(this.center.x+this.extents.x)+" "+(this.center.y-this.extents.y)+" "+(this.center.y+this.extents.y);
	},

	get_radius: function(){
		return Math.max(this.extents.x, this.extents.y);
	},

	get_points: function(){
		var rst = [];
		rst.push([this.center.x-this.extents.x, this.center.y-this.extents.y]);
		rst.push([this.center.x-this.extents.x, this.center.y+this.extents.y]);
		rst.push([this.center.x+this.extents.x, this.center.y+this.extents.y]);
		rst.push([this.center.x+this.extents.x, this.center.y-this.extents.y]);
		return rst;
	},

	getLeft: function(){
		return this.center.x - this.extents.x;
	},

	getTop: function(){
		return this.center.y - this.extents.y;
	},
	getBottom: function(){
		return this.center.y + this.extents.y;
	},

	getWidth: function(){
		return this.extents.x*2;
	},
	getHeight: function(){
		return this.extents.y*2;
	}
};