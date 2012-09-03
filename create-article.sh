#!/bin/sh

echo
echo Creating new article:
printf "  Slug: " && read SLUG
printf "  Title: " && read TITLE

DIR=`dirname $0`
FILE="$DIR/articles/$SLUG.markdown"
echo "Title: $TITLE" > "$FILE"
echo "Date: `node -pe "new Date().toUTCString()"`" >> "$FILE"
echo >> "$FILE"
echo >> "$FILE"

# edit
if [ "x$EDITOR" != "x" ]; then
  "$EDITOR" "$FILE"
fi
