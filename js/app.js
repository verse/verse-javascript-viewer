$(document).ready(function() {
	var scene, scenes = {}, objects = {}, meshes = {};
	
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
		var config, dataHandler, prio = 128;

		console.log(verse);

		nodeHandler = function nodeHandler (data) {
			data.forEach(function(cmd) {
				if (cmd.CMD === 'NODE_CREATE') {
					if (cmd.CUSTOM_TYPE === 123) {
						console.log('Blender Scene Node:');
						// Add this node to the list of scenes shared at verse server
						scenes[cmd.NODE_ID] = {
							'name': undefined,
							'data_node_id': undefined
						};
					} else if (cmd.CUSTOM_TYPE === 124) {
						console.log('Blender Scene Data Node:');
						// Store the id o this node in parent node
						scenes[cmd.PARENT_ID].cmd_node_id = cmd.NODE_ID;
					// Is it object?
					} else if (cmd.CUSTOM_TYPE === 125) {
						console.log('Blender 3D Object:');
						// Create Three.js object and add it to hash list of objects
						objects[cmd.NODE_ID] = {
							'obj': new THREE.Object3D(),
							'tg_trans_id': undefined,
							'tag_pos_id': undefined,
							'tag_scale_id': undefined,
							'tag_rot_id': undefined
						};
						// Add object to the scene
						scene.add( objects[cmd.NODE_ID].obj );
					// Is it Mesh?
					} else if (cmd.CUSTOM_TYPE === 126) {
						console.log('Blender Mesh:');
						// Create empty face geometry
						face_geometry = create_face_geometry({}, {});
						// Create empty edge geometry
						edge_geometry = create_edge_geometry({}, {});
						// Create simple material for faces
						var face_material = new THREE.MeshLambertMaterial( { color: 0x5ce5ff } );
						// Create simple material for edges
						var edge_material = new THREE.LineBasicMaterial( { color: 0xffffff } );
						// Create mesh and add it to hash list of meshes
						meshes[cmd.NODE_ID] = {
							'obj' : objects[cmd.PARENT_ID],
							'face_material': face_material,
							'face_mesh': new THREE.Mesh(face_geometry, face_material),
							'edge_material': edge_material,
							'edge_mesh': new THREE.Line(edge_geometry, edge_material, THREE.LinePieces),
							'layer_vertices_id': undefined,
							'vertices': {},
							'layer_edges_id': undefined,
							'edges': {},
							'layer_faces_id': undefined,
							'faces': {}
						};
						// Append face_mesh to Three.js object
						objects[cmd.PARENT_ID].obj.add(meshes[cmd.NODE_ID].face_mesh);
						// Append edge_mesh to Three.js object
						objects[cmd.PARENT_ID].obj.add(meshes[cmd.NODE_ID].edge_mesh);
					}
					console.log(cmd);
					console.log('Subscribing to node: ' + cmd.NODE_ID + ' ...');
					// TODO: do not subscribe automaticaly to everything
					verse.nodeSubscribe(prio, cmd.NODE_ID);
				} else {
					console.log(cmd);
				}
			});
		}

		tagGroupHandler	= function tagGroupHandler (data) {
			data.forEach(function(cmd) {
				if (cmd.CMD === 'TAG_GROUP_CREATE') {
					console.log(cmd);
					console.log('Subscribing to tag_group: ' + cmd.TAG_GROUP_ID + ' in node: ' + cmd.NODE_ID + ' ...');
					verse.tagGroupSubscribe(prio, cmd.NODE_ID, cmd.TAG_GROUP_ID);

					// Is it tag group with object transformation?
					if(objects[cmd.NODE_ID] !== undefined && cmd.CUSTOM_TYPE === 0) {
						console.log('TagGroup with transformation created.');
						objects[cmd.NODE_ID].tg_trans_id = cmd.TAG_GROUP_ID;
					}
				} else {
					console.log(cmd);
				}
			});
		}

		tagHandler = function tagHandler (data) {
			data.forEach(function(cmd) {
				if (data.CMD === 'TAG_CREATE') {
					console.log(data);

					// Tag including position
					if(objects[data.NODE_ID] !== undefined && objects[data.NODE_ID].tg_trans_id !== undefined && data.CUSTOM_TYPE === 0) {
						console.log('Tag with position created.');
						objects[data.NODE_ID].tag_pos_id = data.TAG_ID;
					}

					// Tag including rotation
					if(objects[data.NODE_ID] !== undefined && objects[data.NODE_ID].tg_trans_id !== undefined && data.CUSTOM_TYPE === 1) {
						console.log('Tag with rotation created.');
						objects[data.NODE_ID].tag_rot_id = data.TAG_ID;
					}

					// Tag including scale
					if(objects[data.NODE_ID] !== undefined && objects[data.NODE_ID].tg_trans_id !== undefined && data.CUSTOM_TYPE === 2) {
						console.log('Tag with scale created.');
						objects[data.NODE_ID].tag_scale_id = data.TAG_ID;
					}
				}
				else if (data.CMD === 'TAG_SET_REAL32') {
					// Set object position, scale and rotation
					console.log(data);

					// Position
					if(objects[data.NODE_ID] !== undefined && objects[data.NODE_ID].tg_trans_id === data.TAG_GROUP_ID && objects[data.NODE_ID].tag_pos_id === data.TAG_ID) {
						console.log('Object position: ' + data.VALUES[0] + ', ' + data.VALUES[1] + ', ' + data.VALUES[2]);
						objects[data.NODE_ID].obj.position.x = data.VALUES[0];
						objects[data.NODE_ID].obj.position.y = data.VALUES[1];
						objects[data.NODE_ID].obj.position.z = data.VALUES[2];
					// Rotation
					} else if(objects[data.NODE_ID] !== undefined && objects[data.NODE_ID].tg_trans_id === data.TAG_GROUP_ID && objects[data.NODE_ID].tag_rot_id === data.TAG_ID) {
						console.log('Object rotation: ' + data.VALUES[0] + ', ' + data.VALUES[1] + ', ' + data.VALUES[2] + ', ' + data.VALUES[3]);
						objects[data.NODE_ID].obj.quaternion.x = data.VALUES[0];
						objects[data.NODE_ID].obj.quaternion.y = data.VALUES[1];
						objects[data.NODE_ID].obj.quaternion.z = data.VALUES[2];
						objects[data.NODE_ID].obj.quaternion.w = data.VALUES[3];
					// Scale
					} else if(objects[data.NODE_ID] !== undefined && objects[data.NODE_ID].tg_trans_id === data.TAG_GROUP_ID && objects[data.NODE_ID].tag_scale_id === data.TAG_ID) {
						console.log('Object scale: ' + data.VALUES[0] + ', ' + data.VALUES[1] + ', ' + data.VALUES[2]);
						objects[data.NODE_ID].obj.scale.x = data.VALUES[0];
						objects[data.NODE_ID].obj.scale.y = data.VALUES[1];
						objects[data.NODE_ID].obj.scale.z = data.VALUES[2];
					}
				} else {
					console.log(cmd);
				}
			});
		}

		layerHandler = function layerHandler (data) {
			var changed_meshes = {};

			data.forEach(function(cmd) {
				if (cmd.CMD === 'LAYER_CREATE') {
					verse.layerSubscribe(prio, cmd.NODE_ID, cmd.LAYER_ID);
					console.log(cmd);
					console.info('Subscribing to layer: node_id = ' + cmd.NODE_ID + ' layer_id = ' + cmd.LAYER_ID);

					// Layer with vertices was created
					if(meshes[cmd.NODE_ID] !== undefined && cmd.CUSTOM_TYPE === 0) {
						console.log('Layer with vertices.');
						meshes[cmd.NODE_ID].layer_vertices_id = cmd.LAYER_ID;
					}

					// Layer with edges was created
					if(meshes[cmd.NODE_ID] !== undefined && cmd.CUSTOM_TYPE === 1) {
						console.log('Layer with edges.');
						meshes[cmd.NODE_ID].layer_edges_id = cmd.LAYER_ID;
					}

					// Layer with faces was created
					if(meshes[cmd.NODE_ID] !== undefined && cmd.CUSTOM_TYPE === 2) {
						console.log('Layer with faces.');
						meshes[cmd.NODE_ID].layer_faces_id = cmd.LAYER_ID;
					}
				}
				else if (cmd.CMD === 'LAYER_SET_UINT32') {
					console.log(cmd);

					// Edges
					if(meshes[cmd.NODE_ID] !== undefined && meshes[cmd.NODE_ID].layer_edges_id === cmd.LAYER_ID) {
						console.log('Edge indexes: ', + cmd.VALUES[0] + ', ' + cmd.VALUES[1]);
						meshes[cmd.NODE_ID].edges[cmd.ITEM_ID] = cmd.VALUES;

						changed_meshes[cmd.NODE_ID] = cmd.NODE_ID;
					}
					// Faces
					else if(meshes[cmd.NODE_ID] !== undefined && meshes[cmd.NODE_ID].layer_faces_id === cmd.LAYER_ID) {
						console.log('Faces indexes: ', + cmd.VALUES[0] + ', ' + cmd.VALUES[1] + ', ' + cmd.VALUES[2] + ', ' + cmd.VALUES[3]);
						meshes[cmd.NODE_ID].faces[cmd.ITEM_ID] = cmd.VALUES;

						changed_meshes[cmd.NODE_ID] = cmd.NODE_ID;
					}
				}
				else if (cmd.CMD === 'LAYER_SET_REAL32') {
					// TODO: bounding box
					console.log(cmd);
				}
				else if (cmd.CMD === 'LAYER_SET_REAL64') {
					console.log(cmd);

					if(meshes[cmd.NODE_ID] !== undefined && meshes[cmd.NODE_ID].layer_vertices_id === cmd.LAYER_ID) {
						console.log('Vertex position: ' + cmd.VALUES[0] + ', ' + cmd.VALUES[1] + ', ' + cmd.VALUES[2]);
						meshes[cmd.NODE_ID].vertices[cmd.ITEM_ID] = cmd.VALUES;
						// Update or create
						if (meshes[cmd.NODE_ID].vertices[cmd.ITEM_ID] === undefined) {
							console.log('New vertex ...');
						} else {
							console.log('Updated position ...');
							// TODO: update position of vertex
							// meshes[cmd.NODE_ID].face_mesh.verticesNeedUpdate = true;
						}
					}

					changed_meshes[cmd.NODE_ID] = cmd.NODE_ID;
				}
				else if (cmd.CMD === 'LAYER_UNSET') {
					console.log(data);

					// Vertices
					if(meshes[cmd.NODE_ID] !== undefined && meshes[cmd.NODE_ID].layer_vertices_id === cmd.LAYER_ID) {
						console.log('Deleted vertex:', + cmd.ITEM_ID);
						delete meshes[cmd.NODE_ID].vertices[cmd.ITEM_ID];
						changed_meshes[cmd.NODE_ID] = cmd.NODE_ID;
					}
					// Edges
					else if(meshes[cmd.NODE_ID] !== undefined && meshes[cmd.NODE_ID].layer_edges_id === cmd.LAYER_ID) {
						console.log('Deleted edge: ', + cmd.ITEM_ID);
						delete meshes[cmd.NODE_ID].edges[cmd.ITEM_ID];
						changed_meshes[cmd.NODE_ID] = cmd.NODE_ID;
					}
					// Faces
					else if(meshes[cmd.NODE_ID] !== undefined && meshes[cmd.NODE_ID].layer_faces_id === cmd.LAYER_ID) {
						console.log('Deleted face: ', + cmd.ITEM_ID);
						delete meshes[cmd.NODE_ID].faces[cmd.ITEM_ID];
						changed_meshes[cmd.NODE_ID] = cmd.NODE_ID;
					} else {
						console.log('Other unsetting.')
					}
				}
				else {
					console.log(cmd);
				}
			});

			// Update mesh, when all layer commands from 'packet' were evaluated
			for (var key in changed_meshes) {
				// Remove old face and edge mesh from object
				meshes[key].obj.obj.remove(meshes[key].face_mesh);
				meshes[key].obj.obj.remove(meshes[key].edge_mesh);
				// Set THREE.js new face mesh
				face_geometry = create_face_geometry(meshes[key].vertices, meshes[key].faces);
				meshes[key].face_mesh = new THREE.Mesh(face_geometry, meshes[key].face_material);
				meshes[key].obj.obj.add(meshes[key].face_mesh);
				// Set THREE.js new edge mesh
				edge_geometry = create_edge_geometry(meshes[key].vertices, meshes[key].edges);
				meshes[key].edge_mesh = new THREE.Line(edge_geometry, meshes[key].edge_material, THREE.LinePieces);
				meshes[key].obj.obj.add(meshes[key].edge_mesh);
			};
		}

		// Get values from form
		var username = $('#username').val();
		var password = $('#password').val();
		var serverURI = $('#server').val();

		config = {
			uri: serverURI,
			version: 'v1.verse.tul.cz',
			username: username,
			passwd: password,
			nodeCallback: nodeHandler,
			tagGroupCallback: tagGroupHandler,
			tagCallback: tagHandler,
			layerCallback: layerHandler,
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
			if (faces[key].length === 4) {
				// Triangle
				if(faces[key][3] === 0) {
					geometry.faces.push(
						new THREE.Face3(
							la_table[ faces[key][0] ],
							la_table[ faces[key][1] ],
							la_table[ faces[key][2] ]
							)
						);
				// Quad
				} else {
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
			// Render scene
			render();
		};

		function render() {
			renderer.render( scene, camera );
		};

		render();
		animate();

		return scene;
	}
});
