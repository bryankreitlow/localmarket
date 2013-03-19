(function () {
  "use strict";
  var paper;

  window.ScaleRaphael = function(container, width, height) {
    var wrapper = document.getElementById(container);
    wrapper.style.width = width + "px";
    wrapper.style.height = height + "px";
    wrapper.style.overflow = "hidden";

    wrapper.innerHTML = "<div id='svggroup'><\/div>";
    var nestedWrapper = document.getElementById("svggroup");

    paper = new Raphael(nestedWrapper, width, height);
    paper.w = width;
    paper.h = height;
    paper.canvas.setAttribute("viewBox", "0 0 "+width+" "+height);
    paper.changeSize = function() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      var ratioW = w / width;
      var ratioH = h / height;
      var scale = ratioW < ratioH ? ratioW : ratioH;

      var newHeight = Math.floor(height * scale);
      var newWidth = Math.floor(width * scale);

      wrapper.style.width = newWidth + "px";
      wrapper.style.height = newHeight + "px";
      paper.setSize(newWidth, newHeight);
    };
    window.onresize = function() {
      paper.changeSize();
    };

    paper.changeSize();

    return paper;
  };

    var R = ScaleRaphael("container", 1000, 900),
      attr = {
      "fill": "#d3d3d3",
      "stroke": "#fff",
      "stroke-opacity": "1",
      "stroke-linejoin": "round",
      "stroke-miterlimit": "4",
      "stroke-width": "0.75",
      "stroke-dasharray": "none"
    },
    usRaphael = {};
    
    //Draw Map and store Raphael paths
    for (var state in usMap) {
      usRaphael[state] = R.path(usMap[state]).attr(attr);
    }
    
    //Do Work on Map
    for (var state in usRaphael) {
      usRaphael[state].color = Raphael.getColor();
      
      (function (st, state) {

        st[0].style.cursor = "pointer";

        st[0].onmouseover = function () {
          st.animate({fill: st.color}, 500);
          st.toFront();
          R.safari();
        };

        st[0].onmousedown = function() {
          var stateLocation = state.toUpperCase();
          window.location = window.location + '/' + stateLocation;
        };

        st[0].onmouseout = function () {
          st.animate({fill: "#d3d3d3"}, 500);
          st.toFront();
          R.safari();
        };
                   
      })(usRaphael[state], state);
    }
            
  })();