class_name Bullet
extends Area2D

const GfxT := preload("res://scripts/gfx.gd")

var velocity: Vector2 = Vector2.ZERO
var life: float = 1.35
var damage: int = 1
var from_player: bool = true


func setup(origin: Vector2, dir: Vector2, player_owned: bool, speed: float = 680.0) -> void:
	global_position = origin
	velocity = dir.normalized() * speed
	from_player = player_owned
	add_to_group("bullet")
	collision_layer = Game.LAYER_PLAYER_BULLET if player_owned else Game.LAYER_ENEMY_BULLET
	if player_owned:
		collision_mask = Game.LAYER_WORLD | Game.LAYER_ENEMY
	else:
		collision_mask = Game.LAYER_WORLD | Game.LAYER_PLAYER
	monitoring = true
	monitorable = true

	var cs := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(10, 6)
	cs.shape = shape
	add_child(cs)

	var color := Color(1.0, 0.92, 0.35) if player_owned else Color(0.95, 0.25, 0.2)
	GfxT.rect_poly(self, Vector2(-6, -3), Vector2(12, 6), color, 4)
	if player_owned:
		GfxT.rect_poly(self, Vector2(-8, -1), Vector2(5, 2), Color(1, 1, 0.8), 5)

	body_entered.connect(_on_body)
	area_entered.connect(_on_area)


func _physics_process(delta: float) -> void:
	global_position += velocity * delta
	life -= delta
	if life <= 0.0:
		queue_free()


func _on_body(body: Node) -> void:
	if body is StaticBody2D:
		queue_free()
		return
	if from_player and body.is_in_group("enemy") and body.has_method("take_hit"):
		body.take_hit(damage)
		queue_free()
	elif not from_player and body.is_in_group("player") and body.has_method("kill"):
		body.kill()
		queue_free()


func _on_area(area: Node) -> void:
	if from_player and area.is_in_group("enemy") and area.has_method("take_hit"):
		area.take_hit(damage)
		queue_free()
	elif not from_player and area.is_in_group("player") and area.has_method("kill"):
		area.kill()
		queue_free()
