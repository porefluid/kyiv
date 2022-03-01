//import collection and set visualization params
var kyiv = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[29.493199333624094, 51.02315415826779],
          [29.493199333624094, 50.1143087111848],
          [31.336155876592844, 50.1143087111848],
          [31.336155876592844, 51.02315415826779]]], null, false),
    vis2 = {"opacity":1,"bands":["VH_norm","VV_norm","VV_norm"],"min":0.15,"max":0.4,"gamma":1},
    s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    vis = {"opacity":1,"bands":["VV_norm","VH_norm","VH_norm"],"min":0.25,"max":0.75,"gamma":1},
    geometry = /* color: #04ff1d */ee.Geometry.MultiPoint();

// draw a reference region around Kyiv for image normalization statistics


// set a point from where social media reports suggest convoy buildup 
var geometry = ee.Geometry.Point([30.06474853644518, 50.84181041220485])

// set the target area
var target = geometry;
// define a function to normalie images and calculate a difference betwee co and cross polarized channels
var maxMinNorm = function(image){
  var max_vh = ee.Number(image.reduceRegion(ee.Reducer.max(), kyiv, 1000).get('VH'));
  var max_vv = ee.Number(image.reduceRegion(ee.Reducer.max(), kyiv, 1000).get('VV'));
  var min_vh = ee.Number(image.reduceRegion(ee.Reducer.min(), kyiv, 1000).get('VH'));
  var min_vv = ee.Number(image.reduceRegion(ee.Reducer.min(), kyiv, 1000).get('VV'));
  var ratio = image.select(['VV']).divide(image.select(['VH']));
  var norm_vh = image.select(['VH']).subtract(min_vh).divide(max_vh.subtract(min_vh));
  var norm_vv = image.select(['VV']).subtract(min_vv).divide(max_vv.subtract(min_vv));
  var date = image.date()
  return ratio.addBands(norm_vh).addBands(norm_vv).rename(['vv_div_vh', 'VH_norm', 'VV_norm'])
          .set('date', date);
  
};

// import the image collection and filter by target area and dates

s1 = s1.filterBounds(target).filterDate('2022-02-16', '2022-03-30');

//map function across collection
s1 = s1.map(maxMinNorm)

// convert to a list
s1 = s1.toList(s1.size());

// retrieve first list item
var first = ee.Image(s1.get(0))

// retrieve first list item
var last = ee.Image(s1.get(-1))

//calculate difference final minus initial
var dif = last.subtract(first).abs()

// add layers to map
Map.addLayer(ee.Image(s1.get(0)), vis, ee.Image(s1.get(0)).get('system:index').getInfo());
Map.addLayer(ee.Image(s1.get(-1)), vis, ee.Image(s1.get(-1)).get('system:index').getInfo());
Map.addLayer(dif, vis2, 'final minus initial');

// center map
Map.centerObject(target, 14)

// create drawing method
var drawingTools = Map.drawingTools();

// Only allow drawing lines.
drawingTools.setDrawModes(['line']);

// Get the layers list.
var layers = drawingTools.layers();

// Create a panel
var panel1 = ui.Panel([ui.Label({value: 'This map automatically updates to highlight differences between Sentinel-1 radar images at the location of Russian convoy build-up north of Kyiv.',
    style: {fontSize: '15px'}}),
    ui.Label({value: 'To measure distance, select the line tool in the upper left and double click when finished drawing.',
    style: {fontSize: '15px'}}),
    
    ui.Label({value: 'Sentinel-1 granule IDs are listed in the "Layers" tab in the top right',
    style: {fontSize: '15px'}}),
    
    ui.Label("@coreymaps").setUrl('https://twitter.com/coreymaps')]);
    
//Set panel position 
panel1.style().set({
  width: '300px',
  position: 'bottom-left'
});

//Add panel to map
Map.add(panel1);

//Set panel position
var panel2 = ui.Panel();
panel2.style().set({
  width: '150px',
  position: 'top-left'
});

//Add panel to map
Map.add(panel2);

// Register a function to measure length of a line and add to panel2
drawingTools.onDraw(function(line) {
  var length = ui.Label(ee.String(line.length().round().format()).cat(' meters').getInfo());
  panel2.add(length);
});

// Create the title label.
var title = ui.Label('Kyiv Convoy Tracker');
title.style().set('position', 'top-center');
Map.add(title);

Map.setOptions('SATELLITE');