// ==UserScript==
// @name        ForceStart(Manual)
// @namespace   ornicare
// @include     http://navigatorcraft.net/batiment/2
// @include     http://navigatorcraft.net/batiment/7
// @version     1
// @grant       GM_addStyle
// ==/UserScript==


addButton();

function addButton() {
  
    var zNode = document.createElement ('div');
    zNode.innerHTML = '<button id="forceStartButton" type="button">Force start !</button>';
      
    zNode.setAttribute ('id', 'forceStart');
    document.body.appendChild (zNode);
    

    
    //--- Activate the newly added button.
    document.getElementById ("forceStartButton").addEventListener (
        "click", ButtonClickActionForceStart, false
    );

    function ButtonClickActionForceStart (zEvent) {
        document.getElementById("forceStartButton").disabled = true; 
        if(document.getElementsByTagName('form').length>0)
        {
            //get the form to fill
            var form = document.getElementsByTagName('form')[0];
            
            //get the current state (can we send a new task ?)
            if(document.getElementById("divBoutonExplo")!=null) {
                alert('Trying to start !');
                form.submit();
            }
        }

    }
    
    //--- Style our newly added elements using CSS.
    GM_addStyle ( multilineStr ( function () {/*!
        #forceStartButton {
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
    
    #forceStartButton:hover {
      background: #3cb0fd;
      background-image: -webkit-linear-gradient(top, #3cb0fd, #3498db);
      background-image: -moz-linear-gradient(top, #3cb0fd, #3498db);
      background-image: -ms-linear-gradient(top, #3cb0fd, #3498db);
      background-image: -o-linear-gradient(top, #3cb0fd, #3498db);
      background-image: linear-gradient(to bottom, #3cb0fd, #3498db);
      text-decoration: none;
    }
    
    #forceStart {
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

