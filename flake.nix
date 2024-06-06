{
  description = "code-server";

  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem
      (system:
        let pkgs = nixpkgs.legacyPackages.${system};
            nodejs = pkgs.nodejs_20;
            yarn' = pkgs.yarn.override { inherit nodejs; };
        in {
          devShells.default = pkgs.mkShell {
            nativeBuildInputs = with pkgs; [
              nodejs yarn' python3 pkg-config git rsync jq moreutils quilt bats openssl
            ];
            buildInputs = with pkgs; (lib.optionals (!stdenv.isDarwin) [ libsecret libkrb5 ]
                          ++ (with xorg; [ libX11 libxkbfile ])
                          ++ lib.optionals stdenv.isDarwin (with pkgs.darwin.apple_sdk.frameworks; [
                            AppKit Cocoa CoreServices Security xcbuild
                          ]));
          };
        }
      );
}
