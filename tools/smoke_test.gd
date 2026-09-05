extends SceneTree

## Headless proof: player exists, moves, shoots, enemy dies, restart works.
## Avoids autoload identifiers — `--script` compiles without Game as a global.

var _state: String = "boot"
var _age: float = 0.0
var _fails: PackedStringArray = PackedStringArray()
var _start_x: float = 0.0
var _enemy: Node
var _saw_bullets: int = 0
var _kills_before: int = 0
var _deaths_before: int = 0
var _player_ref: int = 0


func _initialize() -> void:
	print("SMOKE: boot")
	change_scene_to_file("res://scenes/main.tscn")


func _game() -> Node:
	return root.get_node_or_null("Game")


func _process(delta: float) -> bool:
	_age += delta
	if _age > 12.0:
		_fail("timeout in state " + _state)
		_finish(1)
		return true

	match _state:
		"boot":
			if _age > 0.25:
				_check_boot()
		"move":
			if _age > 0.45:
				_check_move()
		"shoot":
			_count_bullets()
			if _age > 0.25:
				_check_shoot()
		"kill":
			if _age > 0.55:
				_check_kill()
		"restart":
			if _age > 0.85:
				_check_restart()
	return false


func _player() -> Node:
	var g := _game()
	if g == null:
		return null
	return g.call("get_player")


func _check_boot() -> void:
	var p := _player()
	if p == null:
		_fail("player missing at boot")
		_finish(1)
		return
	if not p.visible:
		_fail("player not visible")
	if p.modulate.a < 0.5:
		_fail("player alpha hidden")
	if int(p.call("get_gfx_poly_count")) < 4:
		_fail("player has no drawn shape body")
	if p.global_position == Vector2.ZERO:
		_fail("player at origin (not placed)")
	_start_x = p.global_position.x
	p.set("use_debug", true)
	p.set("debug_axis", Vector2.RIGHT)
	p.set("debug_fire", false)
	_state = "move"
	_age = 0.0
	print("SMOKE: player ok at ", p.global_position)


func _check_move() -> void:
	var p := _player()
	if p == null:
		_fail("player missing after move")
		_finish(1)
		return
	if p.global_position.x <= _start_x + 8.0:
		_fail("player did not move right (x=%s start=%s)" % [p.global_position.x, _start_x])
	print("SMOKE: moved ", _start_x, " -> ", p.global_position.x)
	p.set("debug_axis", Vector2.RIGHT)
	p.set("debug_fire", true)
	_saw_bullets = 0
	_state = "shoot"
	_age = 0.0


func _count_bullets() -> void:
	_saw_bullets = get_nodes_in_group("bullet").size()


func _check_shoot() -> void:
	if _saw_bullets <= 0:
		_fail("no bullets spawned")
	else:
		print("SMOKE: bullets ", _saw_bullets)
	var p := _player()
	if p == null:
		_fail("player missing before kill test")
		_finish(1)
		return
	var g := _game()
	_kills_before = int(g.get("kills"))
	var stage: Node = g.get("stage")
	if stage != null and stage.has_method("spawn_test_enemy"):
		_enemy = stage.call("spawn_test_enemy", p.global_position + Vector2(90, 0))
		_enemy.set("walk_speed", 0.0)
		_enemy.set("walk_dir", 1.0)
	else:
		_fail("stage missing spawn_test_enemy")
		_finish(1)
		return
	p.set("debug_fire", true)
	p.set("debug_axis", Vector2.RIGHT)
	_state = "kill"
	_age = 0.0


func _check_kill() -> void:
	if _enemy != null and is_instance_valid(_enemy) and not bool(_enemy.get("dead")):
		_fail("enemy still alive after being shot")
	var g := _game()
	if int(g.get("kills")) <= _kills_before:
		_fail("kill counter did not increase")
	print("SMOKE: enemy died, kills=", g.get("kills"))
	var p := _player()
	if p == null:
		_fail("player missing before restart")
		_finish(1)
		return
	_deaths_before = int(g.get("deaths"))
	_player_ref = p.get_instance_id()
	p.call("kill")
	_state = "restart"
	_age = 0.0


func _check_restart() -> void:
	var g := _game()
	if int(g.get("deaths")) <= _deaths_before:
		_fail("death did not increment")
	var p := _player()
	if p == null:
		_fail("player missing after restart")
	elif p.get_instance_id() == _player_ref:
		_fail("player instance did not refresh after restart")
	elif not p.visible:
		_fail("restarted player not visible")
	else:
		print("SMOKE: restarted, new player at ", p.global_position)
	_finish(0 if _fails.is_empty() else 1)


func _fail(msg: String) -> void:
	_fails.append(msg)
	print("SMOKE FAIL: ", msg)


func _finish(code: int) -> void:
	if not _fails.is_empty():
		code = 1
		print("SMOKE: FAILED")
		for f in _fails:
			print(" - ", f)
	else:
		print("SMOKE: PASSED")
	quit(code)
