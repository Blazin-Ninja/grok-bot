extends Node

## Global feel-pass state. No story locks. Restart resets the run.

const WEAPON_RAPID := "rapid"
const WEAPON_SPREAD := "spread"

const LAYER_WORLD := 1
const LAYER_PLAYER := 2
const LAYER_PLAYER_BULLET := 4
const LAYER_ENEMY := 8
const LAYER_ENEMY_BULLET := 16
const LAYER_PICKUP := 32

var weapon: String = WEAPON_RAPID
var deaths: int = 0
var kills: int = 0
var boss_dead: bool = false
var stage_clear: bool = false

var pad_stick: Vector2 = Vector2.ZERO
var pad_fire: bool = false
var pad_jump: bool = false

var rng: RandomNumberGenerator = RandomNumberGenerator.new()

var stage: Node = null

func _ready() -> void:
	rng.seed = 20260905
	_bind_inputs()


func reset_run() -> void:
	weapon = WEAPON_RAPID
	boss_dead = false
	stage_clear = false
	pad_stick = Vector2.ZERO
	pad_fire = false
	pad_jump = false


func restart_stage() -> void:
	deaths += 1
	reset_run()
	get_tree().reload_current_scene()


func get_player() -> Node:
	if stage != null and stage.has_method("get_player"):
		return stage.get_player()
	var nodes := get_tree().get_nodes_in_group("player")
	if nodes.size() > 0:
		return nodes[0]
	return null


func _bind_inputs() -> void:
	_ensure_action("move_left")
	_ensure_action("move_right")
	_ensure_action("move_up")
	_ensure_action("move_down")
	_ensure_action("jump")
	_ensure_action("fire")

	_add_key("move_left", KEY_A)
	_add_key("move_left", KEY_LEFT)
	_add_key("move_right", KEY_D)
	_add_key("move_right", KEY_RIGHT)
	_add_key("move_up", KEY_W)
	_add_key("move_up", KEY_UP)
	_add_key("move_down", KEY_S)
	_add_key("move_down", KEY_DOWN)

	_add_key("jump", KEY_X)
	_add_key("jump", KEY_K)
	_add_key("jump", KEY_SPACE)
	_add_key("fire", KEY_Z)
	_add_key("fire", KEY_J)

	_add_joy_button("jump", JOY_BUTTON_A)
	_add_joy_button("fire", JOY_BUTTON_B)
	_add_joy_axis("fire", JOY_AXIS_TRIGGER_RIGHT, 1.0)

	_add_joy_axis("move_left", JOY_AXIS_LEFT_X, -1.0)
	_add_joy_axis("move_right", JOY_AXIS_LEFT_X, 1.0)
	_add_joy_axis("move_up", JOY_AXIS_LEFT_Y, -1.0)
	_add_joy_axis("move_down", JOY_AXIS_LEFT_Y, 1.0)

	_add_joy_button("move_left", JOY_BUTTON_DPAD_LEFT)
	_add_joy_button("move_right", JOY_BUTTON_DPAD_RIGHT)
	_add_joy_button("move_up", JOY_BUTTON_DPAD_UP)
	_add_joy_button("move_down", JOY_BUTTON_DPAD_DOWN)


func _ensure_action(action: String) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action, 0.2)


func _add_key(action: String, keycode: Key) -> void:
	var ev := InputEventKey.new()
	ev.physical_keycode = keycode
	_add_event(action, ev)


func _add_joy_button(action: String, button: JoyButton) -> void:
	var ev := InputEventJoypadButton.new()
	ev.button_index = button
	_add_event(action, ev)


func _add_joy_axis(action: String, axis: JoyAxis, value: float) -> void:
	var ev := InputEventJoypadMotion.new()
	ev.axis = axis
	ev.axis_value = value
	_add_event(action, ev)


func _add_event(action: String, ev: InputEvent) -> void:
	for existing in InputMap.action_get_events(action):
		if existing.get_class() == ev.get_class():
			if ev is InputEventKey and existing is InputEventKey:
				if existing.physical_keycode == ev.physical_keycode:
					return
			elif ev is InputEventJoypadButton and existing is InputEventJoypadButton:
				if existing.button_index == ev.button_index:
					return
			elif ev is InputEventJoypadMotion and existing is InputEventJoypadMotion:
				if existing.axis == ev.axis and is_equal_approx(existing.axis_value, ev.axis_value):
					return
	InputMap.action_add_event(action, ev)
