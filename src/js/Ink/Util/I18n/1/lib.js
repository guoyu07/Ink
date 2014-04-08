/**
 * Internationalization Utilities 
 * @module Ink.Util.I18n_1
 * @version 1
 */

Ink.createModule('Ink.Util.I18n', '1', [], function () {
    'use strict';

    var pattrText = /\{(?:(\{.*?})|(?:%s:)?(\d+)|(?:%s)?|([\w-]+))}/g;

    var funcOrVal = function( ret , args ) {
        if ( typeof ret === 'function' ) {
            return ret.apply(this, args);
        } else if (typeof ret !== undefined) {
            return ret;
        } else {
            return '';
        }
    };

    /**
     * You can use this module to internationalize your applications. It roughly emulates GNU gettext's API.
     *
     * @class Ink.Util.I18n
     * @constructor
     *
     * @param {Object} dict         Object mapping language codes (in the form of `pt_PT`, `pt_BR`, `fr`, `en_US`, etc.) to their `dictionaries`
     * @param {String} [lang='pt_PT'] language code of the target language
     *
     * @sample Ink_Util_I18n_1.html
     */
    var I18n = function( dict , lang , testMode ) {
        if ( !( this instanceof I18n ) ) { return new I18n( dict , lang , testMode ); }

        this.reset( )
            .lang( lang )
            .testMode( testMode )
            .append( dict || { } , lang );
    };

    I18n.prototype = {
        reset: function( ) {
            this._dicts    = [ ];
            this._dict     = { };
            this._testMode = false;
            this._lang     = this._gLang;

            return this;
        },
        /**
         * Adds translation strings for the helper to use.
         *
         * @method append
         * @param   {Object} dict Object containing language objects identified by their language code
         *
         * @example
         * var i18n = new I18n({}, 'pt_PT');
         * i18n.append({'pt_PT': {
         *     'sfraggles': 'braggles'
         * }});
         * i18n.text('sfraggles') // -> 'braggles'
         */
        append: function( dict ) {
            this._dicts.push( dict );

            this._dict = Ink.extendObj(this._dict , dict[ this._lang ] );

            return this;
        },
        /**
         * Gets or sets the language.
         * If there are more dictionaries available in cache, they will be loaded.
         *
         * @method  lang
         * @param   {String}    lang    Language code to set this instance to.
         */
        lang: function( lang ) {
            if ( !arguments.length ) { return this._lang; }

            if ( lang && this._lang !== lang ) {
                this._lang = lang;

                this._dict = { };

                for ( var i = 0, l = this._dicts.length; i < l; i++ ) {
                    this._dict = Ink.extendObj( this._dict , this._dicts[ i ][ lang ] || { } );
                }
            }

            return this;
        },
        /**
         * Sets or unsets test mode.
         * In test mode, unknown strings are wrapped in `[ ... ]`. This is useful for debugging your application and to make sure all your translation keys are in place.
         *
         * @method  testMode
         * @param   {Boolean} bool Flag to set the test mode state
         */
        testMode: function( bool ) {
            if ( !arguments.length ) { return !!this._testMode; }

            if ( bool !== undefined  ) { this._testMode = !!bool; }

            return this;
        },

        /**
         * Gest a key from the current dictionary
         *
         * @method getKey
         * @param {String} key
         * @return {Mixed} The object which happened to be in the current language dictionary on the given key.
         *
         * @example
         * _.getKey('astring'); // -> 'a translated string'
         * _.getKey('anobject'); // -> {'a': 'translated object'}
         * _.getKey('afunction'); // -> function () { return 'this is a localized function' }
         */
        getKey: function( key ) {
            var ret;
            var gLang = this._gLang;
            var lang  = this._lang;
    
            if ( key in this._dict ) {
                ret = this._dict[ key ];
            } else {
                I18n.lang( lang );
    
                ret = this._gDict[ key ];
    
                I18n.lang( gLang );
            }
    
            return ret;
        },

        /**
         * Translates a string.
         * Given a translation key, return a translated string, with replaced parameters.
         * When a translated string is not available, the original string is returned unchanged.
         *
         * @method text
         * @param {String} str          Key to look for in i18n dictionary (which is returned verbatim if unknown)
         * @param {Object} [namedParms] Named replacements. Replaces {named} with values in this object.
         * @param {String} [args]      Replacement #1 (replaces first {} and all {1})
         * @param {String} [arg2]       Replacement #2 (replaces second {} and all {2})
         * @param {String} [argn*]      Replacement #n (replaces nth {} and all {n})
         *
         * @example
         * _('Gosto muito de {} e o céu é {}.', 'carros', 'azul');
         * // returns 'Gosto muito de carros e o céu é azul.'
         *
         * @example
         * _('O {1} é {2} como {2} é a cor do {3}.', 'carro', 'azul', 'FCP');
         * // returns 'O carro é azul como azul é o FCP.'
         *
         * @example
         * _('O {person1} dava-se com a {person2}', {person1: 'coisinho', person2: 'coisinha'});
         * // -> 'O coisinho dava-se com a coisinha'
         *
         * @example
         * // This is a bit more complex
         * var i18n = make().lang('pt_PT').append({
         *     pt_PT: {
         *         array: [1, 2],
         *         object: {'a': '-a-', 'b': '-b-'},
         *         func: function (a, b) {return '[[' + a + ',' + b + ']]';}
         *     }
         * });
         * i18n.text('array', 0); // -> '1'
         * i18n.text('object', 'a'); // -> '-a-'
         * i18n.text('func', 'a', 'b'); // -> '[[a,b]]'
         */
        text: function( str /*, replacements...*/ ) {
            if ( typeof str !== 'string' ) { return; } // Backwards-compat

            var pars = Array.prototype.slice.call( arguments , 1 );
            var idx = 0;
            var isObj = typeof pars[ 0 ] === 'object';

            var original = this.getKey( str );
            if ( original === undefined ) { original = this._testMode ? '[' + str + ']' : str; }
            if ( typeof original === 'number' ) { original += ''; }

            if (typeof original === 'string') {
                original = original.replace( pattrText , function( m , $1 , $2 , $3 ) {
                    var ret =
                        $1 ? $1 :
                        $2 ? pars[ $2 - ( isObj ? 0 : 1 ) ] :
                        $3 ? pars[ 0 ][ $3 ] || '' :
                             pars[ (idx++) + ( isObj ? 1 : 0 ) ];
                    return funcOrVal( ret , [idx].concat(pars) );
                });
                return original;
            }
             
            return (
                typeof original === 'function' ? original.apply( this , pars ) :
                original instanceof Array      ? funcOrVal( original[ pars[ 0 ] ] , pars ) :
                typeof original === 'object'   ? funcOrVal( original[ pars[ 0 ] ] , pars ) :
                                                 '');
        },

        /**
         * Translates and pluralizes text.
         * Given a singular string, a plural string and a number, translates either the singular or plural string.
         *
         * @method ntext
         * @return {String}
         *
         * @param {String} strSin   Word to use when count is 1
         * @param {String} strPlur  Word to use otherwise
         * @param {Number} count    Number which defines which word to use
         * @param [args*]           Extra arguments, to be passed to `text()`
         *
         * @example
         * i18n.ntext('platypus', 'platypuses', 1); // returns 'ornitorrinco'
         * i18n.ntext('platypus', 'platypuses', 2); // returns 'ornitorrincos'
         * 
         * @example
         * // The "count" argument is passed to text()
         * i18n.ntext('{} platypus', '{} platypuses', 1); // returns '1 ornitorrinco'
         * i18n.ntext('{} platypus', '{} platypuses', 2); // returns '2 ornitorrincos'
         */
        ntext: function( strSin , strPlur , count ) {
            var pars = Array.prototype.slice.apply( arguments );
            var original;

            if ( pars.length === 2 && typeof strPlur === 'number' ) {
                original = this.getKey( strSin );
                if ( !( original instanceof Array ) ) { return ''; }

                pars.splice( 0 , 1 );
                original = original[ strPlur === 1 ? 0 : 1 ];
            } else {
                pars.splice( 0 , 2 );
                original = count === 1 ? strSin : strPlur;
            }

            return this.text.apply( this , [ original ].concat( pars ) );
        },

        /**
         * Gets the ordinal suffix of a number.
         *
         * This works by using transforms (in the form of Objects or Functions) passed into the function or found in the special key `_ordinals` in the active language dictionary.
         *
         * @method ordinal
         *
         * @param {Number}          num                         Input number
         * @param {Object|Function} [options]={}                Dictionaries for translating. Each of these options' fallback is found in the current language's dictionary. The lookup order is the following: `exceptions`, `byLastDigit`, `default`. Each of these may be either an `Object` or a `Function`. If it's a function, it is called (with `number` and `digit` for any function except for byLastDigit, which is called with the `lastDigit` of the number in question), and if the function returns a string, that is used. If it's an object, the property is looked up using `obj[prop]`. If what is found is a string, it is used directly.
         * @param {Object|Function} [options.byLastDigit]={}    If the language requires the last digit to be considered, mappings of last digits to ordinal suffixes can be created here.
         * @param {Object|Function} [options.exceptions]={}     Map unique, special cases to their ordinal suffixes.
         *
         * @returns {String}        Ordinal suffix for `num`.
         *
         * @example
         * var i18n = new I18n({
         *     pt_PT: {  // 1º, 2º, 3º, 4º, ...
         *         _ordinal: {  // The _ordinals key each translation dictionary is special.
         *             'default': "º" // Usually the suffix is "º" in portuguese...
         *         }
         *     },
         *     fr: {  // 1er, 2e, 3e, 4e, ...
         *         _ordinal: {  // The _ordinals key is special.
         *             'default': "e", // Usually the suffix is "e" in french...
         *             exceptions: {
         *                 1: "er"   // ... Except for the number one.
         *             }
         *         }
         *     },
         *     en_US: {  // 1st, 2nd, 3rd, 4th, ..., 11th, 12th, ... 21st, 22nd...
         *         _ordinal: {
         *             'default': "th",// Usually the digit is "th" in english...
         *             byLastDigit: {
         *                 1: "st",  // When the last digit is 1, use "th"...
         *                 2: "nd",  // When the last digit is 2, use "nd"...
         *                 3: "rd"   // When the last digit is 3, use "rd"...
         *             },
         *             exceptions: { // But these numbers are special
         *                 0: "",
         *                 11: "th",
         *                 12: "th",
         *                 13: "th"
         *             }
         *         }
         *     }
         * }, 'pt_PT');
         *
         * i18n.ordinal(1);    // returns 'º'
         * i18n.ordinal(2);    // returns 'º'
         * i18n.ordinal(11);   // returns 'º'
         * 
         * i18n.lang('fr');
         * i18n.ordinal(1);    // returns 'er'
         * i18n.ordinal(2);    // returns 'e'
         * i18n.ordinal(11);   // returns 'e'
         *
         * i18n.lang('en_US');
         * i18n.ordinal(1);    // returns 'st'
         * i18n.ordinal(2);    // returns 'nd'
         * i18n.ordinal(12);   // returns 'th'
         * i18n.ordinal(22);   // returns 'nd'
         * i18n.ordinal(3);    // returns 'rd'
         * i18n.ordinal(4);    // returns 'th'
         * i18n.ordinal(5);    // returns 'th'
         **/
        ordinal: function( num ) {
            if ( num === undefined ) { return ''; }

            var lastDig = +num.toString( ).slice( -1 );

            var ordDict  = this.getKey( '_ordinals' );
            if ( ordDict === undefined ) { return ''; }

            if ( typeof ordDict === 'string' ) { return ordDict; }

            var ret;

            if ( typeof ordDict === 'function' ) {
                ret = ordDict( num , lastDig );

                if ( typeof ret === 'string' ) { return ret; }
            }

            if ( 'exceptions' in ordDict ) {
                ret = typeof ordDict.exceptions === 'function' ? ordDict.exceptions( num , lastDig ) :
                      num in ordDict.exceptions                ? funcOrVal( ordDict.exceptions[ num ] , [num , lastDig] ) :
                                                                 undefined;

                if ( typeof ret === 'string' ) { return ret; }
            }

            if ( 'byLastDigit' in ordDict ) {
                ret = typeof ordDict.byLastDigit === 'function' ? ordDict.byLastDigit( lastDig , num ) :
                      lastDig in ordDict.byLastDigit            ? funcOrVal( ordDict.byLastDigit[ lastDig ] , [lastDig , num] ) :
                                                                  undefined;

                if ( typeof ret === 'string' ) { return ret; }
            }

            if ( 'default' in ordDict ) {
                ret = funcOrVal( ordDict['default'] , [ num , lastDig ] );

                if ( typeof ret === 'string' ) { return ret; }
            }

            return '';
        },

        /**
         * Create an alias.
         *
         * Returns an alias to this I18n instance. It contains the I18n methods documented here, but is also a function. If you call it, it just calls `text()`. This is commonly assigned to "_".
         *
         * @method alias
         * @returns {Function} an alias to `text()` on this instance. You can also access the rest of the translation API through this alias.
         *
         * @example
         * var i18n = new I18n({
         *     'pt_PT': {
         *         'hi': 'olá',
         *         '{} day': '{} dia',
         *         '{} days': '{} dias',
         *         '_ordinals': {
         *             'default': 'º'
         *         }
         *     }
         * }, 'pt_PT');
         * var _ = i18n.alias();
         * _('hi');  // -> 'olá'
         * _('{} days', 3);  // -> '3 dias'
         * _.ntext('{} day', '{} days', 2);  // -> '2 dias'
         * _.ntext('{} day', '{} days', 1);  // -> '1 dia'
         * _.ordinal(3);  // -> 'º'
         */
        alias: function( ) {
            var ret      = Ink.bind( I18n.prototype.text     , this );
            ret.ntext    = Ink.bind( I18n.prototype.ntext    , this );
            ret.append   = Ink.bind( I18n.prototype.append   , this );
            ret.ordinal  = Ink.bind( I18n.prototype.ordinal  , this );
            ret.testMode = Ink.bind( I18n.prototype.testMode , this );

            return ret;
        }
    };

    /**
     * Resets I18n global state (global dictionaries, and default language for instances)
     *
     * @method reset
     * @static
     *
     **/
    I18n.reset = function( ) {
        I18n.prototype._gDicts = [ ];
        I18n.prototype._gDict  = { };
        I18n.prototype._gLang  = 'pt_PT';
    };
    I18n.reset( );

    /**
     * Adds a dictionary to be used in all I18n instances for the corresponding language.
     *
     * @method appendGlobal
     * @static
     *
     * @param dict {Object}     Dictionary to be added
     * @param lang {String}     Language fo the dictionary being added
     *
     */
    I18n.appendGlobal = function( dict , lang ) {
        if ( lang ) {
            if ( !( lang in dict ) ) {
                var obj = { };

                obj[ lang ] = dict;

                dict = obj;
            }

            if ( lang !== I18n.prototype._gLang ) { I18n.lang( lang ); }
        }

        I18n.prototype._gDicts.push( dict );

        Ink.extendObj( I18n.prototype._gDict , dict[ I18n.prototype._gLang ] );
    };

    I18n.append = function () {
        // [3.1.0] remove this alias
        Ink.warn('Ink.Util.I18n.append() was renamed to appendGlobal().');
        return I18n.appendGlobal.apply(I18n, [].slice.call(arguments));
    }

    /**
     * Gets or sets the current default language of I18n instances.
     *
     * @method langGlobal
     * @param lang the new language for all I18n instances
     *
     * @static
     *
     * @return {String} language code
     */
    I18n.langGlobal = function( lang ) {
        if ( !arguments.length ) { return I18n.prototype._gLang; }

        if ( lang && I18n.prototype._gLang !== lang ) {
            I18n.prototype._gLang = lang;

            I18n.prototype._gDict = { };

            for ( var i = 0, l = I18n.prototype._gDicts.length; i < l; i++ ) {
                Ink.extendObj( I18n.prototype._gDict , I18n.prototype._gDicts[ i ][ lang ] || { } );
            }
        }
    };

    I18n.lang = function () {
        // [3.1.0] remove this alias
        Ink.warn('Ink.Util.I18n.lang() was renamed to langGlobal().');
        return I18n.langGlobal.apply(I18n, [].slice.call(arguments));
    }
    
    return I18n;
});