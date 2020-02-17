# xlf-merge
GIT merge driver tool that asks which siede merge of XLF 1.2 files.

Useful for Angular apps where the NG compiler requires single translation file per language. If your translations are organized into
many small XLF files you can run this tool to merge them before invoking Angular compilation.

# Installation
```bash
npm install -g xlf-merge
```

# GIT Integration
## Add on .git/config
```bash
[merge "translation"]
  driver = xlf-merge %A %B -o %A
  name = merge con xlf-merger
  recursive = binary
```
# Add on .gitattributes
```bash
*.xlf merge=translation
```

## Usage
On merge conflicts will ask to choose a side.

## Author
Jaroslav Svak

## License
MIT
