/** 
 *	Constructor of Object
 * 		
 *		@param selector - selector of HTML element where you want to add graph
 */
var DoubleStarGraph = function (selector) {
	this.width = 2000;
	this.height = 1500;
	this.starRadius = 150;

	this.svg = d3.select(selector)
		.append('svg')
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('viewBox', '0 0 '+[this.width, this.height])
			.attr('preserveAspectRatio',"xMidYMid meet")
			.append('g')
}

/** 
 *	Computes an initial position of node according to bucket
 * 		
 *		@param center - incoming json to transform
 * 		@param i - indice of node in the array
 * 		@param vertextNum - amount of nodes in the bucket which node belongs to
 */
DoubleStarGraph.prototype.computeCircle = function(center, i, vertexNum) {
	return {
		x: this.starRadius * Math.cos(i*(2*Math.PI/vertexNum))+center.x,
		y: this.starRadius * Math.sin(i*(2*Math.PI/vertexNum))+center.y,
	}
}
/**
 * Wraps an actual drawing function. It transforms incoming object to an object
 * which is convenient for force layout to use
 *  
 *		@param inc_json - object like 
 * 			{
 *				bucket_1:{nodes:[{name: ... ,id: ..., }], links: [node_id, ...]},
 *				bucket_2:{nodes:[{name: ... ,id: ..., }], links: [node_id, ...]},
 *				links: [{source: ..., target: ..., sourceBucket: ...,  targetBucket: ...}, ...]
 *			}
 */
DoubleStarGraph.prototype.draw = function(inc_json) {
	var data = {nodes:[], links:[]},
		nodes_dict = {},
		bucket_1 = {'name': inc_json.bucket_1.name, 'bucket':0, is_bucket:true, fixed: true, x:this.width/2, y:2*this.height/7},
		bucket_2 = {'name': inc_json.bucket_2.name, 'bucket':1, is_bucket:true, fixed: true, x:this.width/2, y:5*this.height/7};
	inc_json.bucket_1.nodes.forEach(function(d,i){
		d['bucket']=0;
		data.nodes.push(d)
	})
	inc_json.bucket_2.nodes.forEach(function(d,i){
		d['bucket']=1;
		data.nodes.push(d)
	})
	data.nodes = inc_json.bucket_1.nodes.concat(inc_json.bucket_2.nodes);
	data.nodes.forEach(function(d, i){nodes_dict[d.id] = i;});
	data.nodes.push(bucket_1)
	data.nodes.push(bucket_2)

	nodes_dict['bucket_1'] = data.nodes.length-2;
	nodes_dict['bucket_2'] = data.nodes.length-1;

	inc_json.links.forEach(function(d, i){
		d.target = nodes_dict[d.target];
		d.source = nodes_dict[d.source];
		data.links.push(d);
	});

	inc_json.bucket_1.links.forEach(function(d,i) {
		data.links.push({'target':d, 'source':nodes_dict['bucket_1']})
	})

	inc_json.bucket_2.links.forEach(function(d,i) {
		data.links.push({'target':d, 'source':nodes_dict['bucket_2']})
	})
	return this._draw(data);
}

/**
 * Function that draws data on the canvas
 *
 * 		@param data - incoming data :
 *			{	
 *				links: [{source: ... , target: ... , id: ... }, ...],
 *				nodes: [{name: ... , bucket: ... , id: ... }, ...]
 * 			}
 */
DoubleStarGraph.prototype._draw = function(data) {
	//data.links = []
	var colors = ["#3366cc", "#dc3912"],
		self = this,
		links = [],
		bucket_2_nodes_amount = data.nodes.filter(function(d){return d.bucket==1;}).length,
		bucket_1_nodes_amount = data.nodes.filter(function(d){return d.bucket==0;}).length,
		bucket_2_nodes=0, 
		bucket_1_nodes=0;

	for (var i in data.nodes) {
		links.push({'target':+i, 'source':data.nodes[i].bucket == 1 ? data.nodes.length-1:data.nodes.length-2})
	}

	data.nodes.forEach(function(node, i) {
		if(!node.is_bucket) {
			if(node.bucket == 0 )
				var coords = self.computeCircle(data.nodes[data.nodes.length-2], bucket_1_nodes++, bucket_1_nodes_amount);
			else 				
				var coords = self.computeCircle(data.nodes[data.nodes.length-1], bucket_2_nodes++, bucket_2_nodes_amount);
			node.x = coords.x;
			node.y = coords.y;
			console.log(coords);
		}
	});
	

	this.force =  d3.layout.force()
	    .gravity(0.025)
	    .distance(this.starRadius)
		.charge(function(d) {return d.is_bucket ? -1000:-500})
	    .size([this.width, this.height])
	    .nodes(data.nodes)
	    .links(links)
	    .start();

	var inter_bucket = this.svg.selectAll('inter-bucket-links')
			.data(data.links).enter()
		.append('line')
			.style('opacity', 1)
			.style('stroke-width', function(d) {
				return data.nodes[d.source].bucket == data.nodes[d.target].bucket ? '3px' : '1px'
			})
			.classed('inter-bucket-links', true)
			.attr('stroke', function(d) {
				return data.nodes[d.source].bucket == data.nodes[d.target].bucket ? colors[data.nodes[d.target].bucket] : '#000'
			});

	var nodes = this.svg.selectAll('.node')
		.data(data.nodes)
		.enter()
			.append('g')
			.classed('node',true)
			.classed('bucket-node',function(d) {return d.is_bucket})
			.attr('fill', function(d) {return colors[d.bucket];})
			.call(this.force.drag);

	nodes.append('circle')
		.attr('r', '10px')
		.style('fill', function(d) {return colors[d.bucket];})

	nodes.append('text')
		.text(function(d) {return d.name})
			.attr('dy', '-5px')
			.attr('text-anchor', 'middle')
			.attr('font-size', function(d) {return d.is_bucket ? '125px': '50px';});

	this.svg.selectAll('.bucket-node').selectAll('text')
		.attr('fill', function(d) {return colors[d.bucket];})
		.attr('dy', '15px');

	this.force.on("tick", function(d) {
	    nodes.attr("transform", function(d) {
			var dd = d;
			if(d.additional !== "" && d.additional !== undefined)
			{
				var parent_node = data.nodes[+d.additional];
				var origin_node;
				
				if(d.bucket == 0)
				{
					origin_node = data.nodes[data.nodes.length - 2];
				}
				else // == 1
				{
					origin_node = data.nodes[data.nodes.length - 1];
				}
				
				var x1 = origin_node.x;
				var x2 = parent_node.x;
				var y1 = origin_node.y;
				var y2 = parent_node.y;
				
				var delta_x, delta_y;
				
				if(x1 > x2 && y1 > y2) {
					delta_x = x2 - (x1 - x2)/d.order;
					delta_y = y2 - (y1 - y2)/d.order;
				}
				
				if(x1 < x2 && y1 < y2) {
					delta_x = x2 + (x2 - x1)/d.order;
					delta_y = y2 + (y2 - y1)/d.order;
				}
				
				if(x1 > x2 && y1 < y2) {
					delta_x = x2 - (x1 - x2)/d.order;
					delta_y = y2 + (y2 - y1)/d.order;
				}
				
				if(x1 < x2 && y1 > y2) {
					delta_x = x2 + (x2 - x1)/d.order;
					delta_y = y2 - (y1 - y2)/d.order;
				}
				
				d.x = delta_x;
				d.y = delta_y;
			}
			return "translate(" + d.x + "," + d.y + ")";
		});
	    inter_bucket
	    	.attr('x1', function(d) {
				var dd = d.source;
				return data.nodes[d.source].x
			})
	    	.attr('x2', function(d) {
				
				var x1 = data.nodes[d.source].x;
				var x2 = data.nodes[d.target].x;
				
				var delta_x;
				
				if(x1 > x2) {
					delta_x = x2 - (x1 - x2)*(data.nodes[d.target].nodes - 1);					
				}
				else {
					delta_x = x2 + (x2 - x1)*(data.nodes[d.target].nodes - 1);
				}				
								
				if(d.source == data.nodes.length-2 || d.source == data.nodes.length-1)
				{
					return delta_x;
				}
				else
				{
					return data.nodes[d.target].x;
				}
				
			})
	    	.attr('y1', function(d) {
				return data.nodes[d.source].y
			})
	    	.attr('y2', function(d) {
				var y1 = data.nodes[d.source].y;
				var y2 = data.nodes[d.target].y;
				
				var delta_y;				
				
				if(y1 > y2) {
					delta_y = y2 - (y1 - y2)*(data.nodes[d.target].nodes - 1);
				}
				else {
					delta_y = y2 + (y2 - y1)*(data.nodes[d.target].nodes - 1);
				}
								
				if(d.source == data.nodes.length-2 || d.source == data.nodes.length-1)
				{
					return delta_y;
				}
				else
				{
					return data.nodes[d.target].y;
				}				
			})
	});
};

/**
 * Updates graph with new data
 * 
 *		@param data - object: 
 * 			{
 *				bucket_1:{nodes:[{name: ... ,id: ..., }], links: [node_id, ...]}
 *				bucket_2:{nodes:[{name: ... ,id: ..., }], links: [node_id, ...]}
 *				links: [{source: ..., target: ..., sourceBucket: ...,  targetBucket: ...}, ...]
 *			}
 */
DoubleStarGraph.prototype.update = function(data) {
	this.svg.selectAll('*').remove()
	this.svg.append('g')
	this.draw(data);
};