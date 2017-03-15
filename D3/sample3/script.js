var mySVG = d3.select("#tasting")
    .append("svg")
    .attr("width", 600)
    .attr("height", 500);

var circle_center_x = 270;
var circle_center_y = 270;
var circle_radius = 100;
var spot_radius = 5;

var spotData = new Array();
var circleData = new Array();
var textData = new Array();
var polyData = new Array();
var orgTastePolyData = new Array();

var numSpotsPerCircle = 16;
var degIncrease = 360/numSpotsPerCircle;
var degree = 0;

var numOfCircles = 6;
var circleRadiusSpace = 30;
var circleRadius = 30;

var layer1 = mySVG.append('g');
var layer2 = mySVG.append('g');
var layer3 = mySVG.append('g');
var layer4 = mySVG.append('g');
var layer5 = mySVG.append('g');

// Fixed JSON
var orgTaste = JSON.parse('[{"taste":"Sweetness","score":5},{"taste":"Sourness","score":5},{"taste":"Saltiness","score":4},{"taste":"Bitterness","score":4},{"taste":"Unami","score":6},{"taste":"Coolness","score":5},{"taste":"Numbness","score":5},{"taste":"Astringency","score":5},{"taste":"Metallicness","score":6},{"taste":"Calcium","score":6},{"taste":"Fattiness","score":6},{"taste":"Heartiness ","score":4},{"taste":"Pungent","score":5},{"taste":"Astringent","score":5},{"taste":"Unsalted","score":4},{"taste":"Syrupy","score":6}]');

// Taste name list
var tasteNameList = [
  "Sweetness",
  "Sourness",
  "Saltiness",
  "Bitterness",
  "Unami",
  "Coolness",
  "Numbness",
  "Astringency",
  "Metallicness",
  "Calcium",
  "Fattiness",
  "Heartiness ",
  "Pungent",
  "Astringent",
  "Unsalted",
  "Syrupy"
  ];

// Define the polygon datastruct.
function updatePolyData(d)
{ 
  d.selected = true;    
  d3.select("#" + d.id)
    .classed("selected", d.selected)  

  var orgCircle = polyData[d.taste_id];
  
  if(orgCircle.id == d.id)
    return;
  
  orgCircle.selected = false;
  d3.select("#" + orgCircle.id)
        .classed("spot", !orgCircle.selected)
        .classed("selected", orgCircle.selected);
        
  polyData[d.taste_id] = d;
  console.log(polyData);
}


// Added by pony
for(var id = 0; id < numSpotsPerCircle; id++)
{
  textData.push ( {
    "x": Math.sin(  id * degIncrease * Math.PI / 180) * 220 + circle_center_x - 30,
    "y": Math.cos(  id * degIncrease * Math.PI / 180) * 210 + circle_center_y,
    "name": tasteNameList[id],
    "id": "taste" + id
  });
}

for (var i = 1;i <= 6; i++)
{
  degree = 0;
  for (var y = 0;y < numSpotsPerCircle; y++)
  {
     spotData.push({ 
      "x": Math.sin(  degree * Math.PI / 180) * circleRadius + circle_center_x, 
      "y": Math.cos(  degree * Math.PI / 180) * circleRadius + circle_center_y,
      "r": spot_radius,
      "id" : "spot" + y + "-" + i,
      "score_id": i,
      "taste_id": y,
      "selected": (i == 1) ? true : false
     });

     if(i == 1)
     {
      layer1.append("line")
      .attr("x1", circle_center_x)
      .attr("y1", circle_center_y)
      .attr("x2", Math.sin(  degree * Math.PI / 180) * 180 + circle_center_x)
      .attr("y2", Math.cos(  degree * Math.PI / 180) * 180 + circle_center_y);   
     }

     degree += degIncrease;
  }

  if(i <= 6)
  {
    layer2.append("circle")
      .attr("cx", circle_center_x)
      .attr("cy", circle_center_y)
      .attr("r", circleRadius)
      .attr("stroke", "black")
      .attr("stroke-width", "3")
      .attr("opacity", "0.5")
      .attr("fill", "none");
  }
  circleRadius += circleRadiusSpace;
}
  
// Write down taste labels
var labels = layer1
    .selectAll('text')
    .data(textData)
    .enter()
    .append("text");

labels
    .attr('x', function(d) { return d.x; })
    .attr('y', function(d) { return d.y; })
    .text( function (d) { return d.name; })
    .attr('fill', 'green')
    .attr("id", function(d){
      return d.id;
    })

// Drawing all circles
var spots = layer5
    .selectAll('circle')
    .data(spotData);

spots
    .enter()
    .append('circle')
    .attr('cx', function(d) {
        return d.x;
    })
    .attr('cy', function(d) {
        return d.y;
    })
    .attr('r', function(d) {
        return d.r;
    })
    .attr('id', function(d) {
        return d.id;
    })
    .attr('class', function(d) {
      if(d.selected)
        return 'selected';
      else
        return 'spot';
    })
    .on("mouseover", function(d) {
      d3.select("#" + d.id)
        .transition()
        .duration(100)
        .attr("r", 10);
      d3.select("#taste" + d.taste_id)
        .transition()
        .duration(100)
        .style("font-weight", "bold")
        .attr("fill", "magenta");
        
    })
    .on("mouseout", function(d) {
      d3.select("#" + d.id)
        .transition()
        .duration(100)
        .attr("r", 5);
      d3.select("#taste" + d.taste_id)
        .transition()
        .duration(100)
        .style("font-weight", "normal")
        .attr("fill", "green");
        
    })
    .on("click", function(d){
      updatePolyData(d);
      render();
    })
    .append("svg:title")
    .text(function(d) { return d.score_id; });

for(i = 0; i < numSpotsPerCircle; i++)
{
  polyData.push(spotData[i]);
  orgTastePolyData.push(spotData[(orgTaste[i].score - 1) * numSpotsPerCircle + i]);
}

layer3.selectAll("polygon")
    .data([orgTastePolyData])
    .enter().append("polygon")
    .attr("points",function(pData) {       
      return pData.map(function(d) { 
          return [d.x,d.y].join(","); }).join(" ");
      })
    .attr("stroke","black")
    .attr("fill","blue")
    .attr("opacity","0.5")
    .attr("stroke-width",2)
    .attr("id", "orgtaste");

layer4.selectAll("polygon")
    .data([polyData])
    .enter().append("polygon")
    .attr("points",function(pData) {       
      return pData.map(function(d) { 
          return [d.x,d.y].join(","); }).join(" ");
      })
    .attr("stroke","blue")
    .attr("fill","yellow")
    .attr("opacity","0.5")
    .attr("stroke-width",2)
    .attr("id", "polystatus");
        
render();

function render() {
  console.log("ok, drawing polygon");
  
  console.log(polyData.map(function(d) { 
    return [d.x,d.y].join(","); }));
 
  d3.select("#polystatus")
    .transition()
    .duration(300)
    .attr("points",function(pData) {       
      return pData.map(function(d) { 
          return [d.x,d.y].join(","); }).join(" ");
      });
}

function print_r(arr,level) {

  var dumped_text = "";

  if(!level) level = 0;

  //The padding given at the beginning of the line.
  var level_padding = "";

  for(var j = 0; j < level + 1; j++)
    level_padding += "    ";

  if(typeof(arr) == 'object') { //Array/Hashes/Objects 
    for(var item in arr) {
      var value = arr[item];

      if(typeof(value) == 'object') { //If it is an array,
        dumped_text += level_padding + "'" + item + "' ...\n";
        dumped_text += print_r(value,level+1);
      } else {
        dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
      }
    }
  } 
  else { //Stings/Chars/Numbers etc.
    dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
  }
  
  return dumped_text;
}

d3.select("#save")
  .on("click", function(d) {
    var jsonTaste = polyData.map(function(d){
      return { taste: textData[d.taste_id].name,
               score: d.score_id};
    });
    
    console.log(JSON.stringify(jsonTaste));
    localStorage.setItem('tasteStorage', JSON.stringify(jsonTaste));
  });
  
d3.select("#load")
  .on("click", function(d) {
    var jsonTaste = JSON.parse(localStorage.getItem('tasteStorage'));
    if(jsonTaste != undefined)
    {
      for(var i = 0; i < jsonTaste.length; i++)
      {
        updatePolyData(spotData[(jsonTaste[i].score - 1) * numSpotsPerCircle + i]);
      }
      render();
    }
  });
  
d3.select("#othertaste")
  .on("change", function() {
    var checkValue = this.checked;
    
    console.log("Checkvalue = ", checkValue);
    
    d3.select("#orgtaste")
      .transition()
      .duration(100)
      .attr("opacity", function(d){
        if(checkValue == true)
          return 0.5;
        else
          return 0;
      });
  });