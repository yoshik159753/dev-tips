#!/bin/bash

usage() {
  cat 1>&2 <<EOF
Task Runner
USAGE:
    sh run.sh [-h] dev
FLAGS:
    -h, --help                Prints help information
EOF
}

die() {
  err_msg="$1"
  echo "$err_msg" >&2
  exit 1
}

handle() {
  if test $# -le 0 ; then
    usage
    exit 0
  fi

  while test $# -gt 0; do
    key="$1"
    case "$key" in
    dev)
      rm -rf _site
      npm run dev
      exit 0
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      die "Got an unexpected argument: $1"
      ;;
    esac
    shift
  done
}

main() {
  handle "$@"
  exit 0
}

main "$@" || exit 1
