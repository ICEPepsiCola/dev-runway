#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/docs"
SRC_DIR="$ROOT_DIR/docs-src"

render_page() {
  local src_file="$1"
  local out_file="$2"
  local title="$3"

  mkdir -p "$(dirname "$out_file")"
  pnpx markdown-it "$src_file" -o "$OUT_DIR/body.html"

  cat > "$out_file" <<EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="/dev-runway/style.css">
  <style>
    body { padding: 24px; }
    .page-nav { margin-bottom: 24px; }
    .page-nav a { margin-right: 12px; }
  </style>
</head>
<body class="markdown-body">
  <nav class="page-nav">
    <a href="/dev-runway/">English</a>
    <a href="/dev-runway/zh-CN/">中文</a>
    <a href="https://github.com/ICEPepsiCola/dev-runway">GitHub</a>
  </nav>
EOL

  cat "$OUT_DIR/body.html" >> "$out_file"

  cat >> "$out_file" <<EOL
</body>
</html>
EOL
}

echo "Preparing docs output..."
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/zh-CN"

echo "Copying GitHub CSS..."
cp "$ROOT_DIR/node_modules/github-markdown-css/github-markdown.css" "$OUT_DIR/style.css"

echo "Rendering English page..."
render_page "$SRC_DIR/en.md" "$OUT_DIR/index.html" "Dev Runway"

echo "Rendering Chinese page..."
render_page "$SRC_DIR/zh-CN.md" "$OUT_DIR/zh-CN/index.html" "Dev Runway 中文文档"

rm -f "$OUT_DIR/body.html"

echo "Build complete. Static pages generated in docs/."
