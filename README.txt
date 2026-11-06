OGgames
=======

Preview OGgames.bat   Opens the site on this computer. Double-clicking index.html
                      won't run games: browsers block them unless they come from a server.
Add a game.bat        Adds a game. Only someone with these files can do that:
                      the website has no upload page.

A GAME NEEDS
  A folder with an index.html that runs in a browser.

THE "YOU BEAT IT" POPUP
  Add this to the game's index.html:
      <script src="../oggames-sdk.js"></script>
  Then, when the player beats the game, run:
      OGgames.complete();
  The popup's words are in game.html. The YouTube link is at the top of assets\app.js.

PIP'S SKY KINGDOM
  Its web version is built from D:\Mark3_work\source by D:\OGgames_build\build_web.py.
  It downloads its Python engine from pygame-web.github.io when a player opens it,
  so it needs that site to be online.
