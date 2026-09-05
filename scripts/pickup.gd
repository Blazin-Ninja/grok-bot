class_name WeaponPickup
extends Area2D

const GfxT := preload("res://scripts/gfx.gd")

var taken: bool = false
var _gfx: Node2D


func setup(pos: Vector2) -> void:
	global_position = pos
	add_to_group("pickup")
	collision_layer = Game.LAYER_PICKUP
	collision_mask = Game.LAYER_PLAYER
	monitoring = true
	monitorable = true

	var cs := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(28, 28)
	cs.shape = shape
	add_child(cs)

	_gfx = Node2D.new()
	add_child(_gfx)
	# Diamond — spread pickup
	GfxT.poly(_gfx, PackedVector2Array([
		Vector2(0, -16), Vector2(14, 0), Vector2(0, 16), Vector2(-14, 0)
	]), Color(0.95, 0.8, 0.15), 3)
	GfxT.poly(_gfx, PackedVector2Array([
		Vector2(0, -8), Vector2(7, 0), Vector2(0, 8), Vector2(-7, 0)
	]), Color(1, 0.95, 0.55), 4)
	# World-space letter mark (Control Labels do not stay in the world).
	GfxT.rect_poly(_gfx, Vector2(-3, -22), Vector2(6, 4), Color(1, 0.92, 0.4), 5)

	body_entered.connect(_on_body)


func _process(delta: float) -> void:
	if taken or _gfx == null:
		return
	_gfx.rotation += delta * 3.0
	_gfx.position.y = sin(Time.get_ticks_msec() * 0.006) * 4.0


func _on_body(body: Node) -> void:
	if taken:
		return
	if body.is_in_group("player"):
		taken = true
		Game.weapon = Game.WEAPON_SPREAD
		queue_free()
