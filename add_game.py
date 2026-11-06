"""Adds a game to OGgames. Run it on your own PC: visitors to the site can't add anything."""
import json
import os
import re
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
LIST = os.path.join(HERE, "games.js")
PREFIX = "window.OG_GAMES = "


def read_games():
    with open(LIST, encoding="utf-8") as f:
        text = f.read().strip()
    return json.loads(text[len(PREFIX):].rstrip(";"))


def write_games(games):
    with open(LIST, "w", encoding="utf-8") as f:
        f.write(PREFIX + json.dumps(games, indent=2, ensure_ascii=False) + ";\n")


def ask(question, default=""):
    extra = f" [{default}]" if default else ""
    return input(f"{question}{extra}: ").strip().strip('"') or default


def main():
    print("Add a game to OGgames\n")
    folder = ask("Folder that holds the game (it must contain index.html)")
    if not os.path.isfile(os.path.join(folder, "index.html")):
        print("\nThat folder has no index.html, so nothing was added.")
        return
    name = ask("Game name")
    game_id = re.sub(r"[^a-z0-9]+", "-", name.lower().replace("'", "")).strip("-")
    if not game_id:
        print("\nThat name can't be used, so nothing was added.")
        return
    games = read_games()
    existing = next((g for g in games if g["id"] == game_id), None)
    if existing and ask(f"{name} is already on the site. Replace it? (y/n)", "n").lower() != "y":
        print("\nNothing was changed.")
        return
    category = ask("Category", "Arcade")
    about = ask("One or two sentences about the game")
    controls = ask("Controls")
    picture = ask("Picture for the game's tile (PNG file, or leave empty)")

    target = os.path.join(HERE, "games", game_id)
    if existing and os.path.isdir(target):
        shutil.rmtree(target)
    shutil.copytree(folder, target)
    thumb = f"games/{game_id}/thumb.png"
    if picture:
        shutil.copyfile(picture, os.path.join(target, "thumb.png"))
    entry = {"id": game_id, "name": name, "category": category, "about": about,
             "controls": controls, "thumb": thumb, "ready": True}
    if existing:
        games[games.index(existing)] = entry
    else:
        games.insert(0, entry)
    write_games(games)
    print(f"\nDone! {name} is on your copy of the site. Publish the site to put it online.")


if __name__ == "__main__":
    main()
    input("\nPress Enter to close.")
