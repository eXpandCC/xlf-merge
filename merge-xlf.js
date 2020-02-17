module.exports = async function(first, second, fileName) {
    function fail(message) {
        throw new Error(message + ' File name: ' + fileName + '.');
    }

    function getElement(src, path, isOptional) {
        let result = src;
        let breadcrumbs = '';

        for (const pnode of path) {
            breadcrumbs += '/' + pnode;

            if (!result.elements) {
                if (!isOptional) {
                    fail(breadcrumbs + ' - expected element ' + pnode + ' not found. Make sure that the XLF file schema is correct.');
                } else {
                    return null;
                }
            }

            result = result.elements.find(e => e.name === pnode);
            if (!result) {
                if (!isOptional) {
                    fail('Element ' + breadcrumbs + ' not found. Make sure that the XLF file schema is correct.');
                } else {
                    return null;
                }
            }
        }

        return result;
    }

    function getContent(src) {
        const result = ((src && src.elements) || []).find(e => e.type === 'text');
        return result ? result.text : '';
    }

    function* getTransUnits(root) {
        if (!root.elements) {
            console.log('Skipping ', fileName, '- no trans-units found.');
            return;
        }

        for (const el of root.elements) {
            if (el.name === 'trans-unit') {
                yield el;
            }
        }
    }

    const transPath = ['xliff', 'file', 'body'];
    const srcRoot = getElement(first, transPath);
    const tgtRoot = getElement(second, transPath);
    const tgtTransUnits = [...getTransUnits(tgtRoot)];
    let numMergedTransUnits = 0;

    function findTgtById(id) {
        return tgtTransUnits.find(t => t.attributes && t.attributes.id === id);
    }

    process.stdin.setEncoding('utf8');
    // This function reads only one line on console synchronously. After pressing `enter` key the console will stop listening for data.
    function readlineSync() {
        return new Promise((resolve, reject) => {
            process.stdin.resume();
            process.stdin.on('data', function (data) {
                process.stdin.pause(); // stops after one line reads
                resolve(data);
            });
        });
    }

    let elementIndex = 0;

    const transLanguages = getElement(first, ['xliff', 'file'], true);
    const txt2Flag = (txt) => {
      if (txt === "en") {
        return "🇬🇧";
      } else if (txt === "es") {
        return "🇺🇾";
      } else {
        return txt;
      }
    }
    const getLang = (node, side) => {
      if (node && node.attributes){
        return node.attributes[`${side}-language`];
      }
    }
    console.log(`🔧 START REPAIRING TRANSLATION ${txt2Flag(getLang(transLanguages, "source"))}  ➡ ${txt2Flag(getLang(transLanguages, "target"))}`)

    for (const srcTransUnit of getTransUnits(srcRoot)) {
        const id = srcTransUnit.attributes.id;
        const content = getContent(getElement(srcTransUnit, ['target'], true));
        const sourceContent = getContent(getElement(srcTransUnit, ['source'], true));

        const matchingTgt = findTgtById(id);
        if (matchingTgt) {
            const tgtContent = getContent(getElement(matchingTgt, ['target'], true));
            if (content !== tgtContent) {
                console.log(`🛑${bColors.WARNING} CONFLICT IN ${bColors.OKGREEN}"${sourceContent}"${bColors.ENDC}`);
                console.log('Trans-unit', id, ' differs in file', fileName);
                console.log('(L) Local content:', content);
                console.log('(r) Remote content:', tgtContent);
                // console.log('differs in file', fileName);

                let data = readlineSync();
                process.stdout.write("> [L/r] ");
                await data.then(
                  (answer) => {
                    if (
                      (answer.toLowerCase() === "l\n") ||
                      (answer.toLowerCase() === "\n")
                    )  {
                      matchingTgt.elements[1].elements[0].text = content;
                    }
                    if (answer.toLowerCase() === "\n") {
                      answer = "(L)\n"
                    }
                    process.stdout.write(answer);
                  }
                )
            }
        } else {
            tgtRoot.elements.push(srcTransUnit);
            numMergedTransUnits++;
        }
        elementIndex++;
    }

    console.log('✅ ', numMergedTransUnits, 'translations merged');
    return second;
}

// This is a object for use ANSI escape to color the text in the terminal
const bColors = {
    HEADER    : '\033[95m',
    OKBLUE    : '\033[94m',
    OKGREEN   : '\033[92m',
    WARNING   : '\033[93m',
    FAIL      : '\033[91m',
    ENDC      : '\033[0m',
    BOLD      : '\033[1m',
    UNDERLINE : '\033[4m'
}
