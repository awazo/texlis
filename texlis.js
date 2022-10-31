/**
texlis.js: text input listener, a js lib for func with text input

key pattern:
ime OFF
  edit-about key like BackSpace, left arrow, etc. : not invoke keypress
  other: invoke keypress
ime ON
  keypress never invoked
  edit-about key: keydown = keyup = the key
  other:
    keydown = 229
    keyup:
      on firefox: the key (e.g. enter = 13)
      on chrome, ie:
        enter: keyup = 229 only
        other: keyup = 229 and the key
*/

let texlis = {};

texlis.KeyBucket = function(texlis) {
  this.key = {}
  this.clear = function() {
    this.key = {}
  };
  this.containsKeyName = function(keyName) {
    return this.key.keys().includes(keyName);
  };
  this.contains = function(keyCode) {
    return this.key.values().includes(keyCode);
  };
  this.add = function(keyName, keyCode) {
    if (!this.contains(keyCode)) {
      this.key[keyName] = keyCode;
    }
  };
  this.removeByKeyName = function(keyName) {
    delete this.key[keyName];
  };
  this.remove = function(keyCode) {
    let keyName = this.getKeyName(keyCode);
    if (keyName != null) {
      delete this.key[keyName];
    }
  };
  this.getKeyName = function(keyCode) {
    let pair = this.key.entries().find(function(elm, idx, arr) {
      return (elm[1] === keyCode);
    });
    return (pair && pair[0]);
  };
  this.getKeyCode = function(keyName) {
    return this.key[keyName];
  };

  this.equalsKeySet = function(keySet1, keySet2) {
    return ((keySet1.length === keySet2.length)
      && keySet1.every(function(elm, idx, arr) {
        return keySet2.includes(elm);
      }));
  };

  this.excludeKey = {}
  this.clearExclude = function() {
    this.excludeKey = {}
  };
  this.containsExcludeKeyName = function(keyName) {
    return this.excludeKey.keys().includes(keyName);
  };
  this.containsExclude = function(keySet) {
    return this.excludeKey.values().some(function(elm, idx, arr) {
      return this.equalsKeySet(keySet, elm);
    });
  };
  this.addExclude = function(keyName, keySet) {
    if (!this.containsExclude(keySet)) {
      this.excludeKey[keyName] = (Array.isArray(keySet)? keySet: [ keySet ]);
    }
  };
  this.removeExcludeByKeyName = function(keyName) {
    delete this.excludeKey[keyName];
  };
  this.removeExclude = function(keySet) {
    let keyName = this.getExcludeKeyName(keySet);
    if (keyName != null) {
      delete this.excludeKey[keyName];
    }
  };
  this.getExcludeKeyName = function(keySet) {
    let pair = this.excludeKey.entries().find(function(elm, idx, arr) {
      return this.equalsKeySet(keySet, elm[1]);
    });
    return (pair && pair[0]);
  };
  this.getExcludeKeySet = function(keyName) {
    return this.excludeKey[keyName];
  };

  this.initialize = function(key, excludeKey) {
    if ((key != null) && (typeof key === 'object')) {
      this.key = key;
    }
    if ((excludeKey != null) && (typeof excludeKey === 'object')) {
      this.excludeKey = excludeKey;
    }
  };
  this.inKeyName = function(keyName) {
    return (this.containsKeyName(keyName)
      && !this.containsExcludeKeyName(keyName));
  };
  this.in = function(keyCode, keySet) {
    if (keySet == null) {
      return (this.contains(keyCode)
        && !this.containsExclude([ keyCode ]));
    } else {
      if (!keySet.includes(keyCode)) {
        keySet = Array.from(keySet);
        keySet.push(keyCode);
      }
      return (this.contains(keyCode)
        && !this.containsExclude(keySet));
    }
  };
};

texlis.Texlis = function(element, callback, options) {
  if (element == null) throw 'invalid element';
  if ((callback == null) || (typeof callback !== 'function'))
    callback = function(event) {};
  if (options == null) options = {};

  this.element = element;
  this.callback = callback;
  this.options = options;

  this.ignore = new texlis.KeyBucket();
  this.ignore.initialize({
    'Tab': 9, 'Enter': 13, 'Shift': 16, 'Ctrl': 17,
    'Alt': 18, 'Pause/Break': 19, 'CapsLock': 20, 'Esc': 27,
    'PageUp': 33, 'PageDown': 34, 'End': 35, 'Home': 36,
    'left arrow': 37, 'up arrow': 38, 'right arrow': 39, 'down arrow': 40,
    'Insert': 45, 'F1': 112, 'F2': 113, 'F3': 114,
    'F4': 115, 'F5': 116, 'F6': 117, 'F7': 118,
    'F8': 119, 'F9': 120, 'F10': 121, 'F11': 122,
    'F12': 123, 'NumLock': 144, 'ScrollLock': 145
  }, {
    'paste': [ 17, 'v' ]  // TODO: fixme: 'v' to code
  });

  this.ignoreKeyCode = [
    9,  // Tab
    13,  // Enter
    16,  // Shift
    17,  // Ctrl
    18,  // Alt
    19,  // Pause/Break
    20,  // CapsLock
    27,  // Esc
    33,  // PageUp
    34,  // PageDown
    35,  // End
    36,  // Home
    37,  // <- (left arrow)
    38,  // ^ (up arrow)
    39,  // -> (right arrow)
    40,  // v (down arrow)
    45,  // Insert
    112,  // F1
    113,  // F2
    114,  // F3
    115,  // F4
    116,  // F5
    117,  // F6
    118,  // F7
    119,  // F8
    120,  // F9
    121,  // F10
    122,  // F11
    123,  // F12
    144,  // NumLock
    145  // ScrollLock
  ];
  this.clearIgnoreKey = function() { this.ignoreKeyCode = []; };
  this.addIgnoreKey = function(keyCode) { this.ignoreKeyCode.unshift(keyCode); };
  this.removeIgnoreKey = function(keyCode) {
    let index = this.ignoreKeyCode.indexOf(keyCode);
    if (index >= 0) {
      this.ignoreKeyCode.splice(index, 1);
    }
  };

  this.keyStack = [];
  this.isKeypressInvoked = false;
  this.isImeMode = false;
  this.keyupWaitMillisec = 10;
  this.keyupWaitTimerId = null;

  let that = this;
  this.element.addEventListener('focus', function(event) {
    that.keyStack = [];
    that.isKeypressInvoked = false;
    that.isImeMode = false;
  });
  this.element.addEventListener('blur', function(event) {
    that.keyStack = [];
    that.isKeypressInvoked = false;
    that.isImeMode = false;
  });
  this.element.addEventListener('keydown', function(event) {
    that.isKeypressInvoked = false;
    that.isImeMode = (event.keyCode === 229);
    if (!that.isImeMode) {
      that.keyStack.unshift(event.keyCode);
    }
  });
  this.element.addEventListener('keypress', function(event) {
    that.isKeypressInvoked = true;
  });
  this.element.addEventListener('keyup', function(event) {
    if (that.isKeypressInvoked) {
      if (!that.ignoreKeyCode.includes(event.keyCode)) {
        that.callback(event);
      }
    } else {
      let withIgnoreKey = that.keyStack.some(function(elm, idx, arr) {
        return that.ignoreKeyCode.includes(elm);
      });
      if (!withIgnoreKey) {
        if (that.isImeMode) {
          if (event.keyCode === 13) {
            that.callback(event);
          } else if (event.keyCode === 229) {
            that.keyupWaitTimerId = setTimeout(function() {
              that.callback(event);
            }, that.keyupWaitMillisec);
          } else {
            if (that.keyupWaitTimerId != null) {
              clearTimeout(that.keyupWaitTimerId);
              that.keyupWaitTimerId = null;
            }
          }
        } else {
          that.callback(event);
        }
      }
    }
    let index = that.keyStack.indexOf(event.keyCode);
    if (index >= 0) {
      that.keyStack.splice(index, 1);
    }
  });
};

