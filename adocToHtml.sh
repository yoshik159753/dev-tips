#!/bin/sh
asciidoctor -D docs -o index.html ./src/main.adoc
asciidoctor -D docs -o ubuntu.html ./src/ubuntu/main.adoc
asciidoctor -D docs -o python.html ./src/python/main.adoc
asciidoctor -D docs -o php.html ./src/php/main.adoc
asciidoctor -D docs -o asciidoc-cheatsheet.html ./src/asciidoc-cheatsheet/asciidoc-cheatsheet.adoc
