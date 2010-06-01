var SimpleStorage = new Class({
	Implements:Options,

	options:{
		mode:'sessionStorage'
	},

	_data:{},

	initialize:function(options){
		this.setOptions(options);

		if(this.options.mode === 'sessionStorage') {
			try {
				this._data = window.sessionStorage;
			}
			catch(e){
				console.log('calling exception');
				this.options.mode = 'cookie';
			}
		}

		if(this.options.mode === 'cookie'){
			this.get = this.getCookie.bind(this);
			this.set = this.setCookie.bind(this);
		}

		if(!this.set && !this.get) {
			this.get = this.getData.bind(this);
			this.set = this.setData.bind(this);
		}
	},

	get:null,
	set:null,

	getData:function(key){
		if(!key) return this._data;
		return this._data[key];
	},

	setData:function(){
		if(!arguments[0]) return;
		
		var type = $type(arguments[0]);
		
		if(type==='string' && arguments.length==2)
			this._data[arguments[0]] = arguments[1];
		if(type==='object')
			$extend(this._data,arguments[0]);
	},
	
	removeData:function(){
		if(!arguments[0]) return;
		
		$each(arguments,function(name){
			if(!this._data[name] || $type(this._data[name])!=='string') return;
			delete this._data[name];
		},this);
	},

	getCookie:function(key){
		var cookie = JSON.decode(Cookie.read(key));
		var data = this.getData(key);
		if(!cookie) return null;
		
		if(!data && cookie) this.setCookie(key,cookie);
		
		return this.getData(key);
	},

	setCookie:function(){
		var type = $type(arguments[0]);
		
		if(type==='string' && arguments.length==2)
			Cookie.write(arguments[0],JSON.encode(arguments[1]));
		if(type==='object'){
			$each(arguments[0],function(item,index,obj){
				Cookie.write(index,JSON.encode(obj[index]));
			});
		}
		return this.setData.attempt(arguments,this);
	}
});