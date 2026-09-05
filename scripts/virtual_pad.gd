class_name VirtualPad
extends CanvasLayer

const GfxT := preload("res://scripts/gfx.gd")

## Left stick: move + 8-way aim. Right: FIRE (hold) and JUMP.

const STICK_R := 78.0
const DEAD := 0.22

var _stick_origin: Vector2
var _stick_finger: int = -1
var _fire_finger: int = -1
var _jump_finger: int = -1

var _base: Control
var _knob: ColorRect
var _fire_btn: ColorRect
var _jump_btn: ColorRect
var _fire_label: Label
var _jump_label: Label


func _ready() -> void:
	layer = 80
	process_mode = Node.PROCESS_MODE_ALWAYS

	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	_base = _circle_box(root, Vector2(120, 720 - 140), Vector2(156, 156), Color(0.12, 0.1, 0.14, 0.55))
	_knob = _box(_base, Vector2(46, 46), Vector2(64, 64), Color(0.85, 0.85, 0.9, 0.85))
	_stick_origin = _base.position + _base.size * 0.5

	_fire_btn = _box(root, Vector2(1280 - 250, 720 - 168), Vector2(96, 96), Color(0.7, 0.18, 0.16, 0.72))
	_fire_label = GfxT.label(_fire_btn, "FIRE", Vector2(22, 34), 20, Color(1, 0.92, 0.9))
	_jump_btn = _box(root, Vector2(1280 - 130, 720 - 168), Vector2(96, 96), Color(0.2, 0.42, 0.78, 0.72))
	_jump_label = GfxT.label(_jump_btn, "JUMP", Vector2(18, 34), 20, Color(0.9, 0.95, 1))

	# Re-anchor on resize so Android landscape stays usable.
	root.resized.connect(_relayout)
	_relayout()


func _relayout() -> void:
	var vp := get_viewport().get_visible_rect().size
	_base.position = Vector2(48, vp.y - 196)
	_stick_origin = _base.position + _base.size * 0.5
	_fire_btn.position = Vector2(vp.x - 250, vp.y - 176)
	_jump_btn.position = Vector2(vp.x - 130, vp.y - 176)


func _box(parent: Control, pos: Vector2, size: Vector2, color: Color) -> ColorRect:
	var r := ColorRect.new()
	r.position = pos
	r.size = size
	r.color = color
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(r)
	return r


func _circle_box(parent: Control, pos: Vector2, size: Vector2, color: Color) -> Control:
	return _box(parent, pos, size, color)


func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		_handle_touch(event.index, event.position, event.pressed)
	elif event is InputEventScreenDrag:
		if event.index == _stick_finger:
			_update_stick(event.position)
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		_handle_touch(100, event.position, event.pressed)
	elif event is InputEventMouseMotion and _stick_finger == 100:
		_update_stick(event.position)


func _handle_touch(index: int, pos: Vector2, pressed: bool) -> void:
	if not pressed:
		if index == _stick_finger:
			_stick_finger = -1
			Game.pad_stick = Vector2.ZERO
			_knob.position = Vector2(46, 46)
		if index == _fire_finger:
			_fire_finger = -1
			Game.pad_fire = false
			_fire_btn.color.a = 0.72
		if index == _jump_finger:
			_jump_finger = -1
			Game.pad_jump = false
			_jump_btn.color.a = 0.72
		return

	if _fire_hit(pos):
		_fire_finger = index
		Game.pad_fire = true
		_fire_btn.color.a = 1.0
		get_viewport().set_input_as_handled()
		return
	if _jump_hit(pos):
		_jump_finger = index
		Game.pad_jump = true
		_jump_btn.color.a = 1.0
		get_viewport().set_input_as_handled()
		return
	if _stick_hit(pos) or pos.x < get_viewport().get_visible_rect().size.x * 0.42:
		_stick_finger = index
		_update_stick(pos)
		get_viewport().set_input_as_handled()


func _stick_hit(pos: Vector2) -> bool:
	return Rect2(_base.position, _base.size).grow(24).has_point(pos)


func _fire_hit(pos: Vector2) -> bool:
	return Rect2(_fire_btn.position, _fire_btn.size).grow(12).has_point(pos)


func _jump_hit(pos: Vector2) -> bool:
	return Rect2(_jump_btn.position, _jump_btn.size).grow(12).has_point(pos)


func _update_stick(pos: Vector2) -> void:
	var delta := pos - _stick_origin
	if delta.length() > STICK_R:
		delta = delta.normalized() * STICK_R
	_knob.position = Vector2(46, 46) + delta * 0.55
	var v := delta / STICK_R
	if v.length() < DEAD:
		Game.pad_stick = Vector2.ZERO
	else:
		Game.pad_stick = v.limit_length(1.0)
