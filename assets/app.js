/* OGgames: the home page grid and the play page. */
window.OG = (function () {
  var YOUTUBE = "https://www.youtube.com/channel/UCQ1P8B75CzSpf7KZPjvYejQ";
  var games = window.OG_GAMES || [];

  function $(id) { return document.getElementById(id); }

  // Browser storage can be blocked (private windows), so never rely on it
  function loadRecent() {
    try { return JSON.parse(localStorage.getItem("og_recent")) || []; } catch (e) { return []; }
  }
  function saveRecent(id) {
    try {
      var list = loadRecent().filter(function (x) { return x !== id; });
      list.unshift(id);
      localStorage.setItem("og_recent", JSON.stringify(list.slice(0, 6)));
    } catch (e) { /* the site works without it */ }
  }

  function tile(game) {
    var a = document.createElement("a");
    a.className = "tile";
    a.href = "game.html?id=" + encodeURIComponent(game.id);
    var img = document.createElement("img");
    img.src = game.thumb;
    img.alt = "";
    img.loading = "lazy";
    img.onerror = function () { img.remove(); a.classList.add("no-thumb"); };
    var name = document.createElement("span");
    name.className = "tile-name";
    name.textContent = game.name;
    a.appendChild(img);
    a.appendChild(name);
    if (!game.ready) {
      var soon = document.createElement("span");
      soon.className = "soon";
      soon.textContent = "Coming soon";
      a.appendChild(soon);
    }
    return a;
  }

  function fill(box, list) {
    box.textContent = "";
    list.forEach(function (g) { box.appendChild(tile(g)); });
  }

  function home() {
    var category = "All", query = "";
    var cats = ["All"];
    games.forEach(function (g) { if (cats.indexOf(g.category) < 0) cats.push(g.category); });

    function draw() {
      var q = query.trim().toLowerCase();
      var list = games.filter(function (g) {
        return (category === "All" || g.category === category) && g.name.toLowerCase().indexOf(q) >= 0;
      });
      fill($("grid"), list);
      $("empty").hidden = list.length > 0;
      $("grid-title").textContent = category === "All" ? "All games" : category + " games";
      var chips = $("chips");
      chips.textContent = "";
      cats.forEach(function (c) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "chip" + (c === category ? " on" : "");
        b.textContent = c;
        b.onclick = function () { category = c; draw(); };
        chips.appendChild(b);
      });
    }
    $("search").oninput = function (e) { query = e.target.value; draw(); };
    draw();

    var recent = loadRecent().map(function (id) {
      return games.filter(function (g) { return g.id === id && g.ready; })[0];
    }).filter(Boolean);
    if (recent.length) {
      fill($("recent"), recent);
      $("recent-wrap").hidden = false;
    }
  }

  function play() {
    var id = new URLSearchParams(location.search).get("id");
    var game = games.filter(function (g) { return g.id === id; })[0];
    var stage = $("stage");
    if (!game) {
      $("name").textContent = "Game not found";
      $("fullscreen").hidden = true;
      stage.innerHTML = '<div class="stage-msg">That game isn\'t here. <a href="index.html">See all games</a></div>';
      return;
    }
    document.title = game.name + " - Play on OGgames";
    $("name").textContent = game.name;
    $("about").textContent = game.about;
    $("controls").textContent = game.controls;

    var others = games.filter(function (g) { return g.id !== id; });
    if (others.length) {
      fill($("more"), others);
      $("more-wrap").hidden = false;
    }
    if (!game.ready) {
      $("fullscreen").hidden = true;
      stage.innerHTML = '<div class="stage-msg">Coming soon!</div>';
      return;
    }

    saveRecent(id);
    var frame = document.createElement("iframe");
    frame.src = "games/" + encodeURIComponent(id) + "/index.html";
    frame.title = game.name;
    frame.allow = "fullscreen; autoplay; gamepad";
    frame.onload = function () { frame.focus(); };
    stage.appendChild(frame);

    $("fullscreen").onclick = function () {
      if (stage.requestFullscreen) stage.requestFullscreen();
      frame.focus();
    };

    // The game says it was beaten: only believe the game in our own frame
    var shown = false;
    window.addEventListener("message", function (e) {
      if (e.source !== frame.contentWindow || shown) return;
      if (!e.data || e.data.source !== "oggames" || e.data.type !== "complete") return;
      shown = true;
      if (document.fullscreenElement) document.exitFullscreen();
      $("popup-title").textContent = "You beat " + game.name + "!";
      $("popup-link").href = YOUTUBE;
      $("popup").hidden = false;
      $("popup-link").focus();
    });
    $("popup-close").onclick = function () {
      $("popup").hidden = true;
      frame.focus();
    };
  }

  return { home: home, play: play };
})();
