CaptureSpeed_script.ts 		スクリプトファイル
CaptureSpeed_strings.json	ストリングスファイル

使い方　スクリプトにそれぞれ読み込みます

設定	

// User setting items

let cpointno=5; //Number of CapturePoints
let capID=200;  //First capturepoint ID [(200),201,202...]
let cspeedC=10;//Capture Control speed
let cspeedR=10;//Capture release speed

//User settings up to here

変数：cpointno　キャプチャーポイントの最大数
変数：capID	チャプチャーポイントの最初のID　基本　IDは連続することとします
変数：cspeedC　	キャプチャー制圧スピード
変数：cspeedR	キャプチャー解除スピード
それぞれ希望の数値を代入してください

仕様

10秒設定の場合プレイヤーが一人多いと、マイナス1秒　9秒で制圧されます
5人の時は１０－５＝５　５秒で制圧可能です

