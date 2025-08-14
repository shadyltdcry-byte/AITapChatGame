{pkgs}: {
  deps = [
    pkgs.imagemagick_light
    pkgs.gatling
    pkgs.python312Packages.cleanlab
    pkgs.rPackages.VFS
  ];
}
