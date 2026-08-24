# Two Years

A handmade digital scrapbook — a kraft, spiral-bound book you turn page by page.

## Running it

No dependencies, no build step. You need Node installed.

```
node server.js
```

Then open <http://localhost:3002>.

## Reading it

Click the **right-hand page** to turn forward, the **left-hand page** to turn back.
Arrow keys and swipe work too. On a phone it shows one page at a time.

## Writing it

Everything you can read is in one file: **`public/content.js`**. Edit it, save,
refresh the page. Nothing else needs touching.

- `chapters` — the story, a photo on the left and your words on the right
- `essay` — one long piece of writing; it flows across as many pages as it needs
- `notes` — free writing pages, one entry per page, add as many as you like
- `letter` — what's inside the sealed envelope
- everything else — the DIYs below

Pages are a fixed size, so writing that runs long shrinks itself to fit.

## Photos

Drop image files into **`public/images/`** and reference them by filename, e.g.
`photo: "images/01.jpg"`. Any frame whose file isn't there yet shows a labelled
empty slot instead of a broken image, so the book always looks finished.

## The DIYs

| | |
|---|---|
| Sealed envelope | Break the wax seal, the letter unfolds |
| Pull-out card | Drag the card up out of its pocket |
| Scratch card | Rub the gold foil off with your finger |
| Jar of reasons | Pull out a folded paper slip, one at a time |
| Lift the flap | A taped flap hinges up off a photo |
| Spin the year | A dial of twelve months, snaps to the one you land on |
| The negatives | Drag a 35mm film strip through its frames |
| Fold-out | A concertina that opens one panel at a time |
| Promises | A tick list that remembers what's been ticked |

## Layout

```
server.js            zero-dependency static server on port 3002
public/index.html    the shell
public/content.js    every word in the book
public/app.js        pages, page-turning, the DIYs
public/styles.css    the look
public/images/       your photos go here
```
