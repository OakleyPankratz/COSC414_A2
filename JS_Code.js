var circleRes = 30;
var fieldRadius = 0.65;
var maxInitBacRadius = 0.07;
var minInitBacRadius = 0.02;
var growthRate = 0.1;

var VSHADER_SOURCE = 
'attribute vec4 a_Position;\n' +
'attribute vec4 a_Color;\n' +
'varying vec4 v_Color;\n' +
'uniform float u_SizeChange;\n' +       //Will probably delete the use of a unifrom float in change of a uniform Mat 4 to expand the coloured circles radially outward.
'void main() {\n' +
'   gl_Position.x = u_SizeChange * a_Position.x;\n' +
'   gl_Position.y = u_SizeChange * a_Position.y;\n' +
'   gl_Position.z = u_SizeChange * a_Position.z;\n' +
'   gl_Position.w = 1.0;\n' +
'   v_Color = a_Color;\n' +
'}\n';

var FSHADER_SOURCE = 
'precision mediump float;\n' +
'varying vec4 v_Color;\n' +
'void main() {\n' +
    'gl_FragColor = v_Color;\n' +
'}\n';

//centerX, centerY, radius, r, g, b, a
var circles; 

//points with colors for all cirles
var pointsColors;

var a_Position;
var a_Color;

function main() {

    var canvas = document.getElementById( "webgl" );
    
	//Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.15, 0.15, 0.15, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    //initialize shaders
    var program = initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    if(!program) {
        console.log('Failed to initialize shaders');
        return;
    }
    //get attribute variable locations
    a_Position = gl.getAttribLocation(gl.program, "a_Position");
    if(a_Position < 0) {
        console.log('Failed to get Storage location of a_Position');
        return;
    }

    a_Color = gl.getAttribLocation(gl.program, "a_Color");
    if(a_Color < 0) {
        console.log('Failed to get Storage location of a_Color');
        return;
    }

    var u_SizeChange = gl.getUniformLocation(gl.program, 'u_SizeChange');
    if (!u_SizeChange) { 
      console.log('Failed to get the storage location of u_SizeChange');
      return;
    }

    
    gl.uniform1f(u_SizeChange, 1.0);

    //create a buffer object for verticies and colors of circle points
    var vertexBuffer = gl.createBuffer();
    if(!vertexBuffer) {
        console.log("Failed to create a Buffer Object");
        return -1;
    }
    //use helper function to generate initial circles
    var numCircles = generateCircles();
    //draw initial circles

    drawCircles(numCircles);
    //drawCircles(numCircles);

    //----------------------------------

    var tick = function(){
        animateBacteria(numCircles);
        gl.clear(gl.COLOR_BUFFER_BIT);
        drawCircles(numCircles);
        requestAnimationFrame(tick, canvas);
    }
   //tick();


    //----------------------------------

    //----helper functions----
    //draw all circles
    function drawCircles(numCircles) {
        for(var i = 0; i < numCircles; i++) {
            drawSingleCircle(circles[6*i], circles[6*i+1], circles[6*i+2], circles[6*i+3], circles[6*i+4], circles[6*i+5]);
        }
    }

    //draw a single circle
    function drawSingleCircle(centerX, centerY, radius, r, g, b) {

        pointsColors = new Float32Array((circleRes+2)*5);
        pointsColors[0] = centerX;
        pointsColors[1] = centerY;
        pointsColors[2] = r;
        pointsColors[3] = g;
        pointsColors[4] = b;

        var d = 2*Math.PI/circleRes;
        for(var i = 0; i <= circleRes; i++) {
            pointsColors[5*i] = centerX + radius*Math.cos(d*i);
            pointsColors[5*i+1] = centerY + radius*Math.sin(d*i);
            pointsColors[5*i+2] = r;
            pointsColors[5*i+3] = g;
            pointsColors[5*i+4] = b;

        }


        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, pointsColors, gl.STATIC_DRAW);

        var FSIZE = pointsColors.BYTES_PER_ELEMENT;
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*5, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*5, FSIZE*2);
        gl.enableVertexAttribArray(a_Color);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, circleRes+2);

    }

    //initialize all circles including field and bacteria
    function generateCircles() {

    var numCircles = 1 + Math.floor(3 + 8*Math.random());
    
    circles = new Float32Array(6*numCircles);
    //field Circle
    circles[0] = 0.0;           //centerX
    circles[1] = 0.0;           //centerY
    circles[2] = fieldRadius;   //radius
    circles[3] = 0.9;           //red
    circles[4] = 0.9;           //green
    circles[5] = 0.9;           //blue
    
    //bacteria
    for(var i = 1; i < numCircles; i++){
        var angle = 2*Math.PI*Math.random();
        circles[6*i] = fieldRadius*Math.cos(angle);
        circles[6*i+1] = fieldRadius*Math.sin(angle);
        circles[6*i+2] = minInitBacRadius + (maxInitBacRadius - minInitBacRadius)*Math.random();
        circles[6*i+3] = 0.2 + 0.8*Math.random();
        circles[6*i+4] = 0.2 + 0.8*Math.random();
        circles[6*i+5] = 0.2 + 0.8*Math.random();
    }

    return numCircles;

    }
    //First time this funciton was called
    var g_last = Date.now();
    function animateBacteria(numCircles) {
        //calculate elapsed time
        var now = Date.now();
        var elapsed = now - g_last;
        g_last = now;
  
        //increase radii of bacteria
        for(var i = 1; i < numCircles; i++) {
            circles[6*i+2] += (growthRate*elapsed)/1000;
        }

    }

}
