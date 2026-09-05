class_name Stage
extends Node2D

const STAGE_W := 3800.0
const VIEW_H := 720.0
const GROUND_Y := 620.0

const GfxT := preload("res://scripts/gfx.gd")
const PlayerT := preload("res://scripts/player.gd")
const EnemyT := preload("res://scripts/enemy.gd")
const BossT := preload("res://scripts/boss.gd")
const PickupT := preload("res://scripts/pickup.gd")
const HudT := preload("res://scripts/hud.gd")
const PadT := preload("res://scripts/virtual_pad.gd")

var player: CharacterBody2D
var camera: Camera2D


func _ready() -> void:
	Game.stage = self
	Game.reset_run()
	_build_world()
	_spawn_player()
	_spawn_combat()
	_spawn_camera()
	_spawn_ui()
	for arg in OS.get_cmdline_user_args():
		if arg == "--screenshot":
			add_child(load("res://tools/capture_driver.gd").new())


func _exit_tree() -> void:
	if Game.stage == self:
		Game.stage = null


func get_player() -> CharacterBody2D:
	return player


func _build_world() -> void:
	# Backdrop — programmer art only, no textures from disk.
	var sky := Polygon2D.new()
	sky.color = Color(0.07, 0.05, 0.09)
	sky.polygon = PackedVector2Array([
		Vector2(0, 0), Vector2(STAGE_W, 0), Vector2(STAGE_W, VIEW_H), Vector2(0, VIEW_H)
	])
	sky.z_index = -20
	add_child(sky)

	# Far ruins
	for i in 8:
		var x := 180.0 + i * 430.0
		var h := 140.0 + (i % 3) * 50.0
		GfxT.rect_poly(self, Vector2(x, GROUND_Y - h), Vector2(70, h), Color(0.11, 0.08, 0.13), -10)
		if i % 2 == 0:
			GfxT.poly(self, PackedVector2Array([
				Vector2(x + 10, GROUND_Y - h),
				Vector2(x + 35, GROUND_Y - h - 60),
				Vector2(x + 60, GROUND_Y - h),
			]), Color(0.16, 0.09, 0.12), -9)

	# Moon
	GfxT.rect_poly(self, Vector2(240, 70), Vector2(46, 46), Color(0.55, 0.48, 0.52), -8)

	# Ground
	GfxT.block_body(self, Vector2(0, GROUND_Y), Vector2(STAGE_W, 100), Color(0.18, 0.12, 0.14))
	# Ground lip
	GfxT.rect_poly(self, Vector2(0, GROUND_Y - 6), Vector2(STAGE_W, 6), Color(0.32, 0.16, 0.18), -1)

	# Platforms (flat + a few ledges)
	_platform(380, 500, 180)
	_platform(760, 410, 170)
	_platform(1120, 500, 210)
	_platform(1540, 370, 180)
	_platform(1960, 500, 160)
	_platform(2320, 400, 220)
	_platform(2780, 500, 280)

	# Boss dais
	GfxT.block_body(self, Vector2(3180, GROUND_Y - 16), Vector2(420, 16), Color(0.28, 0.1, 0.12))


func _platform(x: float, y: float, w: float) -> void:
	GfxT.block_body(self, Vector2(x, y), Vector2(w, 18), Color(0.36, 0.2, 0.22))


func _spawn_player() -> void:
	player = PlayerT.new()
	player.name = "Player"
	add_child(player)
	player.global_position = Vector2(140, GROUND_Y - 2)


func _spawn_combat() -> void:
	_enemy(EnemyT.Kind.WALKER, Vector2(560, GROUND_Y - 2))
	_enemy(EnemyT.Kind.WALKER, Vector2(1020, GROUND_Y - 2))
	_enemy(EnemyT.Kind.WALKER, Vector2(1880, GROUND_Y - 2))
	_enemy(EnemyT.Kind.SPITTER, Vector2(840, 410 - 2))
	_enemy(EnemyT.Kind.SPITTER, Vector2(1630, 370 - 2))
	_enemy(EnemyT.Kind.SPITTER, Vector2(2420, 400 - 2))
	_enemy(EnemyT.Kind.HOPPER, Vector2(1360, GROUND_Y - 2))
	_enemy(EnemyT.Kind.HOPPER, Vector2(2580, GROUND_Y - 2))

	var pickup: Area2D = PickupT.new()
	add_child(pickup)
	pickup.setup(Vector2(1200, GROUND_Y - 28))

	var boss: CharacterBody2D = BossT.new()
	add_child(boss)
	boss.setup(Vector2(3380, GROUND_Y - 2))


func _enemy(kind: int, pos: Vector2) -> void:
	var e: CharacterBody2D = EnemyT.new()
	add_child(e)
	e.setup(kind, pos)


func _spawn_camera() -> void:
	camera = Camera2D.new()
	camera.enabled = true
	# Zoom so a ~50px player reads like NES Contra on a 720p phone.
	camera.zoom = Vector2(1.9, 1.9)
	camera.limit_left = 0
	camera.limit_top = 0
	camera.limit_right = int(STAGE_W)
	camera.limit_bottom = int(VIEW_H)
	camera.position_smoothing_enabled = true
	camera.position_smoothing_speed = 8.0
	add_child(camera)
	_update_camera(0.0)


func _spawn_ui() -> void:
	add_child(HudT.new())
	add_child(PadT.new())


func _process(delta: float) -> void:
	_update_camera(delta)


func _update_camera(_delta: float) -> void:
	if player == null or not is_instance_valid(player) or camera == null:
		return
	var look := Vector2(150, 0)
	var target: Vector2 = player.global_position + look
	# Lock vertical like Contra; keep ground in the lower third.
	target.y = 500.0
	camera.global_position = target


func spawn_test_enemy(pos: Vector2) -> Node:
	var e: CharacterBody2D = EnemyT.new()
	add_child(e)
	e.setup(EnemyT.Kind.WALKER, pos)
	return e
