// ==UserScript==
// @name         Cookie Autoclicker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Shimizoki
// @match        https://orteil.dashnet.org/cookieclicker/
// @icon         https://cdn.akamai.steamstatic.com/steam/apps/1454400/capsule_616x353.jpg?t=1630523196
// @grant        none
// ==/UserScript==

if(CookieAutoClicker === undefined) var CookieAutoClicker = {};
if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/' + (0? 'Beta/' : '') + 'CCSE.js');
CookieAutoClicker.name = 'CookieAutoClicker';
CookieAutoClicker.version = '0.1';
CookieAutoClicker.GameVersion = '2.042';


CookieAutoClicker.clicksPerSecond = 0;
CookieAutoClicker.nextPurchase = 'UnInitialized';

CookieAutoClicker.launch = function() {
    
	CookieAutoClicker.init = async function() {
        'use strict';
    
        await CookieAutoClicker.sleep(1000);
        CookieAutoClicker.addDisplay();
        CookieAutoClicker.updateDisplay(CookieAutoClicker.nextPurchase);
    
        // Interval for calculating CPS
        let cookiesLastInterval = Game.cookies;
        setInterval(()=>{
            let cps = Game.cookies - cookiesLastInterval;
            cookiesLastInterval = Game.cookies;
    
            // Back out early if I bought something
            if(cps < 0) { return; }
    
            let autoCps = Game.cookiesPs;
            let clickCps = cps - autoCps;
            clicksPerSecond = Math.round(clickCps / Game.computedMouseCps);
    
            //console.log("CPS: " + cps + " | Click CPS" + clickCps + " | Clicks Per Second " + clicksPerSecond);
        }, 1000)
    
        // Interval for clicking on the cookies
        setInterval(()=>{
            Game.ClickCookie();
            CookieAutoClicker.clickGoldenCookie();
        }, 4)
    
        // Interval for buying Buildings and Upgrades
        setInterval(()=>{
            let bestBuilding = CookieAutoClicker.calcBestBuilding();
            let bestUpgrade = CookieAutoClicker.calcBestUpgrade();
    
            if(bestBuilding[1] <= bestUpgrade[1]){
                //console.log("Best Index: " + bestBuilding[0] + " with ROI: " + bestRoi);
                if(bestBuilding[0] != -1) {
                    //console.log("Best Purchase: " + Game.ObjectsById[bestBuilding[0]].name);
                    CookieAutoClicker.updateDisplay(Game.ObjectsById[bestBuilding[0]].name);
                    Game.ObjectsById[bestBuilding[0]].buy();
                }
            }
            else if(bestUpgrade[1] < bestBuilding[1]){
                //console.log("Best Index: " + bestUpgrade[0] + " with ROI: " + bestRoi);
                if(bestUpgrade[0] != -1) {
                    //console.log("Best Purchase: " + Game.UpgradesInStore[bestUpgrade[0]].name);
                    CookieAutoClicker.updateDisplay(Game.UpgradesInStore[bestUpgrade[0]].name);
                    if(Game.UpgradesInStore[bestUpgrade[0]].canBuy() == 1) {
                        Game.UpgradesInStore[bestUpgrade[0]].buy();
                    }
                }
            }
    
        }, 100)
    }
    
    CookieAutoClicker.save = function(){
	}

	CookieAutoClicker.load = function(str){
	}
    
    CookieAutoClicker.calcBestBuilding() {
        let bestRoi = 10000000000000;
        let bestIdx = -1;
        for(let i=Game.ObjectsById.length-1; i >= 0; i--) {
            let deltaCps = CookieAutoClicker.calcBuildingCps(i);
            if(Game.ObjectsById[i].locked == 0 && deltaCps != 0) {
                let roi = Game.ObjectsById[i].price / deltaCps;
                if(roi < bestRoi) {
                    bestRoi = roi;
                    bestIdx = i;
                }
            }
        }
    
        return [bestIdx, bestRoi];
    }
    
    CookieAutoClicker.calcBestUpgrade() {
        let bestRoi = 10000000000000;
        let bestIdx = -1;
        for(let i=0; i < Game.UpgradesInStore.length; i++) {
            let deltaCps = CookieAutoClicker.calcUpgradeCps(i);
            if(deltaCps != 0) {
                let roi = Game.UpgradesInStore[i].getPrice() / deltaCps;
                if(roi < bestRoi) {
                    bestRoi = roi;
                    bestIdx = i;
                }
            }
        }
    
        return [bestIdx, bestRoi];
    }
    
    CookieAutoClicker.clickGoldenCookie() {
        for(let i = 0; i < Game.shimmers.length; i++) {
            if(Game.shimmers[i].type == 'golden') {
                Game.shimmers[i].pop();
                castForceHand();
            }
        }
    }
    
    CookieAutoClicker.calcBuildingCps(buildingId){
    
        let curCps = Game.cookiesPs + (Game.computedMouseCps*clicksPerSecond);
    
        Game.ObjectsById[buildingId].getFree(1);
        Game.CalculateGains();
    
        let newCps = Game.cookiesPs + (Game.computedMouseCps*clicksPerSecond);
    
        Game.ObjectsById[buildingId].getFree(-1);
        Game.CalculateGains();
    
        return newCps - curCps;
    }
    
    CookieAutoClicker.calcUpgradeCps(upgradeId){
    
        let curCps = Game.cookiesPs + (Game.computedMouseCps * CookieAutoClicker.clicksPerSecond);
    
        Game.UpgradesInStore[upgradeId].earn();
        Game.CalculateGains();
    
        let newCps = Game.cookiesPs + (Game.computedMouseCps * CookieAutoClicker.clicksPerSecond);
    
        Game.UpgradesInStore[upgradeId].unearn();
        Game.CalculateGains();
    
        return newCps - curCps;
    }
    
    CookieAutoClicker.castForceHand() {
        Game.ObjectsById[7].minigame.castSpell(Game.ObjectsById[7].minigame.spellsById[1],{});
    }
    
    CookieAutoClicker.addDisplay(){
      const parent = document.querySelector('#versionNumber');
      let newElement = document.createElement('div');
      newElement.id = "nextPurchase";
      newElement.style.color = "white";
      newElement.style.cursor = "pointer";
      newElement.textContent = "";
      parent.appendChild(newElement);
    }
    
    CookieAutoClicker.updateDisplay(value){
        if(value == nextPurchase) { return; }
    
        let element = document.querySelector('#nextPurchase');
        element.textContent = "Next: " + value;
        CookieAutoClicker.nextPurchase = value;
    }
    
    CookieAutoClicker.sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
}

if(!CookieAutoClicker.isLoaded){
    if(CCSE && CCSE.isLoaded){
    	CookieAutoClicker.launch();
    }
    else{
    	if(!CCSE) var CCSE = {};
    	if(!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
    	CCSE.postLoadHooks.push(CookieAutoClicker.launch);
    }
}
