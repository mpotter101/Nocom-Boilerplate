var KEEPER = {
	// "Private" properties, but user can mess with them if they want
	_stopUpdate: false,
	_onUpdate: [],
	_onLateUpdate: [],
	_animeAnimations: [],
	_timedEvents: [],
	_timeLastFrameMs: 0,
	_pauseOnError: true,
	_colliders: [],
	
	// For use in initial setup or when data is missing from a method call
	defaults: {
		name: { length: 10 },
		cam: {
			fov: 70,
			aspectRatio: 800/600,
			nearClipping: 0.1,
			farClipping: 1000
		},
		scene: {
			height: 600,
			width: 800,
			nameLength: 10
		},
	},
	
	// Constants
	characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
	camTypes: {
		orthographic: 'OrthographicCamera',
		perspective: 'PerspectiveCamera'
	},
	
	// Game engine state
	scenes: {},
	deltaTime: 0,
	
	// ---
	// Functions not meant to be interacted with outside of this object
	// Essentially private, but end-user should be allowed to interact with these
	
	_Boot: () => {
		// Integrate the broken-out parts of the library.
		KEEPER = Object.assign(KEEPER, K_HELPER, K_INPUT, K_COLLISION);

		// Check for dependencies.
		var jQueryAvailable = window.$ ? true : undefined;
		var pixiAvailable = window.PIXI ? true : undefined;
		var animeAvailable = window.anime ? true: undefined;
		var threeAvailable = window.THREE ? true : undefined;
		
		var message = "Booting KEEPER...\n";
		message += "Checking Libraries:\n";
		message += "\tJquery: %f" + jQueryAvailable + '%f\n';
		message += "\tPixi: " + pixiAvailable + '\n';
		message += "\tAnime: " + animeAvailable + '\n';
		message += "\tThreeJS: " + threeAvailable + '\n';	

		KEEPER.Log({ message });

		if (
			jQueryAvailable &&
			pixiAvailable &&
			animeAvailable &&
			threeAvailable
		) {
			KEEPER.Log({ message: "Boot successful. Update starting." });
			KEEPER._Update();
			return;
		}
		
		KEEPER.Log({
				message: 'Missing Dependencies! Please ensure listed libraries are loaded onto the page before KEEPER is loaded.',
				severity: KEEPER.severity.error
			});
		
		KEEPER.Log({
			message: 'KEEPER not started.',
			severity: KEEPER.severity.error
		});
	},
	
	_CreateScene: (data) => {
		var safeData = data;
		
		// prevents confusing logs in console
		if (!('camera' in safeData))
		{
			safeData.camera = KEEPER.CreateCamera();
		}
		
		var camera = safeData.camera;
		var scene = new THREE.Scene();
		var renderer = new THREE.WebGLRenderer();
		
		return { 
			camera, scene, renderer,
			Add: (sceneObj) => { scene.add (sceneObj); },
		}
	},
	
	_CheckSphereIntersection: (sphereA, sphereB) => {
		var distance = sphereA.sceneObj.position.distanceTo (sphereB.sceneObj.position);
		
		return distance < sphereA.radius + sphereB.radius
	},

	_Render: () => {
		Object.keys (KEEPER.scenes).forEach (kSceneKey => {
			var kScene = KEEPER.scenes[kSceneKey];
			kScene.renderer.render (kScene.scene, kScene.camera)
		});
	},
	
	_UpdateTimedEvents: () => {
		// increment all timers by current delta time
		// and fire off any that are ready
		KEEPER._timedEvents.forEach (evnt => {
			evnt.timer += KEEPER.deltaTime;
			
			if (evnt.timer >= evnt.waitForSeconds) {
				evnt.callback ({context: evnt.context});
			}
		});
		
		// Remove all events that have expired
		KEEPER._timedEvents = KEEPER._timedEvents.filter (evnt => evnt != null && evnt.timer < evnt.waitForSeconds);
	},
	
	_Update: () => {
		try {
			// Prepare new frame
			requestAnimationFrame(KEEPER._Update);
			
			// Don't update if loop is paused
			if (KEEPER._stopUpdate) {return}
			
			// New Delta Time
			var nowMs = Date.now ();
			KEEPER.deltaTime = Date.now () - KEEPER._timeLastFrameMs;
			
			// convert result to Ms
			KEEPER.deltaTime = KEEPER.deltaTime * 0.001;
			
			// Update timed events
			KEEPER._UpdateTimedEvents();
			
			// Normal update
			KEEPER._onUpdate.forEach (item => { item.method() });
			
			// Check for collisions
			KEEPER.CheckForCollisions();
			
			// Late update
			KEEPER._onLateUpdate.forEach (item => { item.method() });
			
			KEEPER._timeLastFrameMs = nowMs;
			
			// Draw the canvas after updates have happened.
			KEEPER._Render();
			
			// Update keyboard state.
			KEEPER.UpdateKeyState();
		}
		catch (e) {
			console.error (e);
			
			if (KEEPER._pauseOnError == true) {
				KEEPER.Stop ();
			}
		}
	},
	// End of "Private" functions
	//---
	
	AddToUpdate: (data) => {
		var safeData = KEEPER.EnsureDefaults (
			{ 
				owner: KEEPER,
				method: () => { console.log ('Object added empty method to update loop.'); },
			},
			data
		);
		
		safeData.id = KEEPER.GenerateKeeperId ({ length: 20 });
		
		KEEPER._onUpdate.push(safeData);
		return safeData.id;
	},
	
	AddToLateUpdate: (data) => {
		var safeData = KEEPER.EnsureDefaults (
			{ 
				owner: KEEPER,
				method: () => { console.log ('Object added empty method to update loop.'); },
			},
			data
		);
		
		safeData.id = KEEPER.GenerateKeeperId ({ length: 20 });
		
		KEEPER._onLateUpdate.push(safeData);
		return safeData.id;
	},
	
	AddTimedEvent: (data) => {
		var safeData = KEEPER.EnsureDefaults (
			{ 
				id: KEEPER.GenerateName({length: 20}),
				waitForSeconds: 1, 
				context: KEEPER,
				callback: (d) => { console.log ('Event fired off from', d.context); }
			},
			data
		);
		
		safeData.timer = 0;
		KEEPER._timedEvents.push (safeData);
		return safeData.id;
	},
	
	GetTimedEvent: (data) => {
		var safeData = KEEPER.EnsureDefaults (
			{ id: '' },
			data
		);
		
		var item, key;
		for (key = 0; key < KEEPER._onUpdate; key++) {
			item = KEEPER._onUpdate [key];
			
			if (item.id == safeData.id) {
				return KEEPER._timedEvents [key]
			}
		}
		
		return null;
	},
	
	RemoveTimedEvent: (data) => {
		var safeData = KEEPER.EnsureDefaults (
			{ id: '' },
			data
		);
		
		var item, key;
		for (key = 0; key < KEEPER._onUpdate; key++) {
			item = KEEPER._onUpdate [key];
			
			if (item.id == safeData.id) {
				KEEPER._timedEvents [key] = null;
				return true;
			}
		}
		
		return false;
	},
	
	// Returns true if something was removed from the update
	RemoveFromUpdate: (data) => {
		var safeData = KEEPER.EnsureDefaults (
			{ id: '' },
			data
		);
		
		var item, key;
		for (key = 0; key < KEEPER._onUpdate; key++) {
			item = KEEPER._onUpdate [key];
			
			if (item.id == safeData.id) {
				KEEPER._onUpdate [key] = null;
				return true;
			}
		}
		
		return false;
	},
	
	// Returns true if something was removed from the update
	RemoveFromLateUpdate: (data) => {
		var safeData = KEEPER.EnsureDefaults (
			{ id: '' },
			data
		);
		
		var item, key;
		for (key = 0; key < KEEPER._onLateUpdate; key++) {
			item = KEEPER._onLateUpdate [key];
			
			if (item.id == safeData.id) {
				KEEPER._onLateUpdate = null;
				return true;
			}
		}
		
		return false;
	},
	
	GetInputState: () => {
		return {
			down: KEEPER.GetActiveKeysFromArea(KEEPER.keys.down), 
			held: KEEPER.GetActiveKeysFromArea(KEEPER.keys.held), 
			up: KEEPER.GetActiveKeysFromArea(KEEPER.keys.up)
		}
	},
	
	GenerateKeeperId: (data) => { 
		var safeData = KEEPER.EnsureDefaults (
			{ 
				length: KEEPER.defaults.name.length,
			},
			data
		);
		
		var id = Date.now() + '-' + KEEPER.GenerateName (safeData);
		return id;
	},
	
	GenerateName: (data) => {  
		var safeData = KEEPER.EnsureDefaults (
			{ 
				length: KEEPER.defaults.name.length,
			},
			data
		);

		var length = safeData.length;
		if (length == -1) { length = 10; }
		
		var result = '';
		
		for (var i = 0; i < length; i++) {
			result += KEEPER.characters.charAt(Math.floor(Math.random() * KEEPER.characters.length));
		}
		
		return result;
	},
	
	// Creates a THREE.cam with sensible defaults that can be customized.
	CreateCamera: (data) => {
		var safeData = KEEPER.EnsureDefaults (
			{ 
				type: KEEPER.camTypes.perspective,
				
				// perspective stuff
				fov: KEEPER.defaults.cam.fov, 
				aspectRatio: KEEPER.defaults.cam.aspectRatio, 
				
				// orthographic stuff
				left: -4,
				right: 4,
				top: 3,
				bottom: -3, 
				// Needed by both
				nearClipping: KEEPER.defaults.cam.nearClipping, 
				farClipping: KEEPER.defaults.cam.farClipping,
			},
			data
		);
		
		
		// return camera
		switch (safeData.type) {
			case KEEPER.camTypes.perspective:
				KEEPER.Log ({message: 'Making ' + KEEPER.camTypes.perspective + ' camera'});
				// return the perspective camera
				return new THREE.PerspectiveCamera(
					safeData.fov, 
					safeData.aspectRatio, 
					safeData.nearClipping, 
					safeData.farClipping
				);
				break;
			case KEEPER.camTypes.orthographic:
				KEEPER.Log ({message: 'Making ' + KEEPER.camTypes.orthographic + ' camera'});
				
				// return the orthographic camera
				return new THREE.OrthographicCamera(
					safeData.left,
					safeData.right,
					safeData.top,
					safeData.bottom, 
					safeData.nearClipping,
					safeData.farClipping
				);
				break;
			default: 
			
				// Warn user that a camera could not be found.
				var ortho = KEEPER.camTypes.orthographic;
				var persp = KEEPER.camTypes.perspective;
				console.log ("Camera type", type, "not recognized. Try either", ortho, "or", persp);
				break;
		}
	},
	
	// Creates a new THREE scene with sensible defaults that can be customized.
	CreateKeeperScene: (data) => {
		var safeData = KEEPER.EnsureDefaults (
			{
				node: $(document.body), 
				height: KEEPER.defaults.scene.height, 
				width: KEEPER.defaults.scene.width, 
			},
			data
		);
		
		// Function act a bit weird when passed into EnsureDefaults...
		// manually assigning here to avoid that.
		if (!('camera' in safeData)) {
			console.log ('here');
			safeData.camera = KEEPER.CreateCamera()
		}
		
		if (!('name' in safeData)) {
			safeData.name = KEEPER.GenerateName()
		}
		
		var n = safeData.name;
		var node = safeData.node;
		
		KEEPER.scenes [n] = KEEPER._CreateScene (safeData)
		KEEPER.scenes [n].renderer.setSize (safeData.width, safeData.height);
		
		node.append (KEEPER.scenes [n].renderer.domElement);
		
		KEEPER.Log ({message: 'Creating scene: ' + n});
		
		return KEEPER.scenes [n];
	},
	
	// Gets a KEEPER scene by name
	GetSceneByName: (data) => {
		var safeData = KEEPER.EnsureDefaults (
			{ name: ''},
			data
		);
		
		return KEEPER.scenes [safeData.name];
	},
	
	
	CreateBasicKeeperShape: () => {
		var geometry = new THREE.BoxGeometry (1, 1, 1);
		var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
		var sceneObj = new THREE.Mesh (geometry, material);
		
		return { geometry, material, sceneObj }
	},
	
	Stop: () => {
		KEEPER._stopUpdate = true;
	},
	
	Resume: () => {
		KEEPER._stopUpdate = false;
	},
}

$(window).on('load', () => {
	// Setting up Delta Time
	KEEPER._timeLastFrameMs = Date.now();

	// Start the update loop
	KEEPER._Boot();

	// Capture key events
	$(window).on('keydown', (data) => {
		KEEPER.KeyListener({ type: 'down', key: data.key });
	});

	$(window).on('keyup', (data) => {
		KEEPER.KeyListener({ type: 'up', key: data.key });
	});
});
