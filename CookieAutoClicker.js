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


if(AutoClicker === undefined) var AutoClicker = {};
if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/' + (0? 'Beta/' : '') + 'CCSE.js');
AutoClicker.name = 'AutoClicker';
AutoClicker.version = '0.1';
AutoClicker.GameVersion = '2.042';

let clicksPerSecond = 0;
let nextPurchase = 'UnInitialized';

AutoClicker.launch = async function() {
    'use strict';

    await sleep(1000);
    addDisplay();
    updateDisplay(nextPurchase);

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
        clickGoldenCookie();
    }, 4)

    // Interval for buying Buildings and Upgrades
    setInterval(()=>{
        let bestBuilding = calcBestBuilding();
        let bestUpgrade = calcBestUpgrade();

        if(bestBuilding[1] <= bestUpgrade[1]){
            //console.log("Best Index: " + bestBuilding[0] + " with ROI: " + bestRoi);
            if(bestBuilding[0] != -1) {
                //console.log("Best Purchase: " + Game.ObjectsById[bestBuilding[0]].name);
                updateDisplay(Game.ObjectsById[bestBuilding[0]].name);
                Game.ObjectsById[bestBuilding[0]].buy();
            }
        }
        else if(bestUpgrade[1] < bestBuilding[1]){
            //console.log("Best Index: " + bestUpgrade[0] + " with ROI: " + bestRoi);
            if(bestUpgrade[0] != -1) {
                //console.log("Best Purchase: " + Game.UpgradesInStore[bestUpgrade[0]].name);
                updateDisplay(Game.UpgradesInStore[bestUpgrade[0]].name);
                if(Game.UpgradesInStore[bestUpgrade[0]].canBuy() == 1) {
                    Game.UpgradesInStore[bestUpgrade[0]].buy();
                }
            }
        }

    }, 100)
}

AutoClicker.launch();

function calcBestBuilding() {
    let bestRoi = 10000000000000;
    let bestIdx = -1;
    for(let i=Game.ObjectsById.length-1; i >= 0; i--) {
        let deltaCps = calcBuildingCps(i);
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

function calcBestUpgrade() {
    let bestRoi = 10000000000000;
    let bestIdx = -1;
    for(let i=0; i < Game.UpgradesInStore.length; i++) {
        let deltaCps = calcUpgradeCps(i);
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

function clickGoldenCookie() {
    for(let i = 0; i < Game.shimmers.length; i++) {
        if(Game.shimmers[i].type == 'golden') {
            Game.shimmers[i].pop();
            castForceHand();
        }
    }
}

function calcBuildingCps(buildingId){

    let curCps = Game.cookiesPs + (Game.computedMouseCps*clicksPerSecond);

    Game.ObjectsById[buildingId].getFree(1);
    Game.CalculateGains();

    let newCps = Game.cookiesPs + (Game.computedMouseCps*clicksPerSecond);

    Game.ObjectsById[buildingId].getFree(-1);
    Game.CalculateGains();

    return newCps - curCps;
}

function calcUpgradeCps(upgradeId){

    let curCps = Game.cookiesPs + (Game.computedMouseCps*clicksPerSecond);

    Game.UpgradesInStore[upgradeId].earn();
    Game.CalculateGains();

    let newCps = Game.cookiesPs + (Game.computedMouseCps*clicksPerSecond);

    Game.UpgradesInStore[upgradeId].unearn();
    Game.CalculateGains();

    return newCps - curCps;
}

function castForceHand() {
    Game.ObjectsById[7].minigame.castSpell(Game.ObjectsById[7].minigame.spellsById[1],{});
}

function addDisplay(){
  const parent = document.querySelector('#versionNumber');
  let newElement = document.createElement('div');
  newElement.id = "nextPurchase";
  newElement.style.color = "white";
  newElement.style.cursor = "pointer";
  newElement.textContent = "";
  parent.appendChild(newElement);
}

function updateDisplay(value){
    if(value == nextPurchase) { return; }

    let element = document.querySelector('#nextPurchase');
    element.textContent = "Next: " + value;
    nextPurchase = value;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
