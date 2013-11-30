// ==UserScript==
// @name        Upgrader(Manual)
// @namespace   ornicare
// @include     http://navigatorcraft.net/batiment/*
// @version     1
// @grant       GM_addStyle
// ==/UserScript==

addButton();

function addButton() {
    var zNode = document.createElement ('div');
    zNode.innerHTML = '<button id="myButtonForceMine" type="button">Force upgrade</button>';
      
    zNode.setAttribute ('id', 'myContainerForceMine');
    document.body.appendChild (zNode);
    

    
    //--- Activate the newly added button.
    document.getElementById ("myButtonForceMine").addEventListener (
        "click", ButtonClickAction, false
    );
    
    function ButtonClickAction (zEvent) {
        document.getElementById("myButtonForceMine").disabled = true; 
        alert('Trying to upgrade !');
        var splitS = window.location.href.split('/');
        var idBat = splitS[splitS.length-1];
        $.ajax({
        	url: "http://navigatorcraft.net/batiment/upgrade/"+idBat,
        	async: false,
        	type: "GET",
        	dataType: "html",
        	success: function(data) {
        	alert(data);
        	}
        	});

    }
    
        //--- Style our newly added elements using CSS.
    GM_addStyle ( multilineStr ( function () {/*!
        #myButtonForceMine {
      background: #3498db;
      background-image: -webkit-linear-gradient(top, #3498db, #2980b9);
      background-image: -moz-linear-gradient(top, #3498db, #2980b9);
      background-image: -ms-linear-gradient(top, #3498db, #2980b9);
      background-image: -o-linear-gradient(top, #3498db, #2980b9);
      background-image: linear-gradient(to bottom, #3498db, #2980b9);
      -webkit-border-radius: 28;
      -moz-border-radius: 28;
      border-radius: 28px;
      font-family: Arial;
      color: #ffffff;
      font-size: 20px;
      padding: 3px 20px 3px 20px;
      text-decoration: none;
    }
    
    #myButtonForceMine:hover {
      background: #3cb0fd;
      background-image: -webkit-linear-gradient(top, #3cb0fd, #3498db);
      background-image: -moz-linear-gradient(top, #3cb0fd, #3498db);
      background-image: -ms-linear-gradient(top, #3cb0fd, #3498db);
      background-image: -o-linear-gradient(top, #3cb0fd, #3498db);
      background-image: linear-gradient(to bottom, #3cb0fd, #3498db);
      text-decoration: none;
    }
    
    #myContainerForceMine {
        margin-top:                 5px;
        margin-bottom:                 5px;
        margin-left:                 17%;
    }
    */} ) );

    function multilineStr (dummyFunc) {
        var str = dummyFunc.toString ();
        str     = str.replace (/^[^\/]+\/\*!?/, '') // Strip function () { /*!
                .replace (/\s*\*\/\s*\}\s*$/, '')   // Strip */ }
                .replace (/\/\/.+$/gm, '') // Double-slash comments wreck CSS. Strip them.
                ;
        return str;
    }
}