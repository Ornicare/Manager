// ==UserScript==
// @name        Manager
// @namespace   ornicare
// @include     http://navigatorcraft.net/*
// @require     http://ornilabs.com/scripts/hashMap.js
// @require		http://code.jquery.com/jquery-latest.js
// @version     1
// @grant       GM_setValue
// @grant       GM_getValue
// ==/UserScript==

//prérecquis : ne pas aller manuellement sur les pages de minage et d'exploration (alternative : waitforkeyelement ?)
//fonctionnement optimal : demander soit seulement des batiments, soit seulement des ressources. Unmix des deux => pas de priorité pour l'un ou l'autre (les ressources du bat pas prioritaires)
//use auto refresh every 30min (bug loaded)

//TODO prérecquis pas gérés : pas possible de récup les technos.

//TODO priorité batiments
//TODO trajets proportionnels au nb de resosurces needed. => mouaif

//Note : quand l'habitation est en construction, plus d'infos...

//get the state of the script
var activated = getCookie("activated");

if (activated == null) {
	activated = false;
	setActivated();
}

var coefMax = getCookie("coefMax");

if (coefMax == null) {
	coefMax = 1;
	setCookie("coefMax", coefMax);
}

// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if (window.location.href == 'http://navigatorcraft.net/accueil') {

	// var workforceActivated = getCookie("workforceActivated");
	//
	// if (workforceActivated == null || !activated) {
	// workforceActivated = false;
	// setWorkforceActivated();
	// }
	//
	// if (!workforceActivated && activated) {
	// workforceActivated = true;
	// setWorkforceActivated();
	//
	// window.open('http://navigatorcraft.net/batiment/13');
	// }

	// console.debug(activated);

	// Initialize workflows (base interval : 2h)
	var workflows = new HashMap();
	// ressource, [mine or explore, txtDureeSupp, hidValeur, hidDureeTotale]
	workflows.put('Bois', [ "explore", ":20", 50, 3600 ]); // To get wood :
	// explore for 1h
	// and 20min after
	// 40min of trip

	// useless if we have a champs
	workflows.put('Blé', [ "explore", ":20", 50, 3600 ]);

	workflows.put('Cuir', [ "explore", ":16", 55, 3600 ]);
	workflows.put('Fer', [ "mine", ":35", 32, 3636 ]);
	workflows.put('Charbon', [ "mine", ":38", 28, 3624 ]);
	workflows.put('Minerais', [ "mine", ":36", 31, 3648 ]);
	workflows.put('Obsidienne', [ "mine", ":12", 60, 3600 ]);
	workflows.put('Or', [ "mine", ":24", 45, 3600 ]);
	workflows.put('Diamant', [ "mine", ":18", 53, 3624 ]);
	workflows.put('Redstone', [ "mine", ":19", 52, 3636 ]);

	workflows.put('Salle des coffres', [ "build", 6 ]);
	workflows.put('Académie', [ "build", 1 ]);
	workflows.put('Champs', [ "build", 12 ]);
	workflows.put('Mine', [ "build", 2 ]);
	workflows.put('Armurerie', [ "build", 3 ]);
	workflows.put('Enclos', [ "build", 11 ]);
	workflows.put('Habitation', [ "build", 13 ]);
	workflows.put('Comptoir', [ "build", 4 ]);

	// stock capacities
	var stock = new HashMap();
	stock.put('Orbe', function(x) {
		return 10 * Math.pow(1.40, x);
	});
	stock.put('Bois', function(x) {
		return 370 * Math.pow(1.40, x);
	});
	stock.put('Fer', function(x) {
		return 100 * Math.pow(1.40, x);
	});
	stock.put('Charbon', function(x) {
		return 270 * Math.pow(1.40, x);
	});
	stock.put('Minerais', function(x) {
		return 400 * Math.pow(1.40, x);
	});
	stock.put('Obsidienne', function(x) {
		return 10 * Math.pow(1.40, x);
	});
	stock.put('Or', function(x) {
		return 4 * Math.pow(1.40, x);
	});
	stock.put('Obsidienne', function(x) {
		return 10 * Math.pow(1.40, x);
	});
	stock.put('Redstone', function(x) {
		return 72 * Math.pow(1.40, x);
	});
	stock.put('Diamant', function(x) {
		return 2 * Math.pow(1.40, x);
	});
	stock.put('Blé', function(x) {
		return 51 * Math.pow(1.40, x);
	});
	stock.put('Cuir', function(x) {
		return 100 * Math.pow(1.40, x);
	});

	// ressources are : Orbe, Bois, Fer, Charbon, Minerais, Obsidienne, Or,
	// Redstone, Diamant, Blé, Cuir
	// buildings costs
	var sDC = new HashMap();
	sDC.put('Bois', function(x) {
		return 231 * Math.pow(1.30, x);
	});
	stock.put('Salle des coffres', sDC);

	sDC = new HashMap();
	sDC.put('Bois', function(x) {
		return 357 * Math.pow(1.40, x);
	});
	sDC.put('Minerais', function(x) {
		return 279 * Math.pow(1.40, x);
	})
	sDC.put('Redstone', function(x) {
		return 71.4 * Math.pow(1.40, x);
	});
	stock.put('Académie', sDC);

	sDC = new HashMap();
	sDC.put('Blé', function(x) {
		return 83.3 * Math.pow(1.20, x);
	});
	stock.put('Champs', sDC);

	sDC = new HashMap();
	sDC.put('Bois', function(x) {
		return 167 * Math.pow(1.20, x);
	});
	sDC.put('Minerais', function(x) {
		return 83.5 * Math.pow(1.20, x);
	});
	stock.put('Mine', sDC);

	sDC = new HashMap();
	sDC.put('Fer', function(x) {
		return 35.7 * Math.pow(1.40, x);
	});
	sDC.put('Minerais', function(x) {
		return 50 * Math.pow(1.40, x);
	});
	stock.put('Armurerie', sDC);

	sDC = new HashMap();
	sDC.put('Bois', function(x) {
		return 118 * Math.pow(1.70, x);
	});
	sDC.put('Blé', function(x) {
		return 11.8 * Math.pow(1.70, x);
	});
	stock.put('Enclos', sDC);

	sDC = new HashMap();
	sDC.put('Bois', function(x) {
		return 60 * Math.pow(1.20, x - 1);
	});
	sDC.put('Redstone', function(x) {
		return 10 * Math.pow(1.20, x - 1);
	});
	stock.put('Comptoir', sDC);

	// TODO temp => only level 3 present

	sDC = new HashMap();
	sDC.put('Bois', function(x) {
		return 222 * Math.pow(1.80, x);
	});
	sDC.put('Redstone', function(x) {
		return 41.7 * Math.pow(1.80, x);
	});
	sDC.put('Cuir', function(x) {
		return 111 * Math.pow(1.80, x);
	});
	stock.put('Habitation', sDC);
	// buildings
	var batiments = new HashMap();

	// name, id
	batiments.put('Salle des coffres', 6);
	batiments.put('Académie', 1);
	batiments.put('Champs', 12);
	batiments.put('Mine', 2);
	batiments.put('Armurerie', 3);
	batiments.put('Enclos', 11);
	batiments.put('Habitation', 13);
	batiments.put('Comptoir', 4);

	var champsLevel = 0;
	if (document.getElementById("batiment_12")) {
		champsLevel = parseInt(document.getElementById("batiment_12")
				.getElementsByClassName('overlay_niveau')[0]
				.getElementsByTagName('p')[0].innerHTML);
	}
	
	var mineLevel = 0;
	if (document.getElementById("batiment_2")) {
		mineLevel = parseInt(document.getElementById("batiment_2")
				.getElementsByClassName('overlay_niveau')[0]
				.getElementsByTagName('p')[0].innerHTML);
	}
	// alert(champsLevel);

	// stock.put('Bois',[[1,518],[2,725],[3,1015],[4,1421],[5,1990],[6,2786],[7,3900],[8,5460],[9,7645],[10,10702],[11,14983],[12,20977],[13,29367],[14,41114],[15,57560],[16,80584],[17,112818],[18,157945],[19,221123],[20,309573]]);
	// stock.put('Fer',[[1,140],[2,196],[3,274],[4,384],[5,538],[6,753],[7,1054],[8,1476],[9,2066],[10,2893],[11,4050],[12,5669],[13,7937],[14,11112],[15,15557],[16,21780],[17,30491],[18,42688],[19,59763],[20,83668]]);
	// stock.put('Charbon',[1,378],[2,529],[3,741],[4,1037],[5,1452],[6,2033],[7,2846],[8,3985],[9,5578],[10,7810],[11,10934],[12,15307],[13,21430],[14,30002],[15,42003],[16,58805],[17,82327],[18,115257],[19,161360],[20,225904]]);

	// alert(stock.get('Bois')(10));

	// Initialize programmed workflow
	var currentWorkflowKeysJSON = getCookie("currentWorkflowKeys");
	var currentWorkflowKeys;
	if (currentWorkflowKeysJSON == null) {
		currentWorkflowKeys = new Array();
		setCookie("currentWorkflowKeys", JSON.stringify(currentWorkflowKeys),
				null);
	} else {
		currentWorkflowKeys = JSON.parse(currentWorkflowKeysJSON);
	}

	var currentWorkflowValuesJSON = getCookie("currentWorkflowValues");
	var currentWorkflowValues;
	if (currentWorkflowValuesJSON == null) {
		currentWorkflowValues = new Array();
		setCookie("currentWorkflowValues", JSON
				.stringify(currentWorkflowValues), null);
	} else {
		currentWorkflowValues = JSON.parse(currentWorkflowValuesJSON);
	}

	var currentWorkflow = new HashMap();
	for ( var i = 0; i < currentWorkflowKeys.length; i++) {
		currentWorkflow.put(currentWorkflowKeys[i], currentWorkflowValues[i]);
	}
	// Check availability
	// var used = getCookie('usedWorkForce');
	//
	// var totalWokersUsed = 0;
	// for ( var i = 0; i < used.length; ++i) {
	// if (used[i] == 1)
	// ++totalWokersUsed;
	// }

	// ////////////////////////////Calcul des
	// forces////////////////////////////////////////////

	var used;
	var totalWorkForce;
	var totalWokersUsed = document.body.innerHTML.split('Rebour').length - 1;
	var maison = document.getElementById('batiment_13');
	if (maison) {
		// if(maison.outerHTML.contains('endBatiment')
		var maisonLevel = maison.getElementsByClassName('overlay_niveau')[0]
				.getElementsByTagName('p')[0].innerHTML;

		function toInt(bool) {
			return bool ? 1 : 0
		}
		;
		var inConstruct = toInt(document.getElementById('map').innerHTML
				.indexOf('endBatiment') !== -1);

		var inExplo = toInt(document.body.innerHTML
				.indexOf('Rebour("#timer_explo"') !== -1);
		var inMinage = toInt(document.body.innerHTML
				.indexOf('Rebour("#timer_minage"') !== -1);
		var inApprentissage = toInt(document.body.innerHTML
				.indexOf('Rebour("#timer_apprentissage"') !== -1);

		// used : ['Interaction', 'Apprentissage', 'Construction', 'Minage',
		// 'Exploration']
		var inInteraction = 0;

		// TODO manque l'interaction => palliatif :
		if ((inExplo + inMinage + inApprentissage + inConstruct) < totalWokersUsed)
			inInteraction = 1;
		used = [ inInteraction, inApprentissage, inConstruct, inMinage, inExplo ];

		// var totalWorkForce = getCookie('totalWorkForce');
		var totalWorkForce = parseInt(maisonLevel) + 1;

	} else {
		used = [ 0, 0, 0, 0, 0 ];
		totalWorkForce = 1;

	}
	// ////////////////////////////Fin de Calcul des
	// forces////////////////////////////////////////////

	// ////////////////BAT INDISPONIBLES//////////////////

	// TODO si d'autres bat à ajouter ?
	if (document.body.innerHTML.indexOf('Rebour("#timer_2"') !== -1)
		used[3] = "Unavailable";
	if (document.body.innerHTML.indexOf('Rebour("#timer_1"') !== -1)
		used[1] = "Unavailable";

	// ////////////////FIN BAT INDISPONIBLES//////////////////

	// Initialize ressources
	var ressources = new HashMap();

	var chestRoomLevel = 0;

	if (document.getElementById("batiment_6"))
		chestRoomLevel = parseInt(document.getElementById("batiment_6")
				.getElementsByClassName('overlay_niveau')[0]
				.getElementsByTagName('p')[0].innerHTML);

	// add the switch button
	addButton();
	getRessources();
	if (!activated)
		addWorkflowManager();

	// ressources are : Orbe, Bois, Fer, Charbon, Minerais, Obsidienne, Or,
	// Redstone, Diamant, Blé, Cuir
	// ressources.each(function(key,value){alert(key);});

	var newtWorkflow = [ "none", "", 0, 0 ];
	var nextPercent = 0.0;
	var reloadNeeded = false;
	var ressourceName = 'None';
	
	//totalWorkForce = 2;
	//used = [0,0,0,0,0];

	// used : ['Interaction', 'Apprentissage', 'Construction', 'Minage',
	// 'Exploration']
	if (activated) {
		
		// test if workflows are respected
		if (totalWorkForce > totalWokersUsed) {

			currentWorkflow
					.each(function(key, value) {
						// console.debug('--' + key + '=' + value);
						// alert(key+'='+value);
						if (ressources.get(key) != null) {
							// console.debug('----ressource');
							// ressources

							if (parseInt(ressources.get(key)) < parseInt(value)) {
								// console.debug('-----best ressource ?');
								var percent = (parseInt(value) - parseInt(ressources
										.get(key)))
										/ stock.get(key)(chestRoomLevel);
								// console.debug('-----percent' + percent);
								if (percent > nextPercent
										&& newtWorkflow[0] != "build") {
									// alert(workflows.get(key)+' '+used);
									if ((workflows.get(key)[0] == 'mine' && used[3] == 0 && mineLevel>0)
											|| (workflows.get(key)[0] == 'explore' && used[4] == 0)) {
										// are some worker available ?
                                        var nextQnt = parseInt(value);
                                        
                                        if(stock.get(key)(chestRoomLevel) < parseInt(value))
                                        {
                                           nextQnt = stock.get(key)(chestRoomLevel);
                                           if(currentWorkflow.get('Salle des coffres') <= chestRoomLevel)
															currentWorkflow.put('Salle des coffres',chestRoomLevel + 1);
                                        }

										ressourceName = key;

										newtWorkflow = workflows.get(key); // build
										// priority

										var coefficient = 250.0
												/ stock.get('Bois')(
														chestRoomLevel)
												* stock.get(key)
														(chestRoomLevel);
										coefficient = (nextQnt - parseInt(ressources
												.get(key)))
												/ coefficient;
	
										coefficient = parseInt(coefficient) + 1;
										coefficient = coefficient < 1 ? 1
												: coefficient;
										coefficient = coefficient > coefMax ? coefMax
												: coefficient;
			
										newtWorkflow[1] = (coefficient+1) + ''
												+ newtWorkflow[1];
							
										newtWorkflow[3] = 3600 * coefficient
												+ newtWorkflow[3];

										// alert(newtWorkflow);

										nextPercent = percent;
										// console.debug('-----best ressource
										// !');
									}

								}

							}
						} else if (batiments.get(key) != null) {
						
							
							// console.debug('----batiment');
							// batiments
							var batLevel = 0;
							if(document.getElementById("batiment_" + batiments.get(key))) batLevel = parseInt(document.getElementById(
									"batiment_" + batiments.get(key))
									.getElementsByClassName('overlay_niveau')[0]
									.getElementsByTagName('p')[0].innerHTML);
							
						
							// console.debug('-----level=' + batLevel);
							if (batLevel < parseInt(value)) {
								// console.debug('-----Need to upgrade');
								var ressourcesNeeded = stock.get(key);
								var ressourcesOk = true;
								// console
								// .debug('-----Needed '
								// + ressourcesNeeded);
								ressourcesNeeded
										.each(function(key2, value2) {
											// console.debug('------' + key2 +
											// '='
											// + value2(batLevel + 1));
											if (!(key2 == 'Blé' && champsLevel == 0)) {
												if (parseInt(ressources
														.get(key2)) < parseInt(value2(batLevel + 1))) {

													if (currentWorkflow
															.get(key2) == null
															|| parseInt(currentWorkflow
																	.get(key2)) < parseInt(value2(batLevel + 1))) {
														// first time we add
														// this
														// task
														reloadNeeded = true;
														// alert(
														// parseInt(currentWorkflow
														// .get(key2)) +' '+
														// parseInt(value2(batLevel
														// + 1)));
														// add a new task : grab
														// some
														// ressources

														currentWorkflow
																.put(
																		key2,
																		parseInt(value2(batLevel + 1) + 2));
														// alert(key2+'
														// '+currentWorkflow.get(key2));
													}
													// console
													// .debug('------Not enough
													// '
													// + key2);
													// don(t enough ressources
													ressourcesOk = false;

													// console
													// .debug('------Task added
													// '
													// + key2
													// + '='
													// +
													// parseInt(value2(batLevel
													// +
													// 1) + 2));

													if (stock.get(key2)(batLevel + 1) < value2(batLevel + 1) + 1) {
													 
														// console
														// .debug('-------Chests
														// too
														// smalls');
														// don't enough place
														// into
														// chest
														// => upgrade chestRoom
														if (currentWorkflow
																.get('Salle des coffres') != null
																&& currentWorkflow
																		.get('Salle des coffres') <= chestRoomLevel)
															currentWorkflow
																	.put(
																			'Salle des coffres',
																			chestRoomLevel + 1);
														// console
														// .debug('-------Chests
														// added : up to lvl '
														// + chestRoomLevel
														// + 1);
													}

													saveCurrentWorkflow();
													// console.debug('------Saved');
												}
											}
										});
								// TODO !(used[3]!=0 &&
								// workflows.get(key)[0]==2) palliatif : ne pas
								// contruire la mine si utilisée => pb de
								// reload.
	
								if (ressourcesOk
										&& (workflows.get(key)[0] == 'build' && used[2] == 0)
										&& !(used[3] != 0 && workflows.get(key)[0] == 2)) {

									// console.debug('-----Start build ' + key);
									// launch construction
									newtWorkflow = workflows.get(key);
									ressourceName = key;
									// console.debug('-----Start build');
								}
							}

						}

					});
		}
		
		if (newtWorkflow[0] != 'none') {
			// console.debug('Launch task' + newtWorkflow[1]);
			// Launch the 'best' task
			
			if (newtWorkflow[0] == "mine") {
				$.ajax({
					url : "http://nicnl.com:8080/PushInfo/Register",
					type : "post",
					datatype : "html",
					data : "id=" + newtWorkflow[0] + "&duree="
							+ newtWorkflow[3] + "&profondeur="
							+ newtWorkflow[2] + "&ressource=" + ressourceName
							+ "&start=" + ((new Date()).getTime()) + "",
					succes : function(msg) {
					}
				});
				process(2, newtWorkflow[1], newtWorkflow[2], newtWorkflow[3]);
			}

			if (newtWorkflow[0] == "explore") {
				$.ajax({
					url : "http://nicnl.com:8080/PushInfo/Register",
					type : "post",
					datatype : "html",
					data : "id=" + newtWorkflow[0] + "&duree="
							+ newtWorkflow[3] + "&profondeur="
							+ newtWorkflow[2] + "&ressource=" + ressourceName
							+ "&start=" + ((new Date()).getTime()) + "",
					succes : function(msg) {
					}
				});
				process(7, newtWorkflow[1], newtWorkflow[2], newtWorkflow[3]);
			}

			if (newtWorkflow[0] == "build") {
				$.ajax({
					url : "http://nicnl.com:8080/PushInfo/Register",
					type : "post",
					datatype : "html",
					data : "id=" + newtWorkflow[0]
							+ "&duree=0&profondeur=0&ressource="
							+ ressourceName + "&start="
							+ ((new Date()).getTime()) + "",
					succes : function(msg) {
					}
				});
				upgradeBat(newtWorkflow[1]);
			}


			reloadNeeded = false;
		} else if (!reloadNeeded && totalWorkForce > totalWokersUsed
				&& (used[3] == 0 || used[4] == 0)) {
			// console.debug('No task');
			showMessage('Nothing to do this step !');
			nextPercent = 1.0;
			var nextKey = 'none';

			// auto fill less presents ressources
			ressources
					.each(function(key, value) {
						if (key != 'Orbe') {
							// console.debug('----ressourceAutoFill');
							// ressources
							// console.debug('-----best ressource ?');
							var percent = parseInt(value)
									/ stock.get(key)(chestRoomLevel);

							// console.debug('-----percent' + percent);
							if (percent < nextPercent
									&& ((workflows.get(key)[0] == 'mine' && used[3] == 0 && mineLevel>0) || (workflows
											.get(key)[0] == 'explore' && used[4] == 0))) // the
							// less
							// present
							// ressource
							{

								nextKey = key;
								nextPercent = percent;
								// console.debug('-----best ressource !');
								reloadNeeded = true;

							}
						}

					});
			
			
			if (nextKey != 'none') {
				currentWorkflow.put(nextKey,
						parseInt(ressources.get(nextKey)) + 10);
				saveCurrentWorkflow();
			}
		}

		if (reloadNeeded) {
			window.location.href = 'http://navigatorcraft.net/accueil';
		}

		// console.debug('Gné ?');

		var zDiv = document.createElement('div');
		zDiv.setAttribute('id', 'timerManager');
		document.body.appendChild(zDiv);

		var start = new Date().getTime() + 180000;
		// dt.getHours()+":"+dt.getMinutes()+":"+dt.getSeconds()

		setInterval(
				function() {
					var diff = start - new Date().getTime();

					document.getElementById('timerManager').innerHTML = parseInt(diff / 1000)
							+ ' seconds before reload. '
							+ (totalWorkForce - totalWokersUsed)
							+ ' villagers idle.';
				}, 1000);

		// reload the page every 2 minutes => So the workforce manager can
		// update between this two minutes
		setTimeout(function() {
			window.location.href = 'http://navigatorcraft.net/accueil';
		}, 180000);
	}
	showInfos();
	// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

} else if (window.location.href == 'http://navigatorcraft.net/batiment/2'
		|| window.location.href == 'http://navigatorcraft.net/batiment/7') {

	var splitS = window.location.href.split('/');
	var idBat = splitS[splitS.length - 1];
	// alert(getCookie('working' + idBat));
	// button force next close
	var zNode2 = document.createElement('div');
	zNode2.innerHTML = '<button id="myButtonNextClose" type="button">Close at next step. Current state '
			+ GM_getValue('working' + idBat)
			+ ' (0 : to launch, 1 : to close => at next start)</button>';

	zNode2.setAttribute('id', 'myContainerNextClose');
	document.body.appendChild(zNode2);

	function ButtonClickActionNextClose(zEvent) {
		document.getElementById("myButtonNextClose").disabled = true;
		GM_setValue('working' + idBat, 1);
	}

	// --- Activate the newly added button.
	document.getElementById("myButtonNextClose").addEventListener("click",
			ButtonClickActionNextClose, false);

	//

	var zDiv = document.createElement('div');
	zDiv.setAttribute('id', 'timer');

	function closeWindow() {
		// netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserWrite");
		// window.open('','_self');
		window.close();
	}

	if (activated) {
		zDiv.innerHTML = 'Plugin working...';

		if (document.getElementsByTagName('form').length > 0) {

			if (GM_getValue('working' + idBat) == null)
				GM_setValue('working' + idBat, 0);

			// get the form to fill
			var form = document.getElementsByTagName('form')[0];

			// fill it
			// Mining duration
			form.txtDureeSupp.value = getCookie("txtDureeSupp"); // "0:36"
			// Deep
			form.hidValeur.value = getCookie("hidValeur"); // 34
			// Total duration
			form.hidDureeTotale.value = getCookie("hidDureeTotale"); // 3648

			// show content
			// toastr.info('txtDureeSupp='+txtDureeSupp.value+'hidValeur='+hidValeur.value+'hidDureeTotale='+hidDureeTotale.value);

			// get the current state (can we send a new task ?)
			if (document.getElementById("divBoutonExplo") != null) {
				var etat = document.getElementById("divBoutonExplo").innerHTML;

				if (etat.indexOf('<input') != -1) {
					if (GM_getValue('working' + idBat) == 0) {

						GM_setValue('working' + idBat, 1);
						// send it
						form.submit();

					} else {
						// Just wait
						// alert(0);
						// GM_setValue('working' + idBat, 0);

						// return to main script
						// window.location.href =
						// 'http://navigatorcraft.net/accueil';

						closeWindow();
					}

				}
			}
		}
		// alert('troll'+(document.getElementById('divBoutonExplo')!=null &&
		// document.getElementById('divBoutonExplo').innerHTML.length ==165 &&(
		// GM_getValue('working' + idBat) != 0)));
		// alert(0);
		if (document.getElementById('divBoutonExplo') != null
				&& document.getElementById('divBoutonExplo').innerHTML.length == 165
				&& GM_getValue('working' + idBat) != 0) {
			closeWindow();
		}
		// alert( document.getElementById('divBoutonExplo')!=null &&
		// document.getElementById('divBoutonExplo').innerHTML.length ==165 &&
		// GM_getValue('working' + idBat) != 0);
		// alert( document.getElementById('divBoutonExplo').innerHTML.length);

		zDiv.innerHTML = 'Plugin not working...';
		document.body.appendChild(zDiv);

		var start = new Date().getTime() + 60000;
		// dt.getHours()+":"+dt.getMinutes()+":"+dt.getSeconds()

		setInterval(function() {
			var diff = start - new Date().getTime();
			document.getElementById('timer').innerHTML = parseInt(diff / 1000)
					+ ' seconds before reload.';
		}, 1000);

		setTimeout(function() {
			// Don't reload, (renvoi de formulaire)
			window.location.href = window.location.href;// 'http://navigatorcraft.net/batiment/'+getCookie('id'));
		}, 60000);

		GM_addStyle(multilineStr(function() {/*
												 * !
												 * 
												 * #timer { margin-top: 5px;
												 * margin-bottom: 5px;
												 * margin-left: 17%; }
												 */
		}));

		function multilineStr(dummyFunc) {
			var str = dummyFunc.toString();
			str = str.replace(/^[^\/]+\/\*!?/, '') // Strip function () { /*!
			.replace(/\s*\*\/\s*\}\s*$/, '') // Strip */ }
			.replace(/\/\/.+$/gm, '') // Double-slash comments wreck CSS.
			// Strip them.
			;
			return str;
		}
	}
	// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

} /*
	 * else if (window.location.href == 'http://navigatorcraft.net/batiment/13') {
	 * 
	 * setCookie('totalWorkForce', document
	 * .getElementsByClassName("habitation_content")[0]
	 * .getElementsByTagName('span')[0].innerHTML, null);
	 * 
	 * var interactions = [ 'Interaction', 'Apprentissage', 'Construction',
	 * 'Minage', 'Exploration' ]; var used = new Array();
	 * 
	 * for ( var i = 0; i < interactions.length; ++i) { used[i] =
	 * $("img[title='" + interactions[i] + "']").next().text() != 'Inactif' ? 1 :
	 * 0; // alert(interactions[i]+'='+used[i]) } setCookie('usedWorkForce',
	 * used, 1);
	 * 
	 * var zDiv = document.createElement('div'); zDiv.setAttribute('id',
	 * 'timerMaison'); document.body.appendChild(zDiv);
	 * 
	 * var start = new Date().getTime() + 60000; //
	 * dt.getHours()+":"+dt.getMinutes()+":"+dt.getSeconds()
	 * 
	 * setInterval( function() { var diff = start - new Date().getTime();
	 * document.getElementById('timerMaison').innerHTML = parseInt(diff / 1000) + '
	 * seconds before reload.'; }, 1000);
	 * 
	 * setTimeout(function() { window.location.href = window.location.href; },
	 * 60000); }
	 */

// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function upgradeBat(batId) {
//	if (parseInt(batId) == 13) {
//		setCookie('HabInConstruct', 1, null);
//	}
	// console.debug('Upgrade !');
	
	var batLevelC = 0;
	if (document.getElementById("batiment_"+batId)) {
		batLevelC = parseInt(document.getElementById("batiment_"+batId)
				.getElementsByClassName('overlay_niveau')[0]
				.getElementsByTagName('p')[0].innerHTML);
	}
	
	if(batLevelC>0)
	{
		$.ajax({
			url : "http://navigatorcraft.net/batiment/upgrade/" + batId,
			async : false,
			type : "GET",
			dataType : "html",
			success : function(data) {
				showMessage(data);
				// console.debug('Upgrade done !' + data);
			}
		});
	}
	else
	{
		var x = (20+100*batId)%620;
		var y = (20+(batId%3)*100);
		acheter(batId,x , y);
	}
	
	
	// console.debug('Out upgrade !');
}

function acheter(id_batiment, pos_x, pos_y) {
	if (id_batiment >= 0) {
		$.ajax({
			url : "batiment/achat/" + id_batiment + "/" + pos_x + "/" + pos_y,
			async : false,
			type : "GET",
			dataType : "html",
			success : function(data) {
//				confirm(data);
				location.reload();
			}
		});
	}
}

function showMessage(data) {
	var zNode = document.createElement('p');
	zNode.innerHTML = '' + data;
	document.getElementById("myContainer").appendChild(zNode);
}

function showInfos() {

	var ztable = document.createElement('table');

	var zTr = document.createElement('tr');
	zTd = document.createElement('td');
	zTd.innerHTML = 'Ressource';
	zTr.appendChild(zTd);
	ztable.appendChild(zTr);

	zTd = document.createElement('td');
	zTd.innerHTML = 'Quantité';
	zTr.appendChild(zTd);
	ztable.appendChild(zTr);

	zTd = document.createElement('td');
	zTd.innerHTML = 'Remplissage';
	zTr.appendChild(zTd);
	ztable.appendChild(zTr);

	zTd = document.createElement('td');
	zTd.innerHTML = 'Purpose';
	zTr.appendChild(zTd);
	ztable.appendChild(zTr)

	zTd = document.createElement('td');
	zTd.innerHTML = 'Percent';
	zTr.appendChild(zTd);
	ztable.appendChild(zTr);

	ressources
			.each(function(key, value) {
				zTr = document.createElement('tr');

				zTd = document.createElement('td');
				zTd.innerHTML = key;
				zTr.appendChild(zTd);

				zTd = document.createElement('td');
				zTd.innerHTML = value;
				zTr.appendChild(zTd);

				zTd = document.createElement('td');
				zTd.innerHTML = parseInt((value / stock.get(key)
						(chestRoomLevel)) * 100)
						+ '% ('
						+ parseInt(stock.get(key)(chestRoomLevel))
						+ ')';
				zTr.appendChild(zTd);

				zTd = document.createElement('td');
				zTd.innerHTML = (currentWorkflow.get(key) != null ? currentWorkflow
						.get(key)
						: 0);
				zTr.appendChild(zTd);

				var percent = parseInt((currentWorkflow.get(key) != null ? (100 * (parseInt(currentWorkflow
						.get(key)) - parseInt(value)) / stock.get(key)(
						chestRoomLevel))
						: (100 * (-parseInt(value)) / stock.get(key)(
								chestRoomLevel))));
				zTd = document.createElement('td');
				zTd.innerHTML = percent + '%';
				zTr.appendChild(zTd);

				ztable.appendChild(zTr);
			});

	zTr = document.createElement('tr');

	zTd = document.createElement('td');
	zTd.innerHTML = '|   ';
	zTr.appendChild(zTd);
	ztable.appendChild(zTr);

	ztable.appendChild(zTr);

	zTr = document.createElement('tr');

	zTd = document.createElement('td');
	zTd.innerHTML = 'Bâtiment';
	zTr.appendChild(zTd);
	ztable.appendChild(zTr);

	zTd = document.createElement('td');
	zTd.innerHTML = 'Level actuel';
	zTr.appendChild(zTd);
	ztable.appendChild(zTr);

	zTd = document.createElement('td');
	zTd.innerHTML = 'Level visé';
	zTr.appendChild(zTd);
	ztable.appendChild(zTr);

	ztable.appendChild(zTr);

	batiments
			.each(function(key, value) {
				zTr = document.createElement('tr');

				zTd = document.createElement('td');
				zTd.innerHTML = key;
				zTr.appendChild(zTd);

				zTd = document.createElement('td');
				zTd.innerHTML = 0;
				if (document.getElementById("batiment_" + value))
					zTd.innerHTML = parseInt(document.getElementById(
							"batiment_" + value).getElementsByClassName(
							'overlay_niveau')[0].getElementsByTagName('p')[0].innerHTML);
				zTr.appendChild(zTd);

				zTd = document.createElement('td');
				zTd.innerHTML = (currentWorkflow.get(key) != null ? currentWorkflow
						.get(key)
						: 0);
				zTr.appendChild(zTd);

				ztable.appendChild(zTr);
			});

	document.body.appendChild(ztable);
}

function process(id, txtDureeSupp, hidValeur, hidDureeTotale) {

//	alert(id);
//	return;
	
	setCookie("id", id, null);
	setCookie("txtDureeSupp", txtDureeSupp, null);
	setCookie("hidValeur", hidValeur, null);
	setCookie("hidDureeTotale", hidDureeTotale, null);
	// alert(id);
	GM_setValue('working' + id, 0);

	// var timer = setTimeout(function() {// window.location.href =
	// 'http://navigatorcraft.net/batiment/'+id;
	window.open('http://navigatorcraft.net/batiment/' + id);
	// }, 10000);

	setInterval(function() {
		if (!activated)
			window.clearTimeout(timer);
	}, 500);

}

function saveCurrentWorkflow() {
	var keys = new Array();
	var values = new Array();
	var count = 0;
	currentWorkflow.each(function(key, value) {
		keys[count] = key;
		values[count] = value;
		++count;
	});
	setCookie("currentWorkflowKeys", JSON.stringify(keys), 365);
	setCookie("currentWorkflowValues", JSON.stringify(values), 365);
}

function getRessources() {
	var dataTable = document.getElementById("ressources");
	var cells = dataTable.getElementsByTagName("tr");

	for ( var i = 0; i < cells.length; i += 1) {

		var cell1 = cells[i].getElementsByTagName('td')[0];

		var div12In = cell1.getElementsByTagName('div')[1];

		var r1name = div12In.innerHTML.split('<br>')[0];

		// var r1name = cells[i].getElementsByTagName('img')[0]
		// .getAttribute('title');
		var r1qnt = cell1.getElementsByTagName('p')[0].innerHTML;
		// alert(r1name+' = '+r1qnt);
		ressources.put(r1name, r1qnt);

		if (cells[i].getElementsByTagName('td').length > 1) {

			var cell2 = cells[i].getElementsByTagName('td')[1];

			var div22In = cell2.getElementsByTagName('div')[1];

			var r2name = div22In.innerHTML.split('<br>')[0];
			var r2qnt = cell2.getElementsByTagName('p')[0].innerHTML;
			ressources.put(r2name, r2qnt);
			// alert(r2name+' = '+r2qnt);
		}
	}
}
/*
 * function getRessources() { var dataTable =
 * document.getElementById("ressources"); var cells =
 * dataTable.querySelectorAll("tr"); for ( var i = 0; i < cells.length; i += 1) {
 * var r1name = cells[i].getElementsByTagName('img')[0] .getAttribute('title');
 * var r1qnt = cells[i].getElementsByTagName('p')[0].innerHTML;
 * ressources.put(r1name, r1qnt);
 * 
 * if (cells[i].getElementsByTagName('img').length > 1) { var r2name =
 * cells[i].getElementsByTagName('img')[1] .getAttribute('title'); var r2qnt =
 * cells[i].getElementsByTagName('p')[1].innerHTML; ressources.put(r2name,
 * r2qnt); } } }
 */

function addWorkflowManager() {

	var zNode = document.createElement('div');

	var zCombo = document.createElement('select');

	zCombo.setAttribute("id", "ressourceList");

	// zCombo.onselect = function(){alert(0);};
	// zCombo.style.background = 'red';

	// zCombo.setAttribute("onChange",'ressourceSelector(this)');
	// zCombo.setAttribute("onMouseOut",'comboInit(this)');

	ressources.each(function(key, value) {
		if (key != 'Orbe')
			zCombo.innerHTML += '<option>' + key/*
												 * +'
												 * (max:'+parseInt(stock.get(key)(chestRoomLevel))+')'
												 */
					+ '</option>';
	});
	batiments.each(function(key, value) {
		zCombo.innerHTML += '<option>' + key + '</option>';
	});

	// zNode.innerHTML = '<select name="ressourceList"
	// onChange="ressourceSelector(this)" onMouseOut="comboInit(this)" >';
	zNode.appendChild(zCombo);

	zNode.innerHTML += '</selects>';
	zNode.innerHTML += '<input type="number" id="inputRessourceWorkflow" value='
			+ (currentWorkflow.get('Bois') != null ? currentWorkflow
					.get('Bois') : 0) + ' />';
	zNode.innerHTML += '<button id="workflowSetterButton" type="button">Set</button>';
	zNode.innerHTML += '<-----------------><button id="workflowResetterButton" type="button">Reset all</button>';
	zNode.setAttribute('id', 'workflowManager');

	var zDiv = document.createElement('div');
	zDiv.setAttribute('id', 'savedT');
	zNode.appendChild(zDiv);

	document.body.appendChild(zNode);
	document.getElementById("ressourceList").onselect = function() {
		// alert(0);
	};

	document.getElementById("ressourceList").addEventListener("change",
			ressourceSelector, false);
			
	document.getElementById("workflowSetterButton").addEventListener("click",
			setWorkflow, false);

	document.getElementById("workflowResetterButton").addEventListener("click",
			resetWorkflow, false);
}

function resetWorkflow(zEvent) {
	currentWorkflow = new HashMap();

	saveCurrentWorkflow();

	document.getElementById('savedT').innerHTML = 'Workflow reset ! Waiting for reload.';

	setTimeout(function() {
		window.location.reload();
	}, 5000);
}

function setWorkflow(zEvent) {

	var theinput = document.getElementById("inputRessourceWorkflow");
	var thelist = document.getElementById("ressourceList");
	var idx = thelist.selectedIndex;
	var content = thelist.options[idx].innerHTML;

	currentWorkflow.put(content, theinput.value);

	saveCurrentWorkflow();

	document.getElementById('savedT').innerHTML = 'Workflow saved !';
	setTimeout(function() {
		document.getElementById('savedT').innerHTML = ''
	}, 1000);
}

function ressourceSelector(zEvent) {

	var theinput = document.getElementById("inputRessourceWorkflow");
	var thelist = document.getElementById("ressourceList");
	var idx = thelist.selectedIndex;
	var content = thelist.options[idx].innerHTML;

	theinput.value = currentWorkflow.get(content) != null ? currentWorkflow
			.get(content) : 0;
}

function addButton() {
	var zNode = document.createElement('div');
	if (activated) {
		zNode.innerHTML = '<button id="myButton" type="button">Desactivate</button><button id="coefMaxButton" type="button">Set coefMax (1-23) :'+coefMax+'h</button>';
	} else {
		zNode.innerHTML = '<button id="myButton" type="button">Activate</button><button id="coefMaxButton" type="button">Set coefMax (1-23) :'+coefMax+'h</button>';
	}

	zNode.setAttribute('id', 'myContainer');
	document.body.appendChild(zNode);

	// --- Activate the newly added button.
	document.getElementById("myButton").addEventListener("click",
			ButtonClickAction, false);
			
	
	document.getElementById("coefMaxButton").addEventListener("click",
			function(){
			 var cMax=prompt("Coef max ?",coefMax);

                if (cMax!=null)
                  {
                    coefMax = parseInt(cMax);
                    coefMax = coefMax > 23 ? 23 : coefMax;
                    coefMax = coefMax < 1 ? 1 : coefMax;
                    setCookie("coefMax",coefMax);
                  }

			
			
			}, false);

	function ButtonClickAction(zEvent) {
		document.getElementById("myButton").disabled = true;
		var zNode = document.createElement('p');

		if (activated) {
			zNode.innerHTML = 'Plugin desactivated ... waiting for reload.';
			activated = false;
		} else {
			zNode.innerHTML = 'Plugin activated ... waiting for reload.';
			activated = true;
			GM_setValue('working2', 0);
			GM_setValue('working7', 0);
			//window.open('http://navigatorcraft.net/batiment/2');
			//window.open('http://navigatorcraft.net/batiment/7');
		}
		setActivated();
		document.getElementById("myContainer").appendChild(zNode);

		// reload the page
		setTimeout(function() {
			window.location.reload();
		}, 3000);
	}
}

function setActivated() {
	setCookie("activated", activated, null);
}

function setWorkforceActivated() {
	setCookie("workforceActivated", workforceActivated, null);
}

function setCookie(name, value, obsolete) {
	GM_setValue(name, JSON.stringify(value));
}

function getCookie(name) {
	var value = GM_getValue(name);
	if (value != null)
		return JSON.parse(value);
	return null;
}



// alert('test'+GM_getValue("foo"));
// GM_setValue("foo", JSON.stringify(GM_getValue("foo")+'r'));
