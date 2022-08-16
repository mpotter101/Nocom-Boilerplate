var Main = {
	Start: () => {
		// Create a new scene:
		//Main.kScene = KEEPER.CreateKeeperScene();
		Main.kScene = KEEPER.CreateKeeperScene({ 
			camera: KEEPER.CreateCamera({type: KEEPER.camTypes.orthographic})
		});
		
		// Create a basic shape (WIP: Only returns a fixed cube at the moment.):
		Main.kShape = KEEPER.CreateBasicKeeperShape();
		Main.kShape.sceneObj.position.x = 1.5;
		
		// Setting position of object
		Main.kScene.camera.position.z = 2;
		
		// How to add something to update loop
		KEEPER.AddToUpdate({ owner: Main, method: Main.InputHandler });
		
		// Create a simple collider
		Main.kColSphere = KEEPER.CreateCollisionSphere();
		Main.kColSphere.Show();
		
		// Create a collider with callbacks and custom properties
		Main.kOtherCollider = KEEPER.CreateCollisionSphere({
			hasDepth: true, //not a part of base object, but will exist in returned object
			color: 0x5555ff,
			OnCollisionEnter: (data) => { console.log ('a collision happened!') }, 
			OnCollisionStay: (data) => {  console.log ('a collision is happening!');},
			OnCollisionLeave: (data) => { 
				console.log ('a collision stopped happening!') 
				
				if ( Main.kOtherCollider.hasDepth ) {
					Main.kOtherCollider.DrawWithDepth();
				}
				else {
					Main.kOtherCollider.DrawOnTop();
				}
				
				Main.kOtherCollider.hasDepth = !Main.kOtherCollider.hasDepth;
			},
		});
		Main.kOtherCollider.sceneObj.position.x = -2;
		Main.kOtherCollider.Show();
	
		// Add objects to scene
		Main.kScene.Add(Main.kShape.sceneObj);
		Main.kScene.Add (Main.kColSphere.sceneObj);
		Main.kScene.Add (Main.kOtherCollider.sceneObj);
	},
	
	// Basic input handling
	InputHandler: () => {
		// Key Held example
		if (KEEPER.GetKeyHeld({key: 'j'}))
		{
			Main.kColSphere.sceneObj.rotation.x += 1 * KEEPER.deltaTime;
			Main.kColSphere.sceneObj.rotation.y += 1 * KEEPER.deltaTime;
			
			Main.kShape.sceneObj.rotation.x += 1 * KEEPER.deltaTime;
			Main.kShape.sceneObj.rotation.y += 1 * KEEPER.deltaTime;
		}
		
		// 1 frame key pressed example
		if (KEEPER.GetKeyDown({key: 'k'}))
		{
			Main.kColSphere.sceneObj.material.color = new THREE.Color (Math.random() * 0xffffff);
		}
		
		// 1 frame key up example
		if (KEEPER.GetKeyUp({key: 'l'}))
		{
			Main.kScene.camera.position.z = Math.random () * 8 + 2;
		}
		
		// Move the other collider
		if (KEEPER.GetKeyHeld({key: 'd'}))
		{
			Main.kOtherCollider.sceneObj.position.x += 1 * KEEPER.deltaTime;
		}
		
		if (KEEPER.GetKeyHeld({key: 'a'}))
		{
			Main.kOtherCollider.sceneObj.position.x -= 1 * KEEPER.deltaTime;
		}
	}
}