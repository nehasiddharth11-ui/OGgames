/* Put this in a game's index.html:   <script src="../oggames-sdk.js"></script>
   When the player beats the game, call:   OGgames.complete();
   The site then shows the "you beat it" popup with the YouTube link. */
window.OGgames = {
  complete: function () {
    if (window.parent !== window) {
      window.parent.postMessage({ source: "oggames", type: "complete" }, "*");
    }
  }
};
