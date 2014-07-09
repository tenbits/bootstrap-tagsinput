# Bootstrap Tags Input. [Fork](https://github.com/TimSchlechter/bootstrap-tagsinput)

#### Modifications
- refactored
- some features and options removed
- full [twitters typeahead](https://github.com/twitter/typeahead.js) support

#### Sample

```javascript
$select.tagsinput({
	
	// optional, predefine items, this sample contains tags: [{name,id}, ...]
	items: model.tags,


	// optional, define initial allowedTags, later its extend it in typehead.source
	allowedItems: allTags,

	itemText: 'name',
	itemValue: 'id',

	typeahead: {
		source: function(query, cb) {
			$
				.getJSON('/tags?query=' + encodeURIComponent(query))
				.done(function(tags){

					// populate autocomplete and extend the allowedItems
					cb(tags);
				});
		}
	}
});
```



## License
This project is licensed under [MIT](https://raw.github.com/TimSchlechter/bootstrap-tagsinput/master/LICENSE "Read more about the MIT license").