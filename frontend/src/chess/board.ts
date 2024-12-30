export default class Board {
  grid: (string | null)[][];
  turn: 'w' | 'b';
  castlingRights: { white: { kingSide: boolean; queenSide: boolean }, black: { kingSide: boolean; queenSide: boolean } };
  enPassant: string | null; // e.g., "e3" if black just moved a pawn two squares forward.
  halfMoveClock: number;
  fullMoveNumber: number;
  gameState: "ongoing" | "checkmate" | "stalemate" | "draw";
  prevMove: number[][];

  constructor(copyBoard?: Board, FEN?: string) {
    if (copyBoard) {
      this.grid = JSON.parse(JSON.stringify(copyBoard.grid)); // Deep copy of the grids

      this.castlingRights = {
        white: { kingSide: copyBoard.castlingRights.white.kingSide, queenSide: copyBoard.castlingRights.white.queenSide },
        black: { kingSide: copyBoard.castlingRights.black.kingSide, queenSide: copyBoard.castlingRights.black.queenSide },
      };

      this.turn           = copyBoard.turn;
      this.enPassant      = copyBoard.enPassant;
      this.halfMoveClock  = copyBoard.halfMoveClock;
      this.fullMoveNumber = copyBoard.fullMoveNumber;
      this.gameState      = copyBoard.gameState;
      this.prevMove       = [];
    }
    else if (FEN) {
      const [
        piecePlacement,
        activeColor,
        castlingRightsString,
        enPassant,
        halfMoveClock,
        fullMoveNumber,
      ]: string[] = FEN.split(' ');

      this.turn = activeColor === 'w' ? 'w' : 'b' ;

      const rows: string[] = piecePlacement.split('/');
      this.grid = Array(8).fill(null).map(() => Array(8).fill(null));

      // Parse piece placement
      for (let i = 0; i < 8; i++) {
        let col = 0;
        for (const char of rows[i]) {
          if (/\d/.test(char)) { // \d is used to match numbers
            // Handle empty squares (number specifies count of empty squares)
            col += parseInt(char, 10);
          } else {
            // Handle piece characters
            this.grid[i][col] = char;
            col++;
          }
        }
      }

      // Parse castling rights
      this.castlingRights = {
        white: {
          kingSide:  castlingRightsString.includes('K'),
          queenSide: castlingRightsString.includes('Q'),
        },
        black: {
          kingSide:  castlingRightsString.includes('k'),
          queenSide: castlingRightsString.includes('q'),
        },
      };

      // Parse en passant target square
      this.enPassant = enPassant === "-" ? null : enPassant;

      // Parse half-move clock and full-move number
      this.halfMoveClock  = parseInt(halfMoveClock, 10);
      this.fullMoveNumber = parseInt(fullMoveNumber, 10);

      // Set game state to ongoing by default
      this.gameState = "ongoing";

      this.prevMove = [];
    }
    else {      
      this.grid = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        Array(8).fill('p'),
        ...Array(4).fill(Array(8).fill(null)), // Four rows of null
        Array(8).fill('P'),
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
      ];

      this.castlingRights = {
        white: { kingSide: true, queenSide: true },
        black: { kingSide: true, queenSide: true },
      };

      this.turn           = 'w';
      this.enPassant      = null;
      this.halfMoveClock  = 0;
      this.fullMoveNumber = 1;
      this.gameState      = "ongoing";
      this.prevMove       = [];
    }
  }


  rookMoves(pos: number[]): number[][] {
    const [row, col] = pos;
    const validMoves: number[][] = [];
    const color = this.pieceColor(pos);

    // Down
    for (let i = row + 1; i < 8; i++) {
      if      (this.grid[i][col] === null)            validMoves.push([i, col]);          // empty square
      else if (this.pieceColor([i, col]) !== color) { validMoves.push([i, col]); break; } // enemy piece
      else break;                                                                         // friendly piece
    }

    // Up
    for (let i = row - 1; i >= 0; i--) {
      if      (this.grid[i][col] === null)            validMoves.push([i, col]);          // empty square
      else if (this.pieceColor([i, col]) !== color) { validMoves.push([i, col]); break; } // enemy piece
      else break;                                                                         // friendly piece
    }
    
    // Right
    for (let i = col + 1; i < 8; i++) {
      if      (this.grid[row][i] === null)            validMoves.push([row, i]);          // empty square
      else if (this.pieceColor([row, i]) !== color) { validMoves.push([row, i]); break; } // enemy piece
      else break;                                                                         // friendly piece
    }
    
    // Left
    for (let i = col - 1; i >= 0; i--) {
      if      (this.grid[row][i] === null)            validMoves.push([row, i]);          // empty square
      else if (this.pieceColor([row, i]) !== color) { validMoves.push([row, i]); break; } // enemy piece
      else break;                                                                         // friendly piece
    }

    return validMoves;
  }

  bishopMoves(pos: number[]): number[][] {
    const [row, col] = pos;
    const validMoves: number[][] = [];
    const color = this.pieceColor(pos);

    // Down Right
    let i = row + 1;
    let j = col + 1;
    while (i < 8 && j < 8) {
      if      (this.grid[i][j] === null)            validMoves.push([i, j]);          // empty square
      else if (this.pieceColor([i, j]) !== color) { validMoves.push([i, j]); break; } // enemy piece
      else break;                                                                     // friendly piece
      
      i++;
      j++;
    }

    // Down Left
    i = row + 1;
    j = col - 1;
    while (i < 8 && j >= 0) {
      if      (this.grid[i][j] === null)            validMoves.push([i, j]);          // empty square
      else if (this.pieceColor([i, j]) !== color) { validMoves.push([i, j]); break; } // enemy piece
      else break;                                                                     // friendly piece
      
      i++;
      j--;
    }

    // Up Right
    i = row - 1;
    j = col + 1;
    while (i >= 0 && j < 8) {
      if      (this.grid[i][j] === null)            validMoves.push([i, j]);          // empty square
      else if (this.pieceColor([i, j]) !== color) { validMoves.push([i, j]); break; } // enemy piece
      else break;                                                                     // friendly piece
      
      i--;
      j++;
    }

    // Up Left
    i = row - 1;
    j = col - 1;
    while (i >= 0 && j >= 0) {
      if      (this.grid[i][j] === null)            validMoves.push([i, j]);          // empty square
      else if (this.pieceColor([i, j]) !== color) { validMoves.push([i, j]); break; } // enemy piece
      else break;                                                                     // friendly piece
      
      i--;
      j--;
    }

    return validMoves;
  }

  knightMoves(pos: number[]): number[][] {
    const [row, col] = pos;
    const validMoves: number[][] = [];
    const color = this.pieceColor(pos);

    const isValid = (row: number, col: number): void => {
      if (row >= 8 || row < 0 || col >= 8 || col < 0) return;
      if (this.pieceColor([row, col]) === color)      return;
      validMoves.push([row, col]);
    };

    isValid(row + 2, col + 1); // Down Right
    isValid(row + 2, col - 1); // Down Left

    isValid(row - 2, col + 1); // Up Right
    isValid(row - 2, col - 1); // Up Left

    isValid(row + 1, col + 2); // Right Down
    isValid(row + 1, col - 2); // Left Down

    isValid(row - 1, col + 2); // Right Up
    isValid(row - 1, col - 2); // Left Up

    return validMoves;
  }


  pieceColor(pos: number[]): 'w' | 'b' | null {
    const piece = this.grid[pos[0]][pos[1]];
    if (!piece) return null;

    if (piece === piece.toLowerCase() && piece !== piece.toUpperCase()) return 'b';
    if (piece === piece.toUpperCase() && piece !== piece.toLowerCase()) return 'w';

    return null;
  }
  
  isCheck(): boolean {
    // pending implementation
    return false;
  }


  FEN(): string {
    // 1. Piece Placement
    const piecePlacement = this.grid.map(row => {
      let rowString: string = '';
      let emptyCount: number = 0;

      for (const square of row) {
        if (square === null) emptyCount++;
        else {
          if (emptyCount > 0) {
            rowString += String(emptyCount);
            emptyCount = 0;
          }
          rowString += square;
        }
      }

      if (emptyCount > 0) rowString += String(emptyCount); // trailing empty squares
      return rowString;
    }).join('/');

    // 2. Active color
    const activeColor: string = this.fullMoveNumber % 2 === 1 ? 'w' : 'b';

    // 3. Castling rights
    const castlingRights: string[] = [];
    if (this.castlingRights.white.kingSide)  castlingRights.push('K');
    if (this.castlingRights.white.queenSide) castlingRights.push('Q');
    if (this.castlingRights.black.kingSide)  castlingRights.push('k');
    if (this.castlingRights.black.queenSide) castlingRights.push('q');
    const castlingRightsString: string = castlingRights.length > 0 ? castlingRights.join('') : '-';

    return [
      piecePlacement,
      activeColor,
      castlingRightsString,
      this.enPassant || '-',
      String(this.halfMoveClock),
      String(this.fullMoveNumber),
    ].join(' ');
  }
}
