class_name Gfx
extends RefCounted

## Programmer-art primitives. Never load images from the filesystem.


static func rect_poly(parent: Node2D, origin: Vector2, size: Vector2, color: Color, z: int = 0) -> Polygon2D:
	var p := Polygon2D.new()
	p.color = color
	p.z_index = z
	p.polygon = PackedVector2Array([
		origin,
		origin + Vector2(size.x, 0.0),
		origin + size,
		origin + Vector2(0.0, size.y),
	])
	parent.add_child(p)
	return p


static func poly(parent: Node2D, points: PackedVector2Array, color: Color, z: int = 0) -> Polygon2D:
	var p := Polygon2D.new()
	p.polygon = points
	p.color = color
	p.z_index = z
	parent.add_child(p)
	return p


static func label(parent: Node, text: String, pos: Vector2, size: int = 16, color: Color = Color.WHITE) -> Label:
	var l := Label.new()
	l.text = text
	l.position = pos
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(l)
	return l


static func block_body(parent: Node, pos: Vector2, size: Vector2, color: Color) -> StaticBody2D:
	var body := StaticBody2D.new()
	body.position = pos
	body.collision_layer = Game.LAYER_WORLD
	body.collision_mask = 0
	var cs := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = size
	cs.shape = shape
	cs.position = size * 0.5
	body.add_child(cs)
	rect_poly(body, Vector2.ZERO, size, color)
	parent.add_child(body)
	return body
