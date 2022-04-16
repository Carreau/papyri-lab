# Trying the extension

Currently the best way to try the extension is via the binder. Look at the
`PostBuild` script if you want to try on your own machine.

# Trying papyri on binder.


In order to keep the image small, documentation bundles are not installed, 
open a terminal and issue:

```
$ papyri install scipy numpy IPython papyri --no-relink
```

This will install the basic docs. The `--no-relink` just does not check the
consistency of the database, you can issue a `papyri relink` to check the
consistency, but it will find errors/find new relationship until some other
features are implemented.

You can also try to `conda install` and then `papyri install` a few other
packages like `astropy`, `networkx`, `dask`, `distributed`, `skimage`, but it's
not guarantied to work as I haven't built all the version. 

Once this is all done, Use the command palette (Ctrl-Shift-C/Cmd-Shift-C) and look for "open papyri
browser".

It has basic features with two bookmarks.






