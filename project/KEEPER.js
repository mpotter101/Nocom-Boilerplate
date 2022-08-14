var KEEPER = {
	// "Private" properties, but user can mess with them if they want
	_stopUpdate: false,
	_onUpdate: [],
	_onLateUpdate: [],
	_timedEvents: [],
	_timeLastFrameMs: 0,
	_pauseOnError: true,
	
	// For use in initial setup or when data is missing from a method call
	defaults: {
		name: { length: 10 },
		cam: {
			fov: 60,
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
	
	// Essentially constants
	characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
	camTypes: {
		orthographic: 'OrthographicCamera',
		perpsective: 'PerspectiveCamera'
	},
	
	// Game engine state
	scenes: {},
	keys: {
		down: {},
		held: {},
		up: {},
	},
	deltaTime: 0,
	
	// Debug options
	debug: {
		logKeypress: false
	},
	
	// ---
	// Functions not meant to be interacted with outside of this object
	// Essentially private, but end-user should be allowed to interact with these
	
	_DebugLog: (debugKey, message) => {
		if (KEEPER.debug [debugKey]) {
			console.log (message);
		}
	},
	
	
	_CreateScene: (data) => {
		var safeData = KEEPER._EnsureDefaults(
			{
				camera: KEEPER.CreateCamera()
			},
			data
		);
		
		var camera = safeData.camera;
		var scene = new THREE.Scene();
		var renderer = new THREE.WebGLRenderer();
		
		return { camera, scene, renderer }
	},
	
	_EnsureDefaults: (defaultValues, actualValues) => {
		var keys = Object.keys (defaultValues);
		var newData = {};
		
		if (actualValues == undefined) { actualValues = {} } 
		
		if (actualValues.constructor != Object) {
			throw new Error ("Values provided to method are not an object literal.");
		}
		
		keys.forEach (k => {
			newData [k] = defaultValues [k];
			
			if (k in actualValues) { newData [k] = actualValues [k]; }
		});
		
		return newData;
	},
	
	_KeyListener: (data) => {
		var key = data.key;
		var eventType = data.type;
		
		if (eventType == 'down' && KEEPER.keys.held [key] == 1) {return;}
		
		KEEPER._DebugLog ('logKeypress', eventType + ': ' + key);
		
		switch (eventType) {
			case 'down': 
				KEEPER.keys.held [key] = 1; KEEPER.keys.up [key] = 0; KEEPER.keys.down [key] = 1;
				break;
			case 'up': 
				KEEPER.keys.held [key] = 0; KEEPER.keys.down [key] = 0; KEEPER.keys.up [key] = 1;
				break;
		}
	},
	
	_UpdateKeyState: () => {
		// let pressed keys be marked as pressed for 1 frame
		Object.keys (KEEPER.keys.down).forEach (key => {
			if (KEEPER.keys.down [key] == 1) { 
				KEEPER.keys.down [key] = 0;
				KEEPER.keys.held [key] = 1;
			}
		});
		
		Object.keys (KEEPER.keys.up).forEach (key => {
			if (KEEPER.keys.up [key] == 1) { 
				KEEPER.keys.up [key] = 0;
			}
		});
	},
	
	_GetActiveKeysFromArea: (area) => {
		var result = [];
		
		Object.keys (area).forEach (key => {
			if (area [key] > 0) { result.push(key); }
		});
		
		return result;
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
			
			// Late update
			KEEPER._onLateUpdate.forEach (item => { item.method() });
			
			KEEPER._timeLastFrameMs = nowMs;
			
			// Draw the canvas after updates have happened.
			KEEPER._Render();
			
			// Update keyboard state.
			KEEPER._UpdateKeyState();
		}
		catch (e) {
			console.error (e);
			
			if (KEEPER._pauseOnError == true) {
				KEEPER.Stop ();
			}
		}
	},
	
	_GetKeyStateSafeData: (data) => {
		return KEEPER._EnsureDefaults (
			{ key: '' },
			data
		);
	},
	
	_KeyMatchesState: (key, keyArea, state) => {
		return KEEPER.keys [keyArea] [key] == state;
	},
	// End of "Private" functions
	//---
	
	AddToUpdate: (data) => {
		var safeData = KEEPER._EnsureDefaults (
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
		var safeData = KEEPER._EnsureDefaults (
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
		var safeData = KEEPER._EnsureDefaults (
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
		var safeData = KEEPER._EnsureDefaults (
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
		var safeData = KEEPER._EnsureDefaults (
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
		var safeData = KEEPER._EnsureDefaults (
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
		var safeData = KEEPER._EnsureDefaults (
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
			down: KEEPER._GetActiveKeysFromArea(KEEPER.keys.down), 
			held: KEEPER._GetActiveKeysFromArea(KEEPER.keys.held), 
			up: KEEPER._GetActiveKeysFromArea(KEEPER.keys.up)
		}
	},
	
	// Returns true if the key was pressed this frame.
	GetKeyDown: (data) => {
		var safeData = KEEPER._GetKeyStateSafeData(data);
		
		return KEEPER._KeyMatchesState (safeData.key, 'down', 1);
	},
	
	// Returns true if key is being held.
	GetKeyHeld: (data) => {
		var safeData = KEEPER._GetKeyStateSafeData(data);
		
		return KEEPER._KeyMatchesState (safeData.key, 'held', 1);
	},
	
	// Returns true if key was released this frame.
	GetKeyUp: (data) => {
		var safeData = KEEPER._GetKeyStateSafeData(data);
		
		return KEEPER._KeyMatchesState (safeData.key, 'up', 1);
	},
	
	GenerateKeeperId: (data) => { 
		var safeData = KEEPER._EnsureDefaults (
			{ 
				length: KEEPER.defaults.name.length,
			},
			data
		);
		
		var id = Date.now() + '-' + KEEPER.GenerateName (safeData);
		return id;
	},
	
	GenerateName: (data) => {  
		var safeData = KEEPER._EnsureDefaults (
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
		var safeData = KEEPER._EnsureDefaults (
			{ 
				type: KEEPER.camTypes.persective,
				fov: KEEPER.defaults.cam.fov, 
				aspectRatio: KEEPER.defaults.cam.aspectRatio, 
				height: KEEPER.defaults.scene.height, 
				width: KEEPER.defaults.scene.width, 
				nearClipping: KEEPER.defaults.cam.nearClipping, 
				farClipping: KEEPER.defaults.cam.farClipping 
			},
			data
		);
		
		var type = safeData.type;
		
		// return camera
		switch (type) {
			case KEEPER.camTypes.perspective:
				
				// return the perspective camera
				return new THREE.PerspectiveCamera(
					safeData.fov, 
					safeData.aspectRation, 
					safeData.nearClipping, 
					safeData.farClipping
				);
			case KEEPER.camTypes.orthographic:
				return new THREE.OrthographicCamera
			default: 
				var ortho = KEEPER.camTypes.orthographic;
				var persp = KEEPER.camTypes.perspective;
				console.log ("Camera type", type, "not recognized. Try either", ortho, "or", persp);
				break;
		}
	},
	
	// Creates a new THREE scene with sensible defaults that can be customized.
	CreateKeeperScene: (data) => {
		var safeData = KEEPER._EnsureDefaults (
			{
				node: $(document.body), 
				height: KEEPER.defaults.scene.height, 
				width: KEEPER.defaults.scene.width, 
				camera: KEEPER.CreateCamera(), 
				name: KEEPER.GenerateName() 
			},
			data
		);
		
		var n = safeData.name;
		var node = safeData.node;
		
		console.log ("Creating new KEEPER Scene in node:", node);
		
		KEEPER.scenes [n] = KEEPER._CreateScene ();
		KEEPER.scenes [n].renderer.setSize (safeData.width, safeData.height);
		
		node.append (KEEPER.scenes [n].renderer.domElement);
		
		return KEEPER.scenes [n];
	},
	
	// Gets a KEEPER scene by name
	GetSceneByName: (data) => {
		var safeData = KEEPER._EnsureDefaults (
			{ name: ''},
			data
		);
		
		return KEEPER.scenes [safeData.name];
	},
	
	
	CreateBasicKeeperShape: () => {
		var geometry = new THREE.BoxGeometry (1, 1, 1);
		var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
		var cube = new THREE.Mesh (geometry, material);
		
		return { geometry, material, cube }
	},
	
	Stop: () => {
		KEEPER._stopUpdate = true;
	},
	
	Resume: () => {
		KEEPER._stopUpdate = false;
	},
}

// Capture key events
$(window).on('keydown', (data) => {
	KEEPER._KeyListener({type: 'down', key: data.key}); 
});

$(window).on('keyup', (data) => {
	KEEPER._KeyListener({type: 'up', key: data.key}); 
});

// Setting up Delta Time
KEEPER._timeLastFrameMs = Date.now ();

// Start the update loop
KEEPER._Update();
