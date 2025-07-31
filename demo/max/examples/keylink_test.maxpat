{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 8,
			"minor" : 6,
			"revision" : 2,
			"architecture" : "x64",
			"modernui" : 1
		},
		"classnamespace" : "box",
		"rect" : [ 54.0, 54.0, 600.0, 400.0 ],
		"bglocked" : 0,
		"openinpresentation" : 0,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"objectsnapshots" : 0,
		"statusbarvisible" : 2,
		"toolbarsvisible" : 1,
		"lefttoolbarspacing" : 0,
		"toptoolbarspacing" : 0,
		"statusbarsize" : 19,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 1,
		"enablevscroll" : 1,
		"devicewidth" : 0.0,
		"description" : "",
		"digest" : "",
		"tags" : "",
		"style" : "",
		"assistsize" : "auto",
		"assistspersist" : 0,
		"boxes" : [ 			{
				"box" : 				{
					"id" : "obj-1",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "keylink lan",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-1",
					"presentation" : 1,
					"presentation_rect" : [ 100.0, 50.0, 100.0, 22.0 ],
					"rect" : [ 100.0, 50.0, 100.0, 22.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-2",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "start",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-2",
					"presentation" : 1,
					"presentation_rect" : [ 100.0, 100.0, 50.0, 22.0 ],
					"rect" : [ 100.0, 100.0, 50.0, 22.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-3",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "bang",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-3",
					"presentation" : 1,
					"presentation_rect" : [ 100.0, 150.0, 50.0, 22.0 ],
					"rect" : [ 100.0, 150.0, 50.0, 22.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-4",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "stop",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-4",
					"presentation" : 1,
					"presentation_rect" : [ 100.0, 200.0, 50.0, 22.0 ],
					"rect" : [ 100.0, 200.0, 50.0, 22.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-5",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "print json",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-5",
					"presentation" : 1,
					"presentation_rect" : [ 250.0, 50.0, 80.0, 22.0 ],
					"rect" : [ 250.0, 50.0, 80.0, 22.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-6",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "print status",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-6",
					"presentation" : 1,
					"presentation_rect" : [ 250.0, 100.0, 80.0, 22.0 ],
					"rect" : [ 250.0, 100.0, 80.0, 22.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-7",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "print mode",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-7",
					"presentation" : 1,
					"presentation_rect" : [ 250.0, 150.0, 80.0, 22.0 ],
					"rect" : [ 250.0, 150.0, 80.0, 22.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-8",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "tosymbol {\"key\":\"G\",\"mode\":\"major\",\"tempo\":120}",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-8",
					"presentation" : 1,
					"presentation_rect" : [ 100.0, 250.0, 200.0, 22.0 ],
					"rect" : [ 100.0, 250.0, 200.0, 22.0 ]
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"id" : "obj-9",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "button",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-9",
					"presentation" : 1,
					"presentation_rect" : [ 50.0, 50.0, 24.0, 24.0 ],
					"rect" : [ 50.0, 50.0, 24.0, 24.0 ]
				}

			}
, 			{
				"patchline" : 				{
					"id" : "obj-10",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "button",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-10",
					"presentation" : 1,
					"presentation_rect" : [ 50.0, 100.0, 24.0, 24.0 ],
					"rect" : [ 50.0, 100.0, 24.0, 24.0 ]
				}

			}
, 			{
				"patchline" : 				{
					"id" : "obj-11",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "button",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-11",
					"presentation_rect" : [ 50.0, 150.0, 24.0, 24.0 ],
					"rect" : [ 50.0, 150.0, 24.0, 24.0 ]
				}

			}
, 			{
				"patchline" : 				{
					"id" : "obj-12",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "button",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-12",
					"presentation_rect" : [ 50.0, 200.0, 24.0, 24.0 ],
					"rect" : [ 50.0, 200.0, 24.0, 24.0 ]
				}

			}
, 			{
				"patchline" : 				{
					"id" : "obj-13",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"text" : "button",
					"fontname" : "Arial",
					"fontsize" : 12.0,
					"id" : "obj-13",
					"presentation_rect" : [ 50.0, 250.0, 24.0, 24.0 ],
					"rect" : [ 50.0, 250.0, 24.0, 24.0 ]
				}

			}
 ],
		"dependency_cache" : [ ],
		"autosave" : 0
	}

} 