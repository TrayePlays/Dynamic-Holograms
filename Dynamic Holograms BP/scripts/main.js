import { world, system } from "@minecraft/server"

function packLetterData(x, y, width, r, g, b) {
    if (x < 0 || x > 63) throw new Error("x must be between 0 and 63");
    if (y < 0 || y > 63) throw new Error("y must be between 0 and 63");
    if (width < 0 || width > 8) throw new Error("width must be between 0 and 8");
    if (r < 0 || r > 3) throw new Error("r must be between 0 and 3");
    if (g < 0 || g > 3) throw new Error("g must be between 0 and 3");
    if (b < 0 || b > 3) throw new Error("b must be between 0 and 3");

    return (
        (x << 16) |
        (y << 10) |
        (width << 6) |
        (r << 4) |
        (g << 2) |
        b
    ) >>> 0;
}

const colorFormats = {
    "0": [0.0, 0.0, 0.0],
    "1": [0.0, 0.0, 0.667],
    "2": [0.0, 0.667, 0.0],
    "3": [0.0, 0.667, 0.667],
    "4": [0.667, 0.0, 0.0],
    "5": [0.667, 0.0, 0.667],
    "6": [1.0, 0.667, 0.0],
    "7": [0.776, 0.776, 0.776],
    "8": [0.333, 0.333, 0.333],
    "9": [0.333, 0.333, 1.0],
    "a": [0.333, 1.0, 0.333],
    "b": [0.333, 1.0, 1.0],
    "c": [1.0, 0.333, 0.333],
    "d": [1.0, 0.333, 1.0],
    "e": [1.0, 1.0, 0.333],
    "f": [1.0, 1.0, 1.0],
};

function scaleToColorBits(r, g, b) {
    return [
        Math.round(r * 3),
        Math.round(g * 3),
        Math.round(b * 3)
    ];
}

async function writeTextToEntity(textEntity, message) {
    let r = 3, g = 3, b = 3; // default color
    let letterIndex = 0;

    for (let i = 0; i < message.length && letterIndex < 30; i++) {
        const char = message[i];

        if (char === "§" && i + 1 < message.length) {
            const code = message[i + 1].toLowerCase();
            if (colorFormats.hasOwnProperty(code)) {
                [r, g, b] = scaleToColorBits(...colorFormats[code]);
                i++;
                continue;
            } else {
                continue
            }
        }

        const { x, y } = getEntityFontPosition(char);
        let width = minecraftFontWidths[message[i - 1]] ?? minecraftFontWidths[char];
        if (message[i - 2] == "§" && i != 2) {
            width = minecraftFontWidths[message[i - 3]]
        }
        const packed = packLetterData(x, y, width, r, g, b);
        textEntity.setProperty(`traye:letter_${letterIndex + 1}_data`, packed);

        letterIndex++;
    }

    for (let i = letterIndex; i < 30; i++) {
        textEntity.setProperty(`traye:letter_${i + 1}_data`, 0);
    }
}

function getEntityFontPosition(char) {
    const ascii = char.charCodeAt(0);
    const charsPerRow = 16;
    const charSize = 1;

    const col = ascii % charsPerRow;
    const row = Math.floor(ascii / charsPerRow);

    return {
        x: col * charSize,
        y: row * charSize
    };
}

const minecraftFontWidths = {
    A: 6, B: 6, C: 6, D: 6, E: 6, F: 6, G: 6, H: 6, I: 4, J: 6, K: 6, L: 6, M: 6, N: 6, O: 6, P: 6, Q: 6, R: 6, S: 6, T: 6, U: 6, V: 6, W: 6, X: 6, Y: 6, Z: 6,
    a: 6, b: 6, c: 6, d: 6, e: 6, f: 5, g: 6, h: 6, i: 2, j: 6, k: 5, l: 3, m: 6, n: 6, o: 6, p: 6, q: 6, r: 6, s: 6, t: 4, u: 6, v: 6, w: 6, x: 6, y: 6, z: 6,
    '0': 6, '1': 6, '2': 6, '3': 6, '4': 6, '5': 6, '6': 6, '7': 6, '8': 6, '9': 6,
    '!': 2, '"': 4, '#': 6, '$': 6, '%': 6, '&': 6, '\'': 2, '(': 4, ')': 4, '*': 4, '+': 6, ',': 3, '-': 6, '.': 2, '/': 6,
    ':': 2, ';': 3, '<': 5, '=': 6, '>': 5, '?': 6, '@': 7,
    '[': 4, '\\': 6, ']': 4, '^': 6, '_': 6, '`': 3,
    '{': 4, '|': 2, '}': 4, '~': 6,
    ' ': 4, '§': 6
};


//ONLY 300 property overrides at once aparently
system.runInterval(onTick)

function onTick() {
    const overworld = world.getDimension("overworld")
    if (overworld.getEntities({ type: "traye:text_entity" }).length == 0) {
        const location = world.getPlayers()[0].getHeadLocation()

        const text = overworld.spawnEntity("traye:text_entity", location)
        text.addTag("initialText")
        writeTextToEntity(text, "Hello World!")
    }
    //You can also set visibility
    for (const text of overworld.getEntities({ type: "traye:text_entity", tags: ["initialText"] })) {
        for (const player of world.getPlayers()) {
            //will only display text if you have tag "seeText"
            player.setPropertyOverrideForEntity(text, "traye:visible", player.hasTag("seeText"))
        }
    }
}