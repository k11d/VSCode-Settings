# GDScript / Godot Color Theme

This is a simple color theme to make VSCode and the syntax highlighting look like [Godot](https://godotengine.org/)'s internal editor.  
To make this theme work and for additional GDScript specific functionality, like e.g. code completion, I recommend the [godot-tools](https://marketplace.visualstudio.com/items?itemName=geequlim.godot-tools) extension.

## Use for `.gd` Files Only
To be able to apply this theme to `.gd` files only, I recommend the [Theme by language](https://marketplace.visualstudio.com/items?itemName=jsaulou.theme-by-language) extension.  
Unfortunately, VSCode does not have this functionality built in as of now.

## Why use it at all though? It looks kinda meh!
I'd have to agree on that one, but I was already used to it from using the internal editor for a while.  
After switching to VSCode, I found myself making many minor mistakes, like naming everything in camel case, since that is the convention in all other languages I use.  
I like to have languages be visually distinct.

## Limitations
Although I tried to make the theme truthful to the original, it wasn't entirely possible.  

### Colors
The color codes are taken directly out of Godot.  
However, the syntax highlighter of the [godot-tools](https://marketplace.visualstudio.com/items?itemName=geequlim.godot-tools) extension does not make some of the distinctions the internal editor does.   
To fix this, it would need to be changed in the TextMate grammar of the syntax highlighter of that extension.

Known inconsistencies:
* In the internal editor, the names of functions have different colors in the definition and when they're called, whereas here they don't.   
(I used the color of a function call for both.)
* Stuff like `true`, `false` and `null` is treated as keywords in the internal editor, here they are constants.  
(Decided to make constants, like `input.MOUSE_MODE_HIDDEN`, have the same red as the keywords instead of having the keywords be faded gray.)
* The `$SomeNode` shorthand for selecting a node is not recognized as a node path.

If you find more, you're welcome to leave me a note or open a merge request on the theme's [GitLab repo](https://gitlab.com/JamesSauer/GDScript-Theme-for-VSCode/issues)!

### Font
A simple color theme without JavaScript can't change fonts. I haven't looked into other ways to do this.  
Again, feel free to leave a merge request in the [repo](https://gitlab.com/JamesSauer/GDScript-Theme-for-VSCode) in case you know more than I do!

If you want to use the font right now, you'll have to install it separately and then apply it through user settings.  
It is called Hack and [you can find it here](https://github.com/source-foundry/Hack).  
After installing the font on your system, paste this into your `settings.json` file:
```
"editor.fontFamily": "Hack, Consolas, 'Courier New', monospace"
```


