var Main = {
	_okayToRun: true,
	
	Start: () => {
		Main.kScene = KEEPER.CreateKeeperScene();
		Main.kShape = KEEPER.CreateBasicKeeperShape();
		Main.kScene.scene.add(Main.kShape.cube);
		Main.kScene.camera.position.z = 5;
		KEEPER.Render();
	},
	
	RenderLoop: () => {
		if (!Main._okayToRun) {return}
		
		try {
			requestAnimationFrame(Main.RenderLoop);
		
			Main.kShape.cube.rotation.x += 0.01;
			Main.kShape.cube.rotation.y += 0.01;
			
			KEEPER.Render();
		}
		catch (e) {
			console.error(e);
			Main._okayToRun = false;
		}
	}
}