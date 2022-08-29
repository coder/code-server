{
  description = "code-server";

  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem
      (system:
        let pkgs = nixpkgs.legacyPackages.${system};
            nodejs = pkgs.nodejs-16_x;
            yarn' = pkgs.yarn.override { inherit nodejs; };
        in {
          devShells.default = pkgs.mkShell {
            nativeBuildInputs = with pkgs; [
              nodejs yarn' python pkg-config git rsync jq moreutils
            ];
            buildInputs = with pkgs; (lib.optionals (!stdenv.isDarwin) [ libsecret ]
                          ++ (with xorg; [ libX11 libxkbfile ])
                          ++ lib.optionals stdenv.isDarwin [
                            AppKit Cocoa CoreServices Security cctools xcbuild
                          ]);
          };
        }
      );
}
