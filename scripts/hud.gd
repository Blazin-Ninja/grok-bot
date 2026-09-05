class_name FeelHud
extends CanvasLayer

var _weapon: Label
var _hint: Label
var _clear: Label


func _ready() -> void:
	layer = 70
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	_weapon = Gfx.label(root, "WEAPON  RAPID", Vector2(24, 16), 22, Color(0.95, 0.9, 0.75))
	_hint = Gfx.label(root, "STICK move+aim   FIRE hold   JUMP   down=duck", Vector2(24, 46), 14, Color(0.7, 0.68, 0.72))
	_clear = Gfx.label(root, "", Vector2(24, 72), 26, Color(1, 0.85, 0.3))


func _process(_delta: float) -> void:
	var name := "SPREAD" if Game.weapon == Game.WEAPON_SPREAD else "RAPID"
	_weapon.text = "WEAPON  " + name
	if Game.stage_clear:
		_clear.text = "CLEAR  —  gun check. Does it feel like Contra?"
	else:
		_clear.text = ""
