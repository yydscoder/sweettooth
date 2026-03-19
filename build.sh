#!/bin/bash

# SweetTooth Gelato - Build Script
# Minifies CSS and JS files and generates size comparison report

echo "======================================"
echo "SweetTooth Build Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directories
CSS_DIR="Sweettooth/assets/css"
JS_DIR="Sweettooth/assets/js"

# Function to get file size
get_file_size() {
    if [ -f "$1" ]; then
        wc -c < "$1" | tr -d ' '
    else
        echo "0"
    fi
}

# Function to format bytes
format_bytes() {
    if [ "$1" -ge 1024 ]; then
        echo "$(echo "scale=2; $1 / 1024" | bc) KB"
    else
        echo "$1 bytes"
    fi
}

echo "Starting minification process..."
echo ""

# Minify CSS
echo "${YELLOW}Minifying CSS...${NC}"
if command -v cssnano &> /dev/null; then
    cssnano "$CSS_DIR/shared.css" "$CSS_DIR/shared.min.css"
    echo -e "${GREEN}✓ CSS minified with cssnano${NC}"
else
    # Fallback: basic minification using sed
    echo "cssnano not found, using basic minification..."
    cat "$CSS_DIR/shared.css" | \
        sed 's/\/\*[^*]*\*\///g' | \
        sed 's/^[[:space:]]*//g' | \
        sed 's/[[:space:]]*$//g' | \
        sed 's/[[:space:]]*:[[:space:]]*/:/g' | \
        sed 's/[[:space:]]*{[[:space:]]*/{/g' | \
        sed 's/[[:space:]]*}[[:space:]]*/}/g' | \
        sed 's/[[:space:]]*,[[:space:]]*/,/g' | \
        sed 's/[[:space:]]*;[[:space:]]*/;/g' | \
        tr -d '\n' > "$CSS_DIR/shared.min.css"
    echo -e "${GREEN}✓ CSS minified (basic)${NC}"
fi

# Minify JS
echo "${YELLOW}Minifying JS...${NC}"
if command -v terser &> /dev/null; then
    terser "$JS_DIR/cart.js" -o "$JS_DIR/cart.min.js"
    echo -e "${GREEN}✓ JS minified with terser${NC}"
else
    # Fallback: basic minification using sed
    echo "terser not found, using basic minification..."
    cat "$JS_DIR/cart.js" | \
        sed 's/\/\*[^*]*\*\///g' | \
        sed 's/\/\/.*$//g' | \
        sed 's/^[[:space:]]*//g' | \
        sed 's/[[:space:]]*$//g' | \
        sed 's/[[:space:]]*=[[:space:]]*/=/g' | \
        sed 's/[[:space:]]*([[:space:]]*/(/g' | \
        sed 's/[[:space:]]*)[[:space:]]*/)/g' | \
        sed 's/[[:space:]]*{[[:space:]]*/{/g' | \
        sed 's/[[:space:]]*}[[:space:]]*/}/g' | \
        sed 's/[[:space:]]*,[[:space:]]*/,/g' | \
        sed 's/[[:space:]]*;[[:space:]]*/;/g' | \
        tr -d '\n' > "$JS_DIR/cart.min.js"
    echo -e "${GREEN}✓ JS minified (basic)${NC}"
fi

echo ""
echo "======================================"
echo "Size Comparison Report"
echo "======================================"

# CSS sizes
CSS_ORIGINAL=$(get_file_size "$CSS_DIR/shared.css")
CSS_MINIFIED=$(get_file_size "$CSS_DIR/shared.min.css")
CSS_SAVED=$((CSS_ORIGINAL - CSS_MINIFIED))
CSS_PERCENT=$((CSS_SAVED * 100 / CSS_ORIGINAL))

echo ""
echo "CSS (shared.css):"
echo "  Original:  $(format_bytes $CSS_ORIGINAL)"
echo "  Minified:  $(format_bytes $CSS_MINIFIED)"
echo "  Saved:     $(format_bytes $CSS_SAVED) (${CSS_PERCENT}% reduction)"

# JS sizes
JS_ORIGINAL=$(get_file_size "$JS_DIR/cart.js")
JS_MINIFIED=$(get_file_size "$JS_DIR/cart.min.js")
JS_SAVED=$((JS_ORIGINAL - JS_MINIFIED))
JS_PERCENT=$((JS_SAVED * 100 / JS_ORIGINAL))

echo ""
echo "JavaScript (cart.js):"
echo "  Original:  $(format_bytes $JS_ORIGINAL)"
echo "  Minified:  $(format_bytes $JS_MINIFIED)"
echo "  Saved:     $(format_bytes $JS_SAVED) (${JS_PERCENT}% reduction)"

# Total sizes
TOTAL_ORIGINAL=$((CSS_ORIGINAL + JS_ORIGINAL))
TOTAL_MINIFIED=$((CSS_MINIFIED + JS_MINIFIED))
TOTAL_SAVED=$((TOTAL_ORIGINAL - TOTAL_MINIFIED))
TOTAL_PERCENT=$((TOTAL_SAVED * 100 / TOTAL_ORIGINAL))

echo ""
echo "======================================"
echo "TOTAL:"
echo "  Original:  $(format_bytes $TOTAL_ORIGINAL)"
echo "  Minified:  $(format_bytes $TOTAL_MINIFIED)"
echo "  Saved:     $(format_bytes $TOTAL_SAVED) (${TOTAL_PERCENT}% reduction)"
echo "======================================"
echo ""

# Generate JSON report
cat > "$CSS_DIR/../build-report.json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "css": {
        "original": $CSS_ORIGINAL,
        "minified": $CSS_MINIFIED,
        "saved": $CSS_SAVED,
        "reduction_percent": $CSS_PERCENT
    },
    "js": {
        "original": $JS_ORIGINAL,
        "minified": $JS_MINIFIED,
        "saved": $JS_SAVED,
        "reduction_percent": $JS_PERCENT
    },
    "total": {
        "original": $TOTAL_ORIGINAL,
        "minified": $TOTAL_MINIFIED,
        "saved": $TOTAL_SAVED,
        "reduction_percent": $TOTAL_PERCENT
    }
}
EOF

echo -e "${GREEN}Build complete! Report saved to assets/build-report.json${NC}"
echo ""
