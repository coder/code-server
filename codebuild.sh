#!/usr/bin/bash

export DEBIAN_FRONTEND=noninteractive
export VERSION=${CODEBUILD_WEBHOOK_HEAD_REF#refs/heads/}@$CODEBUILD_SOURCE_VERSION
export ARTIFACT_NAME=code-server-$VERSION-linux-$ARCH
export ARTIFACT_FILE=$ARTIFACT_NAME.tar.gz

install_phase() {

    # Subphase: Enable swap

    echo "Enabling swap ===>"
    fallocate -l 8G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    free -h
    swapon --show
    printf "<=================\n\n"

    # Subphase: Verify AWS credentials

    echo "Checking AWS credentials ===>"
    aws sts get-caller-identity
    aws s3 ls s3://$ARTIFACT_BUCKET
    printf "<============================\n\n"

    # Subphase: Install base dependencies

    echo "Installing base dependencies ===>"
    apt-get update
    apt-get install -y curl git libxkbfile-dev time ca-certificates
    echo 'deb [trusted=yes] https://repo.goreleaser.com/apt/ /' |  tee /etc/apt/sources.list.d/goreleaser.list
    apt-get update
    apt-get install -y nfpm
    printf "<================================\n\n"

    # Subphase: Install NVM and Node.js

    echo "Installing NVM and Node.js ===>"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/$NVM_VERSION/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    . "$NVM_DIR/nvm.sh"
    nvm install $NODE_VERSION
    nvm use $NODE_VERSION
    node -v
    npm -v
    printf "<==============================\n\n"

    # Subphase: Install code-server dependencies

    echo "Installing code-server dependencies ===>"
    npm ci
    printf "<=======================================\n\n"

}

build_phase() {

    echo Build started at `date`

    export NVM_DIR="$HOME/.nvm"
    . "$NVM_DIR/nvm.sh"
    nvm use $NODE_VERSION

    echo "Artifact => $ARTIFACT_FILE"

    # Subphase: Build code-server

    echo "Build code-server ===>"
    time npm run build
    printf "<=====================\n\n"

    # Subphase: Build vscode

    echo "Build vscode ===>"
    time npm run build:vscode
    printf "<=====================\n\n"

    # Subphase: Build release package

    echo "Build release package ===>"
    time npm run release
    time npm run release:standalone
    time npm run test:integration
    time npm run package
    printf "<==========================\n\n"

    echo Build completed at `date`
    printf "<==========================\n\n"

}

post_build_phase() {

    # Subphase: Upload artifacts

    echo "Uploading artifact ===>"
    S3_KEY="$ARTIFACT_PREFIX/$ARTIFACT_FILE"
    echo "Uploading $S3_KEY to S3..."
    aws s3 cp release-packages/$ARTIFACT_FILE s3://$ARTIFACT_BUCKET/$S3_KEY
    printf "<=======================\n\n"

    # Subphase: Upload static artifacts

    echo "Extracting and uploading static files ===>"
    TEMP_DIR=$(mktemp -d)
    tar -xzf release-packages/$ARTIFACT_FILE -C $TEMP_DIR

    echo "Upload vscode static files ===>"
    STATIC_S3_KEY="$STATIC_ARTIFACT_PREFIX/stable-$CODEBUILD_SOURCE_VERSION/static"
    SOURCE_DIR="$TEMP_DIR/$ARTIFACT_NAME/lib/vscode"
    aws s3 cp $SOURCE_DIR/out s3://$ARTIFACT_BUCKET/$STATIC_S3_KEY/out --recursive
    aws s3 cp $SOURCE_DIR/node_modules s3://$ARTIFACT_BUCKET/$STATIC_S3_KEY/node_modules --recursive
    printf "<=======================\n\n"

    echo "Upload code-server static files ===>"
    STATIC_S3_KEY="$STATIC_ARTIFACT_PREFIX/stable-$CODEBUILD_SOURCE_VERSION/_static"
    SOURCE_DIR="$TEMP_DIR/$ARTIFACT_NAME"
    aws s3 cp $SOURCE_DIR/out s3://$ARTIFACT_BUCKET/$STATIC_S3_KEY/out --recursive
    aws s3 cp $SOURCE_DIR/node_modules s3://$ARTIFACT_BUCKET/$STATIC_S3_KEY/node_modules --recursive
    aws s3 cp $SOURCE_DIR/src s3://$ARTIFACT_BUCKET/$STATIC_S3_KEY/src --recursive
    printf "<=======================\n\n"

    # Subphase: Prune old artifacts

    echo "Pruning old artifacts ===>"
    echo "Keeping last $MAX_ARTIFACTS artifacts in s3://$ARTIFACT_BUCKET/$ARTIFACT_PREFIX"

    OBJECTS=$(aws s3api list-objects-v2 \
    --bucket "$ARTIFACT_BUCKET" \
    --prefix "$ARTIFACT_PREFIX/" \
    | jq -r '.Contents | sort_by(.LastModified) | .[] | select(.Key != "'$ARTIFACT_PREFIX/'") | .Key')

    TOTAL_OBJECTS=$(echo "$OBJECTS" | wc -l)
    printf "Artifact list [%d] =>\n" "$TOTAL_OBJECTS"
    echo "$OBJECTS"
    printf "<===\n\n"

    if (( $TOTAL_OBJECTS > $MAX_ARTIFACTS )); then
        TO_DELETE=$(( $TOTAL_OBJECTS - $MAX_ARTIFACTS ))
        echo "Pruning $TO_DELETE oldest artifacts..."

        echo "$OBJECTS" | head -n $TO_DELETE | awk '{print $1}' | while read -r KEY; do
            echo "Deleting: s3://$ARTIFACT_BUCKET/$KEY"
            aws s3 rm "s3://$ARTIFACT_BUCKET/$KEY"
        done
    else
        echo "No pruning needed."
    fi

    printf "<============================\n\n"

    # Subphase: Prune old static artifacts

    echo "Pruning old static artifacts ===>"
    echo "Keeping last $MAX_ARTIFACTS artifacts in s3://$ARTIFACT_BUCKET/$STATIC_ARTIFACT_PREFIX"

    OBJECTS=$(aws s3api list-objects-v2 \
    --bucket "$ARTIFACT_BUCKET" \
    --prefix "$STATIC_ARTIFACT_PREFIX/" \
    --delimiter "/" \
    | jq -r '.CommonPrefixes // [] | .[].Prefix' | while read -r prefix; do
        aws s3api list-objects-v2 \
            --bucket "$ARTIFACT_BUCKET" \
            --prefix "$prefix" \
            --max-items 1 \
        | jq -r '.Contents[0].LastModified + " " + "'$prefix'"'
    done | sort | cut -d' ' -f2-)

    TOTAL_OBJECTS=$(echo "$OBJECTS" | wc -l)

    printf "Static artifact list [%d] =>\n" "$TOTAL_OBJECTS"
    echo "$OBJECTS"
    printf "<===\n\n"

    if (( $TOTAL_OBJECTS > $MAX_ARTIFACTS )); then

        TO_DELETE=$(( TOTAL_OBJECTS - MAX_ARTIFACTS ))
        echo "Pruning $TO_DELETE oldest static artifacts..."

        for PREFIX in $(echo "$OBJECTS" | head -n $TO_DELETE); do

            echo "Deleting folder: $PREFIX =>"

            OBJECT_KEYS=$(aws s3api list-objects-v2 \
                --bucket "$ARTIFACT_BUCKET" \
                --prefix "$PREFIX" \
                | jq -r '.Contents // [] | .[].Key')

            if [ -z "$OBJECT_KEYS" ]; then
                echo "No objects found; skipping"
                printf "<===\n\n"
                continue
            fi

            NUM_OBJECT_KEYS=$(echo "$OBJECT_KEYS" | tr ' ' '\n' | wc -l)
            echo "$NUM_OBJECT_KEYS files to delete"

            for ((i = 0; i < $NUM_OBJECT_KEYS; i += 500)); do
                BATCH=$(echo "$OBJECT_KEYS" | head -n $((i + 500)) | tail -n 500)
                BATCH_SIZE=$(echo "$BATCH" | tr ' ' '\n' | wc -l)
                TEMP_FILE=$(mktemp)
                printf "Batch delete %d objects\n" "$BATCH_SIZE"
                {
                echo '{"Objects": ['
                j=0
                for obj in $BATCH; do
                    if [[ $j -gt 0 ]]; then
                    echo ","
                    fi
                    echo "{\"Key\": \"$obj\"}"
                    j=$(( $j + 1 ))
                done
                echo '],"Quiet": true}'
                } > "$TEMP_FILE"
                aws s3api delete-objects \
                --bucket "$ARTIFACT_BUCKET" \
                --delete "file://$TEMP_FILE"
                rm -f "$TEMP_FILE"
            done

            printf "<===\n\n"
        done

    else
        echo "Nothing to prune."
    fi

    printf "<============================\n\n"

}

$1
