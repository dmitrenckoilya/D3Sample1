(function () {
	// constructs new graph
	var graph = new DoubleStarGraph('#graph')
	
	$('select').on('change', function() {
		var val = $(this).val()
		d3.xhr('data/'+val, function(err, data) {
			// updates the graph
			var json = JSON.parse(data.responseText);
			json = convert_json(JSON.parse(data.responseText));	
			graph.update(json);
		})
	});
	
	d3.xhr('data/data.json', function(err, data) {
		// draw graph		
		var json = convert_json(JSON.parse(data.responseText));	
		graph.draw(json);
	});
	
	function convert_json(iniJson){
		
		var result = iniJson;
		
		var bucket_1_nodes = [];
		var bucket_1_links = [];
		var bucket_2_nodes = [];
		var bucket_2_links = [];
		
		var nodes1 = iniJson.bucket_1.nodes;
		for(var i = 0; i < nodes1.length; i++)
		{
			for(var j = 0; j < nodes1[i].length; j++)
			{
				var node_obj = {};
				
				node_obj["name"] = nodes1[i][j].name;
				node_obj["id"] = nodes1[i][j].id;
				if(j == 0)
				{
					node_obj["additional"] = "";
					node_obj["nodes"] = nodes1[i].length;
					bucket_1_links.push(nodes1[i][j].id);
				}
				else
				{
					node_obj["additional"] = nodes1[i][j-1].id;					
					node_obj["order"] = j;
				}
				bucket_1_nodes.push(node_obj);
			}
		}
		
		var nodes2 = iniJson.bucket_2.nodes;
		for(var i = 0; i < nodes2.length; i++)
		{
			for(var j = 0; j < nodes2[i].length; j++)
			{
				var node_obj = {};
				node_obj["name"] = nodes2[i][j].name;
				node_obj["id"] = nodes2[i][j].id;
				if(j == 0)
				{
					node_obj["additional"] = "";
					node_obj["nodes"] = nodes2[i].length;
					bucket_2_links.push(nodes2[i][j].id);
				}
				else
				{
					node_obj["additional"] = nodes2[i][j-1].id;					
					node_obj["order"] = j;
				}
				bucket_2_nodes.push(node_obj);
			}
		}
		
		var result = {
				"bucket_2": {
					"nodes": bucket_2_nodes,
					"links": bucket_2_links,
					"name": iniJson.bucket_2.name,
					"language":iniJson.bucket_2.language
				},
				"bucket_1": {
					"nodes": bucket_1_nodes,
					"links": bucket_1_links,
					"name": iniJson.bucket_1.name,
					"language":iniJson.bucket_1.language
				},
				"links": iniJson.links
		};
		return result;
	}
})()