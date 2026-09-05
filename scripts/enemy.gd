class_name Enemy
extends CharacterBody2D

enum Kind { WALKER, SPITTER, HOPPER }

const GRAVITY := 1400.0

var kind: Kind = Kind.WALKER
var hp: int = 2
var walk_speed: float = 70.0
var walk_dir: float = -1.0
var shoot_cd: float = 0.0
var hop_cd: float = 0.0
var dead: bool = false
var _gfx: Node2D
var _flash: float = 0.0


func setup(p_kind: Kind, pos: Vector2) -> void:
	kind = p_kind
	global_position = pos
	add_to_group("enemy")
	collision_layer = Game.LAYER_ENEMY
	collision_mask = Game.LAYER_WORLD
	match kind:
		Kind.WALKER:
			hp = 2
			walk_speed = 72.0
		Kind.SPITTER:
			hp = 3
			walk_speed = 0.0
		Kind.HOPPER:
			hp = 2
			walk_speed = 40.0
			hop_cd = 0.4
	_build()


func _build() -> void:
	var cs := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(22, 28)
	cs.shape = shape
	cs.position = Vector2(0, -14)
	add_child(cs)

	var hurt := Area2D.new()
	hurt.collision_layer = Game.LAYER_ENEMY
	hurt.collision_mask = Game.LAYER_PLAYER
	hurt.monitoring = true
	var hcs := CollisionShape2D.new()
	var hshape := RectangleShape2D.new()
	hshape.size = Vector2(24, 30)
	hcs.shape = hshape
	hcs.position = Vector2(0, -15)
	hurt.add_child(hcs)
	hurt.body_entered.connect(_on_touch)
	add_child(hurt)

	_gfx = Node2D.new()
	add_child(_gfx)
	match kind:
		Kind.WALKER:
			# Cult walker — red slab + horns
			Gfx.rect_poly(_gfx, Vector2(-12, -28), Vector2(24, 28), Color(0.72, 0.16, 0.18), 2)
			Gfx.poly(_gfx, PackedVector2Array([Vector2(-12, -28), Vector2(-4, -40), Vector2(0, -28)]), Color(0.45, 0.08, 0.1), 3)
			Gfx.poly(_gfx, PackedVector2Array([Vector2(12, -28), Vector2(4, -40), Vector2(0, -28)]), Color(0.45, 0.08, 0.1), 3)
			Gfx.rect_poly(_gfx, Vector2(-6, -20), Vector2(4, 4), Color(1, 0.85, 0.3), 3)
			Gfx.rect_poly(_gfx, Vector2(2, -20), Vector2(4, 4), Color(1, 0.85, 0.3), 3)
		Kind.SPITTER:
			# Perched gargoyle — orange hunk
			Gfx.rect_poly(_gfx, Vector2(-14, -26), Vector2(28, 26), Color(0.78, 0.42, 0.12), 2)
			Gfx.poly(_gfx, PackedVector2Array([Vector2(-18, -10), Vector2(-14, -26), Vector2(-6, -14)]), Color(0.55, 0.28, 0.08), 3)
			Gfx.poly(_gfx, PackedVector2Array([Vector2(18, -10), Vector2(14, -26), Vector2(6, -14)]), Color(0.55, 0.28, 0.08), 3)
			Gfx.rect_poly(_gfx, Vector2(-5, -20), Vector2(10, 6), Color(0.2, 0.05, 0.05), 3)
		Kind.HOPPER:
			# Crawler — magenta squat
			Gfx.rect_poly(_gfx, Vector2(-14, -18), Vector2(28, 18), Color(0.72, 0.18, 0.55), 2)
			Gfx.rect_poly(_gfx, Vector2(-10, -24), Vector2(8, 8), Color(0.9, 0.4, 0.75), 3)
			Gfx.rect_poly(_gfx, Vector2(2, -24), Vector2(8, 8), Color(0.9, 0.4, 0.75), 3)


func _physics_process(delta: float) -> void:
	if dead:
		return
	if _flash > 0.0:
		_flash -= delta
		_gfx.modulate = Color(1.4, 1.4, 1.4) if fmod(_flash, 0.08) < 0.04 else Color.WHITE
		if _flash <= 0.0:
			_gfx.modulate = Color.WHITE

	if not is_on_floor() and kind != Kind.SPITTER:
		velocity.y = min(velocity.y + GRAVITY * delta, 760.0)

	match kind:
		Kind.WALKER:
			_tick_walker(delta)
		Kind.SPITTER:
			_tick_spitter(delta)
		Kind.HOPPER:
			_tick_hopper(delta)

	if kind == Kind.SPITTER:
		velocity = Vector2.ZERO
	move_and_slide()

	if is_on_wall() and kind == Kind.WALKER:
		walk_dir *= -1.0
		_gfx.scale.x = walk_dir

	if global_position.y > 800.0:
		_die()


func _tick_walker(_delta: float) -> void:
	velocity.x = walk_dir * walk_speed
	_gfx.scale.x = walk_dir


func _tick_spitter(delta: float) -> void:
	shoot_cd -= delta
	var player := Game.get_player()
	if player == null:
		return
	if shoot_cd <= 0.25 and shoot_cd > 0.0:
		_gfx.modulate = Color(1.3, 0.8, 0.3)
	if shoot_cd <= 0.0:
		_gfx.modulate = Color.WHITE
		var dir := ((player as Node2D).global_position + Vector2(0, -18) - global_position).normalized()
		var b := Bullet.new()
		get_parent().add_child(b)
		b.setup(global_position + Vector2(0, -16), dir, false, 240.0)
		shoot_cd = 1.35


func _tick_hopper(delta: float) -> void:
	hop_cd -= delta
	var player := Game.get_player()
	if is_on_floor():
		velocity.x = move_toward(velocity.x, 0.0, 400.0 * delta)
		if hop_cd <= 0.0 and player != null:
			var dir: float = signf((player as Node2D).global_position.x - global_position.x)
			if dir == 0.0:
				dir = -1.0
			velocity.x = dir * 160.0
			velocity.y = -320.0
			hop_cd = 0.95
			_gfx.scale.x = dir


func _on_touch(body: Node) -> void:
	if dead:
		return
	if body.is_in_group("player") and body.has_method("kill"):
		body.kill()


func take_hit(amount: int) -> void:
	if dead:
		return
	hp -= amount
	_flash = 0.15
	if hp <= 0:
		_die()


func _die() -> void:
	if dead:
		return
	dead = true
	Game.kills += 1
	queue_free()
