class_name Boss
extends CharacterBody2D

const GfxT := preload("res://scripts/gfx.gd")
const BulletT := preload("res://scripts/bullet.gd")

enum Phase { IDLE, TELL, SLAM, SPIT }

const GRAVITY := 1400.0
const MAX_HP := 16

var hp: int = MAX_HP
var phase: Phase = Phase.IDLE
var timer: float = 1.0
var next_is_slam: bool = true
var dead: bool = false
var _gfx: Node2D
var _tell_mark: Node2D
var _warn: Polygon2D
var _flash: float = 0.0


func setup(pos: Vector2) -> void:
	global_position = pos
	add_to_group("enemy")
	add_to_group("boss")
	collision_layer = Game.LAYER_ENEMY
	collision_mask = Game.LAYER_WORLD
	_build()


func _build() -> void:
	var cs := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(56, 72)
	cs.shape = shape
	cs.position = Vector2(0, -36)
	add_child(cs)

	var hurt := Area2D.new()
	hurt.collision_layer = Game.LAYER_ENEMY
	hurt.collision_mask = Game.LAYER_PLAYER
	var hcs := CollisionShape2D.new()
	var hshape := RectangleShape2D.new()
	hshape.size = Vector2(58, 74)
	hcs.shape = hshape
	hcs.position = Vector2(0, -37)
	hurt.add_child(hcs)
	hurt.body_entered.connect(_on_touch)
	add_child(hurt)

	_gfx = Node2D.new()
	add_child(_gfx)
	# Occult idol — big readable block, horns, eye
	GfxT.rect_poly(_gfx, Vector2(-30, -72), Vector2(60, 72), Color(0.38, 0.08, 0.12), 2)
	GfxT.rect_poly(_gfx, Vector2(-22, -88), Vector2(44, 20), Color(0.55, 0.12, 0.16), 3)
	GfxT.poly(_gfx, PackedVector2Array([Vector2(-30, -72), Vector2(-42, -110), Vector2(-10, -72)]), Color(0.22, 0.04, 0.06), 3)
	GfxT.poly(_gfx, PackedVector2Array([Vector2(30, -72), Vector2(42, -110), Vector2(10, -72)]), Color(0.22, 0.04, 0.06), 3)
	GfxT.rect_poly(_gfx, Vector2(-10, -64), Vector2(20, 14), Color(0.95, 0.2, 0.15), 4)
	GfxT.rect_poly(_gfx, Vector2(-4, -58), Vector2(8, 8), Color(1, 0.85, 0.3), 5)

	_tell_mark = Node2D.new()
	_tell_mark.visible = false
	_tell_mark.position = Vector2(0, -128)
	add_child(_tell_mark)
	GfxT.poly(_tell_mark, PackedVector2Array([Vector2(-10, -28), Vector2(10, -28), Vector2(0, 8)]), Color(1, 0.85, 0.15), 8)
	GfxT.rect_poly(_tell_mark, Vector2(-6, 12), Vector2(12, 10), Color(1, 0.85, 0.15), 8)

	_warn = GfxT.rect_poly(self, Vector2(-90, -8), Vector2(180, 8), Color(1, 0.2, 0.15, 0.0), 6)


func _physics_process(delta: float) -> void:
	if dead:
		return
	if not is_on_floor():
		velocity.y = min(velocity.y + GRAVITY * delta, 760.0)
	velocity.x = 0.0
	move_and_slide()

	if _flash > 0.0:
		_flash -= delta
		_gfx.modulate = Color(1.6, 1.6, 1.6)
		if _flash <= 0.0:
			_gfx.modulate = Color.WHITE

	timer -= delta
	match phase:
		Phase.IDLE:
			_tell_mark.visible = false
			_warn.color.a = 0.0
			_gfx.modulate = Color.WHITE
			if timer <= 0.0:
				phase = Phase.TELL
				timer = 0.80
		Phase.TELL:
			# Readable telegraph: gold bang + red body + slam lane on the floor.
			_tell_mark.visible = true
			var pulse := 0.55 + 0.45 * sin(Time.get_ticks_msec() * 0.02)
			_gfx.modulate = Color(1.2, 0.15 + pulse * 0.2, 0.12)
			_tell_mark.scale = Vector2.ONE * (1.0 + 0.15 * pulse)
			if next_is_slam:
				_warn.color = Color(1.0, 0.15, 0.1, 0.35 + 0.35 * pulse)
			else:
				_warn.color.a = 0.0
			if timer <= 0.0:
				if next_is_slam:
					phase = Phase.SLAM
					timer = 0.35
					_do_slam()
				else:
					phase = Phase.SPIT
					timer = 0.30
					_do_spit()
				next_is_slam = not next_is_slam
		Phase.SLAM, Phase.SPIT:
			_tell_mark.visible = false
			_warn.color.a = move_toward(_warn.color.a, 0.0, delta * 3.0)
			if timer <= 0.0:
				phase = Phase.IDLE
				timer = 1.05


func _do_slam() -> void:
	# Expanding floor shock — contact kills if the player is on the lane.
	var wave := Area2D.new()
	wave.collision_layer = Game.LAYER_ENEMY_BULLET
	wave.collision_mask = Game.LAYER_PLAYER
	var cs := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(200, 28)
	cs.shape = shape
	cs.position = Vector2(0, -10)
	wave.add_child(cs)
	var vis := Polygon2D.new()
	vis.color = Color(0.95, 0.25, 0.15, 0.7)
	vis.polygon = PackedVector2Array([
		Vector2(-100, -24), Vector2(100, -24), Vector2(100, 4), Vector2(-100, 4)
	])
	wave.add_child(vis)
	wave.body_entered.connect(func(body: Node) -> void:
		if body.is_in_group("player") and body.has_method("kill"):
			body.kill()
	)
	add_child(wave)
	var tw := create_tween()
	tw.tween_interval(0.28)
	tw.tween_callback(wave.queue_free)


func _do_spit() -> void:
	var player := Game.get_player()
	var base := Vector2.LEFT
	if player != null:
		base = ((player as Node2D).global_position + Vector2(0, -20) - global_position).normalized()
	for ang in [-0.45, -0.22, 0.0, 0.22, 0.45]:
		var b: Area2D = BulletT.new()
		get_parent().add_child(b)
		b.setup(global_position + Vector2(0, -48), base.rotated(ang), false, 260.0)


func _on_touch(body: Node) -> void:
	if dead:
		return
	if body.is_in_group("player") and body.has_method("kill"):
		body.kill()


func take_hit(amount: int) -> void:
	if dead:
		return
	hp -= amount
	_flash = 0.12
	if hp <= 0:
		_die()


func _die() -> void:
	if dead:
		return
	dead = true
	Game.kills += 1
	Game.boss_dead = true
	Game.stage_clear = true
	queue_free()
