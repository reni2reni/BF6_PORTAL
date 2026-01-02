
import * as modlib from 'modlib';

function OngoingPlayer_01_Condition(eventInfo: any): boolean {
  const newState =  mod.And(
    mod.Not(mod.GetSoldierState(eventInfo.eventPlayer, mod.SoldierStateBool.IsAISoldier)),
    mod.GetSoldierState(eventInfo.eventPlayer, mod.SoldierStateBool.IsAlive));
 return newState;
}

async function OngoingPlayer_01_Action(eventInfo: any) {
 mod.AddUIText("XYZ",mod.CreateVector(200,60,0),mod.CreateVector(400,40,0),mod.UIAnchor.BottomCenter,mod.Message(" "),eventInfo.eventPlayer);
 mod.AddUIText("YAWPIT",mod.CreateVector(200,20,0),mod.CreateVector(300,40,0),mod.UIAnchor.BottomCenter,mod.Message(" "),eventInfo.eventPlayer);
 while (true) {
  mod.SetVariable(mod.ObjectVariable(eventInfo.eventPlayer,yawPlayerVar),mod.WorldVectorOf(mod.ForwardVector(),eventInfo.eventPlayer));
  if (mod.GreaterThanEqualTo(
mod.XComponentOf(mod.GetVariable(mod.ObjectVariable(eventInfo.eventPlayer,yawPlayerVar))),
0)) {
   mod.SetVariable(mod.ObjectVariable(eventInfo.eventPlayer,yawPlayerVar),
   mod.DegreesToRadians(mod.AngleBetweenVectors(mod.BackwardVector(),mod.Normalize(mod.CreateVector(
    mod.XComponentOf(mod.GetVariable(mod.ObjectVariable(eventInfo.eventPlayer,yawPlayerVar))),
    0,
   mod.ZComponentOf(mod.GetVariable(mod.ObjectVariable(eventInfo.eventPlayer,yawPlayerVar))))))))
  } else {
   mod.SetVariable(mod.ObjectVariable(eventInfo.eventPlayer,yawPlayerVar),mod.DegreesToRadians(mod.Subtract(
360,
mod.AngleBetweenVectors(mod.BackwardVector(),mod.Normalize(mod.CreateVector(
  mod.XComponentOf(mod.GetVariable(mod.ObjectVariable(eventInfo.eventPlayer,yawPlayerVar))),0,
  mod.ZComponentOf(mod.GetVariable(mod.ObjectVariable(eventInfo.eventPlayer,yawPlayerVar)))))))))
  }
  mod.SetVariable(mod.ObjectVariable(eventInfo.eventPlayer,pitchPlayerVar),
  mod.ArccosineInRadians(mod.YComponentOf(mod.WorldVectorOf(mod.ForwardVector(),eventInfo.eventPlayer))))
  mod.SetUITextLabel(mod.FindUIWidgetWithName("XYZ"),mod.Message("x:  {}   y:  {}   z:  {}",mod.Divide(
mod.RoundToInteger(mod.Multiply(mod.XComponentOf(mod.GetSoldierState(eventInfo.eventPlayer,mod.SoldierStateVector.GetPosition)),100)),
100),mod.Divide(
mod.RoundToInteger(mod.Multiply(mod.YComponentOf(mod.GetSoldierState(eventInfo.eventPlayer,mod.SoldierStateVector.GetPosition)),100)),
100),mod.Divide(
mod.RoundToInteger(mod.Multiply(mod.ZComponentOf(mod.GetSoldierState(eventInfo.eventPlayer,mod.SoldierStateVector.GetPosition)),100)),
100)))
  mod.SetUITextLabel(mod.FindUIWidgetWithName("YAWPIT"),mod.Message("Yaw:  {}   Pitch:  {}",mod.Divide(
mod.RoundToInteger(mod.Multiply(mod.GetVariable(mod.ObjectVariable(eventInfo.eventPlayer,yawPlayerVar)),100)),
100),mod.Divide(
mod.RoundToInteger(mod.Multiply(mod.GetVariable(mod.ObjectVariable(eventInfo.eventPlayer,pitchPlayerVar)),100)),
100)))
  await mod.Wait(0.0166)
 }
}

function OngoingPlayer_01(conditionState: any, eventInfo: any) {
let newState = OngoingPlayer_01_Condition(eventInfo);
if (!conditionState.update(newState)) {
 return;
}
OngoingPlayer_01_Action(eventInfo);
}

function OngoingPlayer_02_Condition(eventInfo: any): boolean {
const newState = mod.And(
  mod.And(
    mod.Not(mod.GetSoldierState(eventInfo.eventPlayer, mod.SoldierStateBool.IsAISoldier)),
    mod.GetSoldierState(eventInfo.eventPlayer, mod.SoldierStateBool.IsAlive)),
  mod.And(
    mod.GetSoldierState(eventInfo.eventPlayer, mod.SoldierStateBool.IsZooming),
    mod.IsInventorySlotActive(eventInfo.eventPlayer, mod.InventorySlots.SecondaryWeapon)));
return newState;
}

async function OngoingPlayer_02_Action(eventInfo: any) {
 mod.SetVariable(mod.ObjectVariable(eventInfo.eventPlayer,dyPlayerVar),mod.Subtract(
mod.YComponentOf(mod.Add(
mod.GetSoldierState(eventInfo.eventPlayer,mod.SoldierStateVector.EyePosition),
mod.Multiply(mod.WorldVectorOf(mod.ForwardVector(),eventInfo.eventPlayer),200))),
mod.YComponentOf(mod.GetSoldierState(eventInfo.eventPlayer,mod.SoldierStateVector.GetPosition))))
 mod.SetVariable(mod.ObjectVariable(eventInfo.eventPlayer,ppoPlayerVar),mod.YComponentOf(mod.GetSoldierState(eventInfo.eventPlayer,mod.SoldierStateVector.GetPosition)))
 if (mod.LessThanEqualTo(mod.ArccosineInRadians(mod.YComponentOf(mod.WorldVectorOf(mod.ForwardVector(),eventInfo.eventPlayer))),0.1)) {
  mod.SetCameraTypeForPlayer(eventInfo.eventPlayer,mod.Cameras.ThirdPerson)
  while (mod.GetSoldierState(eventInfo.eventPlayer,mod.SoldierStateBool.IsZooming)) {
   mod.SetVariable(mod.ObjectVariable(eventInfo.eventPlayer,dyPlayerVar),mod.Add(
mod.GetSoldierState(eventInfo.eventPlayer,mod.SoldierStateVector.GetPosition),
mod.Multiply(mod.UpVector(),20)))
   mod.Teleport(eventInfo.eventPlayer,mod.GetVariable(mod.ObjectVariable(eventInfo.eventPlayer,dyPlayerVar)),mod.GetVariable(mod.ObjectVariable(eventInfo.eventPlayer,yawPlayerVar)))
   await mod.Wait(0.1)
  }
  mod.SetCameraTypeForPlayer(eventInfo.eventPlayer,mod.Cameras.FirstPerson)
 } else {
  mod.SetCameraTypeForPlayer(eventInfo.eventPlayer,mod.Cameras.ThirdPerson)
  while (mod.GetSoldierState(eventInfo.eventPlayer,mod.SoldierStateBool.IsZooming)) {
   mod.SetVariable(mod.ObjectVariable(eventInfo.eventPlayer,ppoPlayerVar),mod.Add(
mod.GetVariable(mod.ObjectVariable(eventInfo.eventPlayer,ppoPlayerVar)),
mod.Divide(
mod.GetVariable(mod.ObjectVariable(eventInfo.eventPlayer,dyPlayerVar)),
20)))
   mod.Teleport(eventInfo.eventPlayer,mod.CreateVector(mod.XComponentOf(mod.WorldPositionOf(mod.Multiply(mod.ForwardVector(),10),
   eventInfo.eventPlayer)),mod.GetVariable(mod.ObjectVariable(eventInfo.eventPlayer,ppoPlayerVar)),mod.ZComponentOf(mod.WorldPositionOf(mod.Multiply(mod.ForwardVector(),10),
   eventInfo.eventPlayer))),mod.GetVariable(mod.ObjectVariable(eventInfo.eventPlayer,yawPlayerVar)))
   await mod.Wait(0.1)
  }
  mod.SetCameraTypeForPlayer(eventInfo.eventPlayer,mod.Cameras.FirstPerson)
 }
}
function OngoingPlayer_02(conditionState: any, eventInfo: any) {
let newState = OngoingPlayer_02_Condition(eventInfo);
if (!conditionState.update(newState)) {
 return;
}
OngoingPlayer_02_Action(eventInfo);
}

// global vars

// player vars
const yawPlayerVar = 0;
const pitchPlayerVar = 1;
const dyPlayerVar = 2;
const ppoPlayerVar = 3;



export function OnPlayerDeployed(eventPlayer: mod.Player) {
const eventInfo = {eventPlayer};
let eventNum = 0;
  OngoingPlayer_01(modlib.getPlayerCondition(eventPlayer, eventNum++), eventInfo);
}

export function OngoingPlayer(eventPlayer: mod.Player) {
const eventInfo = {eventPlayer: eventPlayer};
let eventNum = 1;
  OngoingPlayer_02(modlib.getPlayerCondition(eventPlayer, eventNum++), eventInfo);
}


// Strings content - add the following to your strings file: 

