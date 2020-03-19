/*
	DEVELOPER NOTICE
	- valila javascript 구문만 사용할 것. (ES6구문 사용 금지)
	- IE11등 하위 호환성을 위해.
	- 금지 대상 : let, =>, 등

	polyfill.js를 통해 Array의 forEAch(), find()추가 하였음.
*/

window.edicusSDK = {
	base_url: "https://edicusbase.firebaseapp.com",
	landing_path: "/ed#/editor_landing",
	tnview_path: "/ed#/tnview/landing",
	target_callback: null,
	iframe_el: null,
	messageListener: null,
	ddp_block: null,
	private_css: null,
	options: null,
	data_row: null,
	data_feed: null
}

window.edicusSDK.init = function(config) {
	var self = window.edicusSDK;
	self.base_url = config.base_url;

	if (self.messageListener) {
		window.removeEventListener('message', self.messageListener);
		self.messageListener = null;	
	}

	// addEventListener는 IE11부터 사용가능. 이전은 attachEvent임
	self.messageListener = function(event) {		
		// console.log('received from iframe : ', event);
		/*	iframe내의 editor가 window.parent.postMessage()을 통해 message를 리턴하면,
			target_callback()을 호출한다.
		*/
		if (event.data && typeof event.data === 'string' && event.data.match(/^{.*}$/g)) {
			var data = JSON.parse(event.data);
			if (data) {
				if (data.type == 'from-edicus' || data.type == 'from-edicus-root' || data.type == 'from-edicus-tnview') {
					self.target_callback && self.target_callback(null, data);
				}
				else if (data.type == 'from-edicus-private') {
					if (data.action == "waiting-for-extra-param") {
						let params = [];
						for(var i=0; i<data.info.param_names.length; i++) {
							if (data.info.param_names[i] == 'ddp_block')
								params.push({ name: 'ddp_block', ddp_block: self.ddp_block });
							else if (data.info.param_names[i] == 'private_css')
								params.push({ name: 'private_css', private_css: self.private_css });
							else if (data.info.param_names[i] == 'options')
								params.push({ name: 'options', options: self.options });
							else if (data.info.param_names[i] == 'data_row')
								params.push({ name: 'data_row', data_row: self.data_row });
							else if (data.info.param_names[i] == 'data_feed')
								params.push({ name: 'data_feed', data_feed: self.data_feed });
						}
						var message = {
							type: 'to-edicus-root',
							action: 'send-extra-param',
							info: { params: params }
						}
						self.iframe_el.contentWindow.postMessage(JSON.stringify(message), '*');
					}
					else if (data.action == "waiting-for-ddp-data") {
						var message = {
							type: 'to-edicus-root',
							action: 'send-ddp-data',
							info: { ddp_block: self.ddp_block }
						}
						self.iframe_el.contentWindow.postMessage(JSON.stringify(message), '*');
					}
				}
			}
		}
	}
	window.addEventListener('message', self.messageListener, false)	
}

window.edicusSDK.destroy = function (params) {
	console.log('edicus destroy');

	if (self.messageListener) {
		window.removeEventListener('message', self.messageListener);
		self.messageListener = null;	
	}

	if (this.iframe_el) {
		params.parent_element.removeChild(this.iframe_el);
		this.iframe_el = null;
	}
}

/* debugging용으로 사용함. */
window.edicusSDK.open_portal = function(params, callback) {
	var target_url = this.base_url + 
		'/ed#/editor_portal?' +
        'cmd=open_portal' +
        '&token=' + params.token;

	this._build_iframe(target_url, params.parent_element);
	this.target_callback = callback;	
}


/* 	callback은 prject-id가 생성되면 1회 호출되고,
	종료될 때 callback이 또 호출 될 수 있음.
*/
window.edicusSDK.create_project = function(params, callback) {
	var target_url = this.base_url + this.landing_path + 
		'?cmd=create' +
		'&partner=' + params.partner +
		'&mobile=' + params.mobile +
		'&token=' + params.token +
        '&ps_code=' + params.ps_code +
		'&title=' + encodeURIComponent(params.title) +
		(params.template_uri ? '&template_uri=' + params.template_uri : '') +
		(params.ddp_block ? '&wait_ddp=true': '') +
		(params.private_css ? '&wait_private_css=true': '') +
		(params.options ? '&wait_options=true': '') +
		(params.num_page ? '&num_page=' + params.num_page : '') +
		(params.max_page ? '&max_page=' + params.max_page : '') +
		(params.min_page ? '&min_page=' + params.min_page : '') +
		(params.unit_page ? '&unit_page=' + params.unit_page : '') +
		(params.max_order ? '&max_order=' + params.max_order : '') +
		(params.min_order ? '&min_order=' + params.min_order : '') +
		(params.div ? '&div=' + params.div : '') +
		(params.lang ? '&lang=' + params.lang : '') +
		(params.ui_locale ? '&ui_locale=' + params.ui_locale : '') +
		(params.env_mode ? '&env_mode=' + params.env_mode : '') +
		(params.run_mode ? '&run_mode=' + params.run_mode : '') +
		(params.edit_mode ? '&edit_mode=' + params.edit_mode : '') +
		(params.parent_type ? '&parent_type=' + params.parent_type : '') +
		(params.force_plugin ? '&force_plugin=' + params.force_plugin : '') +
		(params.plugin_param ? '&plugin_param=' + params.plugin_param : '') +
		(params.resapi_param ? '&resapi_param=' + params.resapi_param : '') +
		(params.cal_date ? '&cal_date=' + params.cal_date : '') +
		(params.unlayers ? '&unlayers=' + params.unlayers : '') +
		(params.video_frames ? '&video_frames=' + params.video_frames : '');

	this.target_callback = callback;
	this._set_deferred_params(params);
	this._build_iframe(target_url, params.parent_element);
}

window.edicusSDK.open_project = function(params, callback) {
	var target_url = this.base_url + this.landing_path +
		'?cmd=open' +
		'&partner=' + params.partner +
		'&mobile=' + params.mobile +		
        '&prjid=' + params.prjid +
		'&token=' + params.token +
		(params.ddp_block ? '&wait_ddp=true': '') +
		(params.private_css ? '&wait_private_css=true': '') +
		(params.options ? '&wait_options=true': '') +
		(params.max_page ? '&max_page=' + params.max_page : '') +
		(params.min_page ? '&min_page=' + params.min_page : '') +
		(params.max_order ? '&max_order=' + params.max_order : '') +
		(params.min_order ? '&min_order=' + params.min_order : '') +
		(params.div ? '&div=' + params.div : '') +
		(params.lang ? '&lang=' + params.lang : '') +
		(params.ui_locale ? '&ui_locale=' + params.ui_locale : '') +
		(params.env_mode ? '&env_mode=' + params.env_mode : '') +
		(params.run_mode ? '&run_mode=' + params.run_mode : '') +
		(params.edit_mode ? '&edit_mode=' + params.edit_mode : '') +
		(params.parent_type ? '&parent_type=' + params.parent_type : '') +
		(params.force_plugin ? '&force_plugin=' + params.force_plugin : '') +
		(params.plugin_param ? '&plugin_param=' + params.plugin_param : '') +
		(params.resapi_param ? '&resapi_param=' + params.resapi_param : '') +
		(params.no_update ? '&no_update=' + params.no_update : '') +
		(params.unlayers ? '&unlayers=' + params.unlayers : '');

	this.target_callback = callback;
	this._set_deferred_params(params);
	this._build_iframe(target_url, params.parent_element);
}

window.edicusSDK.edit_template = function(params, callback) {
	var target_url = this.base_url + this.landing_path +
		'?cmd=edit-template' +
		'&partner=' + params.partner +
		'&mobile=' + params.mobile +		
		'&token=' + params.token +
		'&ps_code=' + params.ps_code +
		(params.prjid ? '&prjid=' + params.prjid : '') +
		(params.template_uri ? '&template_uri=' + params.template_uri : '') +
		(params.ddp_block ? '&wait_ddp=true': '') +
		(params.private_css ? '&wait_private_css=true': '') +
		(params.options ? '&wait_options=true': '') +
		(params.num_page ? '&num_page=' + params.num_page : '') +
		(params.max_page ? '&max_page=' + params.max_page : '') +
		(params.min_page ? '&min_page=' + params.min_page : '') +
		(params.unit_page ? '&unit_page=' + params.unit_page : '') +
		(params.max_order ? '&max_order=' + params.max_order : '') +
		(params.min_order ? '&min_order=' + params.min_order : '') +
		(params.div ? '&div=' + params.div : '') +
		(params.lang ? '&lang=' + params.lang : '') + 
		(params.ui_locale ? '&ui_locale=' + params.ui_locale : '') +
		(params.env_mode ? '&env_mode=' + params.env_mode : '') +
		(params.run_mode ? '&run_mode=' + params.run_mode : '') +
		(params.edit_mode ? '&edit_mode=' + params.edit_mode : '') +
		(params.parent_type ? '&parent_type=' + params.parent_type : '') +
		(params.force_plugin ? '&force_plugin=' + params.force_plugin : '') +
		(params.plugin_param ? '&plugin_param=' + params.plugin_param : '') +
		(params.resapi_param ? '&resapi_param=' + params.resapi_param : '') +
		(params.no_update ? '&no_update=' + params.no_update : '') +
		(params.cal_date ? '&cal_date=' + params.cal_date : '') +
		(params.unlayers ? '&unlayers=' + params.unlayers : '');
	
	this.target_callback = callback;
	this._set_deferred_params(params);
	this._build_iframe(target_url, params.parent_element);
}

window.edicusSDK.change_project = function(projectID) {
	var message = {
		type: 'to-edicus-root',
		action: 'change-project',
		info: {
			project_id: projectID,
		}
	}
	this.iframe_el.contentWindow.postMessage(JSON.stringify(message), '*');
}

window.edicusSDK.change_template = function(psCode, template_uri) {
	var message = {
		type: 'to-edicus-root',
		action: 'change-template',
		info: {
			ps_code: psCode,
			template_uri: template_uri
		}
	}
	this.iframe_el.contentWindow.postMessage(JSON.stringify(message), '*');
}

window.edicusSDK.change_layout = function(layout_uri, page_index, change_background_if_available) {
	var message = {
		type: 'to-edicus',
		action: 'change-layout',
		info: {
			layout_uri: layout_uri,
			page_index: page_index || 0,
			change_background_if_available: change_background_if_available
		}
	}
	this.iframe_el.contentWindow.postMessage(JSON.stringify(message), '*');
}

window.edicusSDK.execute_ddp_block = function(ddp_block, history_label) {
	let info = { 
		ddp_block: ddp_block,
		history_label: history_label
	};
	window.edicusSDK.post_to_editor('execute-ddp-block', info);
}

window.edicusSDK.show_tnview = function(params, callback) {
	var target_url = this.base_url + this.tnview_path +
		'?cmd=show' +
		'&token=' + params.token +
		'&ps_code=' + params.ps_code +
		'&template_uri=' + params.template_uri +
		'&div=' + (params.div || 'host') +
		'&lang=' + (params.lang || 'ko') + 
		'&npage=' + (params.npage || 1) +
		'&flow=' + (params.flow || 'horizontal') +
		(params.options ? '&wait_options=true': '') +
		(params.data_row ? '&wait_data_row=true': '');

	this._set_deferred_params(params);
	this._build_iframe(target_url, params.parent_element);
	this.target_callback = callback;
}

window.edicusSDK.create_tnview = function(params, callback) {
	var target_url = this.base_url + this.tnview_path +
		'?cmd=create' +
		'&token=' + params.token +
		'&ps_code=' + params.ps_code +
		'&template_uri=' + params.template_uri +
		'&div=' + (params.div || 'host') +
		'&lang=' + (params.lang || 'ko') + 
		'&npage=' + (params.npage || 1) +
		'&flow=' + (params.flow || 'horizontal') +
		(params.options ? '&wait_options=true': '') +
		(params.data_row ? '&wait_data_row=true': '');

	this._set_deferred_params(params);
	this._build_iframe(target_url, params.parent_element);
	this.target_callback = callback;
}

window.edicusSDK.open_tnview = function(params, callback) {
	var target_url = this.base_url + this.tnview_path +
		'?cmd=open' +
		'&token=' + params.token +
		'&prjid=' + params.prjid +
		'&div=' + (params.div || 'host') +
		'&lang=' + (params.lang || 'ko') + 
		'&npage=' + (params.npage || 1) +
		'&flow=' + (params.flow || 'horizontal') +
		(params.options ? '&wait_options=true': '') +
		(params.data_row ? '&wait_data_row=true': '');

	this._set_deferred_params(params);
	this._build_iframe(target_url, params.parent_element);
	this.target_callback = callback;
}

window.edicusSDK.show_gallery = function(params, callback) {
	var target_url = this.base_url + this.tnview_path +
		'?cmd=gallery' +
		'&token=' + params.token +
		'&div=' + (params.div || 'host') +
		'&lang=' + (params.lang || 'ko') + 
		(params.options ? '&wait_options=true': '') +
		(params.data_feed ? '&wait_data_feed=true': '') +
		(params.data_row ? '&wait_data_row=true': '');

	this._set_deferred_params(params);
	this._build_iframe(target_url, params.parent_element);
	this.target_callback = callback;
}

window.edicusSDK.post_to_editor = function(action, info) {
	var message = {
		type: 'to-edicus',
		action: action,
		info: info
	}
	this.iframe_el.contentWindow.postMessage(JSON.stringify(message), '*');
}

window.edicusSDK.post_to_tnview = function(action, info) {
	var message = {
		type: 'to-edicus-tnview',
		action: action,
		info: info
	}
	this.iframe_el.contentWindow.postMessage(JSON.stringify(message), '*');
}

// for private use only
window.edicusSDK._build_iframe = function (target_url, parent_element) {
	this.iframe_el = document.createElement('iframe');
	this.iframe_el.setAttribute('src', target_url)
	this.iframe_el.setAttribute('frameborder', 0)
	this.iframe_el.style.width = "100%";
	this.iframe_el.style.height = "100%";
	parent_element.appendChild(this.iframe_el);
} 

window.edicusSDK._set_deferred_params = function(params) {
	if (params.ddp_block) {
		console.log('detect_ddp', params.ddp_block)
		this.ddp_block = params.ddp_block;
	}
	else {
		this.ddp_block = null;
	}

	if (params.private_css) {
		console.log('detect_private_css', params.private_css)
		this.private_css = params.private_css;
	}
	else {
		this.private_css = null;
	}

	if (params.options) {
		console.log('detect_options', params.options)
		this.options = params.options;
	}
	else {
		this.options = null;
	}

	if (params.data_feed) {
		console.log('detect_date_feed', params.data_feed)
		this.data_feed = params.data_feed;
	}
	else {
		this.data_feed = null;
	}

	if (params.data_row) {
		console.log('detect_initial_data_row', params.data_row)
		this.data_row = params.data_row;
	}
	else {
		this.data_row = null;
	}	
}
