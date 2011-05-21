/*
Dual Wield
Authors: Karan Kurani, Ben Jacoby and Irene Liew
Free to do whatever you want with the code.
Using arbor.js for the graph visualization. Some of the code in this file is copied form 
of the sample given in the arbor.js site. http://arborjs.org
*/
    var Renderer = function(canvas){
    var canvas = $(canvas).get(0)
    var ctx = canvas.getContext("2d")
	//var gfx = arbor.Graphics(canvas)
    var particleSystem = null

    var that = {
      init:function(system){
        //
        // the particle system will call the init function once, right before the
        // first frame is to be drawn. it's a good place to set up the canvas and
        // to pass the canvas size to the particle system
        //
        // save a reference to the particle system for use in the .redraw() loop
        particleSystem = system

        // inform the system of the screen dimensions so it can map coords for us.
        // if the canvas is ever resized, screenSize should be called again with
        // the new dimensions
        particleSystem.screenSize(canvas.width, canvas.height)
        particleSystem.screenPadding(80) // leave an extra 80px of whitespace per side

        // set up some event handlers to allow for node-dragging
        that.initMouseHandling()
      },

      redraw:function(){
        //
        // redraw will be called repeatedly during the run whenever the node positions
        // change. the new positions for the nodes can be accessed by looking at the
        // .p attribute of a given node. however the p.x & p.y values are in the coordinates
        // of the particle system rather than the screen. you can either map them to
        // the screen yourself, or use the convenience iterators .eachNode (and .eachEdge)
        // which allow you to step through the actual node objects but also pass an
        // x,y point in the screen's coordinate system
        //
        ctx.fillStyle = "white"
        ctx.fillRect(0,0, canvas.width, canvas.height)

        particleSystem.eachEdge(function(edge, pt1, pt2){
          // edge: {source:Node, target:Node, length:#, data:{}}
          // pt1:  {x:#, y:#}  source position in screen coords
          // pt2:  {x:#, y:#}  target position in screen coords

          // draw a line from pt1 to pt2
          ctx.strokeStyle = "rgba(0,0,0, .1)"
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(pt1.x, pt1.y)
          ctx.lineTo(pt2.x, pt2.y)
          ctx.stroke()
        })

        particleSystem.eachNode(function(node, pt){
          // node: {mass:#, p:{x,y}, name:"", data:{}}
          // pt:   {x:#, y:#}  node position in screen coords

          // draw a rectangle centered at pt
          var w = ctx.measureText(node.name||"").width + 6
		  
		  if(node.data.nodeType == 'mainHeading'){
			ctx.clearRect(pt.x-w/2, pt.y-10, w+12,14)
		  	fontSize = '18';
			ctx.textAlign = "center"
			ctx.fillStyle = "black"
		  }
		  else if(node.data.nodeType == 'subSection'){
			ctx.clearRect(pt.x-w/2, pt.y-10, w,14)
		  	fontSize = '14';
			ctx.fillStyle = "#003687"//Dark Blue
		  }else if(node.data.nodeType == 'subSectionLink'){
		  	fontSize = '11';
			ctx.fillStyle = "D26200"//Dark Orange
		  }else if(node.data.nodeType == 'mainHeadingLink'){
		  	fontSize = '12';
			ctx.fillStyle = "green"
		  }else{
			fontSize = '11';
			ctx.fillStyle = "green"			
		  }
		  
		  //ctx.fillRect(pt.x-2, pt.y-fontSize+2, w,fontSize);
          ctx.font = "bold " + fontSize +  " Arial";
		  //ctx.font  = "bold 11px Arial";		  
		  ctx.fillText(node.name.length > 40 ? ( node.name.substring(0,40) + '...') : node.name ,pt.x, pt.y);
		  //ctx.fillText(node.data.link ,pt.x, pt.y);
        })
      },

      initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)
        var dragged = null;

        // set up a handler object that will initially listen for mousedowns then
        // for moves and mouseups while dragging
        var handler = {
          clicked:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            nearest = dragged = particleSystem.nearest(_mouseP);

            if (dragged && dragged.node !== null){
              // while we're dragging, don't let physics move the node
              dragged.node.fixed = true
            }

			if (nearest.node.data.link){
			  //alert('Link Clicked');
              var link = nearest.node.data.link
              if (link.match(/^#/)){
				 //alert('# type clicked');
				 chrome.tabs.update(wikiTabID, {
                    url: wikiTabURL + link
                 });

                 //$(that).trigger({type:"navigate", path:link.substr(1)})
              }
			  else if(link.match(/^\/wiki/)){
				 //alert('/wiki link clicked');
				 chrome.tabs.update(wikiTabID, {
                    url: 'http://en.wikipedia.org' + link
                 });
				 //$(that).trigger({type:"navigate", path: 'http://en.wikipedia.org' + $(link).text()})
			  }
			  else{
				 //alert('Possibly full formed or other link clicked');
                 chrome.tabs.update(wikiTabID, {
                    url: link
                 });
              }
              return false
            }

            $(canvas).bind('mousemove', handler.dragged)
            $(window).bind('mouseup', handler.dropped)

            return false
          },
          dragged:function(e){
            var pos = $(canvas).offset();
            var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)

            if (dragged && dragged.node !== null){
              var p = particleSystem.fromScreen(s)
              dragged.node.p = p
            }

            return false
          },

          dropped:function(e){
            if (dragged===null || dragged.node===undefined) return
            if (dragged.node !== null) dragged.node.fixed = false
            dragged.node.tempMass = 1000
            dragged = null
            $(canvas).unbind('mousemove', handler.dragged)
            $(window).unbind('mouseup', handler.dropped)
            _mouseP = null
            return false
          }
        }

        // start listening
        $(canvas).mousedown(handler.clicked);

      },

    }
    return that
  }

var thisTabID;
chrome.tabs.getCurrent(function(tab) {
    thisTabID = tab.id;
});


function reload() {
    chrome.tabs.update(thisTabID, {
        url: "node.html"
    });
}

function cleanLinks(p){
	var links = $('a', p);
	var cleaned_links = [];
	$(links).each(function(){
		//Only choosing links that do NOT have text of size 1 or less and or are of type of references like [10],[123] etc
		if($(this).text().length > 1 && !($(this).text().match(/\[[0-9]+\]/))){
			cleaned_links.push(this);
		}
	});
	return cleaned_links;
}
chrome.windows.getAll({
    "populate": true
},
findWikiTab);
var wikiTabID = 0;
var wikiTabURL = '';
var links;

function findWikiTab(windows) {

	//var sys = arbor.ParticleSystem({friction:.0001, stiffness:200, repulsion:80,gravity:true,fps:55,dt:0.02,precision:0.6})
	var sys = arbor.ParticleSystem(80, 200, 0.8) // create the system with sensible repulsion/stiffness/friction
    //sys.parameters({gravity:true}) // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...

    var numWindows = windows.length;

    for (var i = 0; i < numWindows; i++) {
        var win = windows[i];
        var numTabs = win.tabs.length;

        for (var j = 0; j < numTabs; j++) {
            var tab = win.tabs[j];
            if (tab.title.indexOf("Wikipedia") != -1) {
                wikiTabID = tab.id;
                wikiTabURL = tab.url;
                chrome.tabs.executeScript(wikiTabID, {
                    code: "chrome.extension.onRequest.addListener(function(request, sender, sendResponse) { if (request.action == 'getDOM') sendResponse({dom: document.body.innerHTML }); else sendResponse({});}); "
                });

                chrome.tabs.executeScript(wikiTabID, {
                    code: "var visualizerTabID = " + thisTabID
                });
                
                chrome.tabs.sendRequest(wikiTabID, {action: "getDOM"},function(response) {
                    var dom = document.implementation.createDocument('http://www.w3.org/1999/xhtml', 'html', null);
                    var body = document.createElementNS('http://www.w3.org/1999/xhtml', 'body');
					var mainHeading;
                    body.innerHTML = response.dom;
                    dom.documentElement.appendChild(body);
					$('body').append('<div id="centralNode"></div>');
                    //Attaching the main title.
                    $('#firstHeading', body).each(function() {
                        var p = $(this).next().contents('#jump-to-nav').nextUntil('h2');
						mainHeading = $(this).text();
						sys.addNode(mainHeading,{fixed:true,mass:5,nodeType:'mainHeading'});
						var links = cleanLinks(p);
						var count = 0;
						$(links).each(function() {
							sys.addNode($(this).text(),{mass:0.2,link:$(this).attr('href'),nodeType:'mainHeadingLink'});
							sys.addEdge(mainHeading,$(this).text());
							count = count + 1;
							if(count==30){
								return false;
							}
						});
                    });
                    //Attaching each of the sections.
                    $('h2 .mw-headline', body).each(function() {
                        var p = $(this).closest('h2').nextUntil('h2');
						subsectionHeading = $(this).text();
                        if(subsectionHeading==="External links" || subsectionHeading==="References" || subsectionHeading==="Notes"){
                        	return true;
                        }
                        // Format the URL of the sub-headers
                        hashloc = wikiTabURL.indexOf('#');
                        newWikiTabURL = wikiTabURL;
                        if (hashloc != -1)
                        {
                            newWikiTabURL = wikiTabURL.substr(0,hashloc);
                        }
                        
                        // Replace spaces with underscores for the IDs
                        newID = $(this).text().replace(/ /g,"_");
                        
						sys.addNode(subsectionHeading,{mass:1,link:newWikiTabURL+"#"+newID,nodeType:'subSection'});
						sys.addEdge(mainHeading,subsectionHeading);
						var links = cleanLinks(p);
						var count = 0;
						$(links).each(function() {
							sys.addNode($(this).text(),{mass:0.2,link:$(this).attr('href'),nodeType:'subSectionLink'});
							sys.addEdge(subsectionHeading,$(this).text());
							count = count + 1;
							if(count==20){
								return false;
							}
						});
                    });
                   
				   //Keep this statement to preserve the properties of main heading. Sometimes overwritten by link of same name.						
					sys.addNode(mainHeading,{mass:1,nodeType:'mainHeading'});
                });
            }
        }
    }
}