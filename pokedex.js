/**
 * Name: Tapan Khanal
 * Date: 11/6/21
 * The pokedex.js file for the pokemon game. This javascript file describes the mechanics behind
 * the pokemon game. It makes requests to an API, displays results, and makes the features function
 * properly.
 */

 "use strict";

 (function() {

   const ENDPOINT = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/pokedex.php";

   const SPRITES = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/sprites/";

   const ICONS = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/icons/";

   const START_GAME = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/game.php";

   const POKE_DATA_PATH = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/";

   let gameId;
   let playerId;
   let playerHP;
   let foundPokemonSet = new Set();

   /**
    * Function that will be called when the window is loaded.
    */
   window.addEventListener("load", init);

   /**
    * Populates the pokedex once the page loads
    */
   function init() {
     let url = ENDPOINT + "?pokedex=all";
     fetch(url)
       .then(statusCheck)
       .then(res => res.text())
       .then(populatePokedex)
       .catch(console.error);
   }

   /**
    * Checks and returns the API status
    * @param {Object} res response from API
    * @returns {Object} response from API
    */
   async function statusCheck(res) {
     if (!res.ok) {
       throw new Error(await res.text());
     }
     return res;
   }

   /**
    * Processes the response from api and populates the pokedex
    * @param {Object} res - response from API
    */
   function populatePokedex(res) {
     res = res.trim().split("\n");
     for (let i = 0; i < res.length; i++) {
       let imgName = res[i].split(":");
       let imgPath = SPRITES + imgName[1] + ".png";
       let img = document.createElement("img");
       img.src = imgPath;
       img.alt = imgName[0];
       img.id = imgName[1];

       img.className = "sprite";

       if (img.id === "bulbasaur" || img.id === "charmander" || img.id === "squirtle") {
         img.classList.add("found");
         img.addEventListener("click", viewPokemonData);
       }

       id("pokedex-view").appendChild(img);
     }
   }

   /**
    * Gets the data of pokemon
    * @param {String} name - name of pokemon
    */
   function getPokemonData(name) {
     let url = ENDPOINT + "?pokemon=" + name;
     fetch(url)
       .then(statusCheck)
       .then(res => res.json())
       .then(populatePlayerCard)
       .catch(console.error);
   }

   /**
    * Makes a request to start a game
    */
   function initializeGame() {
     let url = START_GAME;
     let params = new FormData();
     let pokeName = qs("#p1 .name");
     let mypokemon = pokeName.textContent;
     playerHP = qs("#p1 .hp").textContent;
     params.append("startgame", "true");
     params.append("mypokemon", mypokemon);

     fetch(url, {method: "POST", body: params})
       .then(statusCheck)
       .then(res => res.json())
       .then(startGame)
       .catch(console.error);
   }

   /**
    * Populates p1's card with pokemon data
    * @param {Object} res - response from API
    */
   function populatePlayerCard(res) {
     populatePokemonData(res, "p1");
     let start = id("start-btn");
     unhideElement(start);
     start.addEventListener("click", chooseThisPoke);
   }

   /**
    * Populates the pokemon card of specified player with data
    * @param {Object} res response from API
    * @param {String} player player1 being the user and player2 being the opponent
    */
   function populatePokemonData(res, player) {
     let data;
     if (player === "p1") {
       data = res;
     } else {
       data = res['p2'];
       gameId = res['guid'];
       playerId = res['pid'];
     }

     let pokeName = qs("#" + player + " .name");
     pokeName.textContent = data['name'];

     let imgPath = POKE_DATA_PATH + data['images']['photo'];
     let pokemonPic = qs("#" + player + " .pokemon-pic");
     pokemonPic.children[0].src = imgPath;

     let typePath = POKE_DATA_PATH + data['images']['typeIcon'];
     let typePic = qs("#" + player + " .type");
     typePic.src = typePath;

     let weaknessPath = POKE_DATA_PATH + data['images']['weaknessIcon'];
     let weaknessPic = qs("#" + player + " .weakness");
     weaknessPic.src = weaknessPath;

     let healthPoint = qs("#" + player + " .hp");
     healthPoint.textContent = data['hp'] + "HP";

     let desc = qs("#" + player + " .info");
     desc.textContent = data['info']['description'];

     btnData(data, player);
   }

   /**
    * Events that follow when player "clicks on choose this pokemon"
    */
   function chooseThisPoke() {
     let view = qs("#pokedex-view");
     hideElement(view);

     let p2 = qs("#p2");
     unhideElement(p2);

     let health = qs(".hp-info");
     unhideElement(health);

     let results = qs("#results-container");
     unhideElement(results);

     let start = qs("#start-btn");
     hideElement(start);

     let flee = qs("#flee-btn");
     unhideElement(flee);

     enableDisableMoveBtns(false);

     let title = qs("header h1");
     title.textContent = "Pokemon Battle!";

     initializeGame();
   }

   /**
    * Enable or disable the btns for moves on each pokemon card
    * @param {boolean} option true to disable, false to enable
    */
   function enableDisableMoveBtns(option) {
     let moves = qs(".moves");

     for (let i = 0; i < moves.children.length; i++) {
       if (option === true) {
         moves.children[i].disabled = true;
       } else {
         moves.children[i].disabled = false;
       }
     }

   }

   /**
    * Add a listener to flee btn
    */
   function listenToFlee() {
     let fleeBtn = qs("#flee-btn");
     fleeBtn.addEventListener("click", function() {
       playerMove("flee");
     });
   }

   /**
    * Add a listener to each move btns in the pokemon card
    */
   function listenToPlayerMoves() {
     let moves = qs("#p1 .moves");
     for (let i = 0; i < moves.children.length; ++i) {
       moves.children[i].addEventListener("click", addListenerPlayerMoves);
     }
   }

   /**
    * Get a response of results when a user clicks on a move
    * @param {String} chosenMove - the move user clicked on
    */
   function playerMove(chosenMove) {
     let url = START_GAME;
     let params = new FormData();
     params.append("guid", gameId);
     params.append("pid", playerId);
     params.append("movename", chosenMove);

     showHideLoading(true);
     fetch(url, {method: "POST", body: params})
       .then(statusCheck)
       .then(res => res.json())
       .then(moveRes)
       .catch(console.error);
   }

   /**
    * Process and display data from each move results
    * @param {Object} res - response from API
    */
   function moveRes(res) {
     showHideLoading(false);

     let playerTurnRes = qs("#p1-turn-results");
     let oppTurnRes = qs("#p2-turn-results");

     unhideElement(playerTurnRes);
     unhideElement(oppTurnRes);

     let results = res['results'];
     let playerMsg = attackResultsMessage("1", results);
     let oppMsg = attackResultsMessage("2", results);

     let playerHealthBar = qs("#p1 .health-bar");
     let opponentHealthBar = qs("#p2 .health-bar");

     let playerHp = res['p1']['hp'];
     let playerCurrHp = res['p1']['current-hp'];

     let oppHp = res['p2']['hp'];
     let oppCurrHp = res['p2']['current-hp'];

     let playerHealthPoint = qs("#p1 .hp");
     let oppHealthPoint = qs("#p2 .hp");

     setPlayerResultMsg(playerTurnRes, oppTurnRes, oppMsg, playerMsg, results);

     playerHealthPoint.textContent = playerCurrHp + "HP";
     oppHealthPoint.textContent = oppCurrHp + "HP";

     let playerPercent = (playerCurrHp / playerHp) * 100;
     let oppPercent = (oppCurrHp / oppHp) * 100;

     playerHealthBar.style.width = playerPercent + "%";
     opponentHealthBar.style.width = oppPercent + "%";

     lowHealth(oppPercent, playerPercent, opponentHealthBar, playerHealthBar);

     gameConclusion(playerCurrHp, oppCurrHp, res);

   }

   /**
    * Displays the messages after each move
    * @param {DOMobject} playerTurnRes - Element for player msg to be shown in
    * @param {DOMobject} oppTurnRes - Element for opponent msg to be shown in
    * @param {string} oppMsg - The msg to be shown for opponent
    * @param {string} playerMsg - The msg to be shown for player
    * @param {Object} results - API Response
    */
   function setPlayerResultMsg(playerTurnRes, oppTurnRes, oppMsg, playerMsg, results) {
     playerTurnRes.textContent = playerMsg;
     if (results['p2-move'] !== null && results['p2-result'] !== null) {
       oppTurnRes.textContent = oppMsg;
     } else if (results['p2-move'] === null && results['p2-result'] === null) {
       hideElement(oppTurnRes);
     }
   }

   /**
    * When a user wins a battle, add that pokemon to their found list
    * @param {String} pokemonName - name of pokemon defeated
    */
   function addPokemonToFound(pokemonName) {
     foundPokemonSet.add(pokemonName);
     let pokedex = qs("#pokedex-view").children;
     for (let i = 0; i < pokedex.length; i++) {
       if (pokedex[i].alt === pokemonName) {
         pokedex[i].classList.add("found");
         pokedex[i].addEventListener("click", viewPokemonData);
       }
     }
   }

   /**
    * Events that follow when a user goes back to main menu from game view
    */
   function backToPokedexView() {

     let playerTurnRes = qs("#p1-turn-results");
     let oppTurnRes = qs("#p2-turn-results");
     playerTurnRes.textContent = "";
     oppTurnRes.textContent = "";

     let resContainer = qs("#results-container");
     hideElement(resContainer);

     let opponent = qs("#p2");
     hideElement(opponent);

     let hpInfo = qs("#p1 .hp-info");
     hideElement(hpInfo);

     let startBtn = qs("#start-btn");
     unhideElement(startBtn);

     let playerPokemon = qs("#p1 .hp");
     playerPokemon.textContent = playerHP;

     resetHealthBar("p1");
     resetHealthBar("p2");

     let title = qs("header h1");
     title.textContent = "Your Pokedex";

     let pokedex = qs("#pokedex-view");
     unhideElement(pokedex);

     let endGameBtn = qs("#endgame");
     hideElement(endGameBtn);
   }

   /**
    * Displays the moves data of each pokemon on the buttons
    * @param {*} res - API response
    * @param {*} player - player1 being the user and player2 being the opponent
    */
   function btnData(res, player) {
     let pokeMoves = res['moves'];
     let moves = qs("#" + player + " .moves");
     unHideBtns(player);
     let i;
     for (i = 0; i < pokeMoves.length; ++i) {
       let move = moves.children[i].children[0];
       let dp = moves.children[i].children[1];
       let type = moves.children[i].children[2];

       move.textContent = pokeMoves[i]['name'];

       if (pokeMoves[i]['dp']) {
         dp.textContent = pokeMoves[i]['dp'] + " DP";
       } else {
         dp.textContent = "";
       }

       type.src = ICONS + pokeMoves[i]['type'] + ".jpg";
     }

     for (let j = i; j < moves.children.length; ++j) {
       moves.children[j].className = "hidden";
     }
   }

   /** ------------------------------ Helper Functions  ------------------------------ */

   /**
    * Decides weather the player has won or lost
    * @param {number} playerCurrHp players current health point
    * @param {number} oppCurrHp opponents current health point
    * @param {object} res API response
    */
   function gameConclusion(playerCurrHp, oppCurrHp, res) {

     if (playerCurrHp === 0) {
       playerLoses();
       enableDisableMoveBtns(true);
     }
     if (oppCurrHp === 0) {
       let oppPokemon = res['p2']['name'];
       playerWins();
       enableDisableMoveBtns(true);
       if (!foundPokemonSet.has(oppPokemon)) {
         addPokemonToFound(oppPokemon);
       }
     }
     if (playerCurrHp === 0 || oppCurrHp === 0) {
       gameEnded();
     }
   }

   /**
    * Adds a class to health bar is the health is less than 20%
    * @param {number} oppPercent - current percent of opponent health left
    * @param {number} playerPercent - current player of opponent health left
    * @param {DOMobject} opponentHealthBar - opponents health bar
    * @param {DOMobject} playerHealthBar - opponents health bar
    */
   function lowHealth(oppPercent, playerPercent, opponentHealthBar, playerHealthBar) {
     if (oppPercent < 20) {
       opponentHealthBar.classList.add("low-health");
     }
     if (playerPercent < 20) {
       playerHealthBar.classList.add("low-health");
     }
   }

   /**
    * Displays the move btns on a players pokemon card
    * @param {string} player - player1 being the user and player2 being the opponent
    */
   function unHideBtns(player) {
     let moves = qs("#" + player + " .moves");
     for (let i = 0; i < moves.children.length; ++i) {
       if (moves.children[i].classList.contains("hidden")) {
         unhideElement(moves.children[i]);
       }
     }
   }

   /**
    * Starts the game by populating player 2 cards and adding listeners
    * @param {Object} res - response from API
    */
   function startGame(res) {
     populatePokemonData(res, "p2");
     listenToPlayerMoves();
     listenToFlee();
   }

   /**
    * Hides the flee btn and displays the end game btn after a game has ended
    */
   function gameEnded() {
     let fleeBtn = qs("#flee-btn");
     hideElement(fleeBtn);

     let endGameBtn = qs("#endgame");
     unhideElement(endGameBtn);
     endGameBtn.addEventListener("click", backToPokedexView);

     removeListenerPlayerMoves();
   }

   /**
    * Resets the health bar of player and opponent back to 100%
    * @param {string} player - player1 being the user and player2 being the opponent
    */
   function resetHealthBar(player) {
     let healthBar = qs("#" + player + " .health-bar");
     healthBar.classList.remove("low-health");
     healthBar.style.width = 100 + "%";
   }

   /**
    * Hides an element by addnig "hidden" to classlist
    * @param {object} element the element to be hidden
    */
   function hideElement(element) {
     element.classList.add("hidden");
   }

   /**
    * Displays an element by removing "hidden" from classlist
    * @param {object} element the element to be re-displayed
    */
   function unhideElement(element) {
     element.classList.remove("hidden");
   }

   /**
    * Allows users to view data by click on pokemon in the pokedex
    */
   function viewPokemonData() {
     getPokemonData(this.id);
   }

   /**
    * Remove event listeners from moves btn in the player card
    */
   function removeListenerPlayerMoves() {
     let moves = qs("#p1 .moves");
     for (let i = 0; i < moves.children.length; ++i) {
       moves.children[i].removeEventListener("click", addListenerPlayerMoves);
     }
   }

   /**
    * Helper for adding eventlisterns to each move btn
    */
   function addListenerPlayerMoves() {
     let str = this.children[0].textContent;
     let move = str.replace(/ +/g, "").toLowerCase();
     playerMove(move);
   }

   /**
    * When a player loses the battle
    */
   function playerLoses() {
     let title = qs("header h1");
     title.textContent = "You lost!";
   }

   /**
    * When a player wins the battle
    */
   function playerWins() {
     let title = qs("header h1");
     title.textContent = "You won!";
   }

   /**
    * Formats and returns game results to be shown in results container
    * @param {string} player - player1 being the user and player2 being the opponent
    * @param {object} results - Information of the state of game after a move
    * @returns {String} formatted string
    */
   function attackResultsMessage(player, results) {
     return "Player " + player + " played " + results['p' + player + '-move'] +
     " and " + results['p' + player + '-result'];
   }

   /**
    * Show or hide loading animation
    * @param {boolean} option - true shows loading animation, false hides it
    */
   function showHideLoading(option) {
     let loading = qs("#loading");
     if (option) {
       loading.classList.remove("hidden");
     } else {
       loading.classList.add("hidden");
     }
   }

   /**
    * Returns the element that has the ID attribute with the specified value.
    * @param {string} idName - element ID
    * @returns {object} DOM object associated with id.
    */
   function id(idName) {
     return document.getElementById(idName);
   }

   /**
    * Returns the first element that matches the given CSS selector.
    * @param {string} selector - CSS query selector.
    * @returns {object} The first DOM object matching the query.
    */
   function qs(selector) {
     return document.querySelector(selector);
   }

 })();
