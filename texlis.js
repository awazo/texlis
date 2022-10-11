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

let Texlis = function(element, callback) {
  if (element == null) throw 'invalid element';
  if ((callback == null) || (typeof callback !== 'function'))
    callback = function(event) {};

  this.element = element;
  this.callback = callback;

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
  this.keyStack = [];
  this.isKeypressInvoked = false;
  this.isImeMode = false;
  this.keyupWaitMilliseconds = 10;
  this.keyupWaitTimerId = null;

  let texlis = this;
  this.element.addEventListener('keydown', function(event) {
    texlis.isKeypressInvoked = false;
    texlis.isImeMode = (event.keyCode === 229);
    if (!texlis.isImeMode) {
      texlis.keyStack.unshift(event.keyCode);
    }
  });
  this.element.addEventListener('keypress', function(event) {
    texlis.isKeypressInvoked = true;
    if (texlis.ignoreKeyCode.includes(event.keyCode)) {
      return;
    }
    texlis.callback(event);
  });
  this.element.addEventListener('keyup', function(event) {
    if (texlis.isKeypressInvoked) {
      if (!texlis.ignoreKeyCode.includes(event.keyCode)) {
        texlis.callback(event);
      }
    } else {
      let withIgnoreKey = texlis.keyStack.some(function(elm, idx, arr) {
        return texlis.ignoreKeyCode.includes(elm);
      });
      if (!withIgnoreKey) {
        if (texlis.isImeMode) {
          if (event.keyCode === 13) {
            texlis.callback(event);
          } else if (event.keyCode === 229) {
            texlis.keyupWaitTimerId = setTimeout(function() {
              texlis.callback(event);
            }, texlis.keyupWaitMilliseconds);
          } else {
            if (texlis.keyupWaitTimerId != null) {
              clearTimeout(texlis.keyupWaitTimerId);
              texlis.keyupWaitTimerId = null;
            }
          }
        } else {
          texlis.callback(event);
        }
      }
    }
    let index = texlis.keyStack.indexOf(event.keyCode);
    if (index >= 0) {
      texlis.keyStack.splice(index, 1);
    }
  });
};

