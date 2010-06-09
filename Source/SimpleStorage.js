var SimpleStorage = new Class({
	Implements:[Options,Events],

	options:{
		mode:'sessionStorage',
		storageRef:'SimpleStorageRef',
		prefix:'ss_'
	},

	_data:{},

	get:null,
	set:null,

	initialize:function(options){
		this.setOptions(options);

		this.options.storageRef = this.options.prefix+this.options.storageRef;

		if(this.options.mode === 'sessionStorage' || this.options.mode === 'localStorage') {
			try {
				this._data = window[this.options.mode];
				if(!this._data.getItem(this.options.storageRef)) this._data.setItem(this.options.storageRef,JSON.encode([]));

				this.get = this.getStorage.bind(this);
				this.set = this.setStorage.bind(this);
				this.remove = this.removeStorage.bind(this);
			}
			catch(e){
				this.options.mode = 'cookie';
			}
		}

		if(this.options.mode === 'cookie' || this.options.mode === 'cookies'){
			var currentRef = JSON.decode(Cookie.read(this.options.storageRef));
			var type = $type(currentRef);

			if(type!=='array'){
				Cookie.write(this.options.storageRef,JSON.encode([]));

				currentRef = $A([]);
			}

			this.currentCookies = currentRef;

			this.get = this.getCookie.bind(this);
			this.set = this.setCookie.bind(this);
			this.remove = this.removeCookies.bind(this);

			this.initCookies();
		}

		if(!this.set && !this.get) {
			this.get = this.getData.bind(this);
			this.set = this.setData.bind(this);
			this.remove = this.removeData.bind(this);
		}

		this.fireEvent('load',options);
	},

	initCookies:function(){
		var currentRef = this.currentCookies;
		var type = $type(currentRef);

		if(type!=='array') currentRef = $A([]);

		currentRef.each(function(name){
			this.getCookie(name);
		},this);
	},

	getData:function(key){
		if(!key) return $merge(this._data);

		var type = $type(this._data[key]);

		if(type==='object') return $merge(this._data[key]);

		if(type==='array') return $A(this._data[key]);

		return this._data[key];
	},

	getStorage:function(key){
		if(!key){
			var retObj = {};

			var currentRef = JSON.decode(this._data[this.options.storageRef]);

			if($type(currentRef)!=='array') currentRef = $A([]);

			currentRef.each(function(name){
				retObj[name] = JSON.decode(this._data.getItem(this.options.prefix+name));
			},this);

			return retObj;
		}

		return JSON.decode(this._data.getItem(this.options.prefix+key));
	},

	getCookie:function(key){
		if(!key) return this.getData();

		var cookie = JSON.decode(Cookie.read(this.options.prefix+key));

		var data = this.getData(key);

		if(cookie===null) return null;

		if(!data) this.setData(key,cookie);

		return this.getData(key);
	},

	setData:function(){
		if(!arguments[0]) return;

		var type = $type(arguments[0]);

		var newObj = {};

		if(type==='string' && arguments[1])
			newObj[arguments[0]] = arguments[1];
		else if(type==='object')
			newObj = arguments[0];
		else return false;

		$extend(this._data,newObj);

		this.fireEvent('set',arguments);

		return true;
	},

	setStorage:function(){
		if(!arguments[0]) return;

		var type = $type(arguments[0]);

		var currentRef = JSON.decode(this._data[this.options.storageRef]);

		if($type(currentRef)!=='array') currentRef = $A([]);

		if(type==='string' && arguments.length==2){
			currentRef[currentRef.length] = arguments[0];
			this._data.setItem(this.options.prefix+arguments[0],JSON.encode(arguments[1]));
		}

		if(type==='object')
			$each(arguments[0],function(item,index,obj){
				currentRef[currentRef.length] = index;
				this._data.setItem(this.options.prefix+index,JSON.encode(item));
			},this);

		this._data.setItem(this.options.storageRef,JSON.encode(currentRef));

		this.fireEvent('set',arguments);

		return true;
	},

	setCookie:function(){
		var type = $type(arguments[0]);

		var currentRef = this.currentCookies;

		if($type(currentRef)!=='array') currentRef = $A([]);

		if(type==='string' && arguments.length==2){
			if(currentRef.indexOf(arguments[0])===-1) currentRef[currentRef.length] = arguments[0];
			Cookie.write(this.options.prefix+arguments[0],JSON.encode(arguments[1]));
		}

		if(type==='object'){
			$each(arguments[0],function(item,index,obj){
				if(currentRef.indexOf(index)===-1) currentRef[currentRef.length] = index;
				Cookie.write(this.options.prefix+index,JSON.encode(item));
			},this);
		}

		this.setCookieRef(currentRef);

		return this.setData.attempt(arguments,this);
	},

	removeData:function(keys){
		keys = $splat(keys);

		if(keys.length==0){
			$each(this._data,function(item,index){
				delete this._data[index];
			},this);
		}

		keys.each(function(name){
			if(!this._data[name] || $type(this._data[name])!=='string') return;
			delete this._data[name];
		},this);

		this.fireEvent('remove',keys);

		return true;
	},

	removeStorage:function(keys){
		keys = $splat(keys);

		var currentRef = JSON.decode(this._data.getItem(this.options.storageRef));

		if($type(currentRef)!=='array') currentRef = $A([]);

		if(keys.length===0){
			currentRef.each(function(name){
				this._data.removeItem(this.options.prefix+name);
			},this);

			currentRef = [];
		}

		else keys.each(function(name,index){
			currentRef.splice(currentRef.indexOf(name),1);
			this._data.removeItem(this.options.prefix+name);
		},this);

		this._data.setItem(this.options.storageRef,JSON.encode(currentRef));

		this.fireEvent('remove',keys);

		return true;
	},

	removeCookies:function(keys){
		keys = $splat(keys);

		var currentRef = this.currentCookies;

		if($type(currentRef)!=='array') currentRef = $A([]);

		if(keys.length===0)
			$each(this._data,function(name,index){ this.removeCookie(index,currentRef); },this);

		else
			keys.each(function(item){ this.removeCookie(item,currentRef); },this);

		this.setCookieRef(currentRef);

		this.fireEvent('remove',keys);

		return true;
	},

	removeCookie:function(key,currentRef){
		currentRef.splice(currentRef.indexOf(key),1);
		delete this._data[key];
		return Cookie.dispose(this.options.prefix+key);
	},

	setCookieRef:function(data){
		Cookie.write(this.options.storageRef,JSON.encode(data));

		this.currentCookies = JSON.decode(Cookie.read(this.options.storageRef));
	}
});