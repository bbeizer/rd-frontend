// if white has a piece with the ball on the back row, or if black has a piece on the front row
// with the ball then someone has won
export const didWin = (gameBoard) => {
    //console.log("did win hit")
    const oneArray = ["a1","b1","c1","d1","e1","f1","g1","h1"]
    const eightArray = ["a8","b8","c8","d8","e8","f8","g8","h8"]
    for(var i = 0; i<8;i++){
        if(gameBoard[oneArray[i]]){
            if(gameBoard[oneArray[i]].hasBall && gameBoard[oneArray[i]].color === "white"){
                return true;
            }
        } 
        if(gameBoard[eightArray[i]]){
            if(gameBoard[eightArray[i]].hasBall && gameBoard[eightArray[i]].color === "black"){
                return true
            }
        }
    } return false;
  };