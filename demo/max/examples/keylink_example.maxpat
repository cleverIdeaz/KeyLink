{
  "patcher": {
    "fileversion": 1,
    "rect": [100, 100, 600, 400],
    "bgcolor": [1, 1, 1, 1.0],
    "boxes": [
      { "box": { "maxclass": "newobj", "text": "keylink", "patching_rect": [200, 100, 80, 22] } },
      { "box": { "maxclass": "message", "text": "start", "patching_rect": [100, 50, 50, 22] } },
      { "box": { "maxclass": "message", "text": "stop", "patching_rect": [160, 50, 50, 22] } },
      { "box": { "maxclass": "message", "text": "{\"root\":\"G\",\"mode\":\"Dorian\"}", "patching_rect": [100, 150, 180, 22] } },
      { "box": { "maxclass": "newobj", "text": "dict", "patching_rect": [100, 200, 50, 22] } },
      { "box": { "maxclass": "comment", "text": "Example: Send/receive JSON or dicts for KeyLink sync", "patching_rect": [100, 250, 400, 40] } }
    ],
    "lines": [
      { "patchline": { "source": [1, 0], "destination": [0, 0] } },
      { "patchline": { "source": [2, 0], "destination": [0, 0] } },
      { "patchline": { "source": [3, 0], "destination": [0, 0] } },
      { "patchline": { "source": [4, 0], "destination": [0, 0] } }
    ]
  }
} 