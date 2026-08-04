// @turf/turf ships valid types, but its package.json "exports" map isn't
// resolvable under TS's "bundler" moduleResolution. Declaring the module
// here restores type-checking for our own code without fighting upstream.
declare module "@turf/turf";
