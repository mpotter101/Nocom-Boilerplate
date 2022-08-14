var Main = {
	Start: () => {
		// Create a new scene:
		Main.kScene = KEEPER.CreateKeeperScene();
		
		// Create a basic shape (WIP):
		Main.kShape = KEEPER.CreateBasicKeeperShape();
		
		// ... maybe this should be automatic?
		Main.kScene.scene.add(Main.kShape.cube);
		
		// Setting position of object
		Main.kScene.camera.position.z = 5;
		
		// How to add something to update loop
		KEEPER.AddToUpdate({ owner: Main, method: Main.CubeInputHandler });
	},
	
	// Basic input handling
	CubeInputHandler: () => {
		if (KEEPER.GetKeyHeld({key: 'j'}))
		{
			console.log('here');
			Main.kShape.cube.rotation.x += 0.01;
			Main.kShape.cube.rotation.y += 0.01;
		}
		
		if (KEEPER.GetKeyDown({key: 'k'}))
		{
			Main.kShape.cube.material.color = new THREE.Color (Math.random() * 0xffffff);
		}
	}
}