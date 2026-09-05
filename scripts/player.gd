class_name Player
extends CharacterBody2D

const RUN_SPEED := 250.0
const ACCEL := 5200.0
const FRICTION := 4800.0
const JUMP_VELOCITY := -470.0
const GRAVITY := 1400.0
const MAX_FALL := 760.0
const COYOTE := 0.09
const STICK_DEAD := 0.28
const DUCK_THRESH := 0.58
const FIRE_RAPID := 0.10
const FIRE_SPREAD := 0.16
const BULLET_SPEED := 700.0

var aim: Vector2 = Vector2.RIGHT
var ducking: bool = false
var facing: float = 1.0
var fire_cd: float = 0.0
var coyote: float = 0.0
var jump_cut_used: bool = false
var dead: bool = false

## Smoke / capture hooks. When use_debug is true, pad+device input is ignored.
var use_debug: bool = false
var debug_axis: Vector2 = Vector2.ZERO
var debug_fire: bool = false
var debug_jump: bool = false

var _gfx: Node2D
var _col: CollisionShape2D
var _stand_shape: RectangleShape2D
var _duck_shape: RectangleShape2D
var _muzzle: Polygon2D
var _was_jump_held: bool = false
var _muzzle_hide: float = 0.0


func _ready() -> void:
	add_to_group("player")
	collision_layer = Game.LAYER_PLAYER
	collision_mask = Game.LAYER_WORLD
	floor_stop_on_slope = true
	floor_snap_length = 6.0
	_build_collision()
	_build_gfx()


func _build_collision() -> void:
	_col = CollisionShape2D.new()
	_stand_shape = RectangleShape2D.new()
	_stand_shape.size = Vector2(18, 36)
	_duck_shape = RectangleShape2D.new()
	_duck_shape.size = Vector2(18, 20)
	_col.shape = _stand_shape
	_col.position = Vector2(0, -18)
	add_child(_col)


func _build_gfx() -> void:
	# Origin at feet. All drawn shapes — no Image.load, no file textures.
	_gfx = Node2D.new()
	_gfx.name = "Gfx"
	add_child(_gfx)

	# Outline so the player never disappears into the backdrop.
	Gfx.rect_poly(_gfx, Vector2(-12, -40), Vector2(24, 40), Color(0.05, 0.06, 0.08), 1)
	# Coat
	Gfx.rect_poly(_gfx, Vector2(-10, -36), Vector2(20, 36), Color(0.78, 0.82, 0.86), 2)
	# Chest slash (readable silhouette)
	Gfx.rect_poly(_gfx, Vector2(-6, -28), Vector2(12, 8), Color(0.45, 0.12, 0.16), 3)
	# Head
	Gfx.rect_poly(_gfx, Vector2(-7, -50), Vector2(14, 14), Color(0.93, 0.88, 0.78), 3)
	# Hair / occult mark
	Gfx.rect_poly(_gfx, Vector2(-7, -54), Vector2(14, 6), Color(0.18, 0.12, 0.14), 4)
	Gfx.rect_poly(_gfx, Vector2(-3, -48), Vector2(6, 4), Color(0.7, 0.12, 0.18), 4)
	# Legs
	Gfx.rect_poly(_gfx, Vector2(-9, -12), Vector2(7, 12), Color(0.28, 0.22, 0.24), 2)
	Gfx.rect_poly(_gfx, Vector2(2, -12), Vector2(7, 12), Color(0.28, 0.22, 0.24), 2)
	# Gun
	Gfx.rect_poly(_gfx, Vector2(8, -26), Vector2(22, 6), Color(0.86, 0.7, 0.18), 4)
	_muzzle = Gfx.rect_poly(_gfx, Vector2(28, -28), Vector2(8, 10), Color(1, 0.95, 0.4), 5)
	_muzzle.visible = false


func _physics_process(delta: float) -> void:
	if dead:
		return

	var stick := _read_stick()
	var jump_held := false
	var jump_just := false
	var fire_held := false
	if use_debug:
		jump_held = debug_jump
		jump_just = debug_jump and not _was_jump_held
		fire_held = debug_fire
		_was_jump_held = debug_jump
	else:
		jump_held = Game.pad_jump or Input.is_action_pressed("jump")
		jump_just = Input.is_action_just_pressed("jump") or (Game.pad_jump and not _was_jump_held)
		fire_held = Game.pad_fire or Input.is_action_pressed("fire")
		_was_jump_held = Game.pad_jump or Input.is_action_pressed("jump")

	_update_aim(stick)

	ducking = is_on_floor() and stick.y > DUCK_THRESH and abs(stick.x) < 0.55
	_apply_duck_pose()

	if ducking:
		velocity.x = move_toward(velocity.x, 0.0, FRICTION * delta)
	else:
		var target := stick.x * RUN_SPEED
		if abs(stick.x) > 0.35:
			# Contra is digital; snap run once the stick leaves the dead zone.
			target = sign(stick.x) * RUN_SPEED
		var rate := ACCEL if abs(target) > 1.0 else FRICTION
		velocity.x = move_toward(velocity.x, target, rate * delta)

	if is_on_floor():
		coyote = COYOTE
		jump_cut_used = false
	else:
		coyote -= delta

	if jump_just and coyote > 0.0 and not ducking:
		velocity.y = JUMP_VELOCITY
		coyote = 0.0
		jump_cut_used = false

	if not is_on_floor():
		if not jump_held and velocity.y < 0.0 and not jump_cut_used:
			velocity.y *= 0.48
			jump_cut_used = true
		velocity.y = min(velocity.y + GRAVITY * delta, MAX_FALL)

	move_and_slide()

	if global_position.y > 780.0:
		kill()
		return

	fire_cd = max(0.0, fire_cd - delta)
	if fire_held and fire_cd <= 0.0:
		_shoot()
	if _muzzle_hide > 0.0:
		_muzzle_hide -= delta
		if _muzzle_hide <= 0.0 and _muzzle != null:
			_muzzle.visible = false

	_gfx.scale.x = facing


func _read_stick() -> Vector2:
	if use_debug:
		return debug_axis
	var joy := Vector2(
		Input.get_axis("move_left", "move_right"),
		Input.get_axis("move_up", "move_down")
	)
	var pad := Game.pad_stick
	if pad.length() >= joy.length():
		return pad
	return joy


func _update_aim(stick: Vector2) -> void:
	if stick.length() < STICK_DEAD:
		aim = Vector2(facing, 0.0)
		return
	var snapped := _snap8(stick)
	if snapped == Vector2.ZERO:
		aim = Vector2(facing, 0.0)
		return
	aim = snapped
	if abs(snapped.x) > 0.01:
		facing = sign(snapped.x)


func _snap8(v: Vector2) -> Vector2:
	if v.length() < STICK_DEAD:
		return Vector2.ZERO
	var step := PI / 4.0
	var snapped_angle: float = roundf(v.angle() / step) * step
	return Vector2.from_angle(snapped_angle)


func _apply_duck_pose() -> void:
	if ducking:
		_col.shape = _duck_shape
		_col.position = Vector2(0, -10)
		_gfx.scale.y = 0.58
		_gfx.position.y = 16
	else:
		_col.shape = _stand_shape
		_col.position = Vector2(0, -18)
		_gfx.scale.y = 1.0
		_gfx.position.y = 0


func _shoot() -> void:
	var dir := aim
	if dir.length() < 0.01:
		dir = Vector2(facing, 0.0)
	dir = dir.normalized()
	var muzzle_y := -18.0 if not ducking else -8.0
	var origin := global_position + Vector2(0.0, muzzle_y) + dir * 26.0
	var parent := get_parent()
	if Game.weapon == Game.WEAPON_SPREAD:
		for ang in [-0.30, 0.0, 0.30]:
			_spawn_bullet(parent, origin, dir.rotated(ang))
		fire_cd = FIRE_SPREAD
	else:
		_spawn_bullet(parent, origin, dir)
		fire_cd = FIRE_RAPID
	_muzzle.visible = true
	_muzzle_hide = 0.04


func _spawn_bullet(parent: Node, origin: Vector2, dir: Vector2) -> void:
	var b := Bullet.new()
	parent.add_child(b)
	b.setup(origin, dir, true, BULLET_SPEED)


func kill() -> void:
	if dead:
		return
	dead = true
	visible = true
	modulate = Color(1, 0.3, 0.3)
	# Bind the autoload method — do not capture this Player in a lambda.
	get_tree().create_timer(0.35).timeout.connect(Game.restart_stage, CONNECT_ONE_SHOT)


func get_gfx_poly_count() -> int:
	var n := 0
	for c in _gfx.get_children():
		if c is Polygon2D:
			n += 1
	return n
