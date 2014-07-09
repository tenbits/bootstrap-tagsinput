(function ($) {
  "use strict";

  var defaultOptions = {
    tagClass: function(item) {
      return 'label label-info';
    },
    itemValue: 'value',
    itemText: 'value',
    freeInput: false,
    confirmKeys: [13]
  };

  /**
   * Constructor function
   */
  function TagsInput(element, options) {
    this.itemsArray = [];
    this.$element = $(element).hide();
    this.$element
      .attr('multiselect', 'multiselect')
      .find('options')
      .attr('selected', 'selected')
      ;

    var placeholder = options.placeholder || '';
    
    this.$container = $('<div class="bootstrap-tagsinput"/>');
    this.inputSize = Math.max(1, placeholder.length);
    this.$input = $('<input type="text" placeholder="' + placeholder + '"/>').appendTo(this.$container);
    this.$element.after(this.$container);
    this.build(options);
    this._refreshSize();
  }

  TagsInput.prototype = {
    constructor: TagsInput,
    
    // use to create Object in `AnyTag` mode
    FreeObject: null,
    
    // keep all allowed tags (ignored in `AnyTag` mode)
    allowedItems: null,
    
    _getValue: function(mix){
      if (typeof mix !== 'object') 
        mix = this._getItemByText(mix);
      return mix[this.options.itemValue];
    },

    _getText: function(mix){
      if (typeof mix !== 'object') 
        mix = this._getItemByValue(mix);
      return mix[this.options.itemText];
    },

    _getItemByText: function(itemText){
      if (this.options.freeInput) 
        return new this.FreeObject(itemText);
      
      var prop = this.options.itemText;
      return this.allowedItems.filter(function(x){
          return x[prop] === itemText;
      })[0];
    },

    _getItemByValue: function(itemValue){
      if (this.options.freeInput) 
        return this.FreeObject(itemValue);
      
      var prop = this.options.itemValue;
      return this.allowedItems.filter(function(x){
          return x[prop] === itemValue;
      })[0];
    },

    _getClass: function(item){
      return htmlEncode(this.options.tagClass(item));
    },

    _getTagEl: function(itemValue){
      return this.$container.find('.tag[data-value="' + itemValue + '"]');
    },

    _getOptionEl: function(itemValue) {
      return this.$element.find('option[value="' + itemValue + '"]');
    },

    _createTag: function(item, value, text){
      var html = '<span class="tag" data-value="'
            + value
            + '">'
            + htmlEncode(text)
            + '<span data-role="remove"></span></span>';
      return $(html).addClass(this._getClass(item));
    },

    _createOption: function(value, text){
      var html = '<option selected>' + htmlEncode(text) + '</option>';
      return $(html).attr('value', value);
    },

    _add: function(item, dontPushVal){
      if (item == null) 
        return;
        
      var self = this
        , itemText = this._getText(item)
        , itemValue = this._getValue(item)
        , tagClass = this._getClass(item)
        , exists = this.itemsArray.some(function(x){
          return self._getValue(x) === itemValue
        })
        , $tag
        ;
        
      if (exists) {
        this
          ._getTagEl(itemValue)
          .hide()
          .fadeIn();
        return;
      }

      this.itemsArray.push(item);
      
      $tag = this._createTag(item, itemValue, itemText);
      this._getInputWrapper().before($tag);
      $tag.after(' ');

      if (this._getOptionEl(itemValue).length === 0) {
        // add option if not preset
        this.$element.append(
          this._createOption(itemValue, itemText)
        );
      }
    },

    _emitChange: function(type, item){
      this.$element.trigger('change');
      if (type) 
        this.$element.trigger('item' + type, { item: item });
    },

    /**
     * Returns the element which is wrapped around the internal input. This
     * is normally the $container, but typeahead.js moves the $input element.
     */
    _getInputWrapper: function() {
      var el = this.$input[0],
          container = this.$container[0];
      while(el && el.parentNode !== container)
        el = el.parentNode;
        
      return $(el);
    },
  
    _refreshSize: function(){
      var input$ = this.$input[0]
        , width = Math.max(this.inputSize < 3 ? 3 : this.inputSize, input$.value.length);
       
      input$.style.setProperty('width', width + 'em', 'important');
    },
    /**
     * mix:
     *  - String: Add by itemText (lookup item before)
     *  - Object: Add by item
     *  
     * Adds the given item as a new tag. Pass true to dontPushVal to prevent
     * updating the elements val()
     */
    add: function(mix, dontPushVal) {
      var item = typeof mix === 'object'
          ? mix
          : this._getItemByText(mix.trim());
      
      this._add(item);
      this._emitChange('Added', item);
    },
    addByValue: function(itemValue){
      var item = this._getItemByValue(itemValue);
      this._add(item);
      this._emitChange('Added', item);
    },

    /**
     * Removes the given item. Pass true to dontPushVal to prevent updating the
     * elements val()
     */
    remove: function(itemValue, dontPushVal) {
      var self = this
        , itemText = this._getText(itemValue)
        , item = this._getItemByValue(itemValue);
      if (itemText == null || item == null) {
        console.warn('<tag:remove> Item text is not defined', itemValue);
        return;
      }
      
      this._getTagEl(itemValue).remove();
      this._getOptionEl(itemValue).remove();
      this.itemsArray = this.itemsArray.filter(function(x){
        return self._getValue(x) !== itemValue;
      });
      
      this._emitChange('Removed', item);
    },

    /**
     * Removes all items
     */
    removeAll: function() {
      this.$container.find('.tag').remove();
      this.$element.find('option').remove();
      this.itemsArray.length = 0;
      this._emitChange();
    },


    /**
     * Returns the items added as tags
     */
    items: function() {
      return this.itemsArray;
    },


    /**
     * Initializes the tags input behaviour on the element
     */
    build: function(options) {
      this.allowedItems = options.allowedItems || [];
      this.options = $.extend({}, defaultOptions, options);
      
      var typeahead = this.options.typeahead || {}
        , itemText = this.options.itemText
        , itemValue = this.options.itemValue
        , self = this
        ;
      
      this.FreeObject = function(text){
        this[itemText] = text;
        this[itemValue] = text;
      };
      this.FreeObject.prototype[itemText ] = null;
      this.FreeObject.prototype[itemValue] = null;
      
      makeOptionItemFunction(this.options, 'tagClass');
     
      self
        .$container
        .on('click', function(event) {
          self.$input.focus();
        })
        .on('keydown', 'input', function(event) {
          var $input = $(event.target),
              $inputWrapper = self._getInputWrapper();
  
          switch (event.which) {
            // BACKSPACE
            case 8:
              if (doGetCaretPosition($input[0]) === 0) {
                var prev = $inputWrapper.prev();
                if (prev.length !== 0) 
                  self.remove(prev.data('value'));
              }
              break;
  
            // DELETE
            case 46:
              if (doGetCaretPosition($input[0]) === 0) {
                var next = $inputWrapper.next();
                if (next.length !== 0) 
                  self.remove(next.data('value'));
              }
              break;
  
            // LEFT ARROW
            case 37:
              // Try to move the input before the previous tag
              var $prevTag = $inputWrapper.prev();
              if ($input.val().length === 0 && $prevTag[0]) {
                $prevTag.before($inputWrapper);
                $input.focus();
              }
              break;
            // RIGHT ARROW
            case 39:
              // Try to move the input after the next tag
              var $nextTag = $inputWrapper.next();
              if ($input.val().length === 0 && $nextTag[0]) {
                $nextTag.after($inputWrapper);
                $input.focus();
              }
              break;
           default:
              if (self.options.confirmKeys.indexOf(event.which) !== -1) {
                event.preventDefault();
                event.stopPropagation();
                
                self.add($input.val());
                $input.val('');
                if (self.$typeahead) {
                  self
                    .$typeahead
                    .typeahead('close')
                    .typeahead('val', '');
                }
              }
              break;
          }
          self._refreshSize();
        })
        .on('click', '[data-role=remove]', function(event) {
          self.remove($(this).closest('.tag').data('value'));
        });
      
      if (typeahead.source && $.fn.typeahead) {
        this.$typeahead = self.$input.typeahead({
          hint: true,
          highlight: true,
          minLength: 1
        },{
          displayKey: itemText,
          source: function(query, cb){
            typeahead.source(query, function(items){
              
              self.allowedItems = self.allowedItems.concat(items.filter(function(x){
                return self.allowedItems.indexOf(x) === -1;
              }));
              cb(items);
            });
          }
        });
      }
      
      if (this.options.items) {
        this.options.items.forEach(function(x){
          self._add(x, true);
        });
      }
    },

    /**
     * Removes all tagsinput behaviour and unregsiter all event handlers
     */
    destroy: function() {
      this
        .$container
        .off('keypress', 'input')
        .off('click', '[role=remove]')
        .remove();
      
      this
        .$element
        .removeData('tagsinput')
        .show();
    },

    /**
     * Sets focus on the tagsinput 
     */
    focus: function() {
      this.$input.focus();
    },

    /**
     * Returns the internal input element
     */
    input: function() {
      return this.$input;
    }
  };

  /**
   * Register JQuery plugin
   */
  $.fn.tagsinput = function(mix, arg) {
    var results = [];

    this.each(function() {
      var $this = $(this)
        , tagsinput = $this.data('tagsinput');

      if (tagsinput == null) {
         // Initialize a new tags input
         
        tagsinput = new TagsInput(this, mix);
        $this.data('tagsinput', tagsinput);
        results.push(tagsinput);
        return;
        //$(this).val($(this).val());
      }
      
      // Invoke function on existing tags input
      results.push(tagsinput[mix](arg));
    });

    
    return typeof mix == 'string'
      ? (results.length > 1 ? results : results[0])
      : (results)
      ;
  };

  $.fn.tagsinput.Constructor = TagsInput;
  
  /**
   * Most options support both a string or number as well as a function as 
   * option value. This function makes sure that the option with the given
   * key in the given options is wrapped in a function
   */
  function makeOptionItemFunction(options, key) {
    if (typeof options[key] !== 'function') {
      var propertyName = options[key];
      options[key] = function(item) { return item[propertyName]; };
    }
  }
  function makeOptionFunction(options, key) {
    if (typeof options[key] !== 'function') {
      var value = options[key];
      options[key] = function() { return value; };
    }
  }
  /**
   * HtmlEncodes the given value
   */
  var htmlEncodeContainer = $('<div />');
  function htmlEncode(value) {
    if (value) {
      return htmlEncodeContainer.text(value).html();
    } else {
      return '';
    }
  }

  /**
   * Returns the position of the caret in the given input field
   * http://flightschool.acylt.com/devnotes/caret-position-woes/
   */
  function doGetCaretPosition(input) {
    if (document.selection) {
      input.focus ();
      var sel = document.selection.createRange();
      sel.moveStart ('character', -input.value.length);
      
      return sel.text.length;
    }
    
    if (input.selectionStart || input.selectionStart == '0') 
      return input.selectionStart;
    
    return 0;
  }

})(window.jQuery);
