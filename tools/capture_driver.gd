extends Node

## Drives the player and writes proof screenshots. Desktop / display only.

var _player: Player
var _step: int = 0


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	await get_tree().process_frame
	await get_tree().process_frame
	_player = Game.get_player() as Player
	if _player == null:
		push_error("capture: no player")
		get_tree().quit(1)
		return
	_player.use_debug = true
	await _shot("proof/01_boot_player_visible.png")
	_player.debug_axis = Vector2.RIGHT
	_player.debug_fire = true
	await _wait_frames(28)
	await _shot("proof/02_running_and_firing.png")
	_player.debug_jump = true
	await _wait_frames(8)
	_player.debug_jump = false
	await _wait_frames(10)
	await _shot("proof/03_jump_air_fire.png")
	print("CAPTURE: wrote proof screenshots")
	get_tree().quit(0)


func _wait_frames(n: int) -> void:
	for i in n:
		await get_tree().physics_frame


func _shot(rel: String) -> void:
	await RenderingServer.frame_post_draw
	var img: Image = get_viewport().get_texture().get_image()
	if img == null:
		push_error("capture: empty viewport")
		return
	var path := ProjectSettings.globalize_path("res://").path_join(rel)
	var dir := path.get_base_dir()
	DirAccess.make_dir_recursive_absolute(dir)
	var err := img.save_png(path)
	print("CAPTURE: ", path, " err=", err, " size=", img.get_width(), "x", img.get_height())
