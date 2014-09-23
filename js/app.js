$(document).ready(function() {
	
	function create_alert (alert_type, message) {
		var $div = $('\
			<div class="alert ' + alert_type + ' alert-dismissible" role="alert">\
			<button type="button" class="close" data-dismiss="alert">\
			<span aria-hidden="true">&times;</span>\
			<span class="sr-only">Close</span></button>\
			' + message + '\
			</div>\
		');
		$('.container').prepend($div);
	};

	if (!window.WebGLRenderingContext) {
		// The browser doesn't even know what WebGL is
		var $alert_div = $('\
			<div class="alert alert-danger" role="alert">\
			<strong>Sorry:</strong> Your browser does not support <a href="http://get.webgl.org/" class="alert-link">WebGL</a>!\
			</div>\
			');
		$('.container').prepend($alert_div);
		// TODO: make login form disabled
	}

	$('.form-login').submit(function(event) {
		// Connect to Verse server
		var config, dataHandler, scene, objects, meshes;

		console.log(verse);

		dataHandler = function dataHandler (data) {
			// Nodes
			if (data.CMD === 'NODE_CREATE') {
				verse.subscribeNode(data.NODE_ID);
				console.log(data);
				console.log('Subscribing to node: ' + data.NODE_ID);

				// Debug print
				if (data.CUSTOM_TYPE === 123) {
					console.log('Blender Scene Node');
				} else if (data.CUSTOM_TYPE === 124) {
					console.log('Blender Scene Data Node');
				// Is it object?
				} else if (data.CUSTOM_TYPE === 125) {
					console.log('Blender 3D Object');
					// Create Three.js object and add it to hash list of objects
					// objects[data.NODE_ID] = {
					// 	'obj': new THREE.Object3D(),
					// 	'tg_trans_id': undefined
					// };
					// // Add object to the scene
					// scene.add( objects[data.NODE_ID].obj );
				// Is it Mesh?
				} else if (data.CUSTOM_TYPE === 126) {
					console.log('Blender Mesh');
					// // Create empty geometry
					// var geometry = new THREE.Geometry();
					// // Create simple material
					// var solid_material = new THREE.MeshLambertMaterial( { color: 0x5ce5ff } );
					// // Create mesh and add it to hash list of meshes
					// meshes[data.NODE_ID] = {
					// 	'mesh': new THREE.Mesh(geometry, material),
					// 	'vertices': {},
					// 	'edges': {},
					// 	'faces': {}
					// };
					// // Append mesh to Three.js object
					// objects[data.PARENT_NODE_ID].obj.add(meshes[data.NODE_ID].mesh);
				}
			}
			// Tag Groups
			else if (data.CMD === 'TAG_GROUP_CREATE') {
				verse.subscribeTagGroup(data.NODE_ID, data.TAG_GROUP_ID);
				console.log(data);
				// console.info('Subscribing to tag group: node_id = ' + data.NODE_ID + ' tag_group_id = ' + data.TAG_GROUP_ID);

				// // Is it tag group with object transformation?
				// if(objects[data.NODE_ID] !== undefined && date.CUSTOM_TYPE === 0) {
				// 	objects[data.NODE_ID].tg_trans_id = data.TAG_GROUP_ID;
			}
			// Tags
			else if (data.CMD === 'TAG_CREATE') {
				// TODO
				console.log(data);
			}
			// Layers
			else if (data.CMD === 'LAYER_CREATE') {
				verse.subscribeLayer(data.NODE_ID, data.LAYER_ID);
				console.info('Subscribing to layer: node_id = ' + data.NODE_ID + ' layer_id = ' + data.LAYER_ID);
			}
			else {
				console.log(data);
			}
		};

		// Get values from form
		var username = $('#username').val();
		var password = $('#password').val();
		var serverURI = $('#server').val();

		config = {
			uri: serverURI,
			version: 'v1.verse.tul.cz',
			username: username,
			passwd: password,
			dataCallback: dataHandler,
			connectionTerminatedCallback: function(event) {
				/*
				 * callback function for end of session handling
				 * called when onClose websocket event is fired
				 */
				console.info('[Disconnected], Code:' + event.code + ', Reason: ' + event.reason);

				// Create allert message
				if (event.code === 1001) {
					create_alert('alert-danger',
						'<strong>Sorry:</strong> Verse server ' + config.uri + ' was terminated!');
				} else if (event.code === 1002) {
					create_alert('alert-danger',
						'<strong>Sorry:</strong> Connection with Verse server ' + config.uri + ' timed-out!');
				} else if (event.code === 1006) {
					create_alert('alert-danger',
						'<strong>Sorry:</strong> Verse server ' + config.uri + ' is not running!');
				} else {
					create_alert('alert-danger',
						'<strong>Sorry:</strong> Connection with Verse server ' + config.uri + ' was lost (error: ' + event.code + ')!');
				};

				$('canvas').remove();
				$('.jumbotron').fadeIn();
			},
			connectionAcceptedCallback: function(userInfo) {
				/*
				 * callback function for connection accepted event
				 * called when negotiation process is finished
				 * @param userInfo object
				 */
				console.info('User ID: ' + userInfo.USER_ID);
				console.info('Avatar ID: ' + userInfo.AVATAR_ID);

				// Create dismissible 'info' message
				create_alert('alert-success', '<strong>Great:</strong> Connected to Verse server!');
				$('.jumbotron').fadeOut();
				// TODO: Create in jumbotron list of available scenes

				// Create THREE.js scene and start display loop
				scene = create_THTREE_scene();
			},
			errorCallback: function(error) {
				/*
				 * Error callback 
				 * called when user auth fails
				 * @param error string command name
				 */
				console.error(error);

				// Create allert message
				create_alert('alert-danger', '<strong>Sorry:</strong> Connection with Verse server was terminated');

				$('canvas').remove();
				$('.jumbotron').fadeIn();
			}

		};

		verse.init(config);

		console.info(verse);
		
		event.preventDefault();
	});
});

// Cube with holes in geometry and topology
//
//   4+--------+10
//   /|       /|
// 7+--------+8|
//  | |      | |
//  |0+------|-+3
//  |/       |/
// 1+--------+2
//
var cube_vertices_holes = {
	0:  [-1.0, -1.0, -1.0],
	1:  [ 1.0, -1.0, -1.0],
	2:  [ 1.0,  1.0, -1.0],
	3:  [-1.0,  1.0, -1.0],
	4:  [-1.0, -1.0,  1.0],
	7:  [ 1.0, -1.0,  1.0],
	8:  [ 1.0,  1.0,  1.0],
	10: [-1.0,  1.0,  1.0]
};
var cube_edges_holes = {
	0:  [0, 1],
	1:  [1, 2],
	2:  [2, 3],
	3:  [3, 0],
	4:  [0, 4],
	5:  [1, 7],
	6:  [2, 8],
	7:  [3, 10],
	8:  [4, 7],
	9:  [7, 8],
	10: [8, 10],
	11: [10, 4]
};
var cube_faces_holes = {
	0: [0,  3,  2,  1],
	1: [0,  1,  7,  4],
	3: [1,  2,  8,  7],
	5: [2,  3,  10, 8],
	8: [3,  0,  4, 10],
	9: [4,  7,  8, 10]
};

// Function for creating geometry
function create_face_geometry (vertices, faces) {
	// Create generic geometry
	var geometry = new THREE.Geometry();
	// Create empty look up table
	var la_table = {};
	// Initial index used as value in look up table
	var index = 0;
	// Add vertices to geometry
	for (var key in vertices) {
		geometry.vertices.push(
			new THREE.Vector3(
				vertices[key][0],
				vertices[key][1],
				vertices[key][2]
				)
			);
		// Create mapping for Three.js, because it
		// expects array, not hash table
		la_table[key] = index++;
	};
	// Add faces to geometry
	for (var key in faces) {
		// Triangle
		if(faces[key].length === 3) {
			geometry.faces.push(
				new THREE.Face3(
					la_table[ faces[key][0] ],
					la_table[ faces[key][1] ],
					la_table[ faces[key][2] ]
					)
				);
		// Quad
		} else if (faces[key].length === 4) {
			//
			// 0 +--+ 3
			//   |\ |
			//   | \|
			// 1 +--+ 2
			//
			geometry.faces.push(
				new THREE.Face3(
					la_table[ faces[key][0] ],
					la_table[ faces[key][1] ],
					la_table[ faces[key][2] ]
					)
				);
			geometry.faces.push(
				new THREE.Face3(
					la_table[ faces[key][0] ],
					la_table[ faces[key][2] ],
					la_table[ faces[key][3] ]
					)
				);
		}
	};
	// Recompute normal vectors of faces
	geometry.computeFaceNormals();
	// Compute bounding box of geometry
	geometry.computeBoundingBox();

	return geometry;
}

// Function for creating geometry for edges
function create_edge_geometry (vertices, edges) {
	// Create generic geometry
	var geometry = new THREE.Geometry();
	// Push pairs of vertices to geometry
	for (var key in edges) {
		// Push first vertex
		geometry.vertices.push(
			new THREE.Vector3(
				vertices[edges[key][0]][0],
				vertices[edges[key][0]][1],
				vertices[edges[key][0]][2]
				)
			);
		// Push second vertex
		geometry.vertices.push(
			new THREE.Vector3(
				vertices[edges[key][1]][0],
				vertices[edges[key][1]][1],
				vertices[edges[key][1]][2]
				)
			);
	}
	geometry.computeBoundingSphere();

	return geometry;
}

function create_THTREE_scene() {
	// Create scene
	var scene = new THREE.Scene();

	// Create camera used for rendering scene
	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	camera.position.x = 0.0;
	camera.position.y = 0.0;
	camera.position.z = 5.0;

	// Create trackball control
	controls = new THREE.TrackballControls( camera );

	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	controls.keys = [ 65, 83, 68 ];

	controls.addEventListener( 'change', render );

	// Create renderer
	var renderer = new THREE.WebGLRenderer( { antialias: true} );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0x333333, 1);
	var my_canvas = document.getElementById("my-canvas");
	my_canvas.appendChild( renderer.domElement );

	// Crete geometry for faces from hash table of vertices and faces
	face_geometry = create_face_geometry(cube_vertices_holes, cube_faces_holes);

	// Create simple material
	var solid_material = new THREE.MeshLambertMaterial( { color: 0x5ce5ff } );
	// Create solid mesh from geometry and solid material
	var face_mesh = new THREE.Mesh( face_geometry, solid_material );

	// Crete geometry for edges from hash table of vertices and edges
	var edge_geometry = create_edge_geometry( cube_vertices_holes, cube_edges_holes );
	// Create simple material for edges
	var edge_material = new THREE.LineBasicMaterial( { color: 0xffffff } );
	// Create edge mesh from geometry and edge material
	var edge_mesh = new THREE.Line( edge_geometry, edge_material, THREE.LinePieces );

	// Create 3D object of two meshes
	obj3d = new THREE.Object3D()
	obj3d.add( face_mesh );
	obj3d.add( edge_mesh );

	// Set position of object
	obj3d.position.x = 0.0;
	obj3d.position.y = 0.0;
	obj3d.position.z = 0.0;
	// Set scale of object
	obj3d.scale.x = 1.0;
	obj3d.scale.y = 1.0;
	obj3d.scale.z = 1.0;
	// Set rotation using quaternion
	obj3d.quaternion.x = 0.0;
	obj3d.quaternion.y = 0.0;
	obj3d.quaternion.z = 0.0;
	obj3d.quaternion.w = 1.0;

	// Add 3D object to the scene
	scene.add( obj3d );

	// Create a point light
	var pointLight1 = new THREE.PointLight( 0xffffff );
	pointLight1.position.x = camera.position.x + 0.1;
	pointLight1.position.y = camera.position.y + 0.1;
	pointLight1.position.z = camera.position.z + 1.0;
	// Add light to the scene
	scene.add( pointLight1 );

	// Create another point light
	var pointLight2 = new THREE.PointLight( 0xaaaaaa );
	pointLight2.position.x = camera.position.x - 2.0;
	pointLight2.position.y = camera.position.y - 2.0;
	pointLight2.position.z = camera.position.z - 6.0;
	// Add light to the scene
	scene.add( pointLight2 );

	// Callback function for resizing window
	window.onresize = function(event) {
		// Update camera
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		// Update renderer
		renderer.setSize( window.innerWidth, window.innerHeight);

		controls.handleResize();
	};

	function animate() {
		requestAnimationFrame( animate );
		// Update position of camera
		controls.update();
		// Update position of 1st light
		pointLight1.position.x = camera.position.x + 0.1;
		pointLight1.position.y = camera.position.y + 0.1;
		pointLight1.position.z = camera.position.z + 1.0;
		// Update position of 2nd light
		pointLight2.position.x = camera.position.x - 2.0;
		pointLight2.position.y = camera.position.y - 2.0;
		pointLight2.position.z = camera.position.z - 6.0;
		
		render();
	};

	function render() {
		renderer.render( scene, camera );
	};

	render();
	animate();

	return scene;
}