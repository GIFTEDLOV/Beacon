"""Beacon-local compatibility for genlayer-test 0.29.2 on Windows.

The installed direct-mode loader closes its temporary stdin descriptor after
dup2'ing it onto fd 0, then immediately unlinks the still-open file. Windows
rejects that unlink. Defer only those exact temp-file unlinks; this does not
change contract execution or production behavior.
"""

import atexit
import os
import tempfile


_unlink = os.unlink
_deferred = []
_temp_root = os.path.normcase(os.path.abspath(tempfile.gettempdir()))


def _safe_unlink(path, *args, **kwargs):
    try:
        return _unlink(path, *args, **kwargs)
    except PermissionError:
        absolute = os.path.normcase(os.path.abspath(os.fspath(path)))
        if absolute.startswith(_temp_root + os.sep) and os.path.basename(absolute).startswith("tmp"):
            _deferred.append((path, args, kwargs))
            return None
        raise


os.unlink = _safe_unlink


@atexit.register
def _retry_deferred_unlinks():
    for path, args, kwargs in _deferred:
        try:
            _unlink(path, *args, **kwargs)
        except (FileNotFoundError, PermissionError):
            pass
