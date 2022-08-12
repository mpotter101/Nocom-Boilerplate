var KEEPER = {
	defaults: {
		name: { length: 10 },
		cam: {
			fov: 80,
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
	
	characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
	scenes: {},
	camTypes: {
		orthographic: 'OrthographicCamera',
		perpsective: 'PerspectiveCamera'
	},
	
	// ---
	// Functions not meant to be interacted with outside of this object
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
		
		console.log (defaultValues, actualValues);
		
		keys.forEach (k => {
			newData [k] = defaultValues [k];
			
			if (k in actualValues) { newData [k] = actualValues [k]; }
		});
		
		return newData;
	},
	//---
	
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
		console.log ("Creating new Camera");
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
	
	Render: () => {
		Object.keys (KEEPER.scenes).forEach (kSceneKey => {
			var kScene = KEEPER.scenes[kSceneKey];
			kScene.renderer.render (kScene.scene, kScene.camera)
		});
	}
}