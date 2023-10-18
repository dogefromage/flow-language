#!/bin/bash

# https://github.com/YousefED/typescript-json-schema

typescript-json-schema tsconfig.json EditorClipboardNodeContent \
    --out "src/content/schemas/EditorClipboardNodeContent.json" --required true

typescript-json-schema tsconfig.json MenuShape \
    --out "src/content/schemas/menuShape.json" --required true