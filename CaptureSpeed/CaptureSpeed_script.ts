
import * as modlib from 'modlib';

// User setting items

let cpointno=5; //Number of CapturePoints
let capID=200;  //First capturepoint ID [(100),101,102...]
let cspeedC=10;//Capture Control speed
let cspeedR=10;//Capture release speed

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
capID,p))),
(currentArrayElement: any) => mod.Equals(
mod.GetTeam(currentArrayElement),
mod.GetTeam(1)))),
mod.CountOf(modlib.FilteredArray(
mod.GetPlayersOnPoint(mod.GetCapturePoint(mod.Add(
capID,p))),
(currentArrayElement: any) => mod.Equals(
mod.GetTeam(currentArrayElement),
mod.GetTeam(2))))));
let spC=capspeed[p+cpointno];
let spR=capspeed[p+cpointno];
if(spC>cspeedC){spC=cspeedC}
if(spR>cspeedR){spR=cspeedR}
 if (mod.GreaterThan(
mod.Subtract(
mod.GetCaptureProgress(mod.GetCapturePoint(mod.Add(
capID,p))),
capspeed[p],
),0)) 

{
  mod.SetCapturePointNeutralizationTime(mod.GetCapturePoint(mod.Add(
capID,p)),mod.Subtract(
cspeedR+1,spR));
  mod.SetCapturePointCapturingTime(mod.GetCapturePoint(mod.Add(
capID,p)),mod.Subtract(
cspeedC+1,spC));

 } else {
  if (mod.LessThan(
mod.Subtract(
mod.GetCaptureProgress(mod.GetCapturePoint(mod.Add(
capID,p))),
capspeed[p],
),0)) {
  mod.SetCapturePointCapturingTime(mod.GetCapturePoint(mod.Add(
capID,p)),mod.Subtract(
cspeedC+1,spC));
mod.SetCapturePointNeutralizationTime(mod.GetCapturePoint(mod.Add(
capID,p)),mod.Subtract(
cspeedR+1,spR));
  }
 }
}

