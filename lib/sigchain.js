// Generated by IcedCoffeeScript 1.6.3-i
(function() {
  var Link, SHA256, SigChain, constants, db, iced, log, req, __iced_k, __iced_k_noop;

  iced = require('iced-coffee-script/lib/coffee-script/iced').runtime;
  __iced_k = __iced_k_noop = function() {};

  db = require('./db');

  req = require('./req');

  log = require('./log');

  constants = require('./constants').constants;

  SHA256 = require('./keyutils').SHA256;

  exports.Link = Link = (function() {
    Link.ID_TYPE = constants.ids.sig_chain_link;

    function Link(_arg) {
      this.id = _arg.id, this.obj = _arg.obj;
      this.id || (this.id = this.obj.payload_hash);
    }

    Link.prototype.prev = function() {
      return this.obj.prev;
    };

    Link.prototype.seqno = function() {
      return this.obj.seqno;
    };

    Link.prototype.verify = function() {
      var err, j;
      err = null;
      if (this.obj.payload_hash !== this.id) {
        err = new E.CorruptionError("Link ID mismatch: " + this.obj.payload_hash + " != " + this.id);
      } else if ((j = SHA256(this.obj.payload_json).toString('hex')) !== this.id) {
        err = new E.CorruptionError("Link has wrong id: " + this.id + " != " + this.j);
      }
      return err;
    };

    Link.prototype.store = function(cb) {
      var err, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "/Users/max/src/keybase-node-client/src/sigchain.iced",
            funcname: "Link.store"
          });
          db.put({
            type: Link.ID_TYPE,
            key: _this.id,
            value: _this.obj
          }, __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                return err = arguments[0];
              };
            })(),
            lineno: 36
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          return cb(err);
        };
      })(this));
    };

    Link.load = function(id, cb) {
      var err, obj, ret, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      ret = null;
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "/Users/max/src/keybase-node-client/src/sigchain.iced",
            funcname: "Link.load"
          });
          db.get({
            type: Link.ID_TYPE,
            key: id
          }, __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                err = arguments[0];
                return obj = arguments[1];
              };
            })(),
            lineno: 43
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          if (typeof err !== "undefined" && err !== null) {

          } else if (typeof obj !== "undefined" && obj !== null) {
            ret = new Link({
              id: id,
              obj: obj
            });
            if ((err = ret.verify()) != null) {
              ret = null;
            }
          }
          return cb(err, ret);
        };
      })(this));
    };

    return Link;

  })();

  exports.SigChain = SigChain = (function() {
    function SigChain(uid, _links) {
      this.uid = uid;
      this._links = _links != null ? _links : [];
    }

    SigChain.load = function(uid, curr, cb) {
      var err, link, links, ret, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      links = [];
      err = null;
      ret = null;
      (function(_this) {
        return (function(__iced_k) {
          var _results, _while;
          _results = [];
          _while = function(__iced_k) {
            var _break, _continue, _next;
            _break = function() {
              return __iced_k(_results);
            };
            _continue = function() {
              return iced.trampoline(function() {
                return _while(__iced_k);
              });
            };
            _next = function(__iced_next_arg) {
              _results.push(__iced_next_arg);
              return _continue();
            };
            if (!(curr && (err == null))) {
              return _break();
            } else {
              (function(__iced_k) {
                __iced_deferrals = new iced.Deferrals(__iced_k, {
                  parent: ___iced_passed_deferral,
                  filename: "/Users/max/src/keybase-node-client/src/sigchain.iced",
                  funcname: "SigChain.load"
                });
                Link.load(curr, __iced_deferrals.defer({
                  assign_fn: (function() {
                    return function() {
                      err = arguments[0];
                      return link = arguments[1];
                    };
                  })(),
                  lineno: 63
                }));
                __iced_deferrals._fulfill();
              })(function() {
                return _next(err != null ? log.error("Couldn't find link: " + last) : typeof link !== "undefined" && link !== null ? (links.push(link), curr = link.prev()) : curr = null);
              });
            }
          };
          _while(__iced_k);
        });
      })(this)((function(_this) {
        return function() {
          if (err == null) {
            ret = new SigChain(uid, links.reverse());
            if ((err = ret.check_chain(true)) != null) {
              ret = null;
            }
          }
          return cb(err, ret);
        };
      })(this));
    };

    SigChain.prototype.last_seqno = function() {
      var l;
      if ((l = this.last()) != null) {
        return l.seqno();
      } else {
        return null;
      }
    };

    SigChain.prototype.check_chain = function(first, links) {
      var link, prev, _i, _len;
      links || (links = this._links);
      prev = null;
      for (_i = 0, _len = links.length; _i < _len; _i++) {
        link = links[_i];
        if (((prev != null) && (prev !== link.prev())) || ((prev == null) && first && link.prev())) {
          return new E.CorruptionError("Bad chain link in " + (link.seqno()) + ": " + prev + " != " + (link.prev()));
        }
        prev = link.prev();
      }
      return null;
    };

    SigChain.prototype._update = function(cb) {
      var args, body, err, link, new_links, obj, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      args = {
        uid: this.uid,
        low: this.last_seqno() + 1
      };
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "/Users/max/src/keybase-node-client/src/sigchain.iced",
            funcname: "SigChain._update"
          });
          req.get({
            endpoint: "sig/get",
            args: args
          }, __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                err = arguments[0];
                return body = arguments[1];
              };
            })(),
            lineno: 95
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          var _i, _len, _ref;
          new_links = [];
          if (typeof err === "undefined" || err === null) {
            _ref = body.sigs;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              obj = _ref[_i];
              if (!(typeof err === "undefined" || err === null)) {
                continue;
              }
              link = new Link({
                obj: obj
              });
              err = link.verify();
              new_links.push(link);
            }
          }
          if (err == null) {
            new_links.reverse();
            err = _this.check_chain(_this._links.length === 0, new_links);
          }
          if (err == null) {
            err = _this.check_chain(false, _this._links.slice(-1).concat(new_links.slice(0, 1)));
          }
          if (err == null) {
            _this._links = _this._links.concat(new_links);
            _this._new_links = new_links;
          }
          return cb(err);
        };
      })(this));
    };

    SigChain.prototype.store = function(cb) {
      var err, link, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      err = null;
      (function(_this) {
        return (function(__iced_k) {
          if (_this._new_links != null) {
            (function(__iced_k) {
              var _i, _len, _ref, _results, _while;
              _ref = _this._new_links;
              _len = _ref.length;
              _i = 0;
              _results = [];
              _while = function(__iced_k) {
                var _break, _continue, _next;
                _break = function() {
                  return __iced_k(_results);
                };
                _continue = function() {
                  return iced.trampoline(function() {
                    ++_i;
                    return _while(__iced_k);
                  });
                };
                _next = function(__iced_next_arg) {
                  _results.push(__iced_next_arg);
                  return _continue();
                };
                if (!(_i < _len)) {
                  return _break();
                } else {
                  link = _ref[_i];
                  if (err == null) {
                    (function(__iced_k) {
                      __iced_deferrals = new iced.Deferrals(__iced_k, {
                        parent: ___iced_passed_deferral,
                        filename: "/Users/max/src/keybase-node-client/src/sigchain.iced",
                        funcname: "SigChain.store"
                      });
                      link.store(__iced_deferrals.defer({
                        assign_fn: (function() {
                          return function() {
                            return err = arguments[0];
                          };
                        })(),
                        lineno: 118
                      }));
                      __iced_deferrals._fulfill();
                    })(_next);
                  } else {
                    return _continue();
                  }
                }
              };
              _while(__iced_k);
            })(__iced_k);
          } else {
            return __iced_k();
          }
        });
      })(this)((function(_this) {
        return function() {
          return cb(err);
        };
      })(this));
    };

    SigChain.prototype.update = function(remote_seqno, cb) {
      var err, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      err = null;
      (function(_this) {
        return (function(__iced_k) {
          if ((remote_seqno == null) || remote_seqno > _this.last_seqno()) {
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral,
                filename: "/Users/max/src/keybase-node-client/src/sigchain.iced",
                funcname: "SigChain.update"
              });
              _this._update(__iced_deferrals.defer({
                assign_fn: (function() {
                  return function() {
                    return err = arguments[0];
                  };
                })(),
                lineno: 126
              }));
              __iced_deferrals._fulfill();
            })(function() {
              return __iced_k((remote_seqno != null) && (remote_seqno !== _this.last_seqno()) ? err = new E.CorruptionError("failed to appropriate update chain") : void 0);
            });
          } else {
            return __iced_k();
          }
        });
      })(this)((function(_this) {
        return function() {
          return cb(err);
        };
      })(this));
    };

    SigChain.prototype.last = function() {
      var _ref;
      if ((_ref = this._links) != null ? _ref.length : void 0) {
        return this._links.slice(-1)[0];
      } else {
        return null;
      }
    };

    return SigChain;

  })();

}).call(this);