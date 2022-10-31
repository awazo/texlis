ah... it's not need, maybe... just use input event alternatively...???
I'll test it for a few days...

# texlis.js
text input listener: a javascript library for apps along with text input

## description
texlis.js is useful when you want to executing something along with an user text input.
On a web browser, to executing some function when a textbox (like `<input type="text" />`) is editted is a bit difficult, especially under using text input applications (e.g. IME).
Some js events (keydown, keypress, keyup) are invoked at all keyboard input, but there are included some needless keyboard input for executing a target function.
If you have a page for real-time search result, and there is a text box for input search keyword, a keyboard input "Ctrl-c" is needless to executing the search function, but keydown and keyup events are invoked. 
Also in IME situation (e.g. input Japanese), some space-key is pushed for hiragana-kanji conversion, but the input text is not confirmed yet: an enter-key confirm it. In this situation, Chrome isn't invoke the keyboard event with enter-key (keyCode = 13): only keydown and keyup event with keyCode = 229 are invoked, while another input like 'a' (Japanese 'あ') invoke keyup event with keyCode of the keyboard pushed additionally. 
texlis.js listens the keyboard event keydown, keypress and keyup, and callback your function when only useful keys are pushed. Your callback is invoked from a keyup event handler. 

## how to use
First, include texlis.js in your app.
In a html page likes:
```
<script src="/path/to/directory/texlis.js"></script>
```

Next, setup texlis with textbox element and callback.
A textbox element is like `<input type="text" id="textinput" />`, and A callback is a function you want to do when keyboard inputs are sent.
```
new Texlis(document.getElementById('textinput'), (keyupevent) => console.log(keyupevent.keyCode));
```

