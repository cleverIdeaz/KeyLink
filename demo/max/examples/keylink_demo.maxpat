{
	"patcher" : 			 	{
		"fileversion" : 1,
		"appversion" : 				{
			"major" : 8,
			"minor" : 6,
			"revision" : 2,
			"architecture" : "x64",
			"modernui" : 1
		},
		"classnamespace" : "box",
		"rect" : [ 50.0, 50.0, 800.0, 600.0 ],
		"bglocked" : 0,
		"openinpresentation" : 0,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"objectsnapshots" : 0,
		"statusbarvisible" : 2,
		"toolbarsvisible" : 1,
		"lefttoolbarpinned" : 0,
		"toptoolbarpinned" : 0,
		"righttoolbarpinned" : 0,
		"bottomtoolbarpinned" : 0,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 1,
		"enablevscroll" : 1,
		"devicewidth" : 0.0,
		"description" : "",
		"digest" : "00000000000000000000000000000000",
		"tags" : "",
		"style" : "",
		"assistsize" : 0.0,
		"boxes" : [ 				{
				"box" : 				{
					"id" : "obj-1",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "keylink lan __LAN__",
					"fontsize" : 12.0,
					"fontface" : 0,
					"fontname" : "Arial",
					"presentation" : 1,
					"presentation_rect" : [ 50.0, 50.0, 120.0, 22.0 ],
					"rect" : [ 50.0, 50.0, 120.0, 22.0 ]
				}

			}, 				{
				"box" : 				{
					"id" : "obj-2",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "start",
					"fontsize" : 12.0,
					"fontface" : 0,
					"fontname" : "Arial",
					"presentation" : 1,
					"presentation_rect" : [ 50.0, 100.0, 50.0, 22.0 ],
					"rect" : [ 50.0, 100.0, 50.0, 22.0 ]
				}

			}, 				{
				"box" : 				{
					"id" : "obj-3",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "stop",
					"fontsize" : 12.0,
					"fontface" : 0,
					"fontname" : "Arial",
					"presentation" : 1,
					"presentation_rect" : [ 120.0, 100.0, 50.0, 22.0 ],
					"rect" : [ 120.0, 100.0, 50.0, 22.0 ]
				}

			}, 				{
				"box" : 				{
					"id" : "obj-4",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "bang",
					"fontsize" : 12.0,
					"fontface" : 0,
					"fontname" : "Arial",
					"presentation" : 1,
					"presentation_rect" : [ 50.0, 150.0, 50.0, 22.0 ],
					"rect" : [ 50.0, 150.0, 50.0, 22.0 ]
				}

			}, 				{
				"box" : 				{
					"id" : "obj-5",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "symbol" ],
					"text" : "tosymbol {\"type\":\"set-state\",\"state\":{\"key\":\"G\",\"mode\":\"Mixolydian\",\"tempo\":140}}",
					"fontsize" : 12.0,
					"fontface" : 0,
					"fontname" : "Arial",
					"presentation" : 1,
					"presentation_rect" : [ 50.0, 200.0, 300.0, 22.0 ],
					"rect" : [ 50.0, 200.0, 300.0, 22.0 ]
				}

			}, 				{
				"box" : 				{
					"id" : "obj-6",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "print kl",
					"fontsize" : 12.0,
					"fontface" : 0,
					"fontname" : "Arial",
					"presentation" : 1,
					"presentation_rect" : [ 200.0, 50.0, 60.0, 22.0 ],
					"rect" : [ 200.0, 50.0, 60.0, 22.0 ]
				}

			}, 				{
				"box" : 				{
					"id" : "obj-7",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "print status",
					"fontsize" : 12.0,
					"fontface" : 0,
					"fontname" : "Arial",
					"presentation" : 1,
					"presentation_rect" : [ 280.0, 50.0, 80.0, 22.0 ],
					"rect" : [ 280.0, 50.0, 80.0, 22.0 ]
				}

			}, 				{
				"box" : 				{
					"id" : "obj-8",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "mode wan",
					"fontsize" : 12.0,
					"fontface" : 0,
					"fontname" : "Arial",
					"presentation" : 1,
					"presentation_rect" : [ 50.0, 250.0, 80.0, 22.0 ],
					"rect" : [ 50.0, 250.0, 80.0, 22.0 ]
				}

			}, 				{
				"box" : 				{
					"id" : "obj-9",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "mode lan",
					"fontsize" : 12.0,
					"fontface" : 0,
					"fontname" : "Arial",
					"presentation" : 1,
					"presentation_rect" : [ 150.0, 250.0, 80.0, 22.0 ],
					"rect" : [ 150.0, 250.0, 80.0, 22.0 ]
				}

			}, 				{
				"box" : 				{
					"id" : "obj-10",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "channel myroom",
					"fontsize" : 12.0,
					"fontface" : 0,
					"fontname" : "Arial",
					"presentation" : 1,
					"presentation_rect" : [ 250.0, 250.0, 100.0, 22.0 ],
					"rect" : [ 250.0, 250.0, 100.0, 22.0 ]
				}

			}, 				{
				"box" : 				{
					"id" : "obj-11",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"text" : "KeyLink Demo Patch\n\nControls:\n• start/stop: Start/stop networking\n• bang: Send ping message\n• tosymbol: Send JSON message\n• mode lan/wan: Switch network modes\n• channel: Set channel name\n\nOutputs:\n• Left outlet: JSON messages\n• Right outlet: Status updates",
					"fontsize" : 12.0,
					"fontface" : 0,
					"fontname" : "Arial",
					"presentation" : 1,
					"presentation_rect" : [ 400.0, 50.0, 300.0, 200.0 ],
					"rect" : [ 400.0, 50.0, 300.0, 200.0 ]
				}

			} ],
		"lines" : [ 				{
				"patchline" : 				{
					"source" : [ "obj-2", 0 ],
					"destination" : [ "obj-1", 0 ],
					"hidden" : 0,
					"midpoints" : [  ]
				}

			}, 				{
				"patchline" : 				{
					"source" : [ "obj-3", 0 ],
					"destination" : [ "obj-1", 0 ],
					"hidden" : 0,
					"midpoints" : [  ]
				}

			}, 				{
				"patchline" : 				{
					"source" : [ "obj-4", 0 ],
					"destination" : [ "obj-1", 0 ],
					"hidden" : 0,
					"midpoints" : [  ]
				}

			}, 				{
				"patchline" : 				{
					"source" : [ "obj-5", 0 ],
					"destination" : [ "obj-1", 0 ],
					"hidden" : 0,
					"midpoints" : [  ]
				}

			}, 				{
				"patchline" : 				{
					"source" : [ "obj-1", 0 ],
					"destination" : [ "obj-6", 0 ],
					"hidden" : 0,
					"midpoints" : [  ]
				}

			}, 				{
				"patchline" : 				{
					"source" : [ "obj-1", 1 ],
					"destination" : [ "obj-7", 0 ],
					"hidden" : 0,
					"midpoints" : [  ]
				}

			}, 				{
				"patchline" : 				{
					"source" : [ "obj-8", 0 ],
					"destination" : [ "obj-1", 0 ],
					"hidden" : 0,
					"midpoints" : [  ]
				}

			}, 				{
				"patchline" : 				{
					"source" : [ "obj-9", 0 ],
					"destination" : [ "obj-1", 0 ],
					"hidden" : 0,
					"midpoints" : [  ]
				}

			}, 				{
				"patchline" : 				{
					"source" : [ "obj-10", 0 ],
					"destination" : [ "obj-1", 0 ],
					"hidden" : 0,
					"midpoints" : [  ]
				}

			} ],
		"dependency_cache" : [  ],
		"autosave" : 0
	}
} 