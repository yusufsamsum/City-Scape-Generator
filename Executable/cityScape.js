/*
** Yusuf Samsum
** CS465 2018 Fall First Assignment
** Last Update: 31.10.2018
** ID: 21501651
***
	This program creates an image with respect to inputs from user.
	User will decide the maximum number of storey and number of houses 
	with the help of the sliders. When the user click the "Generate a Scene" 
	button, program will show houses with random colors and storeys.
	Also, program takes inputs from mouse and when the user click the 
	"Draw a Cloud!!" button, program will show clouds with respect to
	locations in which mouse clicked. 

*/

/* 
	There are several sources that used during implementation of the program.
	The program implemented on cad2 application which is one of the example
	application that provided from our course textbook. Also, our course book was used
	for colors' coordinates and other drawing methods i.e. TRIANGLE_FAN. In addition,
	a github example is used for save & load mechanism.
*/
var cloudSunCanvas, gl, program; 

var maxNumVertices  = 200000; // maximum number of vertices is kept high because of the continuity of the program

var index = 0; // index will keep the indexes of the a coordinate and coordinates and colors will be loaded by this variable.

var colors = [

    vec4( 1.0,  1.0,  1.0,  1.0 ),  // white
    vec4( 1.0,  0.0,  0.0,  1.0 ),  // red
    vec4( 1.0,  1.0,  0.0,  1.0 ),  // yellow
    vec4( 0.0,  1.0,  0.0,  1.0 ),  // green
    vec4( 0.0,  0.0,  1.0,  1.0 ),  // blue
    vec4( 1.0,  0.0,  1.0,  1.0 ),  // magenta
    vec4( 0.0,  1.0,  1.0,  1.0 ),   // cyan 
	vec4( 0.36, 0.25, 0.20, 1.0 ),  // brown
	vec4( 0.35, 0.16, 0.14, 1.0 ) // very dark brown ( for tree trunk )
];    


var groundColor 	= vec4( 0.647059, 0.164706, 0.164706, 1.0 ); // brown
var windowColor 	= vec4( 0.8, 0.8, 0.8, 1.0 ); // gray for windows
var treeTrunkColor 	= vec4( 0.35, 0.16, 0.14, 1.0 );  // tree trunk color very dark brown
var treeCircleColor = vec4( 0.0,  1.0,  0.0,  1.0  ); // tree's circle color( green )
var sunCircleColor 	= vec4( 1.0,  1.0,  0.0,  1.0 ); // sun's circle color ( yellow )
var cloudColor		= vec4( 1.0,  1.0,  1.0,  1.0 ); // cloud's color ( white ) 

var clickPosition; // this is the click position for the drawing cloud
var numPolygons = 0; // numPolygons will keep track of the number of polygon for render function
var numIndices = []; // indices will be kept by this variable for render function
numIndices[0] = 0; // first index initilize as 0 because first drawing will start with zero
var start = [0]; // start will keep track of the starting a polygon for render function
var houseNo = 0; // number of houses will be taken from user by a slider
var storeyNo = 0;// maxiumum number of storeys will be taken from user by a slider

var loadCoord =  []; // this stack will keep track of all coordinates and their colors for saving the data to txt file

var cloudNumPolygons = []; // this stack will keep track of the indexes of the cloud polygons for sending render function at the right time
// this variable provides correct order to the cloud objects.

var t1,t2,t3,t4; // common variables for several coordinate

var fixer; // fixer variable will provide consistency of the canvas and object relations

var groundVertices = [ 
    vec2( -1, -1 ),
    vec2(  -1,  -0.4 ),
    vec2(  1, -0.4 ),
    vec2( 1, -1)
];
// ground vertices are constant 

window.onload = function init() {
    cloudSunCanvas = document.getElementById( "cloudSunCanvas" );
    
    gl = WebGLUtils.setupWebGL( cloudSunCanvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
	// shaders    
	program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	
	// Configure WebGL 
	gl.viewport( 0, 0, cloudSunCanvas.width, cloudSunCanvas.height );
	gl.clearColor( 0.196078, 0.6, 0.8, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );
	
	
	fixer = cloudSunCanvas.width/cloudSunCanvas.height; // fixer is initilized for circular objects
	
	// Handling sources from the user
	document.getElementById("houseSlider").onchange = 
	function()
	{
		houseNo = event.srcElement.value;
	};
	
	document.getElementById( "storeySlider" ).onchange = 
	function()
	{
		storeyNo = event.srcElement.value;
	};
	
	
	// load mechanism
	
	var loadButton = document.getElementById( "loadButton" )
	
	loadButton.onchange = function(){
		cloudNumPolygons = [];
		numPolygons = 0;
		numIndices = [];
		numIndices[0] = 0;
		start = [0];
		loadCoord = [];
		index = 0;
		
		var file = this.files[0]; // File object

		
        var reader = new FileReader();
        reader.onload = function(progressEvent){
            var lines = this.result.split('\n');
			
			var number = parseFloat(lines[0]);
			
			// this loop takes the coordinates from txt file and load into the buffers 
			for( var i = 1; i < number; i = i + 2 )
			{
				//t1 = vec2( lines[i] );
				var nums = lines[i].split( ',' )
				t1 =  vec2( parseFloat( nums[0] ), parseFloat( nums[1] ) );
				gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
				gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten( t1 ) ); // 8 * index because the coordinate is a vec2
				 
				nums = lines[ i + 1 ].split( ',' ); 
				
				t1 = vec4( parseFloat( nums[0] ), parseFloat( nums[1] ), parseFloat( nums[2] ), parseFloat( nums[3] ) ) ;
				
				gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
				gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten( t1 )); // 16 * index because  the coordinate is a vec4
				
				index++;
			}
			
			numPolygons = parseFloat(lines[ number + 1 ]); // numPolygons is taken from txt file to take also numIndices and start arrays
			
			number = number + 2; // for going to the starting of the start array
			
			var startIndex = 0;
			for( var i = number; i < number + numPolygons; i++ )
			{
				start[ startIndex ] = parseFloat( lines[ i ] );
				startIndex++;
			} // start array is filled 
			
			number = number + numPolygons;
			startIndex = 0;
			for( var i = number; i < number + numPolygons; i++ )
			{
				numIndices[ startIndex ] = parseFloat( lines[ i ] );
				startIndex++;
			} // numIndices array is filled
			
			// initilize the next index
			number = number + numPolygons;
			var numberCloudPolygons = parseFloat( lines[ number ] ); // getting cloudNumPolygons.length
			number++;
			startIndex = 0;
			for( var i = number; i < number + numberCloudPolygons; i++ ) // getting cloud indexes for correct order drawing
			{
				cloudNumPolygons.push( parseFloat( lines[ i ] ) );
				startIndex++;
			}
			
			render(); // sending to the render the data that is loaded from txt file
        };
		reader.readAsText(file);
	
	};

	// save and download
	
	var saveButton = document.getElementById( "saveButton" )
	
	saveButton.addEventListener( "click", function()
	{
		var text = loadCoord.length + "\n" ;
        var filename = "cityScape.txt";
		
		for( var i = 0; i < loadCoord.length; i++ ) // saving coordinates and their colors
		{
			text = text + loadCoord[ i ] + "\n";
		}

		text = text + numPolygons + "\n";
		
		
		for( var i = 0; i < numPolygons; i++)
		{
			text = text + start[ i ]  +  "\n";
		}
		
		for( var i = 0; i < numPolygons; i++ )
		{
			text = text + numIndices[ i ] + "\n";
		}
		
		text = text + cloudNumPolygons.length + "\n";
		
		for( var i = 0; i < cloudNumPolygons.length; i++ )
		{
			text = text + cloudNumPolygons[ i ] + "\n";
		}
		
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
		
	});
	
	
	// cloud Button and sending coordinates that has taken to render function 
    var cloudButton = document.getElementById("Button1");
	
    cloudButton.addEventListener("click", function(){
    cloudNumPolygons.push( numPolygons );
	numPolygons++;
    numIndices[numPolygons] = 0;
    start[numPolygons] = index;
    render();
    });
	
	
	// Generating a scene 
	var pictureButton = document.getElementById( "Button2" );
	
	pictureButton.addEventListener( "click", function(){
	// clear all data from last picture
	cloudNumPolygons = [];
	numPolygons = 0;
	numIndices = [];
	numIndices[0] = 0;
	start = [0];
	loadCoord = [];
	index = 0;
	
	// drawing ground
	for ( var i = 0; i < groundVertices.length; i++ )
	{
		// loading buffers
		gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
		gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(groundVertices[i]) );
		
		
		loadCoord.push( groundVertices[i] ); // for load and save mechanism
		
		gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
		gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(groundColor));
		
		
		loadCoord.push( groundColor );
		
		numIndices[numPolygons]++;
		index++;
	}
	
	numPolygons++;
    numIndices[numPolygons] = 0;
    start[numPolygons] = index; 

	// drawing Sun object
	for( var i = 0; i<=360; i+=1)
	{
				 
		var j = i * Math.PI / 180;
		 
		var vert1 = vec2(
			0.8 + Math.sin(j)/(3*Math.PI),
			0.75 + Math.cos(j)/(3*Math.PI)*fixer
		);
		
		gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
		gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(vert1) );
		
		loadCoord.push( vert1 ); // for load and save mechanism
		
		gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
		gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(sunCircleColor));
		
		loadCoord.push( sunCircleColor ); // for load and save mechanism
		
		numIndices[numPolygons]++;
		index++;
	}
	
	numPolygons++;
    numIndices[numPolygons] = 0;
    start[numPolygons] = index;
	
	// drawing houses
	
	// variables for drawing houses
	var treeGap = 0.23; // gap between houses for trees
	var storeyHeight = 0.30; // height of the each storey
	var houseBoard = 0.95; // gap between first house and canvas
	var houseWidth = 0.30; // a house's width
	
	
	for( var ithHouse = 0; ithHouse < houseNo; ithHouse++)
	{		
		// draw storeys
		var xPosition = 0;
		var yPosition = 0;
		
		var randomStorey = Math.floor( (Math.random() * storeyNo)  + 1 ); // generate a random storey number with respect to maxiumum of it
		
		for (  var kthFloor = 0; kthFloor < randomStorey; kthFloor++ )
		{
			xPosition = ithHouse * (houseWidth + treeGap) - houseBoard; 
			yPosition = kthFloor * storeyHeight - houseBoard;
			
			var storeyColor = vec4( colors[ Math.floor(Math.random() * colors.length)] ); // every storey's color will be random
			
			// Loading coordinates to the buffer
			
			t1 = vec2( xPosition, yPosition );
			
			gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
			gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(t1) );
			
			loadCoord.push( t1 ); // for load and save mechanism

			gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
			gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(storeyColor));
			
			loadCoord.push( storeyColor ); // for load and save mechanism
			
			numIndices[numPolygons]++;
			index++;
			
			t2 = vec2( xPosition, storeyHeight + yPosition );
			
			gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
			gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(t2) );
			
			loadCoord.push( t2 ); // for load and save mechanism

			gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
			gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(storeyColor));
			
			loadCoord.push( storeyColor ); // for load and save mechanism
			
			numIndices[numPolygons]++;
			index++;
			
			t3 = vec2( xPosition + houseWidth, storeyHeight + yPosition );
			
			loadCoord.push( t3 ); // for load and save mechanism
			
			gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
			gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(t3) );

			loadCoord.push( storeyColor ); // for load and save mechanism
			
			gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
			gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(storeyColor));
			
			numIndices[numPolygons]++;
			index++;
			
			t4 = vec2( xPosition + houseWidth, yPosition );
			
			loadCoord.push( t4 ); // for load and save mechanism
			
			gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
			gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(t4) );

			loadCoord.push( storeyColor ); // for load and save mechanism
			
			gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
			gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(storeyColor));
			
			numIndices[numPolygons]++;
			index++;
			
			// at the end of a polygon(rectangle)
			numPolygons++;
			numIndices[numPolygons] = 0;
			start[numPolygons] = index;
			
			
			// draw windows
			
			var windowSize = 0.10;
			
			for( var ithWindow = 0; ithWindow < 2; ithWindow++)
			{
				var windowXPos = xPosition + (ithWindow * 0.04) + ithWindow * windowSize + 0.03;
				
				var windowYPos = yPosition + 0.06;
				
				// Loading coordinates to the buffer
				
				t1 = vec2( windowXPos, windowYPos );
				
				loadCoord.push( t1 ); // for load and save mechanism
				
				gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
				gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(t1) );

				loadCoord.push( windowColor ); // for load and save mechanism
				
				gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
				gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(windowColor));
				
				numIndices[numPolygons]++;
				index++;
				
				t2 = vec2( windowXPos, windowYPos + windowSize*fixer );
				
				loadCoord.push( t2 ); // for load and save mechanism
				
				gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
				gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(t2) );

				loadCoord.push( windowColor ); // for load and save mechanism
				
				gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
				gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(windowColor));
				
				numIndices[numPolygons]++;
				index++;
				
				t3 = vec2( windowXPos + windowSize, windowYPos + windowSize*fixer );
				
				loadCoord.push( t3 ); // for load and save mechanism
				
				gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
				gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(t3) );

				loadCoord.push( windowColor ); // for load and save mechanism
				
				gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
				gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(windowColor));
				
				numIndices[numPolygons]++;
				index++;
				
				t4 = vec2( windowXPos + windowSize, windowYPos );
				
				loadCoord.push( t4 ); // for load and save mechanism
				
				gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
				gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(t4) );

				loadCoord.push( windowColor ); // for load and save mechanism
				
				gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
				gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(windowColor));
				
				numIndices[numPolygons]++;
				index++;
				
				// at the end of a polygon(rectangle)
				numPolygons++;
				numIndices[numPolygons] = 0;
				start[numPolygons] = index;
			}
		
		}
		
		//draw roof
		yPosition = yPosition + storeyHeight;
		
		var roofColor = vec4( colors[ Math.floor(Math.random() * colors.length)] );
		
		// Loading coordinates to the buffer
		
		t1 = vec2(xPosition, yPosition );

		gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
		gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(t1) );

		gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
		gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(roofColor) );
		
		loadCoord.push( t1 ); // for load and save mechanism
		loadCoord.push( roofColor  ); // for load and save mechanism
		
		numIndices[numPolygons]++;
		index++;
		
		t2 = vec2( xPosition + (houseWidth / 2), yPosition + storeyHeight ); 
		
		gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
		gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(t2) );

		gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
		gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(roofColor) );
		
		numIndices[numPolygons]++;
		index++;

		loadCoord.push( t2 ); // for load and save mechanism
		loadCoord.push( roofColor  ); // for load and save mechanism

		t3 = vec2( xPosition + houseWidth, yPosition );
		
		gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
		gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(t3) );

		gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
		gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(roofColor) );
		
		numIndices[numPolygons]++;
		index++;
		
		loadCoord.push( t3 ); // for load and save mechanism
		loadCoord.push( roofColor  ); // for load and save mechanism

		
		// at the end of a polygon( triangle )
		numPolygons++;
		numIndices[numPolygons] = 0;
		start[numPolygons] = index;
		
		// draw Tree
		if( ithHouse < houseNo - 1 )
		{
			var treeThickness = 0.04;
			var treeHouseGap = 0.08;
			
			var treeXPosition = (ithHouse+1)*houseWidth + (ithHouse)*treeGap - houseBoard + treeHouseGap;
			var treeYPosition = 0 - houseBoard;
			
			// tree trunk
			
			// Loading coordinates to the buffer
			
			t1 = vec2( treeXPosition, treeYPosition );
			gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
			gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(t1) );

			gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
			gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(treeTrunkColor) );
			
			numIndices[numPolygons]++;
			index++;
			
			loadCoord.push( t1 ); // for load and save mechanism
			loadCoord.push( treeTrunkColor  ); // for load and save mechanism

			
			t2 = vec2( treeXPosition, treeYPosition + storeyHeight );  // a storey height = a tree trunk height
			
			gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
			gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(t2) );

			gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
			gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(treeTrunkColor) );
			
			loadCoord.push( t2 ); // for load and save mechanism
			loadCoord.push( treeTrunkColor ); // for load and save mechanism

			numIndices[numPolygons]++;
			index++;
			
			t3 = vec2( treeXPosition + treeThickness, treeYPosition + storeyHeight );
			
			gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
			gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(t3) );

			gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
			gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(treeTrunkColor) );
			
			numIndices[numPolygons]++;
			index++;
			
			loadCoord.push( t3 ); // for load and save mechanism
			loadCoord.push( treeTrunkColor ); // for load and save mechanism

			t4 = vec2( treeXPosition + treeThickness, treeYPosition );
			
			gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
			gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(t4) );

			gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
			gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(treeTrunkColor) );
			
			numIndices[numPolygons]++;
			index++;
			
			loadCoord.push( t4 ); // for load and save mechanism
			loadCoord.push( treeTrunkColor ); // for load and save mechanism

			// at the end of a polygon(rectangle)
			numPolygons++;
			numIndices[numPolygons] = 0;
			start[numPolygons] = index;
			
			// draw tree's circle
			var treeCircleCenterX = treeXPosition + treeThickness / 2;
			var treeCircleCenterY = treeYPosition + storeyHeight + treeGap/2 - 0.04;
			
			for( var i = 0; i<=360; i+=1)
			{
						 
				var j = i * Math.PI / 180;
				 
				var vert1 = vec2(
					treeCircleCenterX + Math.sin(j)/(4*Math.PI),
					treeCircleCenterY + Math.cos(j)/(4*Math.PI)*fixer
				);
				
				// Loading coordinates to the buffer
				
				gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
				gl.bufferSubData( gl.ARRAY_BUFFER, 8*index, flatten(vert1) );
				
				
				loadCoord.push( vert1 ); // for load and save mechanism
				loadCoord.push( treeCircleColor ); // for load and save mechanism

				
				gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
				gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(treeCircleColor))
				
				numIndices[numPolygons]++;
				index++;
			}
			
			// at the end of a shape( circle )
			numPolygons++;
			numIndices[numPolygons] = 0;
			start[numPolygons] = index;
			
		}
	}
	
	
	render();
		
	} );

    cloudSunCanvas.addEventListener("mousedown", function(event){
        clickPosition  = vec2(2*event.clientX/cloudSunCanvas.width-1, 
           2*(cloudSunCanvas.height-event.clientY)/cloudSunCanvas.height-1);
        gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
        gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(clickPosition));

        gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
        gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(cloudColor));
		
		numIndices[numPolygons]++;
        index++;
		
		loadCoord.push( clickPosition ); // for load and save mechanism
		loadCoord.push( cloudColor ); // for load and save mechanism
    } );
	
		
	// Load the data into the GPU
	
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 8*maxNumVertices, gl.STATIC_DRAW );
	
	
    var vPos = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPos, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPos );
    
    var cBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW );
    
	
	var vColor1 = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor1, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor1 );
}


function render() {
	gl.clear( gl.COLOR_BUFFER_BIT );

	for( var i = 0; i < 2; i++) // first two object is the ground and sun
	{
		gl.drawArrays( gl.TRIANGLE_FAN, start[ i ], numIndices[ i ] );
	}
	
	// cloud objects should be drawn before the houses and trees, so clouds can be shown behind of them
    for(var i=0; i<cloudNumPolygons.length; i++) 
	{
		gl.drawArrays( gl.TRIANGLE_FAN, start[cloudNumPolygons[ i ] ], numIndices[ cloudNumPolygons[ i ] ] );
    }
	
	// other objects that will be drawn
	var cloudIndex = 0;
	for( var i = 2; i < numPolygons; i++ )
	{
		if( i != cloudNumPolygons[ cloudIndex ] ) // for safety to not draw clouds again
		{
			gl.drawArrays( gl.TRIANGLE_FAN, start[ i ], numIndices[ i ] );
		}
		else{
			cloudIndex++;
		}
	}
	
	
}