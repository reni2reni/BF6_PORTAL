CaptureSpeed_script.ts Script file
CaptureSpeed_strings.json Strings file

Usage: Load each file into the script.

Settings

// User setting items

let cpointno=5; //Number of Capture Points
let capID=200; //First capture point ID [(200),201,202...]
let cspeedC=10; //Capture Control speed
let cspeedR=10; //Capture release speed

// User settings up to here

Variable: cpointno Maximum number of capture points
Variable: capID First capture point ID (IDs must be consecutive)
Variable: cspeedC Capture control speed
Variable: cspeedR Capture release speed
Please enter the desired values ​​for each variable.

Specifications

For a 10-second setting, if there is one more player, subtract 1 second, resulting in a capture time of 9 seconds.
For a 5-player setting, 10 - 5 = 5, resulting in a capture time of 5 seconds.