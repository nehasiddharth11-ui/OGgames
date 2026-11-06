/* Put this in a game's index.html:   <script src="../oggames-sdk.js"></script>
   When the player beats the game, call:   OGgames.complete();
   The site then shows the "you beat it" popup with the YouTube link.
   Games with "loader": true in games.js also call OGgames.ready() when they can be played. */
window.OGgames = {
  complete: function () { this.send("complete"); },
  ready: function () { this.send("ready"); },
  send: function (type) {
    if (window.parent !== window) {
      window.parent.postMessage({ source: "oggames", type: type }, "*");
    }
  }
};
