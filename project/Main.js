var Main = {
	_okayToRun: true,
	
	Start: () => {
		Main.kScene = KEEPER.CreateKeeperScene();
		Main.kShape = KEEPER.CreateBasicKeeperShape();
		Main.kScene.scene.add(Main.kShape.cube);
		Main.kScene.camera.position.z = 5;
	},
}