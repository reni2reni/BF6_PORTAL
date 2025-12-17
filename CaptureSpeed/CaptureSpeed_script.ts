
import * as modlib from 'modlib';

// User setting items

let cpointno=3; //Number of CapturePoints
let capID=100;  //First capturepoint ID (100),101,102...
let cspeedC=5;//Capture Control speed
let cspeedR=5;//Capture release speed

//User settings up to here

let capspeed: number[]=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
let p=0;
export async function OnGameModeStarted() {
 // TODO: make this function "async"
 while (true) {

  for (let i = 0; i < cpointno; i++) {
    p=i;
    CaptureSpeed();
    capspeed[i]=mod.GetCaptureProgress(mod.GetCapturePoint(capID+i));
  }
  await mod.Wait(0.2);
 }
}

function CaptureSpeed() {

capspeed[p+cpointno]=mod.AbsoluteValue(mod.Subtract(
mod.CountOf(modlib.FilteredArray(
mod.GetPlayersOnPoint(mod.GetCapturePoint(mod.Add(
100,
p))),
(currentArrayElement: any) => mod.Equals(
mod.GetTeam(currentArrayElement),
mod.GetTeam(1)))),
mod.CountOf(modlib.FilteredArray(
mod.GetPlayersOnPoint(mod.GetCapturePoint(mod.Add(
100,p))),
(currentArrayElement: any) => mod.Equals(
mod.GetTeam(currentArrayElement),
mod.GetTeam(2))))));
let spc=capspeed[p+cpointno];
let spR=capspeed[p+cpointno];
if(spc>cspeedC){spc=cspeedC}
if(spR>cspeedR){spR=cspeedR}
 if (mod.GreaterThan(
mod.Subtract(
mod.GetCaptureProgress(mod.GetCapturePoint(mod.Add(
100,p))),
capspeed[p],
),0)) 

{
  mod.SetCapturePointNeutralizationTime(mod.GetCapturePoint(mod.Add(
100,p)),mod.Subtract(
cspeedR+1,spR));
  mod.SetCapturePointCapturingTime(mod.GetCapturePoint(mod.Add(
100,p)),mod.Subtract(
cspeedC+1,spc));

 } else {
  if (mod.LessThan(
mod.Subtract(
mod.GetCaptureProgress(mod.GetCapturePoint(mod.Add(
100,p))),
capspeed[p],
),0)) {
  mod.SetCapturePointCapturingTime(mod.GetCapturePoint(mod.Add(
100,p)),mod.Subtract(
cspeedC+1,spc));
mod.SetCapturePointNeutralizationTime(mod.GetCapturePoint(mod.Add(
100,p)),mod.Subtract(
cspeedR+1,spR));
  }
 }
}
// global vars


// player vars

// team vars

// capture point vars

// mcom vars

// vehicle vars


// Strings content - add the following to your strings file: 

