#!/bin/bash

cd "$(dirname "$0")/.."

protoc --plugin="protoc-gen-ts=./node_modules/.bin/protoc-gen-ts" --js_out="import_style=commonjs,binary:./src/proto" --ts_out="./src/proto" ./src/proto/*.proto --proto_path="./src/proto"
